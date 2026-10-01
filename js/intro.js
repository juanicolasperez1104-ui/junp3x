// Intro: el logo se arma cubo por cubo, se compila el </> y viaja a la barra.
import { $, reduce } from './utils.js';
import { buildLogo } from './logo.js';
import { hideHero, showHero } from './hero.js';
import { waveField } from './waves.js';

const EASE = 'cubic-bezier(.16,1,.3,1)';
const SPRING = 'cubic-bezier(.22,1.25,.36,1)';

const intro = $('#intro');
const brand = $('.brand');
const logoEl = $('#logoBig');
const field = $('#introWaves');
const waves = waveField(field);
const slogan = $('#slogan');
const wordmark = $('#wordmark');

const logo = buildLogo(logoEl);
let letters = [];
let running = [];
let timer = 0, done = false;
const later = [];

function play() {
  done = false;
  running.forEach(a => a.cancel());
  running = [];
  brand.classList.remove('vt');
  intro.hidden = false;
  document.body.style.overflow = 'hidden';
  hideHero();

  const push = a => (running.push(a), a);
  const T0 = 700, STEP = 150, DUR = 1000, N = logo.groups.length;

  // la superficie de puntos se eleva y ondula detrás del logo
  waves.start();
  push(field.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 2200, easing: EASE, fill: 'both' }));
  logoEl.style.transformOrigin = '50% 50%';
  push(logoEl.animate([{ transform: 'scale(.9)' }, { transform: 'none' }], { duration: T0 + N * STEP + DUR, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'both' }));

  // cada cubo se arma cara por cara: izquierda, derecha y tapa
  logo.groups.forEach((g, i) => {
    const d = T0 + i * STEP;
    const [left, right, top] = g.children;
    push(left.animate([{ transform: 'translate(-44px,26px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: DUR, delay: d, easing: SPRING, fill: 'both' }));
    push(right.animate([{ transform: 'translate(44px,26px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: DUR, delay: d + 110, easing: SPRING, fill: 'both' }));
    push(top.animate([{ transform: 'translate(0,-54px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: DUR, delay: d + 220, easing: SPRING, fill: 'both' }));
    push(g.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.8)', offset: .35 }, { filter: 'brightness(1)' }], { duration: 600, delay: d + 220 + DUR * .5 }));
  });

  // una ola de luz recorre el triángulo cuando queda completo
  const tSweep = T0 + (N - 1) * STEP + 220 + DUR - 250;
  logo.groups.forEach((g, i) => push(g.animate(
    [{ filter: 'brightness(1)' }, { filter: 'brightness(1.55) saturate(1.2)', offset: .4 }, { filter: 'brightness(1)' }],
    { duration: 650, delay: tSweep + i * 38, easing: 'ease-in-out' })));

  later.forEach(clearTimeout);
  later.length = 0;
  later.push(setTimeout(() => waves.pulse(.1), tSweep), setTimeout(() => waves.pulse(.06), tSweep + 1500));

  // el código se compila: < y > se abren desde el centro y / cae girando
  const tCode = tSweep + N * 19;
  const [lt, sl, gt] = logo.chars;
  const adv = parseFloat(lt.getAttribute('font-size')) * .6;
  logo.core.style.transformBox = 'fill-box';
  logo.core.style.transformOrigin = 'center';
  push(logo.core.animate([{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'none' }], { duration: 1300, delay: tCode, easing: EASE, fill: 'both' }));
  push(lt.animate([{ opacity: 0, transform: `translateX(${adv}px)` }, { opacity: 1, transform: 'none' }], { duration: 900, delay: tCode + 250, easing: EASE, fill: 'both' }));
  push(gt.animate([{ opacity: 0, transform: `translateX(${-adv}px)` }, { opacity: 1, transform: 'none' }], { duration: 900, delay: tCode + 250, easing: EASE, fill: 'both' }));
  push(sl.animate([{ opacity: 0, transform: 'translateY(-14px) rotate(-120deg) scale(.4)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: tCode + 450, easing: SPRING, fill: 'both' }));

  // nombre y lema
  const tWord = tCode + 1150;
  letters.forEach((l, i) => push(l.animate(
    [{ transform: 'translateY(70%)', opacity: 0, filter: 'blur(8px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }],
    { duration: 900, delay: tWord + i * 80, easing: EASE, fill: 'both' })));
  push(slogan.animate([{ opacity: 0, letterSpacing: '.35em' }, { opacity: 1, letterSpacing: '.06em' }], { duration: 1200, delay: tWord + 650, easing: EASE, fill: 'both' }));

  const total = tWord + 2500;
  clearTimeout(timer);
  timer = setTimeout(finish, total);
}

function finish() {
  if (done) return;
  done = true;
  clearTimeout(timer);
  later.forEach(clearTimeout);
  // si se salta, todo queda armado antes de viajar a la barra
  running.forEach(a => { try { a.finish(); } catch { /* animaciones infinitas */ } });
  const swap = () => {
    intro.hidden = true;
    waves.stop();
    document.body.style.overflow = '';
    brand.classList.add('vt');
  };
  if (document.startViewTransition && !reduce) {
    document.startViewTransition(swap).finished.then(showHero, showHero);
  } else {
    swap();
    showHero();
  }
}

export function initIntro() {
  wordmark.replaceChildren(...[...wordmark.textContent].map(ch => {
    const s = document.createElement('span');
    s.textContent = ch;
    return s;
  }));
  letters = [...wordmark.children];
  $('#skip').addEventListener('click', finish);
  $('#replay').addEventListener('click', () => { scrollTo({ top: 0, behavior: 'instant' }); play(); });
  if (reduce) { intro.hidden = true; showHero(); } else play();
}
