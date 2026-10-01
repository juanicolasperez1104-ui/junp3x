// Fondo vivo: tres luces suaves que derivan por la pantalla y emiten ondas finas, como gotas en agua quieta.
import { reduce, CORAL, CYAN, rgba } from './utils.js';

const MID = [185, 139, 156];
const ORBS = [
  { c: CORAL, x: .12, y: .18, ax: .22, ay: .16, px: 47, py: 61, a: .1, phase: 0 },
  { c: CYAN, x: .86, y: .48, ax: .18, ay: .22, px: 58, py: 43, a: .1, phase: 2.6 },
  { c: MID, x: .45, y: .92, ax: .26, ay: .14, px: 53, py: 71, a: .07, phase: 5.1 },
];
const RING_EVERY = 5.4;   // segundos entre ondas de una misma luz
const RING_LIFE = 11;     // segundos que tarda una onda en desvanecerse
const FPS = 30;

export function initAmbient() {
  const canvas = document.getElementById('ambient');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, V = 0, last = 0;

  const size = () => {
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
    V = Math.max(W, H);
  };

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    ORBS.forEach((o, n) => {
      const x = W * (o.x + o.ax * Math.sin(t * 6.2832 / o.px + o.phase));
      const y = H * (o.y + o.ay * Math.sin(t * 6.2832 / o.py + o.phase * 1.7)) - scrollY * .04 * (n - 1);

      const g = ctx.createRadialGradient(x, y, 0, x, y, V * .32);
      g.addColorStop(0, rgba(o.c, o.a));
      g.addColorStop(1, rgba(o.c, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - V * .32, y - V * .32, V * .64, V * .64);

      // ondas: cada una nace pequeña, se expande con calma y se apaga
      for (let k = 0; k < Math.ceil(RING_LIFE / RING_EVERY); k++) {
        const age = ((t + n * 1.8) % RING_EVERY) + k * RING_EVERY;
        if (age > RING_LIFE) continue;
        const p = age / RING_LIFE, e = 1 - (1 - p) ** 3;
        ctx.strokeStyle = rgba(o.c, .2 * (1 - p) ** 1.6 * Math.min(1, p * 8));
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(x, y, 30 + e * V * .42, (30 + e * V * .42) * .86, 0, 0, 6.2832);
        ctx.stroke();
      }
    });
  }

  function loop(now) {
    if (now - last > 1000 / FPS) { last = now; draw(now / 1000); }
    requestAnimationFrame(loop);
  }

  size();
  addEventListener('resize', size);
  if (reduce) { draw(0); addEventListener('resize', () => draw(0)); }
  else requestAnimationFrame(loop);
}
