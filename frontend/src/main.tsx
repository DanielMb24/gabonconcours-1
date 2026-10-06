import {createRoot} from 'react-dom/client'
import App from './App.tsx'
import './index.css'

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
