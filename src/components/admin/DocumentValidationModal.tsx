import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, FileText, User, Calendar, Eye, AlertCircle, CheckCircle, XCircle as XCircleIcon, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { API_ORIGIN } from '@/services/api';
import DocumentViewer from "@/components/DocumentViewer.tsx";

// LE MÊME BADGE QUE DANS LE TABLEAU → COHÉRENCE TOTALE
const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { className: string; label: string; icon: React.ReactNode }> = {
    valide: {
      className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      label: 'Validé',
      icon: <CheckCircle className="h-3 w-3" />
    },
    rejete: {
      className: 'bg-rose-100 text-rose-800 border-rose-300',
      label: 'Rejeté',
      icon: <XCircleIcon className="h-3 w-3" />
    },
    en_attente: {
      className: 'bg-amber-100 text-amber-800 border-amber-300',
      label: 'En attente',
      icon: <Clock className="h-3 w-3" />
    },
    soumis: {
      className: 'bg-blue-100 text-blue-800 border-blue-300',
      label: 'Soumis',
      icon: <Clock className="h-3 w-3" />
    },
  };

  const normalized = status?.toLowerCase();
  const { className, label, icon } = config[normalized] || config.en_attente;

  return (
    <Badge variant="outline" className={`font-semibold ${className} flex items-center gap-1.5 px-3 py-1`}>
      {icon}
      {label}
    </Badge>
  );
};

interface DocumentValidationModalProps {
    document: any;
    isOpen: boolean;
    onClose: () => void;
    onValidate: (documentId: number, statut: 'valide' | 'rejete', commentaire?: string) => Promise<void>;
    isValidating: boolean;
    candidatInfo?: {
        nomcan: string;
        prncan: string;
        maican: string;
    };
}

