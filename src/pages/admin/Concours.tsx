// =================================================================
// FICHIER : components/Concours.tsx (Composant React)
// =================================================================
import React, {useState} from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {apiService} from '@/services/api';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {toast} from '@/hooks/use-toast';
import CreateConcoursMultiStep from '@/components/admin/CreateConcoursMultiStep';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {Badge} from "@/components/ui/badge";
import {CheckCircle, XCircle, Loader2, Pencil, Archive} from 'lucide-react';

const Concours = () => {
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<any>(null)
    const [editForm, setEditForm] = useState<any>({})
    const queryClient = useQueryClient()

    // Requêtes
    const {data: concoursData, isLoading: isLoadingConcours} = useQuery({
        queryKey: ['admin-concours'],
        queryFn: () => apiService.getConcours(),
    });

    const {data: niveauxData} = useQuery({
        queryKey: ['admin-niveaux'],
        queryFn: () => apiService.getNiveaux(),
    });

    const {data: etablissementsData} = useQuery({
        queryKey: ['admin-etablissements'],
        queryFn: () => apiService.getEtablissements(),
    });

    // Données (avec fallback)
    const niveaux = niveauxData?.data || [];
    const etablissements = etablissementsData?.data || [];

    // Enrichissement pour la table
    const concours = (concoursData?.data || []).map((concoursItem: any) => ({
        ...concoursItem,
        nomniv: concoursItem.niveau_nomniv || concoursItem.nomniv || niveaux.find((n: any) => String(n.id) === String(concoursItem.niveau_id))?.nomniv || 'Non renseigné',
        etablissement_nom: concoursItem.etablissement_nomets || concoursItem.etablissement_nom || etablissements.find((e: any) => String(e.id) === String(concoursItem.etablissement_id))?.nomets || 'Non renseigné',
    }));

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiService.deleteConcours(id.toString()),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['admin-concours']});
            toast({
                title: "Concours supprimé",
                description: "Le concours a été supprimé avec succès",
            });
        },
        onError: (error) => {
            console.error('Erreur suppression concours:', error);
            toast({
                title: "Erreur",
                description: "Impossible de supprimer le concours",
                variant: "destructive",
            });
        },
    });
    const updateMutation = useMutation({
        mutationFn: ({id, data}: any) => apiService.makeRequest(`/concours/${id}`, 'PUT', data),
        onSuccess: () => { queryClient.invalidateQueries({queryKey: ['admin-concours']}); setEditing(null); toast({title:'Concours modifié',description:'Les informations ont été enregistrées.'}); },
        onError: (error: any) => toast({title:'Erreur',description:error.message || 'Modification impossible',variant:'destructive'}),
    });
    const startEdit = (item: any) => { setEditing(item); setEditForm({libcnc:item.libcnc||'',description_concours:item.description_concours||'',etablissement_id:String(item.etablissement_id||''),niveau_id:String(item.niveau_id||''),debcnc:item.debcnc?String(item.debcnc).slice(0,10):'',fincnc:item.fincnc?String(item.fincnc).slice(0,10):'',fracnc:item.fracnc||0,stacnc:item.stacnc||'0'}); };

    // @ts-ignore
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestion des Concours</CardTitle>
                <CardDescription>
                    Liste de tous les concours enregistrés.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* MODALE DE CRÉATION - Multi-Step Form */}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="mb-4">Ajouter un concours</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Créer un concours</DialogTitle>
                            <DialogDescription>
                                Renseignez les informations du concours et ses modalités d'inscription.
                            </DialogDescription>
                        </DialogHeader>
                        <CreateConcoursMultiStep 
                            onClose={() => setOpen(false)}
                            onSuccess={() => {
                                queryClient.invalidateQueries({queryKey: ['admin-concours']});
                                setOpen(false);
                            }}
                        />
                    </DialogContent>
                </Dialog>
                <Dialog open={Boolean(editing)} onOpenChange={(value) => !value && setEditing(null)}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader><DialogTitle>Modifier le concours</DialogTitle><DialogDescription>Modifiez les informations principales et les relations.</DialogDescription></DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2"><Label>Intitulé</Label><Input value={editForm.libcnc||''} onChange={e=>setEditForm({...editForm,libcnc:e.target.value})}/></div>
                            <div><Label>Établissement</Label><Select value={editForm.etablissement_id||''} onValueChange={v=>setEditForm({...editForm,etablissement_id:v})}><SelectTrigger><SelectValue placeholder="Établissement"/></SelectTrigger><SelectContent>{etablissements.map((e:any)=><SelectItem key={e.id} value={String(e.id)}>{e.nomets}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label>Niveau</Label><Select value={editForm.niveau_id||''} onValueChange={v=>setEditForm({...editForm,niveau_id:v})}><SelectTrigger><SelectValue placeholder="Niveau"/></SelectTrigger><SelectContent>{niveaux.map((n:any)=><SelectItem key={n.id} value={String(n.id)}>{n.nomniv}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label>Ouverture</Label><Input type="date" value={editForm.debcnc||''} onChange={e=>setEditForm({...editForm,debcnc:e.target.value})}/></div>
                            <div><Label>Clôture</Label><Input type="date" value={editForm.fincnc||''} onChange={e=>setEditForm({...editForm,fincnc:e.target.value})}/></div>
                            <div><Label>Frais (FCFA)</Label><Input type="number" min="0" value={editForm.fracnc||0} onChange={e=>setEditForm({...editForm,fracnc:Number(e.target.value)})}/></div>
                            <div><Label>Statut</Label><Select value={editForm.stacnc||'0'} onValueChange={v=>setEditForm({...editForm,stacnc:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="1">Ouvert</SelectItem><SelectItem value="0">Fermé</SelectItem></SelectContent></Select></div>
                        </div>
                        <div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setEditing(null)}>Annuler</Button><Button onClick={()=>updateMutation.mutate({id:editing.id,data:editForm})} disabled={updateMutation.isPending}>{updateMutation.isPending&&<Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Enregistrer</Button></div>
                    </DialogContent>
                </Dialog>

                {/* LISTE DES CONCOURS - Design Amélioré */}
                <div className="mt-6">
                    {isLoadingConcours ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="mr-2 h-6 w-6 animate-spin"/>
                            <p className="text-lg text-gray-500">Chargement des concours...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableCaption>Liste de tous les concours.</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Id</TableHead>
                                    <TableHead>Concours</TableHead>
                                    <TableHead>Niveau/Établissement</TableHead>
                                    <TableHead className="text-right">Frais</TableHead>
                                    <TableHead>Dates</TableHead>
                                    <TableHead className="text-center">Données liées</TableHead>
                                    <TableHead className="text-center">Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {concours.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                                            Aucun concours trouvé.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    concours.map((concoursItem: any) => (
                                        <TableRow key={concoursItem.id}>
                                            <TableCell className="font-medium">{concoursItem.id}</TableCell>
                                            <TableCell>
                                                <p className="font-semibold">{concoursItem.libcnc}</p>
                                                <Badge variant="outline" className="mt-1">{concoursItem.status || 'non défini'}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm font-medium">{concoursItem.nomniv}</p>
                                                <p className="text-xs text-muted-foreground">{concoursItem.etablissement_nom}</p>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {concoursItem.fracnc ? `${concoursItem.fracnc.toLocaleString('fr-FR')} FCFA` : '0 FCFA'}
                                            </TableCell>

                                            <TableCell><div className="text-xs">Du {concoursItem.debcnc?new Date(concoursItem.debcnc).toLocaleDateString('fr-FR'):'—'}</div><div className="text-xs">au {concoursItem.fincnc?new Date(concoursItem.fincnc).toLocaleDateString('fr-FR'):'—'}</div></TableCell>
                                            <TableCell className="text-center"><div className="text-xs">{concoursItem.total_candidatures||0} candidature(s)</div><div className="text-xs text-muted-foreground">{concoursItem.total_documents||0} document(s) · {concoursItem.total_paiements||0} paiement(s)</div></TableCell>

                                            {/* Statut Actif */}
                                            <TableCell className="text-center">
                                                {concoursItem.stacnc === '1' ? (
                                                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" title="Concours Actif"/>
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-red-500 mx-auto" title="Concours Inactif"/>
                                                )}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={()=>startEdit(concoursItem)}><Pencil className="h-4 w-4 mr-1"/>Modifier</Button><Button variant="destructive" size="sm" onClick={() => window.confirm(`Archiver le concours « ${concoursItem.libcnc} » ?`) && deleteMutation.mutate(concoursItem.id)} disabled={deleteMutation.isPending}><Archive className="h-4 w-4 mr-1"/>Archiver</Button></div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default Concours;
