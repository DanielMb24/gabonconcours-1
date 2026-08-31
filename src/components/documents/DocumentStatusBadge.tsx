import { Badge } from '@/components/ui/badge';

const states = {
    approved: { label: 'Validé', className: 'border-emerald-200 bg-emerald-100 text-emerald-800' },
    rejected: { label: 'Rejeté', className: 'border-rose-200 bg-rose-100 text-rose-800' },
    pending: { label: 'En attente', className: 'border-amber-200 bg-amber-100 text-amber-800' },
    uploaded: { label: 'Téléversé', className: 'border-blue-200 bg-blue-100 text-blue-800' },
    under_review: { label: 'En vérification', className: 'border-violet-200 bg-violet-100 text-violet-800' },
} as const;

const aliases: Record<string, keyof typeof states> = {
    valide: 'approved', validé: 'approved', approved: 'approved',
    rejete: 'rejected', rejeté: 'rejected', refused: 'rejected', rejected: 'rejected',
    en_attente: 'pending', pending: 'pending',
    soumis: 'uploaded', uploaded: 'uploaded',
    en_verification: 'under_review', under_review: 'under_review',
};

export const normalizeDocumentStatus = (value?: string) => aliases[String(value || '').trim().toLowerCase()] || 'pending';

export default function DocumentStatusBadge({ status }: { status?: string }) {
    const state = states[normalizeDocumentStatus(status)];
    return <Badge variant="outline" className={state.className} role="status">{state.label}</Badge>;
}
