import {useState} from 'react';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {apiService} from '@/services/api';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card';
import {toast} from '@/hooks/use-toast';
import {Plus, Save} from 'lucide-react';

async function request(path: string, method = 'GET', body?: unknown): Promise<any> {
    const result = await apiService.makeRequest(path, method, body);
    if (!result.success) throw new Error(result.message || 'Impossible de charger les données');
    return result.data;
}
export default function CatalogAssociations({subjects = false}: {subjects?: boolean}) {
    const cache = useQueryClient();
    const [establishment, setEstablishment] = useState('');
    const [contest, setContest] = useState('');
    const [program, setProgram] = useState('');
    const [draft, setDraft] = useState<Record<string, {value: number; required: boolean}> | null>(null);
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);
    const establishments = useQuery({queryKey: ['catalog-establishments'], queryFn: () => request('/etablissements')});
    const contests = useQuery({queryKey: ['catalog-contests', establishment], enabled: !!establishment, queryFn: () => request(`/concours?etablissement_id=${establishment}`)});
    const programs = useQuery({queryKey: ['catalog-programs', subjects ? contest : 'all'], enabled: !subjects || !!contest, queryFn: () => request(subjects ? `/concours/${contest}/filieres` : '/filieres')});
    const items = useQuery({queryKey: ['catalog-subjects'], enabled: subjects, queryFn: () => request('/matieres')});
    const scope = subjects ? `${contest}/${program}` : contest;
    const linksPath = subjects ? `/filiere-matieres/filiere/${program}?concours_id=${contest}` : `/concours-filieres/concours/${contest}`;
    const links = useQuery({queryKey: ['catalog-links', subjects, scope], enabled: !!contest && (!subjects || !!program), queryFn: () => request(linksPath)});
    const selected = draft ?? Object.fromEntries((links.data || []).map((link: any) => [String(subjects ? link.matiere_id : link.filiere_id), {value: subjects ? link.coefficient : link.places_disponibles, required: !!link.obligatoire}]));
    const ready = !!contest && (!subjects || !!program);
    const error = establishments.error || contests.error || programs.error || items.error || links.error;
    const selectClass = 'w-full rounded-lg border border-input bg-background px-3 py-3 text-sm disabled:opacity-50';
    const reset = () => {setDraft(null); setName('');};
    async function create() {
        setBusy(true);
        try {
            const item = await request(subjects ? '/matieres' : '/filieres', 'POST', subjects ? {nom_matiere: name} : {nomfil: name, etablissement_id: establishment});
            await cache.invalidateQueries({queryKey: [subjects ? 'catalog-subjects' : 'catalog-programs']});
            setDraft({...selected, [String(item.id)]: {value: subjects ? 1 : 0, required: true}});
            setName('');
            toast({title: subjects ? 'Matière créée et sélectionnée' : 'Filière créée et sélectionnée', description: 'Enregistrez les associations pour la lier à ce concours.'});
        } catch (error) {toast({title: 'Création impossible', description: (error as Error).message, variant: 'destructive'});}
        finally {setBusy(false);}
    }
    async function save() {
        setBusy(true);
        try {
            const entries = Object.entries(selected);
            await request(subjects ? `/filiere-matieres/filiere/${program}/bulk` : `/concours-filieres/concours/${contest}/bulk`, 'POST', subjects ? {concours_id: contest, matieres: entries.map(([matiere_id, value]) => ({matiere_id, coefficient: value.value, obligatoire: value.required}))} : {filieres: entries.map(([filiere_id, value]) => ({filiere_id, places_disponibles: value.value}))});
            await links.refetch(); setDraft(null);
            toast({title: 'Associations enregistrées'});
        } catch (error) {toast({title: 'Enregistrement impossible', description: (error as Error).message, variant: 'destructive'});}
        finally {setBusy(false);}
    }
    return <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">{subjects ? 'Filières et matières' : 'Concours et filières'}</h1><p className="text-muted-foreground">Configurez les formations et les épreuves pour chaque établissement et chaque concours.</p></div>
        <Card><CardContent className="grid gap-4 p-6 md:grid-cols-3">
            <label className="space-y-2 text-sm font-medium">Établissement<select aria-label="Établissement" className={selectClass} disabled={busy} value={establishment} onChange={e => {setEstablishment(e.target.value); setContest(''); setProgram(''); reset();}}><option value="">Sélectionner un établissement</option>{(establishments.data || []).map((e: any) => <option key={e.id} value={e.id}>{e.nomets}</option>)}</select></label>
            <label className="space-y-2 text-sm font-medium">Concours<select aria-label="Concours" className={selectClass} disabled={busy || !establishment || contests.isFetching} value={contest} onChange={e => {setContest(e.target.value); setProgram(''); reset();}}><option value="">{establishment && !contests.isFetching && !contests.data?.length ? 'Aucun concours pour cet établissement' : 'Sélectionner un concours'}</option>{(contests.data || []).map((c: any) => <option key={c.id} value={c.id}>{c.libcnc}</option>)}</select></label>
            {subjects && <label className="space-y-2 text-sm font-medium">Filière<select aria-label="Filière" className={selectClass} disabled={busy || !contest || programs.isFetching} value={program} onChange={e => {setProgram(e.target.value); reset();}}><option value="">Sélectionner une filière du concours</option>{(programs.data || []).map((p: any) => <option key={p.id} value={p.id}>{p.nomfil}</option>)}</select></label>}
        </CardContent></Card>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{(error as Error).message}</p>}
        {ready && <Card><CardHeader><CardTitle>{subjects ? 'Matières du concours' : 'Filières proposées'}</CardTitle></CardHeader><CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2"><Input className="min-w-48 flex-1" aria-label={subjects ? 'Nom de la nouvelle matière' : 'Nom de la nouvelle filière'} placeholder={subjects ? 'Nom de la nouvelle matière' : 'Nom de la nouvelle filière'} value={name} onChange={e => setName(e.target.value)} disabled={busy}/><Button onClick={create} disabled={busy || !name.trim() || links.isFetching}><Plus className="mr-2 h-4 w-4"/>Créer et sélectionner</Button></div>
            {links.isFetching ? <p>Chargement des associations…</p> : <div className="space-y-2">{(subjects ? items.data || [] : programs.data || []).map((item: any) => {const id = String(item.id), value = selected[id]; return <div key={id} className={`flex flex-wrap items-center gap-4 rounded-xl border p-4 ${value ? 'border-primary/40 bg-primary/5' : ''}`}>
                <label className="flex min-w-40 flex-1 items-center gap-3"><input type="checkbox" disabled={busy} checked={!!value} onChange={e => {const next = {...selected}; if(e.target.checked) next[id] = {value: subjects ? 1 : 0, required: true}; else delete next[id]; setDraft(next);}}/><span>{subjects ? item.nom_matiere : item.nomfil}</span></label>
                {value && <><label className="flex items-center gap-2 text-sm">{subjects ? 'Coefficient' : 'Places'}<Input className="w-24" type="number" min={subjects ? 0.1 : 0} step={subjects ? 0.1 : 1} disabled={busy} value={value.value} onChange={e => setDraft({...selected, [id]: {...value, value: Number(e.target.value)}})}/></label>{subjects && <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={busy} checked={value.required} onChange={e => setDraft({...selected, [id]: {...value, required: e.target.checked}})}/>Obligatoire</label>}</>}
            </div>;})}</div>}
            <Button onClick={save} disabled={busy || links.isFetching || !!error} className="w-full"><Save className="mr-2 h-4 w-4"/>{busy ? 'Enregistrement…' : `Enregistrer les associations (${Object.keys(selected).length})`}</Button>
        </CardContent></Card>}
    </div>;
}
