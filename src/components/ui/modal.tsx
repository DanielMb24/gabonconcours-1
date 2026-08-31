import * as React from 'react';
import { Dialog, DialogContent, DialogOverlay } from '@radix-ui/react-dialog';

export function Modal({ open, onOpenChange, children }: any) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogOverlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
            {children}
        </Dialog>
    );
}

export function ModalContent({ children }: any) {
    return (
        <DialogContent className="fixed left-1/2 top-1/2 max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-4 shadow-lg focus:outline-none sm:p-6">
            {children}
        </DialogContent>
    );
}
