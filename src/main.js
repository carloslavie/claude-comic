import '@fontsource/bangers';
import '@fontsource/luckiest-guy';
import '@fontsource/permanent-marker';
import '@fontsource/anton';
import '@fontsource/kosugi-maru';
import '@fontsource/m-plus-rounded-1c';
import '@fontsource/dela-gothic-one';
import './style.css';
import { initUI } from './ui.js';
import { initHome } from './home.js';

// El comic se inicializa una sola vez, aunque se entre por el menú: así su estado se conserva entre vistas.
initUI();
initHome();
