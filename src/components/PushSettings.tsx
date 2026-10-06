import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pushService } from '@/services/pushService';

/**
 * Carte « Notifications sur cet appareil » : active/désactive
 * les notifications push (documents, messages, résultats).
 */
export default function PushSettings() {
    const [supported] = useState(() => pushService.isSupported());
    const [permission, setPermission] = useState<string>(() => pushService.permission());
    const [subscribed, setSubscribed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');

    const refresh = async () => {
        setPermission(pushService.permission());
        setSubscribed(!!(await pushService.getSubscription().catch(() => null)));
    };

    useEffect(() => {
        refresh();
    }, []);

    const enable = async () => {
        setBusy(true);
        setMessage('');
        try {
            await pushService.subscribe();
            await refresh();
            setMessage('Notifications activées sur cet appareil.');
        } catch (error) {
            setMessage((error as Error).message);
        } finally {
            setBusy(false);
        }
    };

    const disable = async () => {
        setBusy(true);
        setMessage('');
        try {
            await pushService.unsubscribe();
            await refresh();
            setMessage('Notifications désactivées sur cet appareil.');
        } catch (error) {
            setMessage((error as Error).message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-4 rounded-xl border bg-white p-6">
            <h3 className="flex items-center gap-2 font-semibold">
                {subscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                Notifications sur cet appareil
            </h3>
            {!supported ? (
                <p className="text-sm text-muted-foreground">Votre navigateur ne prend pas en charge les notifications push.</p>
            ) : permission === 'denied' && !subscribed ? (
                <p className="text-sm text-muted-foreground">Notifications bloquées : autorisez-les dans les réglages du navigateur (ou réinstallez l'application), puis revenez ici.</p>
            ) : (
                <p className="text-sm text-muted-foreground">
                    {subscribed
                        ? 'Cet appareil recevra les alertes (documents validés/rejetés, messages, résultats), même application fermée.'
                        : 'Recevez les alertes GabConcours directement sur votre téléphone, même application fermée.'}
                </p>
            )}
            {supported && (permission !== 'denied' || subscribed) && (
                subscribed
                    ? <Button variant="outline" disabled={busy} onClick={disable}>{busy ? 'Veuillez patienter…' : 'Désactiver sur cet appareil'}</Button>
                    : <Button disabled={busy} onClick={enable}>{busy ? 'Veuillez patienter…' : 'Activer les notifications'}</Button>
            )}
            {message && <p role="status" className="text-sm">{message}</p>}
        </div>
    );
}
