import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BrainCircuit, Save } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';

type Requirement = { id: string; nom: string; description?: string; instructions_validation?: string; instructions_rejet?: string; obligatoire?: boolean };
type Contest = { id: string; libcnc: string };

const ConfigurationIA = () => {
  const [contestId, setContestId] = useState('');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const contestsQuery = useQuery({ queryKey: ['ai-contests'], queryFn: () => apiService.getConcours<Contest[]>() });
  const requirementsQuery = useQuery({ queryKey: ['ai-requirements', contestId], enabled: Boolean(contestId), queryFn: async () => (await apiService.makeRequest(`/concours/${contestId}`, 'GET')).data });

  useEffect(() => {
    const next = requirementsQuery.data?.documents_requis || [];
    setRequirements(next);
  }, [requirementsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => apiService.makeRequest(`/concours/${contestId}`, 'PUT', { documents_requis: requirements }),
    onSuccess: () => toast({ title: 'Configuration IA enregistrée', description: 'Les règles seront appliquées automatiquement aux prochains téléversements.' }),
    onError: (error: any) => toast({ title: 'Enregistrement impossible', description: error.message || 'Vérifiez vos droits administrateur.', variant: 'destructive' })
  });

  const update = (index: number, field: keyof Requirement, value: string) => setRequirements(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  const contests = Array.isArray(contestsQuery.data?.data) ? contestsQuery.data.data : [];

  return <AdminProtectedRoute><AdminLayout><div className="mx-auto max-w-5xl space-y-6">
    <div className="flex items-start gap-3"><BrainCircuit className="mt-1 h-8 w-8 text-blue-600" /><div><h1 className="text-3xl font-bold">Configuration IA</h1><p className="text-muted-foreground">Définissez les règles que l'IA appliquera automatiquement aux documents téléversés.</p></div></div>
    <Card><CardHeader><CardTitle>Choisir un concours</CardTitle></CardHeader><CardContent><Select value={contestId} onValueChange={setContestId}><SelectTrigger><SelectValue placeholder="Sélectionner un concours" /></SelectTrigger><SelectContent>{contests.map(contest => <SelectItem key={contest.id} value={String(contest.id)}>{contest.libcnc}</SelectItem>)}</SelectContent></Select></CardContent></Card>
    {contestId && requirementsQuery.isLoading && <p>Chargement des documents...</p>}
    {contestId && !requirementsQuery.isLoading && <div className="space-y-4">{requirements.map((requirement, index) => <Card key={requirement.id || index}><CardHeader><CardTitle className="text-lg">{requirement.nom}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{requirement.description || 'Aucune description définie.'}</p><div><Label>Règles pour valider</Label><Textarea className="mt-2 min-h-24" value={requirement.instructions_validation || ''} onChange={event => update(index, 'instructions_validation', event.target.value)} placeholder="Ex. nom lisible, date valide, cachet visible..." /></div><div><Label>Règles pour rejeter</Label><Textarea className="mt-2 min-h-24" value={requirement.instructions_rejet || ''} onChange={event => update(index, 'instructions_rejet', event.target.value)} placeholder="Ex. document flou, expiré, incomplet ou mauvais type..." /></div></CardContent></Card>)}{!requirements.length && <p className="rounded-md border border-dashed p-6 text-center text-muted-foreground">Aucun document configuré pour ce concours.</p>}<Button disabled={!requirements.length || saveMutation.isPending} onClick={() => saveMutation.mutate()}><Save className="mr-2 h-4 w-4" />{saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer les règles IA'}</Button></div>}
  </div></AdminLayout></AdminProtectedRoute>;
};

export default ConfigurationIA;
