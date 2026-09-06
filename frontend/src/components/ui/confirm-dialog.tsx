import { Loader2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  pending?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirmer', pending, destructive = true, onConfirm }: ConfirmDialogProps) {
  return <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="max-w-md rounded-md">
      <AlertDialogHeader>
        <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-red-600"><TriangleAlert className="h-5 w-5" /></div>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
        <Button variant={destructive ? 'destructive' : 'default'} disabled={pending} onClick={onConfirm}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{confirmLabel}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
