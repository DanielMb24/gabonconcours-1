import { apiService } from './api';

const urlBase64ToUint8Array = (base64: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const raw = window.atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
};

/**
 * Notifications push web (PWA) : abonnement de l'appareil via le
 * service worker, enregistré côté API (POST /push/subscriptions).
 * iOS : nécessite la PWA installée sur l'écran d'accueil (iOS 16.4+).
 */
export const pushService = {
    isSupported(): boolean {
        return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    },

    permission(): NotificationPermission | 'unsupported' {
        return 'Notification' in window ? Notification.permission : 'unsupported';
    },

    async getSubscription(): Promise<PushSubscription | null> {
        if (!this.isSupported()) return null;
        const registration = await navigator.serviceWorker.ready;
        return registration.pushManager.getSubscription();
    },

    async subscribe(): Promise<boolean> {
        if (!this.isSupported()) throw new Error("Notifications non prises en charge sur cet appareil ou ce navigateur");
        if (Notification.permission === 'denied') throw new Error('Notifications bloquées : autorisez-les dans les réglages du navigateur, puis réessayez');
        const keyResponse = await apiService.makeRequest<{ publicKey: string }>('/push/vapid-key', 'GET');
        if (!keyResponse.success || !keyResponse.data?.publicKey) throw new Error(keyResponse.message || 'Notifications push indisponibles pour le moment');
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(keyResponse.data.publicKey),
            });
        }
        const json = subscription.toJSON();
        const saveResponse = await apiService.post('/push/subscriptions', { endpoint: subscription.endpoint, keys: json.keys });
        if (!saveResponse.success) throw new Error(saveResponse.message || "Enregistrement de l'appareil impossible");
        return true;
    },

    async unsubscribe(): Promise<void> {
        const subscription = await this.getSubscription();
        if (!subscription) return;
        try {
            await apiService.delete('/push/subscriptions', { data: { endpoint: subscription.endpoint } });
        } catch {
            /* poursuite : on coupe au moins côté navigateur */
        }
        await subscription.unsubscribe().catch(() => {});
    },
};
