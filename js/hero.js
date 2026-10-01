// Portada: título que entra palabra por palabra y terreno de cubos vivo detrás.
import { $, $$, reduce, pointer, mix, shade, rgba, BG } from './utils.js';

const EASE = 'cubic-bezier(.16,1,.3,1)';
const headline = $('#headline');
const reveals = $$('.hero .reveal');
let words = [];
let anims = [];

/* ---------- Título partido en palabras ---------- */
function splitWords(el) {
  [...el.childNodes].forEach(node => {
    if (node.nodeType !== Node.TEXT_NODE) return splitWords(node);
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(' '));
      const outer = document.createElement('span');
      const inner = document.createElement('span');
      outer.className = 'w';
      inner.textContent = part;
      outer.appendChild(inner);
      frag.appendChild(outer);
    });
    node.replaceWith(frag);
  });
}

// Un solo degradado continuo sobre toda la frase, aunque esté partida en palabras
function setupGradient() {
  const holder = headline.querySelector('.grad');
  const gradWords = $$('.w>span', holder);
  gradWords.forEach(w => w.classList.add('grad'));
  holder.classList.remove('grad');
  const align = () => {
    const boxes = gradWords.map(w => w.parentElement.getBoundingClientRect());
    const left = Math.min(...boxes.map(b => b.left));
    const right = Math.max(...boxes.map(b => b.right));
    gradWords.forEach((w, i) => {
      w.style.setProperty('--gw', `${right - left}px`);
      w.style.setProperty('--gx', `${left - boxes[i].left}px`);
    });
  };
  new ResizeObserver(align).observe(headline);
  document.fonts?.ready.then(align);
}

export function hideHero() {
  anims.forEach(a => a.cancel());
  anims = [];
  if (reduce) return;
  [...words, ...reveals].forEach(el => { el.style.opacity = '0'; });
}

export function showHero() {
  [...words, ...reveals].forEach(el => { el.style.opacity = ''; });
  terrain.rise();
  if (reduce) return;
  words.forEach((w, i) => anims.push(w.animate(
    [{ transform: 'translateY(105%) rotate(4deg)' }, { transform: 'none' }],
    { duration: 900, delay: 80 + i * 55, easing: EASE, fill: 'both' })));
  const after = 80 + words.length * 55;
  reveals.forEach((el, i) => anims.push(el.animate(
    [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
    { duration: 800, delay: after + i * 120, easing: EASE, fill: 'both' })));
}

/* ---------- Terreno de cubos ---------- */
const terrain = (() => {
  const canvas = $('#terrain');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, G = 13, S = 30, OX = 0, OY = 0, CAP = 1;
  let visible = true, riseStart = 0, rise = reduce ? 1 : 0, pulses = [];
  let gi = -99, gj = -99;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const narrow = W < 820;
    G = narrow ? 11 : 13;
    S = narrow ? Math.min(W / 14, 28) : Math.min(W / 40, H / 21, 34);
    OX = narrow ? W * .5 : W * .74;
    OY = narrow ? H * .66 : H * .3;
    CAP = narrow ? .42 : 1;
    if (reduce) draw(0);
  }

  function face(pts, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let k = 2; k < pts.length; k += 2) ctx.lineTo(pts[k], pts[k + 1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function column(x, y, hgt, rgb, alpha, glow) {
    const h = .866 * S, top = y - hgt, foot = S * .35;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(22,25,27,.85)';
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    face([x - h, top, x, top + S / 2, x, y + S / 2 + foot, x - h, y + foot], rgba(shade(rgb, -.12)));
    face([x, top + S / 2, x + h, top, x + h, y + foot, x, y + S / 2 + foot], rgba(shade(rgb, -.45)));
    face([x, top - S / 2, x + h, top, x, top + S / 2, x - h, top], rgba(shade(rgb, .12 + glow * .5)));
    if (glow > .05) {
      ctx.globalAlpha = alpha * glow;
      ctx.strokeStyle = 'rgba(53,208,222,.95)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, top - S / 2); ctx.lineTo(x + h, top); ctx.lineTo(x, top + S / 2); ctx.lineTo(x - h, top);
      ctx.closePath();
      ctx.stroke();
    }
  }

  function draw(t) {
    const r = canvas.getBoundingClientRect(), h = .866 * S, half = (G - 1) / 2;
    // el puntero se traduce a coordenadas de la cuadrícula
    let pi = -99, pj = -99;
    if (pointer.active) {
      const u = (pointer.x - r.left - OX) / h, v = (pointer.y - r.top - OY) / (S / 2);
      pi = (u + v) / 2; pj = (v - u) / 2;
    }
    gi += (pi - gi) * .12; gj += (pj - gj) * .12;
    if (!reduce && riseStart) rise = Math.min(1, (t - riseStart) / 2200);
    const time = reduce ? 0 : t / 1000;
    if (!reduce && Math.random() < .04) pulses.push({ i: (Math.random() * G) | 0, j: (Math.random() * G) | 0, t0: t });
    pulses = pulses.filter(p => t - p.t0 < 1600);

    ctx.clearRect(0, 0, W, H);
    for (let d = 0; d <= 2 * (G - 1); d++) {
      for (let i = Math.max(0, d - G + 1); i <= Math.min(d, G - 1); i++) {
        const j = d - i;
        const dist = Math.hypot(i - half, j - half) / half;
        if (dist > 1.08) continue;
        // cada columna aparece en onda desde el centro
        const k = Math.max(0, Math.min(1, rise * 2.2 - dist * 1.1));
        if (k <= 0) continue;
        const e = 1 - Math.pow(1 - k, 3);
        const wave = Math.sin(time * .9 + i * .55) * Math.cos(time * .7 + j * .45) * .5 + .5;
        const pd = Math.hypot(i - gi, j - gj), lift = Math.exp(-(pd * pd) / 5);
        let glow = lift * .9;
        for (const p of pulses) if (p.i === i && p.j === j) glow = Math.max(glow, Math.sin((t - p.t0) / 1600 * Math.PI));
        const hgt = (S * .2 + Math.pow(wave, 1.6) * S * 2.1 * (1 - dist * .6) + lift * S * 1.8) * e;
        const x = OX + (i - j) * h, y = OY + (i + j) * S / 2 + (1 - e) * S * 3;
        const col = mix(Math.max(0, Math.min(1, (j + (G - 1 - i)) / (2 * (G - 1)) * 1.1 + wave * .1)));
        const fade = Math.max(0, 1 - Math.pow(Math.max(0, dist - .5) / .58, 2));
        const tinted = col.map((c, n) => Math.round(BG[n] + (c - BG[n]) * (.25 + .75 * fade)));
        column(x, y, hgt, tinted, CAP * e * (.5 + .5 * fade), glow);
      }
    }
    ctx.globalAlpha = 1;
    if (!reduce && visible) requestAnimationFrame(draw);
  }

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => {
    const was = visible;
    visible = e.isIntersecting;
    if (visible && !was && !reduce) requestAnimationFrame(draw);
  }).observe(canvas);
  resize();
  if (!reduce) requestAnimationFrame(draw);

  return { rise() { if (reduce) { rise = 1; return; } riseStart = performance.now(); rise = 0; } };
})();

export function initHero() {
  splitWords(headline);
  setupGradient();
  words = $$('.w>span', headline);
}
