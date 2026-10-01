// Asistente con IA: se abre desde el botón de WhatsApp, responde dudas y precios,
// y pasa la conversación a WhatsApp cuando la persona quiere hablar con Nicolás.
import { $, $$, fine } from './utils.js';
import { systemPrompt, cleanTurns, LIMITS } from './knowledge.js';
import { waLink } from './pricing.js';
import { buildRobot, followPointer } from './robot.js';

const WELCOME = 'Hola, soy el asistente de Junp3x. Cuéntame qué necesita tu negocio y te doy un precio orientativo al instante.';
const FALLBACK = 'Ahora mismo no puedo responder por aquí. Toca "Seguir por WhatsApp" y Nicolás te contesta en persona.';
const ERRORS = {
  rate_limited: 'Hay muchas consultas en este momento. Intenta de nuevo en un minuto o sigue por WhatsApp.',
  session_expired: 'Tu sesión expiró. Vuelve a entrar o sigue por WhatsApp.',
  refused: 'Con eso no puedo ayudarte. Pregúntame por páginas, chatbots o identidad visual.',
  prompt_too_large: 'La conversación ya es muy larga. Sigue por WhatsApp y Nicolás retoma desde aquí.',
};
// Errores que significan "la IA no está disponible en esta vista": no se vuelve a intentar.
const PERMANENT = new Set(['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed', 'not_configured']);

const ui = {
  panel: $('#chat'), log: $('#chatLog'), form: $('#chatForm'), input: $('#chatInput'),
  send: $('#chatSend'), chips: $('#chatChips'), wa: $('#chatWa'), close: $('#chatClose'), toggle: $('#aiFab'), face: $('#robotChat'),
};
const history = [];
let busy = false, offline = false, provider = null;
let pinned = false, hoverTimer = 0;   // pinned: la persona hizo clic o escribió, ya no se cierra solo

/* ---------- Conexión con la IA ---------- */
// En la vista previa de Claude se usa la capacidad "sample"; publicada en un hosting, el servidor propio (/api/chat).
function viaSample(sample) {
  return (turns, onText, signal) => {
    const [first, ...rest] = turns;
    const input = [{ role: 'user', content: `${systemPrompt()}\n\nMensaje del visitante:\n${first.content}` }, ...rest];
    return sample(input, { onText: ({ text }) => onText(text), signal, modelTier: 'quick', cache: false }).then(r => r.text);
  };
}
async function viaServer(turns, onText, signal) {
  const res = await fetch('/api/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: turns }), signal,
  });
  const data = res.headers.get('Content-Type')?.includes('json') ? await res.json() : {};
  if (!res.ok || typeof data.text !== 'string') throw { code: res.status === 404 ? 'not_configured' : data.error || 'upstream_error' };
  onText(data.text);
  return data.text;
}
function connect() {
  if (!provider) {
    const use = window.claude && typeof window.claude.use === 'function' ? window.claude.use('sample') : Promise.resolve(null);
    provider = Promise.resolve(use).catch(() => null).then(s => (s ? viaSample(s) : viaServer));
  }
  return provider;
}

/* ---------- Conversación ---------- */
function bubble(role, text = '') {
  const b = document.createElement('p');
  b.className = `msg ${role}`;
  b.textContent = text;
  ui.log.append(b);
  ui.log.scrollTop = ui.log.scrollHeight;
  return b;
}
function typing(b) {
  b.classList.add('typing');
  b.replaceChildren(...[0, 1, 2].map(() => document.createElement('i')));
}
function updateHandoff() {
  const said = history.filter(t => t.role === 'user').map(t => t.content).join(' / ').slice(0, 400);
  ui.wa.href = waLink(said ? `Hola Junp3x, vengo del asistente de la página. Me interesa: ${said}` : 'Hola Junp3x, quiero cotizar un proyecto.');
}

async function ask(text) {
  text = text.trim().slice(0, LIMITS.chars);
  if (!text || busy) return;
  busy = true;
  ui.send.disabled = true;
  ui.chips.hidden = true;
  ui.input.value = '';
  history.push({ role: 'user', content: text });
  bubble('user', text);
  updateHandoff();

  const reply = bubble('bot');
  if (offline) { reply.textContent = FALLBACK; return done(); }
  typing(reply);
  ui.face.classList.add('think');
  try {
    const talk = await connect();
    const answer = await talk(cleanTurns(history), t => {
      reply.classList.remove('typing');
      reply.textContent = t;
      ui.log.scrollTop = ui.log.scrollHeight;
    }, new AbortController().signal);
    reply.classList.remove('typing');
    reply.textContent = answer;
    history.push({ role: 'assistant', content: answer });
  } catch (e) {
    const code = (e && e.code) || 'upstream_error';
    if (PERMANENT.has(code)) offline = true;
    reply.classList.remove('typing');
    reply.textContent = ERRORS[code] || FALLBACK;
    reply.classList.add('note');
  }
  done();
}
function done() {
  busy = false;
  ui.face.classList.remove('think');
  ui.send.disabled = false;
  ui.wa.classList.add('ready');
  ui.log.scrollTop = ui.log.scrollHeight;
}

/* ---------- Abrir y cerrar ---------- */
function setOpen(open) {
  if (!open) pinned = false;
  ui.panel.classList.toggle('open', open);
  ui.panel.inert = !open;
  ui.toggle.setAttribute('aria-expanded', String(open));
  ui.toggle.classList.toggle('active', open);
  document.body.classList.toggle('chat-open', open);
  if (open) {
    connect();
    if (!ui.log.childElementCount) bubble('bot', WELCOME);
    if (fine && pinned) ui.input.focus({ preventScroll: true });
  } else if (ui.panel.contains(document.activeElement)) {
    ui.toggle.focus();
  }
}

export function initAssistant() {
  if (!ui.panel) return;
  buildRobot($('#robotFab'));
  buildRobot(ui.face);
  followPointer();
  ui.panel.inert = true;
  const isOpen = () => ui.panel.classList.contains('open');
  ui.toggle.addEventListener('click', () => {
    if (isOpen() && pinned) return setOpen(false);
    pinned = true;
    setOpen(true);
  });
  // con mouse: el chat se abre al pasar el cursor y se cierra solo si nadie lo usó
  if (fine) {
    // se abre solo cuando el cursor se mueve sobre el botón (no si el botón aparece bajo un cursor quieto)
    ui.toggle.addEventListener('pointermove', () => {
      if (isOpen() || hoverTimer || !$('#intro').hidden) return;
      hoverTimer = setTimeout(() => { hoverTimer = 0; setOpen(true); }, 140);
    });
    const stay = () => { clearTimeout(hoverTimer); hoverTimer = 0; };
    const leave = () => {
      stay();
      if (isOpen() && !pinned) hoverTimer = setTimeout(() => { hoverTimer = 0; setOpen(false); }, 700);
    };
    [ui.toggle, ui.panel].forEach(el => {
      el.addEventListener('pointerenter', () => { if (isOpen()) stay(); });
      el.addEventListener('pointerleave', leave);
    });
    ui.panel.addEventListener('pointerdown', () => { pinned = true; });
    ui.input.addEventListener('input', () => { pinned = true; });
  }
  ui.close.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && ui.panel.classList.contains('open')) setOpen(false); });
  ui.form.addEventListener('submit', e => { e.preventDefault(); ask(ui.input.value); });
  $$('button', ui.chips).forEach(b => b.addEventListener('click', () => ask(b.textContent)));
  updateHandoff();
}
