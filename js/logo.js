// Logo Junp3x: triángulo "play" hecho de cubos isométricos con </> en el centro.
import { svg, mix, shade, rgba } from './utils.js';

const S = 24; // tamaño de cada cubo en unidades del SVG

function rasterLine(a, b) {
  const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
  const out = [];
  for (let i = 0; i <= n; i++) {
    out.push([Math.round(a[0] + (b[0] - a[0]) * i / n), Math.round(a[1] + (b[1] - a[1]) * i / n)]);
  }
  return out;
}

// Celdas del triángulo en orden de recorrido: sube, cruza arriba y baja
function logoCells() {
  const B = [0, 0], A = [0, 8], C = [6, 7];
  const seen = new Set(), cells = [];
  [[B, A], [A, C], [C, B]].forEach(([p, q], edge) => {
    for (const c of rasterLine(p, q)) {
      const key = c.join(',');
      if (seen.has(key)) continue;
      seen.add(key);
      c.edge = edge;
      cells.push(c);
    }
  });
  return cells;
}

/**
 * Dibuja el logo dentro de un <svg>.
 * small: versión para la barra (sin el símbolo </>).
 * Devuelve los grupos de cada cubo, el símbolo y su brillo para animarlos.
 */
export function buildLogo(root, { small = false } = {}) {
  const cells = logoCells();
  const pts = cells.map(([gx, gz], i) => ({ gx, gz, i, x: gx * .866 * S, y: gx * .5 * S - gz * S }));
  const maxT = Math.max(...pts.map(p => -p.y + .6 * p.x));

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  pts.forEach(p => {
    minX = Math.min(minX, p.x - .866 * S); maxX = Math.max(maxX, p.x + .866 * S);
    minY = Math.min(minY, p.y - .5 * S); maxY = Math.max(maxY, p.y + 1.5 * S);
  });
  const pad = 4;
  root.setAttribute('viewBox', `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`);
  root.replaceChildren();

  // Brillo detrás del símbolo, centrado en el hueco del triángulo
  const hx = 1.62 * S, hy = -3.68 * S;
  let core = null;
  if (!small) {
    const id = 'core' + Math.random().toString(36).slice(2, 7);
    root.appendChild(svg('defs', {}, [
      svg('radialGradient', { id }, [
        svg('stop', { offset: '0', 'stop-color': '#35d0de', 'stop-opacity': '.55' }),
        svg('stop', { offset: '.55', 'stop-color': '#35d0de', 'stop-opacity': '.12' }),
        svg('stop', { offset: '1', 'stop-color': '#35d0de', 'stop-opacity': '0' }),
      ]),
    ]));
    core = svg('circle', { cx: hx, cy: hy, r: S * 1.25, fill: `url(#${id})`, class: 'core-glow' });
    root.appendChild(core);
  }

  // Cubos, del fondo hacia el frente
  const groups = [];
  const h = .866 * S;
  [...pts].sort((a, b) => (a.gx + a.gz) - (b.gx + b.gz)).forEach(p => {
    const base = mix(Math.max(0, Math.min(1, (-p.y + .6 * p.x) / maxT)));
    const { x, y } = p;
    const face = (d, col) => svg('path', {
      d, fill: rgba(col), stroke: '#1e2225', 'stroke-width': small ? 2.2 : 1.4, 'stroke-linejoin': 'round',
    });
    const g = svg('g', {}, [
      face(`M${x - h} ${y}L${x} ${y + S / 2}L${x} ${y + 1.5 * S}L${x - h} ${y + S}Z`, base),
      face(`M${x} ${y + S / 2}L${x + h} ${y}L${x + h} ${y + S}L${x} ${y + 1.5 * S}Z`, shade(base, -.28)),
      face(`M${x} ${y - S / 2}L${x + h} ${y}L${x} ${y + S / 2}L${x - h} ${y}Z`, shade(base, .22)),
    ]);
    root.appendChild(g);
    groups[p.i] = g;
  });

  // Símbolo </> en tres partes para poder animarlas por separado
  const fs = S * .84, adv = fs * .6;
  const code = svg('g', { class: 'code' });
  const chars = ['<', '/', '>'].map((ch, i) => {
    const t = svg('text', {
      x: hx + (i - 1) * adv, y: hy, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      fill: '#ffffff', 'font-family': 'JetBrains Mono, monospace', 'font-weight': '700', 'font-size': fs,
    });
    t.textContent = ch;
    t.style.transformBox = 'fill-box';
    t.style.transformOrigin = 'center';
    code.appendChild(t);
    return t;
  });
  if (small) code.setAttribute('opacity', '0');
  else code.style.filter = 'drop-shadow(0 0 3px rgba(53,208,222,.9)) drop-shadow(0 0 10px rgba(53,208,222,.45))';
  root.appendChild(code);

  return { groups, code, chars, core, edges: cells.map(c => c.edge) };
}
