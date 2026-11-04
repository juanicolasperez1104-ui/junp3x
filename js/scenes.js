// Escenas: proyectos en carrusel (deslizar o botones), proceso que aparece al bajar,
// color de fondo, menú activo y cursor. Nada depende de la rueda del mouse: en el
// celular todo se maneja con el dedo o con botones.
import { $, $$, reduce, fine, pointer } from './utils.js';

/* ---------- Proyectos: carrusel horizontal con deslizamiento, flechas y puntos ---------- */
function works() {
  const sec = $('#proyectos'), track = $('.works-track', sec), panels = $$('.work', sec);
  const prev = $('#worksPrev'), next = $('#worksNext'), dotsBox = $('#worksDots');
  let cur = -1, raf = 0, inView = false;

  const dots = panels.map((w, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Ver ${$('h2', w).textContent}`);
    b.addEventListener('click', () => go(i));
    return b;
  });
  dotsBox.append(...dots);

  const go = i => {
    const k = Math.max(0, Math.min(panels.length - 1, i));
    track.scrollTo({ left: panels[k].offsetLeft, behavior: reduce ? 'instant' : 'smooth' });
  };
  prev.addEventListener('click', () => go(cur - 1));
  next.addEventListener('click', () => go(cur + 1));
  sec.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
  });

  // marca el proyecto visible y mueve un poco cada capa según qué tan centrado está
  const paint = () => {
    raf = 0;
    const x = track.scrollLeft, w = track.clientWidth || 1;
    const idx = Math.round(x / w);
    panels.forEach(p => {
      const off = (p.offsetLeft - x) / w;
      if (!reduce) p.style.setProperty('--sx', Math.max(-1.2, Math.min(1.2, off)).toFixed(3));
      if (inView && Math.abs(off) < .5) p.classList.add('seen');
    });
    if (idx === cur) return;
    cur = idx;
    dots.forEach((d, i) => d.setAttribute('aria-current', i === idx ? 'true' : 'false'));
    panels.forEach((p, i) => p.toggleAttribute('inert', i !== idx));
    prev.disabled = idx === 0;
    next.disabled = idx === panels.length - 1;
  };
  track.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
  addEventListener('resize', () => { cur = -1; paint(); });
  paint();
  // el texto del proyecto entra cuando el carrusel llega a la pantalla
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) paint(); }, { threshold: .35 }).observe(track);

  // con el puntero: la ventana del proyecto se inclina unos grados hacia él
  if (!fine || reduce) return;
  $$('.work-media', sec).forEach(m => {
    m.addEventListener('pointermove', e => {
      const r = m.getBoundingClientRect();
      m.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - .5) * 5}deg`);
      m.style.setProperty('--rx', `${(.5 - (e.clientY - r.top) / r.height) * 4}deg`);
    });
    m.addEventListener('pointerleave', () => { m.style.setProperty('--rx', '0deg'); m.style.setProperty('--ry', '0deg'); });
  });
}

/* ---------- Proceso: cada paso entra al llegar a él y se apila sobre el anterior ---------- */
function process() {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('on');
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -25% 0px' });
  $$('#proceso .sx-panel').forEach(p => io.observe(p));
}

/* ---------- Color de fondo que cambia con cada sección ---------- */
function tones() {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) document.body.style.backgroundColor = e.target.dataset.tone;
  }), { rootMargin: '-50% 0px -50% 0px' });
  $$('[data-tone]').forEach(el => io.observe(el));
}

/* ---------- Cursor: un círculo con una palabra sobre las imágenes que se abren ---------- */
function cursor() {
  if (!fine || reduce) return;
  const dot = $('#cursor'), label = $('span', dot);
  document.documentElement.classList.add('has-cursor');
  let x = pointer.x, y = pointer.y, raf = 0, on = false;
  const loop = () => {
    x += (pointer.x - x) * .2; y += (pointer.y - y) * .2;
    dot.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    raf = on ? requestAnimationFrame(loop) : 0;
  };
  document.addEventListener('pointerover', e => {
    const t = e.target.closest('[data-cursor]');
    on = !!t;
    dot.classList.toggle('on', on);
    if (!t) return;
    label.textContent = t.dataset.cursor;
    if (!raf) { x = pointer.x; y = pointer.y; raf = requestAnimationFrame(loop); }
  });
}

/* ---------- Menú: marca la sección que se está viendo ---------- */
function navSpy() {
  const links = $$('.nav ul a');
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    const link = links.find(a => a.getAttribute('href') === `#${e.target.id}`);
    if (link) link.classList.toggle('on', e.isIntersecting);
  }), { rootMargin: '-45% 0px -45% 0px' });
  links.forEach(a => { const s = $(a.getAttribute('href')); if (s) io.observe(s); });
}

export function initScenes() {
  tones();
  navSpy();
  // lo que recibe el foco del teclado aparece aunque su animación de entrada no haya corrido
  document.addEventListener('focusin', e => e.target.closest('.rise, .sx-panel')?.classList.add('seen', 'on'));
  works();
  process();
  cursor();
}
