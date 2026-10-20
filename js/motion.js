// Movimiento general: apariciones, botones, barra, menú y scroll suave.
import { $, $$, reduce, fine, onceVisible, onScroll, svg } from './utils.js';

/* ---------- Apariciones: títulos por palabras y bloques por partes ---------- */
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.replaceChildren();
  words.forEach((word, i) => {
    const outer = document.createElement('span');
    const inner = document.createElement('span');
    outer.className = 'w';
    inner.textContent = word;
    inner.style.setProperty('--i', i);
    outer.appendChild(inner);
    el.append(outer, ' ');
  });
}

function reveals() {
  document.documentElement.classList.add('js');
  $$('.sec-title, .contact h2, .x3-card h2, .work h2').forEach(splitWords);

  // cada parte de una sección entra con un pequeño retraso respecto a la anterior
  const parts = [];
  const stagger = (els, cls = 'rise', from = 0) => els.forEach((el, i) => {
    el.classList.add(cls);
    el.style.setProperty('--d', from + i);
    parts.push(el);
  });
  $$('.sec-head').forEach(head => {
    stagger([head]);
    stagger($$('.sec-sub', head), 'rise', 3);
  });
  stagger($$('.q-form, .q-result'));
  stagger($$('.app-copy > :not(.sec-title)'), 'rise', 2);
  stagger($$('.contact-in > *:not(h2)'));
  // los servicios llegan deslizándose, uno desde cada lado
  $$('.services > li').forEach((li, i) => li.style.setProperty('--side', i % 2 ? 1 : -1));
  stagger($$('.services > li'), 'slide');
  onceVisible([...parts, ...$$('.sec-title, .contact h2, .x3-card')], el => el.classList.add('seen'), '0px 0px -8% 0px');

  // el nombre del pie sube letra por letra
  const mark = $('.foot-mark');
  mark.replaceChildren(...[...mark.textContent].map((ch, i) => {
    const s = document.createElement('span');
    s.textContent = ch;
    s.style.setProperty('--i', i);
    return s;
  }));
  onceVisible([mark], el => el.classList.add('seen'), '0px 0px -4% 0px');
}

/* ---------- Botones: texto que rueda y flecha en un círculo ---------- */
function buttons() {
  $$('.btn, .nav-cta').forEach(b => {
    if (b.nodeName === 'A' && !b.classList.contains('btn')) b.classList.add('btn', 'btn-main');
    const icon = $('svg', b);
    const text = b.textContent.trim();
    const label = document.createElement('span');
    const front = document.createElement('span');
    const back = document.createElement('span');
    label.className = 'btn-label';
    front.textContent = text;
    back.textContent = text;
    back.setAttribute('aria-hidden', 'true');
    label.append(front, back);
    const kids = icon ? [icon, label] : [label];
    if (!icon && b.classList.contains('btn-main') && !b.classList.contains('nav-cta')) {
      const chip = document.createElement('span');
      chip.className = 'btn-chip';
      chip.appendChild(svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }, [svg('path', { d: 'M5 12h14M13 6l6 6-6 6' })]));
      kids.push(chip);
      b.classList.add('has-chip');
    }
    b.replaceChildren(...kids);
    // el color de relleno nace desde donde entra el puntero
    if (fine) b.addEventListener('pointerenter', e => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--fx', `${e.clientX - r.left}px`);
    });
  });
}

/* ---------- Barra de progreso y menú que se esconde al bajar ---------- */
function chrome() {
  const bar = $('#progress'), nav = $('#nav');
  let lastY = scrollY;
  onScroll(() => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('scrolled', y > 40);
    if (Math.abs(y - lastY) > 6) nav.classList.toggle('hide', y > lastY && y > innerHeight * .6);
    lastY = y;
  });
}

/* ---------- Botones que se acercan levemente al puntero ---------- */
function magnetic() {
  if (!fine || reduce) return;
  $$('.magnetic').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--mx', `${(e.clientX - r.left - r.width / 2) * .16}px`);
      b.style.setProperty('--my', `${(e.clientY - r.top - r.height / 2) * .22}px`);
    });
    b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
  });
}

/* ---------- Scroll suave con inercia para la rueda del mouse ---------- */
function smoothWheel() {
  if (!fine || reduce) return;
  let target = scrollY, current = scrollY, active = false;
  const maxY = () => document.documentElement.scrollHeight - innerHeight;
  const glide = () => {
    current += (target - current) * .085;
    if (Math.abs(target - current) < .5) { current = target; active = false; }
    scrollTo({ top: current, behavior: 'instant' });
    if (active) requestAnimationFrame(glide);
  };
  addEventListener('wheel', e => {
    if (e.ctrlKey || e.defaultPrevented || document.body.style.overflow === 'hidden' || $('dialog[open]')) return;
    e.preventDefault();
    if (!active) target = current = scrollY;
    const d = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    target = Math.max(0, Math.min(maxY(), target + d));
    if (!active) { active = true; requestAnimationFrame(glide); }
  }, { passive: false });
  const stop = () => { active = false; };
  addEventListener('keydown', stop);
  addEventListener('pointerdown', stop);
}

export function initMotion() {
  buttons();
  reveals();
  chrome();
  magnetic();
  smoothWheel();
}
