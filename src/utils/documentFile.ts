// Validation côté client des fichiers documentaires.
// Sur mobile, le sélecteur peut renvoyer un type MIME vide ou un HEIC :
// on se rabat sur l'extension et on explique clairement le problème
// AVANT tout envoi réseau (le backend refuserait de toute façon).

export const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export const ACCEPTED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 Mo

const EXTENSION_MIME: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
};

export const fileExtension = (name: string): string => {
    const parts = String(name || '').toLowerCase().split('.');
    return parts.length > 1 ? parts.pop() as string : '';
};

export interface FileCheck {
    ok: boolean;
    error?: string;
}

export const validateDocumentFile = (file: File | null | undefined, maxSize: number = MAX_DOCUMENT_SIZE): FileCheck => {
    if (!file) return { ok: false, error: 'Sélectionnez un fichier.' };
    if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
        return { ok: false, error: 'Connexion perdue : reconnectez-vous à internet puis réessayez.' };
    }
    const extension = fileExtension(file.name);
    if (['heic', 'heif', 'heics'].includes(extension)) {
        return { ok: false, error: 'Photo iPhone (HEIC) non acceptée : convertissez-la en JPEG/PNG (capture d’écran ou export) puis réessayez.' };
    }
    const mime = file.type || EXTENSION_MIME[extension] || '';
    if (!ACCEPTED_MIME_TYPES.includes(mime) || !ACCEPTED_EXTENSIONS.includes(extension)) {
        return { ok: false, error: 'Format non accepté : envoyez un PDF, JPEG, PNG ou WebP.' };
    }
    if (file.size > maxSize) {
        return { ok: false, error: `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo) : 10 Mo maximum.` };
    }
    if (file.size === 0) {
        return { ok: false, error: 'Fichier vide ou illisible : choisissez un autre fichier.' };
    }
    return { ok: true };
};
