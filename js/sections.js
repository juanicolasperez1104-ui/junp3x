// Secciones con comportamiento propio: 3X, proyectos, demo, galería y proceso.
import { $, $$, reduce, fine, clamp01, onScroll } from './utils.js';
import { buildLogo } from './logo.js';

/* ---------- 3X: paneles horizontales y logo que se enciende por tramos ---------- */
function x3() {
  const section = $('#tresx'), track = $('#x3track'), progress = $('#x3prog');
  const logo = buildLogo($('#logoMid'), { small: true });
  onScroll(() => {
    const r = section.getBoundingClientRect();
    const p = clamp01(-r.top / (r.height - innerHeight));
    const seg = p * 2, k = Math.floor(Math.min(seg, 1.999)), f = seg - k;
    const e = f < .22 ? 0 : f > .78 ? 1 : (f - .22) / .56;
    const pos = k + (e < .5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2);
    track.style.transform = `translate3d(${-pos * 33.3333}%,0,0)`;
    progress.style.transform = `scaleX(${p})`;
    const active = Math.round(pos);
    logo.groups.forEach((g, i) => g.classList.toggle('off', logo.edges[i] > active));
  });
}

/* ---------- Proyectos: inclinación 3D y ficha ampliada ---------- */
const PROJECTS = {
  corp: {
    title: 'Corporación Tame Historia y Cultura',
    text: 'Un sitio para guardar y compartir la memoria de Tame. La corporación edita su contenido desde un panel propio y la comunidad puede enviar aportes.',
    facts: [['Destacado', 'Entrada con escudo y contador, reloj 3D, libros 3D que giran con el mouse y versión en inglés'], ['Tecnología', 'HTML, CSS, JavaScript, Supabase y GitHub Pages']],
    link: 'https://nicolasperzalf.github.io/CorporacionTame-HistoriayCultura/',
    quote: 'sitio',
  },
  pancita: {
    title: 'Pancita Llena',
    text: 'El cliente arma su plato, lo agrega al carrito y el pedido llega completo al WhatsApp del restaurante.',
    facts: [['Destacado', 'Carrito con total en tiempo real, pedido a la mesa o a domicilio'], ['Tecnología', 'HTML, CSS, JavaScript y GitHub Pages']],
    link: 'https://juanicolasperez1104-ui.github.io/Pancita-llena/',
    quote: 'pedidos',
  },
  cacao: {
    title: 'Cacao Tame',
    text: 'Acompaña al monumento del cacao en Tame, Arauca, y cuenta cómo el cultivo pasó del bosque a la exportación.',
    facts: [['Destacado', 'Línea de tiempo con datos clave, incluida la Ley 2464 de 2025'], ['Tecnología', 'HTML, CSS, JavaScript y GitHub Pages']],
    link: 'https://juanicolasperez1104-ui.github.io/Cacao-tame/',
    quote: 'sitio',
  },
};

function projects() {
  const dlg = $('#caseDlg'), artBox = $('#caseArt');
  const canVT = () => document.startViewTransition && !reduce;
  let source = null, bigArt = null;

  const open = btn => {
    const d = PROJECTS[btn.dataset.proj];
    $('#caseTitle').textContent = d.title;
    $('#caseText').textContent = d.text;
    $('#caseFacts').replaceChildren(...d.facts.flatMap(([k, v]) => {
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v;
      return [dt, dd];
    }));
    $('#caseLink').href = d.link;
    $('#caseQuote').dataset.type = d.quote;
    source = $('.art', btn);
    bigArt = source.cloneNode(true);
    bigArt.classList.remove('unveil', 'seen');
    bigArt.style.transitionDelay = '';
    artBox.replaceChildren(bigArt);
    btn.style.setProperty('--rx', '0deg');
    btn.style.setProperty('--ry', '0deg');
    if (!canVT()) return dlg.showModal();
    source.style.viewTransitionName = 'case-art';
    document.startViewTransition(() => {
      source.style.viewTransitionName = '';
      bigArt.style.viewTransitionName = 'case-art';
      dlg.showModal();
    }).finished.finally(() => { bigArt.style.viewTransitionName = ''; });
  };

  const close = () => {
    if (!dlg.open) return;
    if (!canVT() || !source) return dlg.close();
    const src = source;
    bigArt.style.viewTransitionName = 'case-art';
    document.startViewTransition(() => {
      bigArt.style.viewTransitionName = '';
      dlg.close();
      src.style.viewTransitionName = 'case-art';
    }).finished.finally(() => { src.style.viewTransitionName = ''; });
  };

  $$('.proj').forEach(btn => {
    btn.addEventListener('click', () => open(btn));
    if (!fine || reduce) return;
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - .5) * 10}deg`);
      btn.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - .5) * 8}deg`);
    });
    btn.addEventListener('pointerleave', () => { btn.style.setProperty('--rx', '0deg'); btn.style.setProperty('--ry', '0deg'); });
  });
  $('#caseClose').addEventListener('click', close);
  $('#caseQuote').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
}

