// Entry point: wire up i18n, theme, gallery, the add-project panel,
// and the Three.js background.
import './styles/main.css';
import { initI18n, setLanguage } from './i18n.js';
import { initTheme, initLanguageToggle } from './theme.js';
import { initGallery } from './gallery.js';
import { initProjectForm } from './projectForm.js';
import { initScene } from './scene.js';

initI18n();
initTheme();
initLanguageToggle(setLanguage);
initGallery();
initProjectForm();
initScene();
