import {createRoot} from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Appliquer le thème avant le premier rendu pour éviter un flash blanc et
// respecter immédiatement le réglage clair/sombre de l'appareil.
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.classList.add(savedTheme === 'dark' || ((!savedTheme || savedTheme === 'system') && prefersDark) ? 'dark' : 'light');

createRoot(document.getElementById("root")!).render(<App/>);

// PWA : enregistrer le service worker en production uniquement
// (application installable + fonctionnement partiel hors-ligne).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
            console.warn('Service worker non enregistré :', error);
        });
    });
}
