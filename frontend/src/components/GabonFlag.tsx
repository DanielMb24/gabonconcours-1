import { useId } from 'react';

interface GabonFlagProps {
    width?: number;
    className?: string;
    title?: string;
}

/**
 * Drapeau du Gabon en SVG (vert #009E60, jaune #FCD116, bleu #3A75C4),
 * coins arrondis. Aucun fichier image requis.
 */
export default function GabonFlag({ width = 28, className, title = 'Gabon' }: GabonFlagProps) {
    const clipId = useId();
    const height = Math.round(width * 0.75);
    const radius = Math.round(width * 0.12);
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 120 90"
            role="img"
            aria-label={title}
            className={className}
            style={{ borderRadius: radius, boxShadow: '0 0 0 1px rgba(0,0,0,0.12)', display: 'inline-block', verticalAlign: 'middle' }}
        >
            <clipPath id={clipId}>
                <rect width="120" height="90" rx="14" />
            </clipPath>
            <g clipPath={`url(#${clipId})`}>
                <rect width="120" height="30" fill="#009E60" />
                <rect y="30" width="120" height="30" fill="#FCD116" />
                <rect y="60" width="120" height="30" fill="#3A75C4" />
            </g>
        </svg>
    );
}
