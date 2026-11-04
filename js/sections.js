// Secciones con comportamiento propio: soluciones, fichas de caso, demo del chatbot y contacto.
import { $, $$, reduce } from './utils.js';
import { buildLogo } from './logo.js';
import { TYPES } from './pricing.js';

/* ---------- Proyectos: ficha del caso con transición desde la imagen ---------- */
// Solo datos reales de cada proyecto: contexto, necesidad, solución y funcionalidades.
const PROJECTS = {
  corp: {
    title: 'Corporación Tame Historia y Cultura',
    context: 'Corporación cultural de Tame, Arauca, que guarda la historia del municipio.',
    need: 'Contar cuatro siglos de historia de forma que atraiga a jóvenes y visitantes, y actualizar el contenido sin depender de un programador.',
    solution: 'Un sitio inmersivo con dominio propio y un panel para editar el contenido; la comunidad también puede enviar aportes.',
    features: ['Reloj de bolsillo en 3D', 'Línea de tiempo con puertas por épocas', 'Libros que giran y el sonido del cuatro llanero', 'Panel de edición y aportes de la comunidad'],
    tech: 'HTML, CSS, JavaScript, Three.js y Supabase',
    link: 'https://corporaciontamehistoriaycultura.co/',
    quote: 'sitio',
  },
  pancita: {
    title: 'Pancita Llena',
    context: 'Restaurante que recibe sus pedidos por WhatsApp.',
    need: 'Tomar pedidos sin una cadena de mensajes para saber qué hay, cuánto vale y cómo lo quiere el cliente.',
    solution: 'Un menú digital donde el cliente arma su plato y envía el pedido completo al WhatsApp del restaurante.',
    features: ['Menú por categorías', 'Carrito con total en tiempo real', 'Pedido a la mesa o a domicilio', 'Mensaje de WhatsApp con el pedido listo'],
    tech: 'HTML, CSS, JavaScript y GitHub Pages',
    link: 'https://juanicolasperez1104-ui.github.io/Pancita-llena/',
    quote: 'pedidos',
  },
  cacao: {
    title: 'Cacao Tame',
    context: 'Sitio que acompaña al monumento del cacao en Tame, Arauca.',
    need: 'Contar la historia del cultivo de forma clara y visual para cualquier visitante.',
    solution: 'Un sitio con línea de tiempo que va del bosque a la exportación.',
    features: ['Línea de tiempo con datos clave', 'Incluye la Ley 2464 de 2025', 'Diseño pensado para el celular'],
    tech: 'HTML, CSS, JavaScript y GitHub Pages',
    link: 'https://juanicolasperez1104-ui.github.io/Cacao-tame/',
    quote: 'sitio',
  },
  hair: {
    title: 'Team Hair · chatbot de citas',
    context: 'Peluquería con varias sedes que atiende a sus clientes por WhatsApp.',
    need: 'Responder disponibilidad, precios y horarios a cualquier hora sin perder clientes.',
    solution: 'Un chatbot de WhatsApp que guía la cita paso a paso y avisa al negocio.',
    features: ['Menú: citas, servicios, sedes y horarios, preguntas frecuentes y hablar con una persona', 'Agenda por sede, servicio, profesional, día y hora libre', 'Precio y duración de cada servicio', 'Recordatorio una hora antes y aviso al negocio', 'Cancelar o reprogramar libera el cupo'],
    tech: 'WhatsApp, flujo de conversación y agenda',
    img: 'assets/img/frame-21.webp',
    quote: 'chatbot',
  },
  app: {
    title: 'App de mantenimiento',
    context: 'Empresa de mantenimiento de aire acondicionado con técnicos en campo.',
    need: 'Dejar el papel: órdenes, fotos y firmas dispersas, y reportes armados a mano.',
    solution: 'Una app web instalable: el técnico escanea el QR del equipo, llena el checklist, toma fotos y recoge la firma. La orden firmada queda en un PDF sellado.',
    features: ['Equipos por código QR con hoja de vida', 'Checklist del preventivo', 'Fotos que se guardan sin señal y se suben solas', 'Firma del cliente y PDF que no se puede alterar', 'Reportes en Excel y PDF', 'Usuarios con roles, verificación en dos pasos y marca de cada empresa'],
    tech: 'Next.js, Supabase y app instalable (PWA)',
    quote: 'software',
  },
};

