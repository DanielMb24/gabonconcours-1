import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BrainCircuit, FileUp, MessageCircle, Save, Send, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

type Requirement = { id: string; nom: string; description?: string; instructions_validation?: string; instructions_rejet?: string; exemple_document?: { nom_fichier?: string } | null };
type Contest = { id: string; libcnc: string };
type ChatMessage = { role: 'user' | 'assistant'; content: string };

const ConfigurationIA = () => {
  const [searchParams] = useSearchParams();
  const { admin, isSuperAdmin } = useAdminAuth();
  const [contestId, setContestId] = useState(searchParams.get('concours') || '');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const establishmentId = admin?.etablissement_id || admin?.etablissement_object_id;

  const contestsQuery = useQuery({
    queryKey: ['ai-contests', establishmentId, isSuperAdmin],
    enabled: isSuperAdmin || Boolean(establishmentId),
    queryFn: async () => isSuperAdmin ? apiService.getConcours<Contest[]>() : apiService.makeRequest<Contest[]>(`/admin/etablissement/${establishmentId}/concours`, 'GET')
  });
  const requirementsQuery = useQuery({
    queryKey: ['ai-requirements', contestId],
    enabled: Boolean(contestId),
    queryFn: async () => (await apiService.makeRequest(`/concours/${contestId}`, 'GET')).data
  });

  useEffect(() => {
    setRequirements(requirementsQuery.data?.documents_requis || []);
    setChatMessages([]);
  }, [requirementsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => apiService.makeRequest(`/concours/${contestId}`, 'PUT', { documents_requis: requirements }),
    onSuccess: () => toast({ title: 'Configuration IA enregistrée', description: 'Les règles seront appliquées aux prochains téléversements.' }),
    onError: (error: any) => toast({ title: 'Enregistrement impossible', description: error.message || 'Vérifiez vos droits.', variant: 'destructive' })
  });
  const modelMutation = useMutation({
    mutationFn: async ({ requirementId, file }: { requirementId: string; file: File }) => {
      const data = new FormData();
      data.append('example', file);
      return apiService.makeFormDataRequest(`/document-requirements/${requirementId}/example`, 'PUT', data);
    },
    onSuccess: () => { void requirementsQuery.refetch(); toast({ title: 'Modèle enregistré', description: 'Le modèle pourra guider le contrôle de structure.' }); },
    onError: (error: any) => toast({ title: 'Modèle refusé', description: error.message || 'Utilisez un PDF ou une image.', variant: 'destructive' })
  });
  const removeModelMutation = useMutation({
    mutationFn: (requirementId: string) => apiService.makeRequest(`/document-requirements/${requirementId}/example`, 'DELETE'),
    onSuccess: () => void requirementsQuery.refetch()
  });
  const chatMutation = useMutation({
    mutationFn: async () => {
      const response = await apiService.makeRequest<{ answer: string }>('/admin/ai/chat', 'POST', { contestId, message: chatInput, history: chatMessages, requirements }, { timeout: 130000 });
      if (!response.success) throw new Error(response.message || 'Le service IA est indisponible.');
      return response;
    },
    onSuccess: response => { setChatMessages(current => [...current, { role: 'assistant', content: response.data?.answer || response.message || 'Aucune réponse.' }]); setChatInput(''); },
    onError: (error: any) => toast({ title: 'Chat IA indisponible', description: error.message || 'Le service Gemini est indisponible. Contactez l’administrateur.', variant: 'destructive' })
  });

  const contests = Array.isArray(contestsQuery.data?.data) ? contestsQuery.data.data : [];
  const update = (index: number, field: keyof Requirement, value: string) => setRequirements(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  const sendChat = () => {
    const message = chatInput.trim();
    if (!message || chatMutation.isPending) return;
    setChatMessages(current => [...current, { role: 'user', content: message }]);
    chatMutation.mutate();
  };

  return <AdminProtectedRoute><AdminLayout><div className="mx-auto max-w-6xl space-y-6">
    <div className="flex items-start gap-3"><BrainCircuit className="mt-1 h-8 w-8 text-blue-600" /><div><h1 className="text-3xl font-bold">Configuration IA</h1><p className="text-muted-foreground">Règles, documents modèles et assistant de configuration par concours.</p></div></div>
    <Card><CardHeader><CardTitle>Concours concerné</CardTitle></CardHeader><CardContent><Select value={contestId} onValueChange={setContestId}><SelectTrigger><SelectValue placeholder="Sélectionner un concours" /></SelectTrigger><SelectContent>{contests.map(contest => <SelectItem key={contest.id} value={String(contest.id)}>{contest.libcnc}</SelectItem>)}</SelectContent></Select></CardContent></Card>
    {contestId && requirementsQuery.isLoading && <p>Chargement des documents...</p>}
    {contestId && !requirementsQuery.isLoading && <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">Documents contrôlés</h2><p className="text-sm text-muted-foreground">L’IA analysera chaque téléversement selon ces règles et le modèle fourni.</p></div><Button disabled={!requirements.length || saveMutation.isPending} onClick={() => saveMutation.mutate()}><Save className="mr-2 h-4 w-4" />Enregistrer</Button></div>
        {requirements.map((requirement, index) => <Card key={requirement.id || index}><CardHeader><CardTitle className="text-lg">{requirement.nom}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{requirement.description || 'Aucune description définie.'}</p><div><Label>Règles pour valider</Label><Textarea className="mt-2 min-h-24" value={requirement.instructions_validation || ''} onChange={event => update(index, 'instructions_validation', event.target.value)} placeholder="Ex. nom lisible, date valide, cachet visible..." /></div><div><Label>Règles pour rejeter</Label><Textarea className="mt-2 min-h-24" value={requirement.instructions_rejet || ''} onChange={event => update(index, 'instructions_rejet', event.target.value)} placeholder="Ex. document flou, expiré, incomplet ou mauvais type..." /></div><div className="rounded-md border border-dashed p-3"><div className="flex items-center justify-between gap-3"><div><Label>Document modèle</Label><p className="text-xs text-muted-foreground">PDF ou image de référence pour guider la structure attendue.</p>{requirement.exemple_document?.nom_fichier && <p className="mt-1 text-xs font-medium text-blue-700">Modèle : {requirement.exemple_document.nom_fichier}</p>}</div><div className="flex items-center gap-2"><label className="cursor-pointer"><Input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) modelMutation.mutate({ requirementId: requirement.id, file }); event.target.value = ''; }} /><span className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-muted"><FileUp className="mr-2 h-4 w-4" />Ajouter</span></label>{requirement.exemple_document?.nom_fichier && <Button variant="ghost" size="icon" onClick={() => removeModelMutation.mutate(requirement.id)} aria-label="Supprimer le modèle"><Trash2 className="h-4 w-4 text-red-600" /></Button>}</div></div></div></CardContent></Card>)}
        {!requirements.length && <p className="rounded-md border border-dashed p-6 text-center text-muted-foreground">Aucun document configuré pour ce concours.</p>}
      </div>
      <Card className="h-fit"><CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-blue-600" />Assistant IA</CardTitle><p className="text-sm text-muted-foreground">Demandez des règles adaptées à vos documents. Relisez les propositions avant de les enregistrer.</p></CardHeader><CardContent><div className="mb-4 max-h-96 space-y-3 overflow-y-auto">{!chatMessages.length && <p className="rounded-md bg-muted p-3 text-sm">Exemple : « Propose les règles de contrôle pour un relevé de notes du baccalauréat. »</p>}{chatMessages.map((message, index) => <div key={index} className={`whitespace-pre-wrap rounded-md p-3 text-sm ${message.role === 'user' ? 'ml-6 bg-blue-50' : 'mr-3 bg-muted'}`}><strong>{message.role === 'user' ? 'Vous' : 'IA'}</strong><p className="mt-1">{message.content}</p></div>)}</div><div className="space-y-2"><Textarea value={chatInput} onChange={event => setChatInput(event.target.value)} placeholder="Demandez une règle, un exemple ou une amélioration..." /><Button className="w-full" disabled={!contestId || !chatInput.trim() || chatMutation.isPending} onClick={sendChat}><Send className="mr-2 h-4 w-4" />{chatMutation.isPending ? 'Réflexion...' : 'Envoyer'}</Button></div></CardContent></Card>
    </div>}
  </div></AdminLayout></AdminProtectedRoute>;
};

export default ConfigurationIA;
