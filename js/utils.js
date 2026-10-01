// Utilidades compartidas: preferencias del usuario, colores de marca, SVG y puntero.

export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fine = matchMedia('(pointer: fine)').matches;

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const clamp01 = v => Math.max(0, Math.min(1, v));

// Colores de la marca y mezclas
export const CORAL = [240, 96, 90];
export const CYAN = [53, 208, 222];
export const BG = [30, 34, 37];
export const mix = t => CORAL.map((c, i) => Math.round(c + (CYAN[i] - c) * t));
export const shade = (rgb, k) => rgb.map(c => Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k)));
export const rgba = (rgb, a = 1) => `rgba(${rgb.join(',')},${a})`;

// Crea elementos SVG sin usar innerHTML
const NS = 'http://www.w3.org/2000/svg';
export function svg(tag, attrs = {}, children = []) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  children.forEach(c => el.appendChild(c));
  return el;
}

// Posición del puntero, compartida por el cursor y el terreno de la portada
export const pointer = { x: innerWidth / 2, y: innerHeight / 2, active: false };
addEventListener('pointermove', e => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.active = true;
}, { passive: true });

// Ejecuta una vez cuando el elemento entra en pantalla
export function onceVisible(els, cb, rootMargin = '0px 0px -10% 0px') {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    cb(e.target);
    io.unobserve(e.target);
  }), { rootMargin });
  els.forEach(el => io.observe(el));
}

// Un solo bucle de scroll para todos los efectos que dependen de él
const scrollFns = [];
let ticking = false;
export function onScroll(fn) {
  scrollFns.push(fn);
  fn();
}
function runScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    scrollFns.forEach(fn => fn());
  });
}
addEventListener('scroll', runScroll, { passive: true });
addEventListener('resize', runScroll);
