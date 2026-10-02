// Cloudflare Pages Function: POST /api/chat
// Recibe la conversación del asistente y responde con IA. Usa, en este orden:
//   1. Claude, si existe la variable secreta ANTHROPIC_API_KEY.
//   2. La IA gratuita de Cloudflare (Workers AI), si el proyecto tiene el enlace "AI".
// Ninguna llave llega al navegador.
import { systemPrompt, cleanTurns, LIMITS } from '../../js/knowledge.js';

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const FREE_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const MAX_BODY = 8_000;            // bytes que aceptamos del navegador
const WINDOW_MS = 60_000;          // ventana del límite por visitante
const MAX_PER_WINDOW = 12;         // mensajes por minuto por IP (refuerzo; el límite fuerte va en Cloudflare)
const hits = new Map();

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});

function tooMany(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5_000) hits.clear();
  return list.length > MAX_PER_WINDOW;
}

function sameOrigin(origin, host) {
  try { return new URL(origin).host === host; } catch { return false; }
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  if (!sameOrigin(request.headers.get('Origin'), url.host)) return json({ error: 'forbidden' }, 403);
  if (!(request.headers.get('Content-Type') || '').includes('application/json')) return json({ error: 'bad_request' }, 400);
  if (!env.ANTHROPIC_API_KEY && !env.AI) return json({ error: 'not_configured' }, 503);
  if (tooMany(request.headers.get('CF-Connecting-IP') || 'anon')) return json({ error: 'rate_limited' }, 429);

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: 'too_large' }, 413);
  let messages;
  try { messages = cleanTurns(JSON.parse(raw).messages); } catch { return json({ error: 'bad_request' }, 400); }
  if (!messages.length) return json({ error: 'bad_request' }, 400);

  try {
    const text = tidy(env.ANTHROPIC_API_KEY ? await askClaude(env, messages) : await askFree(env, messages));
    return text ? json({ text }) : json({ error: 'empty' }, 502);
  } catch (e) {
    return json({ error: e && e.code === 'rate_limited' ? 'rate_limited' : 'upstream_error' }, 502);
  }
}

async function askClaude(env, messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: LIMITS.maxTokens, system: systemPrompt(), messages }),
  });
  if (!res.ok) throw { code: res.status === 429 ? 'rate_limited' : 'upstream_error' };
  const data = await res.json();
  return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
}

async function askFree(env, messages) {
  const out = await env.AI.run(FREE_MODEL, {
    messages: [{ role: 'system', content: systemPrompt() }, ...messages],
    max_tokens: LIMITS.maxTokens,
    temperature: .4,
  });
  return out && typeof out.response === 'string' ? out.response : '';
}

// Respuesta en texto plano: sin asteriscos ni almohadillas de formato.
const tidy = text => String(text || '').replace(/[*#_`]+/g, '').replace(/\n{3,}/g, '\n\n').trim();

export const onRequest = () => json({ error: 'method_not_allowed' }, 405);
