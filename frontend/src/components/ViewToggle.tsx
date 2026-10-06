import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViewMode } from '@/hooks/useViewMode';

interface ViewToggleProps {
    mode: ViewMode;
    onChange: (mode: ViewMode) => void;
    className?: string;
}

/**
 * Sélecteur d'affichage Cartes / Liste.
 * À placer au-dessus d'une collection avec le hook `useViewMode`.
 */
export default function ViewToggle({ mode, onChange, className }: ViewToggleProps) {
    const button = (value: ViewMode, label: string, Icon: typeof LayoutGrid) => (
        <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            aria-pressed={mode === value}
            title={label}
            className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                mode === value
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
            )}
        >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );

    return (
        <div
            role="group"
            aria-label="Mode d'affichage"
            className={cn('inline-flex items-center gap-0.5 rounded-lg border bg-muted p-0.5', className)}
        >
            {button('cards', 'Cartes', LayoutGrid)}
            {button('list', 'Liste', List)}
        </div>
    );
}
