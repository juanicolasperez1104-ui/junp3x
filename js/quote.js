// Cotizador: calcula el rango de precio, dibuja el proyecto en vivo y arma el mensaje de WhatsApp.
import { $, $$, reduce, svg, mix, shade, rgba } from './utils.js';
import { WHATSAPP, TYPES, EXTRAS, PER_SECTION, RUSH } from './pricing.js';


const form = $('#qForm');
const el = {
  sections: $('#qSections'), sectionsOut: $('#qSecOut'), sectionsBox: $('#qSecWrap'), hint: $('#qSecHint'),
  min: $('#qMin'), max: $('#qMax'), lines: $('#qLines'), send: $('#qSend'), progress: $('#qProg'),
  tower: $('#qTower'), tag: $('#qTag'), mini: $('#qMiniVal'),
  botWrap: $('#x-botWrap'), d3Wrap: $('#x-3dWrap'), domainWrap: $('#x-dominio').closest('label'),
};
const touched = new Set(['type']);
const round5 = v => Math.round(v / 5) * 5;
const money = ([a, b]) => (a === b ? `$${a}` : `$${a}–${b}`);
let shown = [0, 0];

function countTo(node, from, to) {
  if (reduce || from === to) { node.textContent = to; return; }
  const t0 = performance.now();
  const step = t => {
    const k = Math.min(1, (t - t0) / 450), e = 1 - Math.pow(1 - k, 3);
    node.textContent = Math.round(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function update() {
  const type = form.type.value, T = TYPES[type], web = Boolean(T.includes);
  const sections = +el.sections.value;
  const fast = form.when.value === 'rapido';

  el.sectionsBox.disabled = !web;
  el.hint.textContent = web
    ? `Incluye ${T.includes} ${T.unit}. Cada una extra suma entre $${PER_SECTION[0]} y $${PER_SECTION[1]}.`
    : type === 'chatbot' ? 'El chatbot se cotiza por flujo completo, no por secciones.' : 'La identidad visual no depende de secciones.';
  el.botWrap.hidden = !web;
  el.d3Wrap.hidden = !web;
  el.domainWrap.hidden = type === 'marca';
  el.sectionsOut.textContent = sections;

  let [lo, hi] = T.base;
  const lines = [[T.name, money(T.base)]];
  if (web) {
    const extra = Math.max(0, sections - T.includes);
    if (extra) {
      lo += extra * PER_SECTION[0];
      hi += extra * PER_SECTION[1];
      lines.push([`${extra} ${T.unit} extra`, money([extra * PER_SECTION[0], extra * PER_SECTION[1]])]);
    }
  }
  const chosen = new Set();
  $$('.checks input:checked', form).forEach(c => {
    const X = EXTRAS[c.value];
    if (!X || (X.webOnly && !web) || (X.notForBrand && type === 'marca')) return;
    lo += X.price[0];
    hi += X.price[1];
    lines.push([X.name, money(X.price)]);
    chosen.add(c.value);
  });
  if (fast) { lines.push(['Entrega en 1 semana', '+20%']); lo *= RUSH; hi *= RUSH; }
  lo = round5(lo);
  hi = round5(hi);

  countTo(el.min, shown[0], lo);
  countTo(el.max, shown[1], hi);
  shown = [lo, hi];
  el.mini.textContent = `$${lo}–${hi} USD`;
  el.lines.replaceChildren(...lines.map(([a, b]) => {
    const li = document.createElement('li');
    const s1 = document.createElement('span'); s1.textContent = a;
    const s2 = document.createElement('span'); s2.textContent = b;
    li.append(s1, s2);
    return li;
  }));

  const extrasText = [...chosen].map(k => EXTRAS[k].name.toLowerCase());
  const msg = `Hola Junp3x, quiero cotizar: ${T.name}`
    + (web ? `, ${sections} ${T.unit}` : '')
    + (extrasText.length ? `, con ${extrasText.join(', ')}` : '')
    + `. Entrega: ${fast ? 'en 1 semana' : '2 a 3 semanas'}. Estimado de la página: $${lo} a $${hi} USD.`;
  el.send.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  el.progress.style.transform = `scaleX(${touched.size / 4})`;
  drawTower(type, web ? sections : 0, chosen, fast);
}

/* ---------- Vista en vivo: cada sección es un bloque que cae sobre la torre ---------- */
let previous = { type: null, layers: 0 };
function drawTower(type, sections, extras, fast) {
  const cx = 120, base = 212, hw = type === 'marca' ? 44 : 56, hd = hw * .5;
  const isWeb = sections > 0, layers = isWeb ? sections : type === 'chatbot' ? 3 : 1;
  const th = type === 'marca' ? hw * 1.1 : Math.min(12, 96 / layers), gap = type === 'marca' ? 0 : 3;
  const poly = (pts, fill) => svg('path', { d: `M${pts.join('L')}Z`, fill });

  const slabs = [];
  for (let k = 0; k < layers; k++) {
    const y = base - hd - th - k * (th + gap);
    const col = mix(layers === 1 ? .5 : k / (layers - 1));
    const g = svg('g', { class: 'slab' }, [
      poly([[cx - hw, y], [cx, y + hd], [cx, y + hd + th], [cx - hw, y + th]], rgba(col)),
      poly([[cx, y + hd], [cx + hw, y], [cx + hw, y + th], [cx, y + hd + th]], rgba(shade(col, -.35))),
      poly([[cx, y - hd], [cx + hw, y], [cx, y + hd], [cx - hw, y]], rgba(shade(col, .2))),
    ]);
    if (extras.has('textos') && th > 8) {
      g.appendChild(svg('path', { d: `M${cx - hw + 8} ${y + th * .45 + 4}L${cx - 14} ${y + hd + th * .45 - 3}`, stroke: 'rgba(255,255,255,.55)', 'stroke-width': 1.4, 'stroke-linecap': 'round' }));
    }
    if (type === 'marca') {
      const t = svg('text', { x: cx, y: y + 2, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': 'JetBrains Mono, monospace', 'font-weight': 700, 'font-size': 16, fill: '#fff' });
      t.textContent = 'Aa';
      g.appendChild(t);
    }
    g.dataset.k = k;
    slabs.push(g);
  }

  const topY = base - hd - th - (layers - 1) * (th + gap) - hd;
  const parts = [
    svg('ellipse', { cx, cy: base + 4, rx: hw + 18, ry: (hw + 18) * .36, fill: 'rgba(0,0,0,.35)' }),
    svg('g', { class: extras.has('3d') && isWeb ? 'glow' : '' }, slabs),
  ];
  let orbit = null, bubble = null;
  if (extras.has('dominio') && type !== 'marca') {
    orbit = svg('ellipse', { cx, cy: (topY + base) / 2, rx: hw + 26, ry: (hw + 26) * .32, fill: 'none', stroke: 'rgba(53,208,222,.6)', 'stroke-width': 1.2, 'stroke-dasharray': '3 6' });
    parts.push(orbit);
  }
  if ((extras.has('bot') && isWeb) || type === 'chatbot') {
    bubble = svg('g', { transform: `translate(${cx + hw + 4} ${Math.max(28, topY + 6)})` }, [
      svg('rect', { x: -20, y: -14, width: 40, height: 26, rx: 9, fill: '#25d366' }),
      svg('path', { d: 'M-8 12l-4 8 10-8z', fill: '#25d366' }),
      ...[-9, 0, 9].map(x => svg('circle', { cx: x, cy: -1, r: 2.6, fill: '#0b2615' })),
    ]);
    parts.push(bubble);
  }
  el.tower.replaceChildren(...parts);

  const label = isWeb ? `${sections} ${sections === 1 ? 'sección' : 'secciones'}` : type === 'chatbot' ? 'Flujo de chatbot' : 'Identidad visual';
  el.tag.textContent = label + (fast ? ' · modo rápido' : '');

  if (!reduce) {
    const from = previous.type === type ? previous.layers : 0;
    slabs.forEach(s => {
      const k = +s.dataset.k;
      if (k >= from) s.animate([{ transform: 'translateY(-60px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 650, delay: (k - from) * 70, easing: 'cubic-bezier(.22,1.25,.36,1)', fill: 'backwards' });
    });
    bubble?.animate([{ opacity: .6, translate: '0 3px' }, { opacity: 1, translate: '0 -3px' }], { duration: 1400, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
    orbit?.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -90 }], { duration: 3000, iterations: Infinity });
  }
  previous = { type, layers };
}

/* ---------- Accesos rápidos: botón flotante y barra de precio en celular ---------- */
function shortcuts() {
  // cualquier enlace "cotizar esto" deja el cotizador listo con ese tipo
  document.addEventListener('click', e => {
    const link = e.target.closest('a[data-type][href="#cotizar"]');
    if (!link) return;
    const radio = document.getElementById(`t-${link.dataset.type}`);
    if (!radio) return;
    radio.checked = true;
    touched.add('type');
    update();
  });

  const dock = $('#qdock');
  const zones = { hero: true, quote: false, contact: false };
  const dockIO = new IntersectionObserver(entries => {
    entries.forEach(e => { zones[e.target.dataset.zone] = e.isIntersecting; });
    dock.classList.toggle('show', !zones.hero && !zones.quote && !zones.contact);
  }, { threshold: .15 });
  [['hero', 'inicio'], ['quote', 'cotizar'], ['contact', 'contacto']].forEach(([zone, id]) => {
    const section = document.getElementById(id);
    section.dataset.zone = zone;
    dockIO.observe(section);
  });

  const mini = $('#qmini'), result = $('#qResult');
  const state = { form: false, result: false };
  const miniIO = new IntersectionObserver(entries => {
    entries.forEach(e => { state[e.target === form ? 'form' : 'result'] = e.isIntersecting; });
    mini.classList.toggle('show', state.form && !state.result);
  });
  miniIO.observe(form);
  miniIO.observe(result);
}

export function initQuote() {
  form.addEventListener('input', e => {
    const t = e.target;
    touched.add(t.name === 'type' ? 'type' : t === el.sections ? 'sections' : t.type === 'checkbox' ? 'extras' : 'when');
    update();
  });
  form.addEventListener('submit', e => e.preventDefault());
  update();
  shortcuts();
}
