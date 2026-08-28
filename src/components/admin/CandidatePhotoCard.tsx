import React from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {User} from 'lucide-react';
import {BACKEND_ORIGIN} from '@/services/api';

interface CandidatePhotoCardProps {
    candidat: {
        phtcan?: string;
        nomcan: string;
        prncan: string;
    };
}

const CandidatePhotoCard: React.FC<CandidatePhotoCardProps> = ({candidat}) => {
    const photoUrl = (() => {
        const value = candidat.phtcan?.trim();
        if (!value || value === '{}') return null;
        if (/^(data:|blob:)/i.test(value)) return value;
        if (/^https?:\/\//i.test(value)) {
            try {
                const parsed = new URL(value);
                return /^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname)
                    ? `${BACKEND_ORIGIN}${parsed.pathname}${parsed.search}`
                    : value;
            } catch {
                return null;
            }
        }
        const path = value.replace(/^\/+/, '');
        return `${BACKEND_ORIGIN}/${path.startsWith('uploads/') ? path : `uploads/photos/${path}`}`;
    })();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-center">Photo du candidat</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
                {photoUrl ? (
                    <img
                        src={photoUrl}
                        alt={`Photo de ${candidat.prncan} ${candidat.nomcan}`}
                        className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling!.classList.remove('hidden');
                        }}
                    />
                ) : null}
                <div
                    className={`w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center ${photoUrl ? 'hidden' : ''}`}>
                    <User className="h-16 w-16 text-gray-400"/>
                </div>
            </CardContent>
        </Card>
    );
};

export default CandidatePhotoCard;
