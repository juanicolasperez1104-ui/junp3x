// Punto de entrada: arma cada parte de la página en orden.
import { initHero } from './hero.js';
import { initMotion } from './motion.js';
import { initSections } from './sections.js';
import { initQuote } from './quote.js';
import { buildLogo } from './logo.js';
import { initIntro } from './intro.js';
import { initAssistant } from './assistant.js';
import { initAmbient } from './ambient.js';

buildLogo(document.getElementById('logoSmall'), { small: true });
initAmbient();
initHero();
initMotion();
initSections();
initQuote();
initAssistant();
initIntro();
