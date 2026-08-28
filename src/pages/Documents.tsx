import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, CheckCircle, FileText, PlusCircle, Upload, X } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { useCandidature } from '@/hooks/useCandidature';
import { apiService } from '@/services/api';

interface RequirementItem {
  id: string;
  nom: string;
  description?: string;
  obligatoire: boolean;
  acceptedMimeTypes?: string[];
  maxSizeBytes?: number;
}

interface ExistingDocument {
  id: string;
  nomdoc: string;
  nom_fichier?: string;
  mime_type?: string;
  statut?: 'valide' | 'rejete' | 'en_attente';
  requirement_id?: string | null;
}

interface DocumentChecklistResponse {
  nupcan: string;
  checklist: Array<{ requirement: RequirementItem; document: ExistingDocument | null }>;
  supplemental: ExistingDocument[];
}

interface UploadSlot {
  key: string;
  label: string;
  required: boolean;
  description?: string;
  requirementId?: string;
  acceptedMimeTypes?: string[];
  maxSizeBytes?: number;
  file?: File | null;
  existingDocumentId?: string;
  existingFileName?: string;
  existingStatus?: 'valide' | 'rejete' | 'en_attente';
  isCustom?: boolean;
}

const DEFAULT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024;

const acceptFromMimeTypes = (mimeTypes?: string[]) => {
  const source = mimeTypes?.length ? mimeTypes : DEFAULT_MIME_TYPES;
  const mapped = source.flatMap((mimeType) => {
    switch (mimeType) {
      case 'application/pdf':
        return ['.pdf'];
      case 'image/jpeg':
        return ['.jpg', '.jpeg'];
      case 'image/png':
        return ['.png'];
      case 'image/webp':
        return ['.webp'];
      default:
        return [mimeType];
    }
  });
  return Array.from(new Set(mapped)).join(',');
};

const statusLabel = (status?: string) =>
  status === 'valide' ? 'Validé' : status === 'rejete' ? 'À remplacer' : 'Déjà téléversé';

