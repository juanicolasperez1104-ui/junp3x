// Secciones con comportamiento propio: ficha de proyectos, video del asistente y contacto.
import { $, $$, reduce } from './utils.js';
import { buildLogo } from './logo.js';

/* ---------- Proyectos: ficha ampliada con transición desde la imagen ---------- */
const PROJECTS = {
  corp: {
    title: 'Corporación Tame Historia y Cultura',
    text: 'Un viaje por cuatro siglos de historia de Tame. La corporación edita su contenido desde un panel propio y la comunidad puede enviar aportes.',
    facts: [['Destacado', 'Reloj de bolsillo en 3D, puertas al tiempo, libros que giran y el sonido del cuatro llanero'], ['Tecnología', 'HTML, CSS, JavaScript, Three.js y Supabase, con dominio propio']],
    link: 'https://corporaciontamehistoriaycultura.co/',
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
    source = $('.work-media .main', btn.closest('.work'));
    bigArt = source.cloneNode(true);
    bigArt.className = '';
    bigArt.loading = 'eager';
    artBox.replaceChildren(bigArt);
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

  $$('[data-proj]').forEach(btn => {
    btn.addEventListener('click', () => open(btn));
    // la imagen del proyecto también abre la ficha
    $('.work-media[data-cursor]', btn.closest('.work'))?.addEventListener('click', () => open(btn));
  });
  $('#caseClose').addEventListener('click', close);
  $('#caseQuote').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
}

/* ---------- Video del asistente: se reproduce solo cuando se ve ---------- */
function demo() {
  const video = $('#demoVid'), bar = $('#vidProg');
  if (reduce) video.controls = true;
  else new IntersectionObserver(([e]) => { e.isIntersecting ? video.play().catch(() => {}) : video.pause(); }, { threshold: .35 }).observe(video);
  video.addEventListener('timeupdate', () => {
    if (video.duration) bar.style.transform = `scaleX(${video.currentTime / video.duration})`;
  });
}

/* ---------- Contacto: el logo se arma al llegar y se copia el correo ---------- */
function contact() {
  buildLogo($('#logoNext'));
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
  projects();
  demo();
  contact();
}
