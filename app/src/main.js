import '@fontsource-variable/inter';
import '@fontsource-variable/inter-tight';
import './lib/tokens.css';
import './lib/base.css';
import { mount } from 'svelte';
import App from './App.svelte';

mount(App, { target: document.getElementById('app') });

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