const Documents = () => {
  const { numeroCandidature } = useParams<{ numeroCandidature: string }>();
  const navigate = useNavigate();
  const { candidatureData, loadCandidature } = useCandidature();
  const [uploadedDocuments, setUploadedDocuments] = useState<Map<string, UploadSlot>>(new Map());
  const [customDocsCounter, setCustomDocsCounter] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [currentUploadType, setCurrentUploadType] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (numeroCandidature && !candidatureData) {
      loadCandidature(numeroCandidature).catch((error) => {
        console.error('Erreur lors du chargement de la candidature:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les informations de candidature.',
          variant: 'destructive',
        });
        navigate('/');
      });
    }
  }, [numeroCandidature, candidatureData, loadCandidature, navigate]);

  const checklistQuery = useQuery({
    queryKey: ['document-checklist', numeroCandidature],
    queryFn: () =>
      apiService.get<DocumentChecklistResponse>(
        `/candidats/nupcan/${encodeURIComponent(numeroCandidature!)}/document-checklist`,
      ),
    enabled: Boolean(numeroCandidature),
  });

  const documentsRequis = useMemo(
    () => checklistQuery.data?.data?.checklist ?? [],
    [checklistQuery.data],
  );
  const supplementalDocuments = useMemo(
    () => checklistQuery.data?.data?.supplemental ?? [],
    [checklistQuery.data],
  );

  useEffect(() => {
    if (!documentsRequis.length && !supplementalDocuments.length) return;

    setUploadedDocuments((previous) => {
      const next = new Map(previous);

      for (const item of documentsRequis) {
        const key = item.requirement.id;
        const current = next.get(key);
        if (current?.file) continue;

        next.set(key, {
          key,
          label: item.requirement.nom,
          required: item.requirement.obligatoire,
          description: item.requirement.description,
          requirementId: item.requirement.id,
          acceptedMimeTypes: item.requirement.acceptedMimeTypes,
          maxSizeBytes: item.requirement.maxSizeBytes,
          file: current?.file ?? null,
          existingDocumentId: item.document?.id,
          existingFileName: item.document?.nom_fichier || item.document?.nomdoc,
          existingStatus: item.document?.statut,
          isCustom: false,
        });
      }

      for (const document of supplementalDocuments) {
        const key = `custom_existing_${document.id}`;
        const current = next.get(key);
        if (current?.file) continue;

        next.set(key, {
          key,
          label: document.nomdoc || 'Document complémentaire',
          required: false,
          file: current?.file ?? null,
          existingDocumentId: document.id,
          existingFileName: document.nom_fichier || document.nomdoc,
          existingStatus: document.statut,
          isCustom: true,
        });
      }

      return next;
    });
  }, [documentsRequis, supplementalDocuments]);

  const concours = candidatureData?.concours;
  const uploadTarget = uploadedDocuments.get(currentUploadType);
  const acceptValue = acceptFromMimeTypes(uploadTarget?.acceptedMimeTypes);

  const requiredDocs = useMemo(
    () => Array.from(uploadedDocuments.values()).filter((doc) => doc.required && !doc.isCustom),
    [uploadedDocuments],
  );

  const optionalDocs = useMemo(
    () =>
      Array.from(uploadedDocuments.values()).filter(
        (doc) => !doc.required && !doc.isCustom && doc.requirementId,
      ),
    [uploadedDocuments],
  );

  const customDocs = useMemo(
    () => Array.from(uploadedDocuments.values()).filter((doc) => doc.isCustom),
    [uploadedDocuments],
  );

  const completedRequiredDocs = useMemo(
    () =>
      requiredDocs.filter((doc) => Boolean(doc.file) || Boolean(doc.existingDocumentId)),
    [requiredDocs],
  );

  const completionPercentage = requiredDocs.length
    ? Math.round((completedRequiredDocs.length / requiredDocs.length) * 100)
    : 100;

  const validateFileForSlot = (file: File, slot?: UploadSlot) => {
    const allowedMimeTypes =
      slot?.acceptedMimeTypes?.length ? slot.acceptedMimeTypes : DEFAULT_MIME_TYPES;
    const maxSizeBytes = slot?.maxSizeBytes || DEFAULT_MAX_SIZE_BYTES;

    if (file.size > maxSizeBytes) {
      toast({
        title: 'Fichier trop volumineux',
        description: `La taille maximale autorisée est ${(maxSizeBytes / (1024 * 1024)).toFixed(0)} Mo.`,
        variant: 'destructive',
      });
      return false;
    }

    if (!allowedMimeTypes.includes(file.type)) {
      toast({
        title: 'Format non autorisé',
        description: `Cette pièce accepte ${allowedMimeTypes.join(', ')}.`,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const uploadMutation = useMutation({
    mutationFn: async (nupcan: string) => {
      const changedDocuments = Array.from(uploadedDocuments.values()).filter((doc) => doc.file);

      if (changedDocuments.length === 0) {
        return [];
      }

      const responses = [];
      for (const doc of changedDocuments) {
        const formData = new FormData();
        formData.append('file', doc.file as File);
        formData.append('nomdoc', doc.label);

        if (doc.existingDocumentId) {
          const response = await apiService.makeFormDataRequest(
            `/documents/${doc.existingDocumentId}/replace`,
            'PUT',
            formData,
          );
          if (!response.success) throw new Error(response.message || `Échec: ${doc.label}`);
          responses.push(response.data);
          continue;
        }

        formData.append('nupcan', nupcan);
        if (doc.requirementId) formData.append('requirement_id', doc.requirementId);

        const response = await apiService.makeFormDataRequest('/documents', 'POST', formData);
        if (!response.success) throw new Error(response.message || `Échec: ${doc.label}`);
        responses.push(response.data);
      }

      return responses;
    },
    onSuccess: async () => {
      setUploadSuccess(true);
      toast({
        title: 'Documents enregistrés',
        description: 'Les pièces ont bien été prises en compte.',
      });

      if (numeroCandidature) {
        await Promise.allSettled([
          loadCandidature(numeroCandidature),
          checklistQuery.refetch(),
        ]);
      }

      setTimeout(() => {
        navigate(`/dashboard/${encodeURIComponent(numeroCandidature || '')}?refresh=true`);
      }, 1200);
    },
    onError: (error: Error) => {
      setUploadSuccess(false);
      toast({
        title: 'Erreur d’upload',
        description: error.message || 'Une erreur est survenue pendant l’envoi.',
        variant: 'destructive',
      });
    },
  });

  const triggerFileInput = (key: string) => {
    setCurrentUploadType(key);
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const slot = uploadedDocuments.get(currentUploadType);
    if (!file || !slot) return;

    if (!validateFileForSlot(file, slot)) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setCurrentUploadType('');
      return;
    }

    setUploadedDocuments((previous) => {
      const next = new Map(previous);
      next.set(currentUploadType, {
        ...slot,
        file,
      });
      return next;
    });

    toast({
      title: slot.existingDocumentId ? 'Document prêt à être remplacé' : 'Document ajouté',
      description: `${slot.label} - ${file.name}`,
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
    setCurrentUploadType('');
  };

  const clearPendingFile = (key: string) => {
    setUploadedDocuments((previous) => {
      const next = new Map(previous);
      const doc = next.get(key);
      if (!doc) return previous;

      if (doc.isCustom && !doc.existingDocumentId && !doc.file && !doc.label.trim()) {
        next.delete(key);
        return next;
      }

      if (doc.isCustom && !doc.existingDocumentId) {
        next.set(key, { ...doc, file: null });
        return next;
      }

      next.set(key, { ...doc, file: null });
      return next;
    });
  };

  const addCustomDocumentField = () => {
    const key = `custom_${Date.now()}_${customDocsCounter}`;
    setCustomDocsCounter((value) => value + 1);
    setUploadedDocuments((previous) => {
      const next = new Map(previous);
      next.set(key, {
        key,
        label: '',
        required: false,
        file: null,
        isCustom: true,
      });
      return next;
    });
  };

  const updateCustomDocumentLabel = (key: string, label: string) => {
    setUploadedDocuments((previous) => {
      const next = new Map(previous);
      const current = next.get(key);
      if (!current) return previous;
      next.set(key, { ...current, label });
      return next;
    });
  };

  const removeCustomSlot = (key: string) => {
    setUploadedDocuments((previous) => {
      const next = new Map(previous);
      next.delete(key);
      return next;
    });
  };

  const handleContinuer = () => {
    const missingRequired = requiredDocs.filter(
      (doc) => !doc.file && !doc.existingDocumentId,
    );

    if (missingRequired.length > 0) {
      toast({
        title: 'Documents manquants',
        description: missingRequired.map((doc) => doc.label).join(', '),
        variant: 'destructive',
      });
      return;
    }

    const invalidCustomDoc = customDocs.find(
      (doc) => !doc.existingDocumentId && (!!doc.file !== !!doc.label.trim()),
    );
    if (invalidCustomDoc) {
      toast({
        title: 'Document personnalisé incomplet',
        description: 'Ajoutez à la fois un titre et un fichier pour chaque document personnalisé.',
        variant: 'destructive',
      });
      return;
    }

    if (!numeroCandidature) {
      toast({
        title: 'Erreur système',
        description: 'Numéro de candidature introuvable.',
        variant: 'destructive',
      });
      return;
    }

    const hasNewFiles = Array.from(uploadedDocuments.values()).some((doc) => doc.file);
    if (!hasNewFiles) {
      toast({
        title: 'Aucune nouvelle pièce',
        description: 'Votre dossier est déjà à jour.',
      });
      navigate(`/dashboard/${encodeURIComponent(numeroCandidature)}?refresh=true`);
      return;
    }

    uploadMutation.mutate(numeroCandidature);
  };

  const renderDocCard = (doc: UploadSlot, tone: 'required' | 'optional') => {
    const hasExisting = Boolean(doc.existingDocumentId);
    const hasPending = Boolean(doc.file);
    const borderClass =
      tone === 'required'
        ? hasPending || hasExisting
          ? 'border-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/20'
          : 'border-slate-200 dark:border-slate-800'
        : hasPending || hasExisting
          ? 'border-blue-300 bg-blue-50/80 dark:bg-blue-950/20'
          : 'border-slate-200 dark:border-slate-800';

    return (
      <div key={doc.key} className={`rounded-lg border p-3 ${borderClass}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <p className="truncate text-sm font-semibold text-foreground">{doc.label}</p>
              {doc.required ? (
                <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-300">
                  Requis
                </span>
              ) : (
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                  Optionnel
                </span>
              )}
            </div>
            {doc.description ? (
              <p className="text-xs text-muted-foreground">{doc.description}</p>
            ) : null}
            {hasPending ? (
              <p className="truncate text-xs font-medium text-emerald-700 dark:text-emerald-300">
                À envoyer: {doc.file?.name}
              </p>
            ) : hasExisting ? (
              <p className="truncate text-xs text-muted-foreground">
                {statusLabel(doc.existingStatus)}: {doc.existingFileName}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Aucun fichier sélectionné</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={hasExisting && !hasPending ? 'outline' : 'default'}
              className="h-9 rounded-md px-3 text-xs"
              onClick={() => triggerFileInput(doc.key)}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {hasExisting ? 'Remplacer' : 'Téléverser'}
            </Button>
            {hasPending ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-9 rounded-md px-3 text-xs text-red-600"
                onClick={() => clearPendingFile(doc.key)}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Annuler
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptValue}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-md px-2"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Retour
              </Button>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Pièces du dossier</h1>
            {concours?.libcnc ? (
              <p className="mt-1 text-sm text-muted-foreground">{concours.libcnc}</p>
            ) : null}
          </div>

          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-background p-4 dark:border-slate-800">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Avancement</span>
              <span className="text-sm font-semibold text-primary">
                {completedRequiredDocs.length}/{requiredDocs.length}
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2 rounded-full" />
            <p className="mt-2 text-xs text-muted-foreground">
              Seules les pièces réellement exigées par le concours sélectionné sont demandées ici.
            </p>
          </div>
        </div>

        {(uploadMutation.isPending || uploadMutation.isError || uploadSuccess) ? (
          <div className="mb-5 rounded-lg border px-4 py-3 text-sm">
            {uploadMutation.isPending ? (
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Upload className="h-4 w-4 animate-pulse" />
                Envoi des documents en cours...
              </div>
            ) : uploadSuccess ? (
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="h-4 w-4" />
                Documents enregistrés. Redirection en cours...
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="h-4 w-4" />
                Une erreur est survenue pendant l’envoi.
              </div>
            )}
          </div>
        ) : null}

        {checklistQuery.isLoading ? (
          <Card className="rounded-lg border-slate-200 dark:border-slate-800">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Chargement des documents requis...
            </CardContent>
          </Card>
        ) : checklistQuery.isError ? (
          <Card className="rounded-lg border-red-200 dark:border-red-900">
            <CardContent className="py-12 text-center">
              <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
              <p className="text-sm font-medium text-foreground">
                Impossible de charger la checklist documentaire.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 rounded-md"
                onClick={() => checklistQuery.refetch()}
              >
                Réessayer
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_360px]">
            <div className="space-y-4">
              {requiredDocs.length > 0 ? (
                <Card className="rounded-lg border-slate-200 dark:border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Documents obligatoires
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {requiredDocs.map((doc) => renderDocCard(doc, 'required'))}
                  </CardContent>
                </Card>
              ) : null}

              {optionalDocs.length > 0 ? (
                <Card className="rounded-lg border-slate-200 dark:border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-blue-500" />
                      Documents optionnels
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {optionalDocs.map((doc) => renderDocCard(doc, 'optional'))}
                  </CardContent>
                </Card>
              ) : null}

              <Card className="rounded-lg border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Documents complémentaires</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {customDocs.map((doc) => (
                    <div
                      key={doc.key}
                      className="grid gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]"
                    >
                      <Input
                        value={doc.label}
                        placeholder="Nom du document"
                        className="h-10 rounded-md"
                        onChange={(event) => updateCustomDocumentLabel(doc.key, event.target.value)}
                        disabled={Boolean(doc.existingDocumentId)}
                      />
                      <div className="min-w-0">
                        {doc.file ? (
                          <div className="flex h-10 items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                            <span className="truncate">{doc.file.name}</span>
                          </div>
                        ) : doc.existingDocumentId ? (
                          <div className="flex h-10 items-center rounded-md border border-slate-200 px-3 text-xs text-muted-foreground dark:border-slate-800">
                            <span className="truncate">
                              {statusLabel(doc.existingStatus)}: {doc.existingFileName}
                            </span>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 w-full rounded-md"
                            disabled={!doc.label.trim()}
                            onClick={() => triggerFileInput(doc.key)}
                          >
                            <Upload className="mr-1.5 h-3.5 w-3.5" />
                            Ajouter le fichier
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {doc.existingDocumentId ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-md px-3 text-xs"
                            onClick={() => triggerFileInput(doc.key)}
                          >
                            Remplacer
                          </Button>
                        ) : null}
                        {doc.file ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-10 rounded-md px-3 text-xs text-red-600"
                            onClick={() => clearPendingFile(doc.key)}
                          >
                            Annuler
                          </Button>
                        ) : null}
                        {!doc.existingDocumentId ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-10 rounded-md px-3 text-xs text-red-600"
                            onClick={() => removeCustomSlot(doc.key)}
                          >
                            <X className="mr-1.5 h-3.5 w-3.5" />
                            Supprimer
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full rounded-md border-dashed"
                    onClick={addCustomDocumentField}
                  >
                    <PlusCircle className="mr-1.5 h-4 w-4" />
                    Ajouter un document complémentaire
                  </Button>
                </CardContent>
              </Card>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-md"
                  disabled={uploadMutation.isPending}
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Retour
                </Button>
                <Button
                  type="button"
                  className="h-10 rounded-md px-5"
                  disabled={checklistQuery.isLoading || uploadMutation.isPending || uploadSuccess}
                  onClick={handleContinuer}
                >
                  {uploadMutation.isPending
                    ? 'Enregistrement...'
                    : uploadSuccess
                      ? 'Redirection...'
                      : 'Enregistrer et continuer'}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="rounded-lg border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Consignes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Les formats autorisés dépendent du document demandé.</p>
                  <p>Un document déjà présent peut être remplacé sans recréer toute la candidature.</p>
                  <p>Les pièces requises affichées correspondent au concours et à la filière sélectionnés.</p>
                </CardContent>
              </Card>

              <Card className="rounded-lg border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Rappel dossier</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium text-primary">NUPCAN: {numeroCandidature}</p>
                  <p className="text-muted-foreground">{candidatureData?.concours?.libcnc || '-'}</p>
                  <p className="text-muted-foreground">
                    Progression: {completionPercentage}% des documents obligatoires couverts
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Documents;
