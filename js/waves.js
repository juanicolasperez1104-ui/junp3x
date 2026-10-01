// Campo de puntos en perspectiva para la intro: se elevan y forman olas suaves, como una superficie de agua.
import { mix } from './utils.js';

const HORIZON = .2;      // altura del horizonte (fracción de la pantalla)
const CAM = .62;         // altura de la cámara sobre la superficie
const NEAR = .4, FAR = 3;

export function waveField(canvas) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, F = 0, cols = 0, rows = 0, colors = [];
  let raf = 0, t0 = 0, running = false;
  const pulses = [];

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    F = H * .62;
    cols = W < 700 ? 38 : 72;
    rows = W < 700 ? 34 : 44;
    colors = Array.from({ length: cols }, (_, i) => mix(i / (cols - 1)));
  }

  // altura de la superficie en (x, z) en el segundo t
  function height(x, z, t, amp) {
    let y = amp * (
      .045 * Math.sin(x * 2.6 + z * 1.4 + t * 1.05) +
      .035 * Math.sin(z * 4.2 - t * 1.5 + Math.sin(x * 1.3) * .8) +
      .018 * Math.sin((x - z) * 7.5 - t * 2.3)
    );
    for (const p of pulses) {
      const age = t - p.t;
      if (age < 0 || age > 6) continue;
      const r = Math.hypot(x, (z - p.z) * 1.4), front = age * .9;
      y += p.a * Math.exp(-((r - front) ** 2) / .05) * Math.cos((r - front) * 9) * (1 - age / 6);
    }
    return y;
  }

  function frame(now) {
    if (!running) return;
    const t = (now - t0) / 1000;
    const rise = Math.min(1, t / 2.6), amp = rise * rise * (3 - 2 * rise);
    ctx.clearRect(0, 0, W, H);
    const spanX = 1.15 * W / H;
    for (let j = rows - 1; j >= 0; j--) {
      const z = NEAR + (FAR - NEAR) * (j / (rows - 1)) ** 1.35;
      const depth = 1 - (z - NEAR) / (FAR - NEAR);
      for (let i = 0; i < cols; i++) {
        const u = i / (cols - 1), x = (u * 2 - 1) * spanX * z;
        const y = height(x, z, t, amp);
        const sx = W / 2 + x * F / z;
        const sy = H * HORIZON + (CAM - y) * F / z;
        if (sx < -4 || sx > W + 4 || sy > H + 4) continue;
        const crest = Math.max(0, Math.min(1, y * 9 + .35));
        const edge = Math.min(1, Math.min(u, 1 - u) * 6);
        const a = (.1 + crest * .75) * Math.min(1, depth * 1.6) ** 1.6 * edge;
        if (a < .02) continue;
        const r = Math.max(.6, (.9 + crest * 1.1) * F / z / 260);
        ctx.fillStyle = `rgba(${colors[i]},${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, 6.2832);
        ctx.fill();
      }
    }
    raf = requestAnimationFrame(frame);
  }

  return {
    start() {
      size();
      pulses.length = 0;
      running = true;
      t0 = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
      addEventListener('resize', size);
    },
    // una onda que nace bajo el logo
    pulse(a = .09) { pulses.push({ t: (performance.now() - t0) / 1000, z: 1.15, a }); },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      removeEventListener('resize', size);
    },
  };
}
