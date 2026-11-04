// Secciones con comportamiento propio: fichas de caso, demo del chatbot y contacto.
import { $, $$, reduce } from './utils.js?v=20261104e';
import { buildLogo } from './logo.js?v=20261104e';

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
    const root = btn.closest('.work');
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
  });
  $('#caseClose').addEventListener('click', close);
  quote.addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
}

/* ---------- Soluciones: pestañas accesibles (clic, flechas, Inicio y Fin) ---------- */
/* ---------- Demo del chatbot: un celular que se puede usar ---------- */
// Recrea el flujo real del bot de Team Hair (sedes, servicios y mensajes tomados del bot
// publicado). Todo pasa en la página: no se envía nada a ningún lado.
const SEDES = ['Av. Suba', 'Éxito Colina', 'Salitre', 'Vidall y Beto', 'Gran Estación'];
const SERVICIOS = [['Corte de barbería', '$25.000', '40 min'], ['Arreglo de barba', '$18.000', '30 min']];
const CATEGORIAS = ['Peluquería · 5 servicios', 'Barbería · 2 servicios', 'Uñas · 2 servicios', 'Cejas y pestañas · 1 servicio', 'Estética · 2 servicios', 'Spa · 2 servicios'];
const HORAS = { 'Mañana': ['9:00 a. m.', '10:00 a. m.', '11:00 a. m.'], 'Tarde': ['2:00 p. m.', '3:00 p. m.', '4:00 p. m.'] };

function demo() {
  const log = $('#waLog'), opts = $('#waOpts');
  if (!log) return;
  const cita = {};
  let token = 0;

  const bubble = (text, who) => {
    const p = document.createElement('p');
    p.className = `wa-msg ${who}`;
    p.textContent = text;
    log.append(p);
    log.scrollTo({ top: log.scrollHeight, behavior: reduce ? 'instant' : 'smooth' });
  };
  // el bot "escribe" un momento antes de responder
  const say = (lines, choices) => {
    const my = ++token;
    opts.replaceChildren();
    const typing = document.createElement('p');
    typing.className = 'wa-msg in wa-typing';
    typing.textContent = 'escribiendo…';
    log.append(typing);
    log.scrollTo({ top: log.scrollHeight });
    setTimeout(() => {
      if (my !== token) return;
      typing.remove();
      lines.forEach(l => bubble(l, 'in'));
      opts.replaceChildren(...choices.map(([label, next]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.addEventListener('click', () => { bubble(label, 'out'); next(label); });
        return b;
      }));
    }, reduce ? 0 : 650);
  };

  const menu = () => say(['¡Hola! 👋 Bienvenid@ a Team Hair ✨ Soy el asistente virtual y te ayudo a agendar tu cita en segundos, a cualquier hora.', '¿Qué quieres hacer?'], [
    ['📅 Agendar cita', sede],
    ['💇 Ver servicios', () => say(['Estas son nuestras categorías:', CATEGORIAS.join('\n')], [['📅 Agendar cita', sede], ['Volver al menú', menu]])],
    ['📍 Sedes y horarios', () => say(['Nuestras sedes:', SEDES.join('\n')], [['📅 Agendar cita', sede], ['Volver al menú', menu]])],
    ['🙋 Hablar con una persona', () => say(['Listo, una persona del equipo de Team Hair te responde por este chat. (En la demo termina aquí.)'], [['Volver al menú', menu]])],
  ]);
  const sede = () => say(['¿En qué sede quieres tu cita?'], SEDES.map(s => [s, v => { cita.sede = v; servicio(); }]));
  const servicio = () => say(['Barbería: elige el servicio.'], SERVICIOS.map(([n, precio, dur]) => [`${n} · ${precio}`, () => { cita.servicio = n; cita.precio = precio; cita.dur = dur; profesional(); }]));
  const profesional = () => say(['¿Con quién quieres tu cita? Si tienes un profesional favorito, elígelo.'], [['Julián', v => { cita.pro = v; dia(); }], ['El primero disponible', () => { cita.pro = 'el primero disponible'; dia(); }]]);
  const dia = () => say(['¿Qué día te queda bien?'], [['Hoy', v => { cita.dia = v; momento(); }], ['Mañana', v => { cita.dia = v; momento(); }]]);
  const momento = () => say([`Para ${cita.dia.toLowerCase()} hay horarios libres. ¿En qué momento del día?`], Object.keys(HORAS).map(m => [m, () => hora(m)]));
  const hora = m => say(['Elige la hora:'], HORAS[m].map(h => [h, () => { cita.hora = h; confirmar(); }]));
  const confirmar = () => say([`${cita.servicio}\n👤 ${cita.pro}\n📍 Sede ${cita.sede}\n📅 ${cita.dia}, ${cita.hora}\n💲 ${cita.precio} · ${cita.dur} aprox.`, '¿La confirmo?'], [['✅ Confirmar', listo], ['✏️ Cambiar algo', sede], ['Volver al menú', menu]]);
  const listo = () => say([`¡Listo! ✅ Tu cita quedó agendada: ${cita.dia.toLowerCase()} a las ${cita.hora} con ${cita.pro} en la sede ${cita.sede}.`, 'Te enviaré un recordatorio 1 hora antes. Si necesitas cambiarla, escribe "menú".'], [['⏰ Ver el recordatorio', recordatorio], ['Volver al menú', menu]]);
  const recordatorio = () => say([`⏰ Recordatorio de Team Hair\nHola, tu cita de ${cita.servicio.toLowerCase()} es en 1 hora (${cita.hora}) en la sede ${cita.sede}. ¿Nos confirmas tu asistencia?`], [
    ['👍 Ahí estaré', () => say(['¡Te esperamos! 💈'], [['Reiniciar la demo', restart]])],
    ['🔁 Reprogramar', sede],
    ['❌ Cancelar', () => say(['Cita cancelada. El horario quedó libre para otro cliente.'], [['Reiniciar la demo', restart]])],
  ]);
  const restart = () => { log.replaceChildren(); menu(); };

  // arranca cuando el celular aparece en pantalla, como si el cliente escribiera "Hola"
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    bubble('Hola', 'out');
    menu();
  }, { threshold: .3 }).observe(log);
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
