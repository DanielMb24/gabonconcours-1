import './SplashScreen.css';

/**
 * Écran de lancement affiché à l'ouverture de l'application (PWA) :
 * logo GC animé + barre de progression, sortie en fondu.
 * Le parent le démonte après ~2 s (voir App.tsx).
 */
export default function SplashScreen() {
    return (
        <div className="gc-splash" role="status" aria-label="Chargement de GabConcours">
            <div className="gc-splash-logo-wrap">
                <div className="gc-splash-logo" aria-hidden="true">GC</div>
            </div>
            <p className="gc-splash-name">GabConcours</p>
            <p className="gc-splash-tagline">Candidature aux concours</p>
            <div className="gc-splash-bar" aria-hidden="true" />
        </div>
    );
}