function projects() {
  const dlg = $('#caseDlg'), artBox = $('#caseArt'), link = $('#caseLink'), quote = $('#caseQuote');
  const canVT = () => document.startViewTransition && !reduce;
  let source = null, bigArt = null;

  const facts = d => [['Contexto', d.context], ['Necesidad', d.need], ['Solución', d.solution], ['Funcionalidades', d.features], ['Tecnología', d.tech]]
    .flatMap(([k, v]) => {
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd');
      if (Array.isArray(v)) {
        const ul = document.createElement('ul');
        ul.append(...v.map(t => { const li = document.createElement('li'); li.textContent = t; return li; }));
        dd.append(ul);
      } else dd.textContent = v;
      return [dt, dd];
    });

  const open = btn => {
    const d = PROJECTS[btn.dataset.proj];
    $('#caseTitle').textContent = d.title;
    $('#caseFacts').replaceChildren(...facts(d));
    link.hidden = !d.link;
    if (d.link) link.href = d.link;
    quote.dataset.type = d.quote;
    dlg.classList.toggle('case-tall', Boolean(d.img));
    // la imagen del caso: la misma del panel (con transición) o una propia
    const root = btn.closest('.work, .app');
    source = d.img || !root ? null : $('[data-case-img]', root);
    if (source) {
      bigArt = source.cloneNode(true);
      bigArt.removeAttribute('data-case-img');
      bigArt.className = '';
      bigArt.loading = 'eager';
    } else {
      bigArt = document.createElement('img');
      bigArt.src = d.img;
      bigArt.alt = '';
    }
    artBox.replaceChildren(bigArt);
    if (!canVT() || !source) return dlg.showModal();
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
    const work = btn.closest('.work');
    if (work) $('.work-media[data-cursor]', work)?.addEventListener('click', () => open(btn));
  });
  $('#caseClose').addEventListener('click', close);
  quote.addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
}

/* ---------- Soluciones: pestañas accesibles (clic, flechas, Inicio y Fin) ---------- */
function solutions() {
  const tabs = $$('.sol-tab'), panels = $$('.sol-panel');
  // el "desde" de cada solución sale del mismo lugar que el cotizador
  $$('[data-from]').forEach(el => { el.textContent = `Desde $${TYPES[el.dataset.from].base[0]} USD`; });
  const select = (i, focus) => {
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[k].hidden = !on;
    });
    if (focus) tabs[i].focus();
    if (!reduce) panels[i].animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.23,1,.32,1)' });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', e => {
      const n = tabs.length;
      const to = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: n - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      select((to + n) % n, true);
    });
  });
  panels.forEach((p, k) => { p.hidden = k !== 0; });
}

/* ---------- Demo del chatbot: el video se reproduce al verse y cada paso salta a su momento ---------- */
function demo() {
  const video = $('#demoVid'), bar = $('#vidProg'), steps = $$('#botSteps button');
  const marks = steps.map(b => +b.dataset.t);
  if (reduce) video.controls = true;
  else new IntersectionObserver(([e]) => { e.isIntersecting ? video.play().catch(() => {}) : video.pause(); }, { threshold: .35 }).observe(video);
  let cur = -1;
  const mark = i => {
    if (i === cur) return;
    cur = i;
    steps.forEach((b, k) => b.classList.toggle('on', k === i));
  };
  mark(0);
  video.addEventListener('timeupdate', () => {
    if (video.duration) bar.style.transform = `scaleX(${video.currentTime / video.duration})`;
    let i = marks.length - 1;
    while (i > 0 && video.currentTime < marks[i]) i--;
    mark(i);
  });
  steps.forEach((b, k) => b.addEventListener('click', () => {
    mark(k);
    video.currentTime = marks[k] + .05;
    video.play().catch(() => {});
  }));
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
  solutions();
  projects();
  demo();
  contact();
}
