// Punto de entrada: arma cada parte de la página en orden.
import { initHero } from './hero.js?v=20261104e';
import { initMotion } from './motion.js?v=20261104e';
import { initSections } from './sections.js?v=20261104e';
import { initScenes } from './scenes.js?v=20261104e';
import { initQuote } from './quote.js?v=20261104e';
import { buildLogo } from './logo.js?v=20261104e';
import { showHero } from './hero.js?v=20261104e';
import { initAssistant } from './assistant.js?v=20261104e';
import { initAmbient } from './ambient.js?v=20261104e';

// Cada parte arranca por separado: si una falla en algún navegador, el resto sigue
// funcionando.
const safe = fn => { try { fn(); } catch (err) { console.error(err); } };
safe(() => buildLogo(document.getElementById('logoSmall'), { small: true }));
[initAmbient, initHero, initMotion, initScenes, initSections, initQuote, initAssistant].forEach(safe);
// sin entrada: la portada aparece de inmediato
safe(() => { document.querySelector('.brand').classList.add('vt'); showHero(); });
