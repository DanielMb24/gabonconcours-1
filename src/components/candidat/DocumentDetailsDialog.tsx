import { useEffect, useState } from 'react';
import { Calendar, Copy, FileText, Hash, Pencil, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { documentService, type Document } from '@/services/documentService';

type Props = { document: Document | null; onClose: () => void; supplemental?: boolean; onRename: (name: string) => Promise<void>; onReplace: (document: Document) => void };
const size = (bytes?: number) => bytes ? `${(bytes / 1024 / 1024).toFixed(2)} Mo` : 'Non renseignée';

export default function DocumentDetailsDialog({ document, onClose, supplemental, onRename, onReplace }: Props) {
  const [editing, setEditing] = useState(false); const [name, setName] = useState(''); const [saving, setSaving] = useState(false);
  useEffect(() => { setName(document?.nomdoc || ''); setEditing(false); }, [document]);
  if (!document) return null;
  const preview = documentService.getDocumentPreviewUrl(document.id);
  const save = async () => { if (!name.trim()) return; setSaving(true); try { await onRename(name.trim()); setEditing(false); } finally { setSaving(false); } };
  return <Dialog open onOpenChange={open => !open && onClose()}><DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto rounded-md">
    <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Détails du document</DialogTitle><DialogDescription>Consultez le fichier et ses informations techniques.</DialogDescription></DialogHeader>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-h-[420px] overflow-hidden rounded-md border bg-muted/20"><iframe title={`Aperçu ${document.nomdoc}`} src={preview} className="h-[62vh] min-h-[420px] w-full" /></div>
      <div className="space-y-5">
        <div><Label>Libellé</Label>{editing ? <div className="mt-1 flex gap-2"><Input value={name} onChange={e=>setName(e.target.value)} /><Button onClick={save} disabled={saving||!name.trim()}>{saving?'Enregistrement…':'Enregistrer'}</Button></div> : <div className="mt-1 flex items-center justify-between gap-2"><p className="font-medium">{document.nomdoc}</p>{supplemental&&<Button size="icon" variant="ghost" onClick={()=>setEditing(true)} aria-label="Modifier le libellé"><Pencil className="h-4 w-4" /></Button>}</div>}</div>
        <dl className="space-y-3 text-sm">
          <div><dt className="flex items-center gap-2 text-muted-foreground"><Hash className="h-4 w-4" />Identifiant</dt><dd className="mt-1 flex items-center gap-2 break-all font-mono text-xs">{document.id}<Button size="icon" variant="ghost" onClick={()=>navigator.clipboard.writeText(document.id)}><Copy className="h-3.5 w-3.5" /></Button></dd></div>
          {document.requirement_id&&<div><dt className="text-muted-foreground">ID du document demandé</dt><dd className="break-all font-mono text-xs">{document.requirement_id}</dd></div>}
          <div><dt className="text-muted-foreground">Fichier</dt><dd>{document.nom_fichier || document.type || '—'}</dd></div>
          <div><dt className="text-muted-foreground">Format · taille · version</dt><dd>{document.mime_type || '—'} · {size(document.taille)} · v{document.version || 1}</dd></div>
          <div><dt className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" />Ajouté le</dt><dd>{document.created_at ? new Date(document.created_at).toLocaleString('fr-FR') : '—'}</dd></div>
        </dl>
        {document.commentaire_validation&&<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"><strong>Motif du rejet :</strong> {document.commentaire_validation}</div>}
        <Button className="w-full" onClick={()=>onReplace(document)}><RefreshCw className="mr-2 h-4 w-4" />Changer le fichier</Button>
        <Button variant="outline" className="w-full" onClick={()=>window.open(preview,'_blank','noopener,noreferrer')}>Ouvrir dans un nouvel onglet</Button>
      </div>
    </div>
  </DialogContent></Dialog>;
}
