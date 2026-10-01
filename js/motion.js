// Movimiento general: apariciones, bandas, luz en tarjetas, cursor, barra y scroll suave.
import { $, $$, reduce, fine, pointer, onceVisible, onScroll, svg } from './utils.js';

/* ---------- Títulos que suben palabra por palabra y bloques que aparecen ---------- */
function reveals() {
  document.documentElement.classList.add('js');
  $$('.sec-title').forEach(title => {
    const words = title.textContent.trim().split(/\s+/);
    title.replaceChildren();
    words.forEach((word, i) => {
      const outer = document.createElement('span');
      const inner = document.createElement('span');
      outer.className = 'w';
      inner.textContent = word;
      inner.style.setProperty('--i', i);
      outer.appendChild(inner);
      title.append(outer, ' ');
    });
  });
  const blocks = $$('.sec-head,.projects,.demo-grid,.gallery,.services,.process,.quote');
  blocks.forEach(el => el.classList.add('sec-in'));
  onceVisible(blocks, el => el.classList.add('seen'));
  const unveils = $$('.unveil');
  unveils.forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 90}ms`; });
  onceVisible(unveils, el => el.classList.add('seen'), '0px 0px -6% 0px');
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

/* ---------- Interacciones con el mouse ---------- */
function pointerEffects() {
  if (!fine || reduce) return;
  // luz que sigue al puntero en tarjetas
  $$('.spot').forEach(el => el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', `${e.clientX - r.left}px`);
    el.style.setProperty('--py', `${e.clientY - r.top}px`);
  }));
  // botones que se acercan al puntero
  $$('.magnetic').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--mx', `${(e.clientX - r.left - r.width / 2) * .28}px`);
      b.style.setProperty('--my', `${(e.clientY - r.top - r.height / 2) * .35}px`);
    });
    b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
  });
  // cursor en forma de bloque
  const cur = $('#cursor');
  let cx = pointer.x, cy = pointer.y;
  addEventListener('pointermove', () => { cur.style.opacity = '1'; }, { passive: true });
  document.addEventListener('pointerleave', () => { cur.style.opacity = '0'; });
  document.addEventListener('pointerover', e => cur.classList.toggle('big', !!e.target.closest('a,button,.steps li,label')));
  const follow = () => {
    cx += (pointer.x - cx) * .2;
    cy += (pointer.y - cy) * .2;
    cur.style.transform = `translate(${cx}px,${cy}px)`;
    requestAnimationFrame(follow);
  };
  follow();
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
  pointerEffects();
  smoothWheel();
}
