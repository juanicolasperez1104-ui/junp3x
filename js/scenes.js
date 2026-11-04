// Escenas: vitrina de proyectos (deslizar o arrastrar, cambio automático), proceso que
// aparece al bajar, color de fondo, menú activo y cursor. Nada depende de la rueda del mouse.
import { $, $$, reduce, fine, pointer } from './utils.js?v=20261104c';

/* ---------- Proyectos: vitrina a pantalla completa ---------- */
// Se desliza con el dedo (o arrastrando con el mouse) y, si nadie la toca, pasa sola
// al siguiente proyecto cada 25 s. Cada capa se mueve a otra velocidad al cambiar.
const AUTO_MS = 25000;
function works() {
  const sec = $('#proyectos'), track = $('.works-track', sec), panels = $$('.work', sec), timer = $('#worksTimer');
  let cur = -1, raf = 0, inView = false, clock = 0, anim = null;

  const go = i => {
    const k = (i + panels.length) % panels.length;
    track.scrollTo({ left: panels[k].offsetLeft, behavior: reduce ? 'instant' : 'smooth' });
  };

  // cuenta regresiva visible como una línea fina; se reinicia con cada cambio
  const restart = () => {
    clearTimeout(clock);
    anim?.cancel();
    if (reduce || !inView || document.hidden) return;
    anim = timer.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: AUTO_MS, easing: 'linear', fill: 'forwards' });
    clock = setTimeout(() => go(cur + 1), AUTO_MS);
  };

  sec.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
  });

  // marca el proyecto visible y desplaza cada capa según qué tan centrado está
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
    panels.forEach((p, i) => p.toggleAttribute('inert', i !== idx));
    restart();
  };
  // mientras se desliza, las piezas siguen al dedo sin retraso
  let idle = 0;
  track.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(paint);
    track.classList.add('moving');
    clearTimeout(idle);
    idle = setTimeout(() => track.classList.remove('moving'), 160);
  }, { passive: true });
  addEventListener('resize', () => { cur = -1; paint(); });
  document.addEventListener('visibilitychange', restart);
  paint();
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) paint(); restart(); }, { threshold: .35 }).observe(track);

  // con el mouse: arrastrar de lado a lado, como con el dedo
  let drag = null;
  track.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('a, button')) return;
    e.preventDefault(); // sin esto el navegador arrastra la imagen en vez del carrusel
    drag = { x: e.clientX, left: track.scrollLeft, moved: false };
    track.classList.add('dragging');
  });
  addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) drag.moved = true;
    track.scrollLeft = drag.left - dx;
  });
  track.addEventListener('dragstart', e => e.preventDefault());
  const release = e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, w = track.clientWidth;
    track.classList.remove('dragging');
    const base = Math.round(drag.left / w);
    go(Math.abs(dx) > w * .12 ? base + (dx < 0 ? 1 : -1) : base);
    // un arrastre no abre la ficha del proyecto
    if (drag.moved) track.addEventListener('click', ev => ev.stopPropagation(), { capture: true, once: true });
    drag = null;
  };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);

  // con el puntero fino: la ventana del proyecto se inclina unos grados hacia él
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
