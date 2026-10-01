// Robot de Junp3x: la cara del asistente. Un cubo con pantalla, ojos que miran el cursor y parpadean.
import { svg, reduce } from './utils.js';

let gazers = [];

function gradient(id, stops, attrs) {
  return svg('linearGradient', { id, ...attrs }, stops.map(([offset, color]) => svg('stop', { offset, 'stop-color': color })));
}

/** Dibuja el robot dentro de un <svg> vacío. */
export function buildRobot(root) {
  const uid = Math.random().toString(36).slice(2, 7);
  const front = `rf${uid}`, glow = `rg${uid}`;
  root.setAttribute('viewBox', '0 0 64 64');
  root.classList.add('robot');
  root.replaceChildren(
    svg('defs', {}, [
      gradient(front, [['0', '#f0605a'], ['.5', '#b98b9c'], ['1', '#35d0de']], { x1: '0', y1: '1', x2: '1', y2: '0' }),
      svg('radialGradient', { id: glow }, [
        svg('stop', { offset: '0', 'stop-color': '#ffb0a8' }),
        svg('stop', { offset: '1', 'stop-color': '#f0605a' }),
      ]),
    ]),
    svg('g', { transform: 'translate(1 5)' }, [svg('g', { class: 'robot-body' }, [
      // antena
      svg('path', { class: 'robot-antenna', d: 'M31 18V8', stroke: '#9ba4a9', 'stroke-width': '2', 'stroke-linecap': 'round' }),
      svg('rect', { class: 'robot-bulb', x: '27.6', y: '1.6', width: '6.8', height: '6.8', rx: '1.6', fill: `url(#${glow})` }),
      // cubo: tapa, costado y frente
      svg('path', { d: 'M10 22h34l7-7H17z', fill: '#7ef0fa', opacity: '.85' }),
      svg('path', { d: 'M43 22l8-7v28l-8 9z', fill: '#1f7f89' }),
      svg('rect', { x: '10', y: '22', width: '34', height: '30', rx: '4', fill: `url(#${front})` }),
      // pantalla con la cara
      svg('rect', { x: '14.5', y: '26.5', width: '25', height: '21', rx: '5', fill: '#15181a' }),
      svg('g', { class: 'robot-gaze' }, [
        svg('g', { class: 'robot-eyes' }, [
          svg('rect', { x: '19', y: '31.5', width: '5', height: '7.5', rx: '2.5', fill: '#7ef0fa' }),
          svg('rect', { x: '30', y: '31.5', width: '5', height: '7.5', rx: '2.5', fill: '#7ef0fa' }),
        ]),
        svg('path', { class: 'robot-smile', d: 'M23.5 42.5q3.5 2.4 7 0', fill: 'none', stroke: '#7ef0fa', 'stroke-width': '1.6', 'stroke-linecap': 'round', opacity: '.8' }),
      ]),
    ])]),
  );
  gazers.push({ root, gaze: root.querySelector('.robot-gaze') });
  return root;
}

/** Los ojos de todos los robots siguen el cursor. */
export function followPointer() {
  if (reduce) return;
  let x = 0, y = 0, queued = false;
  addEventListener('pointermove', e => {
    x = e.clientX; y = e.clientY;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      gazers = gazers.filter(g => g.root.isConnected);
      gazers.forEach(({ root, gaze }) => {
        const r = root.getBoundingClientRect();
        if (!r.width) return;
        const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 220);
        gaze.style.transform = `translate(${(dx / d * 2.6 * k).toFixed(2)}px,${(dy / d * 1.8 * k).toFixed(2)}px)`;
      });
    });
  }, { passive: true });
}
