// Movimiento general: apariciones, bandas, barra, menú, botones y scroll suave.
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
  $$('.sec-title, .contact h2').forEach(splitWords);

  // cada parte de una sección entra con un pequeño retraso respecto a la anterior
  const parts = [];
  const stagger = (els, from = 0) => els.forEach((el, i) => {
    el.classList.add('rise');
    el.style.setProperty('--d', from + i);
    parts.push(el);
  });
  $$('.sec-head').forEach(head => {
    head.classList.add('rise');
    head.style.setProperty('--d', 0);
    parts.push(head);
    stagger($$('.sec-sub', head), 3);
  });
  stagger($$('.proj-meta'), 2);
  stagger($$('.cta-strip, .demo-grid, .demo-cta, .q-form, .q-result'));
  stagger($$('.services > li'));
  stagger($$('.process > li'));
  $$('.contact > *:not(h2)').forEach((el, i) => { el.classList.add('rise'); el.style.setProperty('--d', i); parts.push(el); });
  const contactTitle = $('.contact h2');
  onceVisible([...parts, contactTitle], el => el.classList.add('seen'), '0px 0px -8% 0px');

  const unveils = $$('.unveil');
  unveils.forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 90}ms`; });
  onceVisible(unveils, el => el.classList.add('seen'), '0px 0px -6% 0px');

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

/* ---------- Bandas de texto: siempre en movimiento, aceleran con el scroll ---------- */
const CUBE_COLORS = ['#35d0de', '#b98b9c', '#f0605a'];
function cubeIcon(n) {
  const k = CUBE_COLORS[n % 3];
  return svg('svg', { class: 'cube', viewBox: '0 0 26 30' }, [
    svg('path', { d: 'M13 0 26 7.5 13 15 0 7.5Z', fill: k, opacity: '.75' }),
    svg('path', { d: 'M0 7.5 13 15V30L0 22.5Z', fill: k }),
    svg('path', { d: 'M26 7.5 13 15V30L26 22.5Z', fill: k, opacity: '.55' }),
  ]);
}
let scrollVelocity = 0;
function bands() {
  const list = $$('.band').map(band => {
    const track = $('.band-track', band);
    const words = track.dataset.words.split('|');
    let n = 0;
    for (let r = 0; r < 2; r++) {
      const row = document.createElement('span');
      row.className = 'band-row';
      words.forEach((w, i) => {
        const s = document.createElement('span');
        s.textContent = w;
        if (w === 'Cotiza aquí mismo') s.className = 'go';
        else if (i % 2) s.className = 'o';
        row.append(s, cubeIcon(n++));
      });
      track.appendChild(row);
    }
    return { band, track, words: $$('.band-row > span', track), centers: [], dir: +band.dataset.dir, x: 0, width: 0, on: false };
  });
  if (reduce) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    const b = list.find(item => item.band === e.target);
    b.on = e.isIntersecting;
  }));
  list.forEach(b => io.observe(b.band));
  addEventListener('resize', () => list.forEach(b => { b.width = 0; }));

  let boost = 0, flow = 1, last = performance.now();
  const loop = now => {
    const dt = Math.min(64, now - last) / 1000;
    last = now;
    boost += (Math.min(40, Math.abs(scrollVelocity)) - boost) * .1;
    if (scrollVelocity) flow = Math.sign(scrollVelocity);
    scrollVelocity = 0;
    list.forEach(b => {
      if (!b.on) return;
      if (!b.width) {
        b.width = b.track.scrollWidth / 2;
        b.centers = b.words.map(w => w.offsetLeft + w.offsetWidth / 2);
      }
      b.x -= b.dir * flow * (42 + boost * 22) * dt;
      b.x = ((b.x % b.width) - b.width) % b.width;
      b.track.style.transform = `translate3d(${b.x}px,0,0) skewX(${-b.dir * flow * Math.min(8, boost * .25)}deg)`;
      // las palabras cerca del centro crecen y se encienden, como si pasaran bajo una lupa
      const mid = innerWidth / 2;
      b.words.forEach((w, i) => {
        const k = Math.max(0, 1 - Math.abs(b.x + b.centers[i] - mid) / (innerWidth * .6));
        w.style.setProperty('--k', (k * k * (3 - 2 * k)).toFixed(3));
      });
    });
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
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
    scrollVelocity += y - lastY;
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
  reveals();
  bands();
  chrome();
  magnetic();
  smoothWheel();
}
