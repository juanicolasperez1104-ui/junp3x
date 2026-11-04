// Punto de entrada: arma cada parte de la página en orden.
import { initHero } from './hero.js?v=20261104d';
import { initMotion } from './motion.js?v=20261104d';
import { initSections } from './sections.js?v=20261104d';
import { initScenes } from './scenes.js?v=20261104d';
import { initQuote } from './quote.js?v=20261104d';
import { buildLogo } from './logo.js?v=20261104d';
import { initIntro } from './intro.js?v=20261104d';
import { initAssistant } from './assistant.js?v=20261104d';
import { initAmbient } from './ambient.js?v=20261104d';

// Cada parte arranca por separado: si una falla en algún navegador, el resto sigue
// funcionando y la entrada siempre termina (nunca deja la página bloqueada).
const safe = fn => { try { fn(); } catch (err) { console.error(err); } };
safe(() => buildLogo(document.getElementById('logoSmall'), { small: true }));
[initAmbient, initHero, initMotion, initScenes, initSections, initQuote, initAssistant].forEach(safe);
try { initIntro(); } catch (err) {
  console.error(err);
  document.getElementById('intro').hidden = true;
  document.body.style.overflow = '';
}
