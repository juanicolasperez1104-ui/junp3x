// Escenas guiadas por el scroll: app de mantenimiento, proyectos en horizontal,
// proceso en paneles, color de fondo, menú activo y cursor.
import { $, $$, reduce, fine, clamp01, onScroll, pointer } from './utils.js';

const smooth = t => t * t * (3 - 2 * t);
// avance de 0 a 1 de una sección alta mientras su contenido queda fijo en pantalla
const progress = el => {
  const r = el.getBoundingClientRect();
  return clamp01(-r.top / Math.max(1, r.height - innerHeight));
};
// recorre tramos con una pausa en cada parada para dar tiempo a leer
const dwell = (seg, hold = .2) => {
  const k = Math.floor(seg), f = seg - k;
  return k + smooth(clamp01((f - hold) / (1 - hold * 2)));
};

/* ---------- App: el celular cambia de pantalla y el texto acompaña cada paso ---------- */
function app() {
  const sec = $('#app'), caps = $$('.app-caps li', sec), screens = $$('.scr', sec);
  const laptop = $('.laptop', sec), phone = $('.handset', sec);
  let cur = 0;
  const show = idx => {
    if (idx === cur) return;
    cur = idx;
    caps.forEach((c, i) => c.classList.toggle('on', i === idx));
    screens.forEach((s, i) => { s.classList.toggle('on', i === idx); s.classList.toggle('past', i < idx); });
  };
  onScroll(() => {
    const p = progress(sec);
    show(Math.min(caps.length - 1, Math.floor(p * caps.length)));
    sec.style.setProperty('--p', p.toFixed(4));
    laptop.style.setProperty('--ly', `${((.5 - p) * 70).toFixed(1)}px`);
    phone.style.setProperty('--hy', `${((p - .5) * 50).toFixed(1)}px`);
  });
}

/* ---------- Proyectos: el scroll vertical recorre los paneles de lado a lado ---------- */
function works() {
  const sec = $('#proyectos'), track = $('.works-track', sec), panels = $$('.work', sec), bar = $('#worksProg');
  let dist = 0;
  const size = () => {
    dist = Math.max(0, track.scrollWidth - innerWidth);
    sec.style.height = `${dist + innerHeight}px`;
  };
  size();
  new ResizeObserver(size).observe(track);
  onScroll(() => {
    const p = progress(sec), n = panels.length - 1;
    const x = dwell(p * n, .16) / n * dist;
    track.style.transform = `translate3d(${-x}px,0,0)`;
    bar.style.transform = `scaleX(${p})`;
    panels.forEach(w => {
      const off = (w.offsetLeft - x) / w.offsetWidth;
      w.style.setProperty('--sx', Math.max(-1.2, Math.min(1.2, off)).toFixed(3));
      if (Math.abs(off) < .5) w.classList.add('seen');
    });
  });

  // con el teclado: el contenedor fijo no se desplaza solo; la página baja hasta el proyecto enfocado
  const pin = $('.works-pin', sec);
  pin.addEventListener('scroll', () => { pin.scrollLeft = 0; });
  panels.forEach((w, i) => w.addEventListener('focusin', () => {
    pin.scrollLeft = 0;
    const top = sec.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + (i / (panels.length - 1)) * (sec.offsetHeight - innerHeight), behavior: 'instant' });
  }));

  // con el puntero: la ventana del proyecto se inclina unos grados hacia él
  if (!fine) return;
  $$('.work-media', sec).forEach(m => {
    m.addEventListener('pointermove', e => {
      const r = m.getBoundingClientRect();
      m.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - .5) * 5}deg`);
      m.style.setProperty('--rx', `${(.5 - (e.clientY - r.top) / r.height) * 4}deg`);
    });
    m.addEventListener('pointerleave', () => { m.style.setProperty('--rx', '0deg'); m.style.setProperty('--ry', '0deg'); });
  });
}

/* ---------- Proceso: cada paso entra deslizándose sobre el anterior ---------- */
function process() {
  const sec = $('#proceso'), panels = $$('.sx-panel', sec), n = panels.length;
  onScroll(() => {
    const seg = progress(sec) * (n - 1);
    const t = panels.map((_, i) => i === 0 ? 1 : smooth(clamp01((seg - (i - 1) - .12) / .76)));
    panels.forEach((el, i) => {
      const cover = t[i + 1] || 0;
      el.style.transform = `translate3d(${((1 - t[i]) * 120).toFixed(2)}%,0,0) scale(${(1 - cover * .08).toFixed(4)})`;
      el.style.setProperty('--t', t[i].toFixed(3));
      el.style.setProperty('--dim', (cover * .5).toFixed(3));
      if (t[i] > .55) el.classList.add('on');
    });
  });
  // el primer panel suelta sus cubos al aparecer la sección
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return;
    panels[0].classList.add('on');
    io.disconnect();
  }, { threshold: .4 }).observe(panels[0]);
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
  if (!fine) return;
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
  document.addEventListener('focusin', e => e.target.closest('.rise, .work')?.classList.add('seen'));
  if (reduce) {
    // sin escenas: tocar cada paso de la app cambia la pantalla del celular
    const caps = $$('.app-caps li'), screens = $$('.scr');
    caps.forEach((li, i) => li.addEventListener('click', () => {
      caps.forEach((c, k) => c.classList.toggle('on', k === i));
      screens.forEach((s, k) => s.classList.toggle('on', k === i));
    }));
    return;
  }
  document.documentElement.classList.add('scenes');
  app();
  works();
  process();
  cursor();
}