const DocumentValidationModal: React.FC<DocumentValidationModalProps> = ({
    document,
    isOpen,
    onClose,
    onValidate,
    isValidating,
    candidatInfo
}) => {
    const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
    const [validationType, setValidationType] = useState<'valide' | 'rejete' | null>(null);
    const [commentaire, setCommentaire] = useState('');

    const handleValidation = async (statut: 'valide' | 'rejete') => {
        if (statut === 'rejete' && !commentaire.trim()) {
            toast({
                title: "Commentaire requis",
                description: "Veuillez indiquer la raison du rejet",
                variant: "destructive",
            });
            return;
        }

        try {
            await onValidate(document.id, statut, commentaire);
            setCommentaire('');
            setValidationType(null);
            onClose();
            
            toast({
                title: statut === 'valide' ? "Validé avec succès !" : "Rejeté",
                description: statut === 'valide' 
                    ? "Le document a été validé avec succès" 
                    : "Le document a été rejeté",
            });
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de traiter la validation",
                variant: "destructive",
            });
        }
    };

    if (!document) return null;

    const fileUrl = `${API_ORIGIN}/documents/${document.id}/download`;
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(document.nom_fichier || '');
    const isPdf = /\.pdf$/i.test(document.nom_fichier || '');

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="w-[min(94vw,52rem)] max-w-3xl max-h-[88vh] overflow-y-auto p-0 rounded-xl shadow-xl">
                    <DialogHeader className="p-5 pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                        <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                            <FileText className="h-7 w-7 text-blue-600" />
                            Validation de document
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600 mt-1">
                            Examinez attentivement le document avant de prendre une décision.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-5 pb-5 space-y-5">
                        {/* Infos candidat + document */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardContent className="pt-4 space-y-4">
                                    <div>
                                        <Label className="text-sm font-bold text-gray-600">Document</Label>
                                        <p className="text-base font-bold text-gray-800 mt-1">
                                            {document.nomdoc}
                                        </p>
                                        <p className="text-sm text-muted-foreground">Type: {document.type || 'Non spécifié'}</p>
                                    </div>

                                    {candidatInfo && (
                                        <div className="pt-4 border-t">
                                            <Label className="text-sm font-bold text-gray-600 flex items-center gap-2">
                                                <User className="h-5 w-5" /> Candidat
                                            </Label>
                                            <p className="text-lg font-semibold mt-1">
                                                {candidatInfo.prncan} {candidatInfo.nomcan}
                                            </p>
                                            <p className="text-sm text-muted-foreground">{candidatInfo.maican}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-4 space-y-4">
                                    <div>
                                        <Label className="text-sm font-bold text-gray-600">Date de soumission</Label>
                                        <p className="flex items-center gap-2 text-sm font-medium mt-2">
                                            <Calendar className="h-4 w-4 text-blue-600" />
                                            {new Date(document.created_at).toLocaleDateString('fr-FR', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <Label className="text-sm font-bold text-gray-600">Statut actuel</Label>
                                        <div className="mt-3">
                                            <StatusBadge status={document.document_statut || document.statut || 'en_attente'} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Aperçu du document */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800">Aperçu du document</h3>
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedDocument(document)}
                                    className="shadow-md hover:shadow-lg transition-shadow"
                                >
                                    <Eye className="h-5 w-5 mr-2" />
                                    Plein écran
                                </Button>
                            </div>

                            <Card className="overflow-hidden">
                                <div className="bg-gray-50 p-3 min-h-56 flex items-center justify-center">
                                    {document.nom_fichier ? (
                                        isImage ? (
                                            <img
                                                src={fileUrl}
                                                alt={document.nomdoc}
                                                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                                            />
                                        ) : isPdf ? (
                                            <iframe
                                                src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                                className="w-full h-64 rounded-md border"
                                                title="PDF Preview"
                                            />
                                        ) : (
                                            <div className="text-center py-16">
                                                <FileText className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                                                <p className="text-xl font-medium text-gray-600">Aperçu non disponible</p>
                                                <p className="text-sm text-gray-500 mt-2">{document.nom_fichier}</p>
                                            </div>
                                        )
                                    ) : (
                                        <p className="text-xl text-gray-500">Aucun fichier joint</p>
                                    )}
                                </div>
                            </Card>
                        </div>

                        <Separator />

                        {/* Commentaire */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="commentaire" className="text-base font-bold">
                                    Commentaire {validationType === 'rejete' && <span className="text-rose-600">(obligatoire)</span>}
                                </Label>
                                {validationType === 'rejete' && (
                                    <p className="text-rose-600 flex items-center gap-2 mt-2 font-medium">
                                        <AlertCircle className="h-5 w-5" />
                                        Précisez la raison du rejet (ex: illisible, expiré, faux document...)
                                    </p>
                                )}
                            </div>
                            <Textarea
                                id="commentaire"
                                value={commentaire}
                                onChange={(e) => setCommentaire(e.target.value)}
                                onFocus={() => setValidationType('rejete')}
                                placeholder={validationType === 'rejete' 
                                    ? "Ex: Document illisible / Date expirée / Signature manquante..."
                                    : "Commentaire optionnel (recommandé pour le rejet)"}
                                rows={3}
                                className="resize-none"
                            />
                        </div>

                        {/* Boutons d'action */}
                        <div className="flex flex-wrap justify-end gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={isValidating}
                                className="px-5"
                            >
                                Annuler
                            </Button>

                            <Button
                                variant="destructive"
                                onClick={() => handleValidation('rejete')}
                                disabled={isValidating}
                                className="px-5"
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                {isValidating ? 'Rejet en cours...' : 'Rejeter'}
                            </Button>

                            <Button
                                onClick={() => handleValidation('valide')}
                                disabled={isValidating}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {isValidating ? 'Validation...' : 'Valider'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <DocumentViewer
                isOpen={!!selectedDocument}
                onClose={() => setSelectedDocument(null)}
                document={selectedDocument || null}
            />
        </>
    );
};

export default DocumentValidationModal;
