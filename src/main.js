import '@fontsource/bangers';
import '@fontsource/luckiest-guy';
import '@fontsource/permanent-marker';
import '@fontsource/anton';
import '@fontsource/kosugi-maru';
import '@fontsource/m-plus-rounded-1c';
import '@fontsource/dela-gothic-one';
import './style.css';
import { initUI } from './ui.js';
import { initFramesUI } from './frameUi.js';
import { initHome } from './home.js';

// Cada herramienta se inicializa una sola vez, aunque se entre por el menú: así su estado se conserva entre vistas.
initUI();
initFramesUI();
initHome();
