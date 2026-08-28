import { createRoot } from 'react-dom/client';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type ConfirmOptions = { title?: string; description: string; confirmLabel?: string; destructive?: boolean };

export function confirmAction(options: string | ConfirmOptions): Promise<boolean> {
  const config = typeof options === 'string' ? { description: options } : options;
  return new Promise(resolve => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    let settled = false;
    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      root.unmount();
      host.remove();
      resolve(result);
    };
    root.render(<ConfirmDialog open onOpenChange={open => !open && finish(false)} title={config.title || 'Confirmer cette action ?'} description={config.description} confirmLabel={config.confirmLabel} destructive={config.destructive} onConfirm={() => finish(true)} />);
  });
}
