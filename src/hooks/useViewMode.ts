import { useState } from 'react';

export type ViewMode = 'cards' | 'list';

/**
 * Mémorise le mode d'affichage (cartes / liste) par zone.
 * La préférence est conservée dans localStorage.
 */
export function useViewMode(key: string, defaultMode: ViewMode = 'cards'): [ViewMode, (mode: ViewMode) => void] {
    const [mode, setModeState] = useState<ViewMode>(() => {
        try {
            const saved = localStorage.getItem(`view-mode:${key}`);
            return saved === 'list' || saved === 'cards' ? saved : defaultMode;
        } catch {
            return defaultMode;
        }
    });

    const setMode = (next: ViewMode) => {
        setModeState(next);
        try {
            localStorage.setItem(`view-mode:${key}`, next);
        } catch {
            /* stockage indisponible : la préférence vit le temps de la page */
        }
    };

    return [mode, setMode];
}
