// Punto de entrada: arma cada parte de la página en orden.
import { initHero } from './hero.js?v=20261104c';
import { initMotion } from './motion.js?v=20261104c';
import { initSections } from './sections.js?v=20261104c';
import { initScenes } from './scenes.js?v=20261104c';
import { initQuote } from './quote.js?v=20261104c';
import { buildLogo } from './logo.js?v=20261104c';
import { initIntro } from './intro.js?v=20261104c';
import { initAssistant } from './assistant.js?v=20261104c';
import { initAmbient } from './ambient.js?v=20261104c';

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