/* ---------- Demo: video sincronizado con los pasos ---------- */
function demo() {
  const video = $('#demoVid'), steps = $$('#steps li'), bar = $('#vidProg');
  if (reduce) video.controls = true;
  else new IntersectionObserver(([e]) => { e.isIntersecting ? video.play().catch(() => {}) : video.pause(); }, { threshold: .35 }).observe(video);
  const sync = () => {
    let idx = 0;
    steps.forEach((li, i) => { if (parseFloat(li.dataset.t) <= video.currentTime + .05) idx = i; });
    steps.forEach((li, i) => li.classList.toggle('on', i === idx));
    if (video.duration) bar.style.transform = `scaleX(${video.currentTime / video.duration})`;
  };
  video.addEventListener('timeupdate', sync);
  sync();
  steps.forEach(li => li.addEventListener('click', () => {
    video.currentTime = parseFloat(li.dataset.t);
    video.play().catch(() => {});
    sync();
  }));
}

/* ---------- Galería: columnas a distinta velocidad y vista ampliada ---------- */
function gallery() {
  const box = $('#gallery'), cols = $$('.gcol', box);
  if (!reduce) onScroll(() => {
    if (innerWidth <= 760) return;
    const g = box.getBoundingClientRect();
    const off = g.top + g.height / 2 - innerHeight / 2;
    cols.forEach(c => { c.style.transform = `translate3d(0,${off * parseFloat(c.dataset.speed)}px,0)`; });
  });
  const lb = $('#lightbox'), img = $('#lbImg'), cap = $('#lbCap');
  $$('.gitem[data-full]').forEach(b => b.addEventListener('click', () => {
    img.src = b.dataset.full;
    img.alt = $('img', b).alt;
    cap.textContent = b.dataset.cap;
    lb.showModal();
    if (!reduce) lb.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 350, easing: 'cubic-bezier(.16,1,.3,1)' });
  }));
  $('#lbClose').addEventListener('click', () => lb.close());
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
}

/* ---------- Proceso: línea que se dibuja con el scroll ---------- */
function process() {
  const list = $('#process'), items = $$('li', list);
  onScroll(() => {
    const r = list.getBoundingClientRect(), mark = innerHeight * .62;
    list.style.setProperty('--p', clamp01((mark - r.top) / r.height));
    items.forEach(li => li.classList.toggle('on', li.getBoundingClientRect().top < mark));
  });
}

/* ---------- Contacto: el logo se arma al llegar y se copia el correo ---------- */
function contact() {
  const logo = buildLogo($('#logoEnd'));
  if (!reduce) {
    const scatter = logo.groups.map(() => ({ x: (Math.random() - .5) * 260, y: (Math.random() - .5) * 200 - 60, r: (Math.random() - .5) * 120 }));
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      const n = logo.groups.length;
      logo.groups.forEach((g, i) => g.animate(
        [{ transform: `translate(${scatter[i].x}px,${scatter[i].y}px) rotate(${scatter[i].r}deg)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 1100, delay: i * 28, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' }));
      logo.code.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: n * 28 + 500, easing: 'cubic-bezier(.22,1.25,.36,1)', fill: 'both' });
      logo.core.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: n * 28 + 400, fill: 'backwards' });
    }, { threshold: .5 });
    io.observe($('#logoEnd'));
  }
  const btn = $('#mailCopy');
  btn.addEventListener('click', () => {
    const done = () => { btn.textContent = 'Copiado'; setTimeout(() => { btn.textContent = 'Copiar'; }, 1800); };
    const fallback = () => {
      const range = document.createRange();
      range.selectNodeContents($('#mailTxt'));
      getSelection().removeAllRanges();
      getSelection().addRange(range);
      btn.textContent = 'Selecciónalo y copia';
    };
    try { navigator.clipboard.writeText('junp3x.contact@gmail.com').then(done, fallback); } catch { fallback(); }
  });
}

export function initSections() {
  x3();
  projects();
  demo();
  gallery();
  process();
  contact();
}
