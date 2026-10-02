// Cloudflare Pages Function: /api/whatsapp
// Webhook del bot de WhatsApp Business (API oficial de Meta, WhatsApp Cloud API).
//   GET  → Meta verifica el webhook una sola vez (WA_VERIFY_TOKEN).
//   POST → llega un mensaje; se comprueba la firma de Meta (WA_APP_SECRET) y la IA responde.
// Secretos en Cloudflare (nunca en el código): WA_VERIFY_TOKEN, WA_APP_SECRET, WA_TOKEN, WA_PHONE_ID.
// Enlace KV opcional "CHATS": guarda el contexto de cada chat 24 h y pausa el bot cuando Nicolás responde a mano.
import { cleanTurns, LIMITS } from '../../js/knowledge.js';
import { answer } from './chat.js';

const GRAPH = 'https://graph.facebook.com/v23.0';
const MAX_BODY = 64_000;
const DAY = 86_400;                 // segundos que se recuerda una conversación
const HUMAN_PAUSE = 12 * 3_600;     // el bot calla 12 h en un chat donde Nicolás escribió
const HUMAN_WORDS = /(asesor|humano|hablar con (una )?persona|hablar con nicol[aá]s)/i;

const text = (body, status = 200) => new Response(body, {
  status,
  headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});

const configured = env => env.WA_VERIFY_TOKEN && env.WA_APP_SECRET && env.WA_TOKEN && env.WA_PHONE_ID && (env.ANTHROPIC_API_KEY || env.AI);

export function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams;
  if (!env.WA_VERIFY_TOKEN) return text('not_configured', 503);
  return q.get('hub.mode') === 'subscribe' && q.get('hub.verify_token') === env.WA_VERIFY_TOKEN
    ? text(q.get('hub.challenge') || '')
    : text('forbidden', 403);
}

export async function onRequestPost({ request, env, waitUntil }) {
  if (!configured(env)) return text('not_configured', 503);
  const raw = await request.text();
  if (raw.length > MAX_BODY) return text('too_large', 413);
  if (!(await signedByMeta(raw, request.headers.get('X-Hub-Signature-256'), env.WA_APP_SECRET))) return text('forbidden', 403);

  let payload;
  try { payload = JSON.parse(raw); } catch { return text('bad_request', 400); }

  // Meta exige respuesta rápida: confirmamos ya y la IA trabaja en segundo plano.
  waitUntil(handle(env, payload).catch(() => {}));
  return text('ok');
}

export const onRequest = () => text('method_not_allowed', 405);

// Firma HMAC-SHA256 del cuerpo con el App Secret; verify() compara en tiempo constante.
async function signedByMeta(raw, header, secret) {
  const m = /^sha256=([0-9a-f]{64})$/i.exec(header || '');
  if (!m) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const sig = new Uint8Array(m[1].match(/../g).map(h => parseInt(h, 16)));
  return crypto.subtle.verify('HMAC', key, sig, enc.encode(raw));
}

async function handle(env, payload) {
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      if (value.metadata && value.metadata.phone_number_id !== env.WA_PHONE_ID) continue;

      // Nicolás respondió desde la app de WhatsApp Business: el bot le cede ese chat.
      if (change.field === 'smb_message_echoes') {
        for (const echo of value.message_echoes || []) if (echo.to) await pause(env, echo.to);
        continue;
      }
      for (const msg of value.messages || []) await reply(env, msg);
    }
  }
}

async function reply(env, msg) {
  const from = String(msg.from || '');
  if (!/^\d{6,15}$/.test(from)) return;
  if (await seen(env, msg.id)) return;          // Meta reintenta envíos: cada mensaje se atiende una vez
  if (await paused(env, from)) return;

  if (msg.type !== 'text' || !msg.text || typeof msg.text.body !== 'string') {
    return send(env, from, 'Por ahora solo leo mensajes de texto. Cuéntame por escrito qué necesitas y te ayudo con gusto.');
  }
  const said = msg.text.body.trim().slice(0, LIMITS.chars);
  if (!said) return;

  if (HUMAN_WORDS.test(said)) {
    await pause(env, from);
    return send(env, from, 'Listo, le aviso a Nicolás y él te responde personalmente por este chat muy pronto.');
  }

  const history = await load(env, from);
  const turns = cleanTurns([...history, { role: 'user', content: said }]);
  let out = '';
  try { out = await answer(env, turns, 'whatsapp'); } catch { /* respuesta de respaldo abajo */ }
  if (!out) out = 'Gracias por escribir a Junp3x. Nicolás revisa tu mensaje y te responde pronto por aquí.';
  out = out.slice(0, 1_500);

  await send(env, from, out);
  await save(env, from, [...turns, { role: 'assistant', content: out }].slice(-LIMITS.turns));
}

async function send(env, to, body) {
  const res = await fetch(`${GRAPH}/${env.WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { body, preview_url: false } }),
  });
  if (!res.ok) throw new Error(`whatsapp_${res.status}`);
}

// Memoria opcional (KV "CHATS"). Sin ella el bot funciona igual, solo que sin recordar el chat.
const kv = env => env.CHATS || null;

async function load(env, who) {
  if (!kv(env)) return [];
  try { return JSON.parse((await kv(env).get(`chat:${who}`)) || '[]'); } catch { return []; }
}
async function save(env, who, turns) {
  if (kv(env)) await kv(env).put(`chat:${who}`, JSON.stringify(turns), { expirationTtl: DAY });
}
async function pause(env, who) {
  if (kv(env)) await kv(env).put(`pause:${who}`, '1', { expirationTtl: HUMAN_PAUSE });
}
async function paused(env, who) {
  return kv(env) ? (await kv(env).get(`pause:${who}`)) === '1' : false;
}
async function seen(env, id) {
  if (!kv(env) || !id) return false;
  const key = `seen:${String(id).slice(0, 128)}`;
  if (await kv(env).get(key)) return true;
  await kv(env).put(key, '1', { expirationTtl: DAY });
  return false;
}
