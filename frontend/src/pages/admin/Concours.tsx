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
import {ConfirmDialog} from '@/components/ui/confirm-dialog';

const Concours = () => {
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<any>(null)
    const [editLoading, setEditLoading] = useState(false)
    const [archiveTarget, setArchiveTarget] = useState<any>(null)
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
    const startEdit = async (item: any) => {
        setEditLoading(true);
        try {
            const response = await apiService.makeRequest(`/concours/${item.id}`, 'GET');
            if (!response.success) throw new Error(response.message || 'Chargement impossible');
            setEditing(response.data);
        } catch (error: any) {
            toast({title:'Erreur',description:error.message || 'Impossible de charger le concours',variant:'destructive'});
        } finally { setEditLoading(false); }
    };

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
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Modifier le concours</DialogTitle><DialogDescription>Formulaire complet : informations, dates, pièces demandées, critères et contacts.</DialogDescription></DialogHeader>
                        {editing && <CreateConcoursMultiStep mode="edit" concoursId={String(editing.id)} initialData={editing} onClose={()=>setEditing(null)} onSuccess={()=>queryClient.invalidateQueries({queryKey:['admin-concours']})} />}
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
                                                <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={()=>startEdit(concoursItem)} disabled={editLoading}><Pencil className="h-4 w-4 mr-1"/>Modifier</Button><Button variant="destructive" size="sm" onClick={() => setArchiveTarget(concoursItem)} disabled={deleteMutation.isPending}><Archive className="h-4 w-4 mr-1"/>Archiver</Button></div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </CardContent>
            <ConfirmDialog open={Boolean(archiveTarget)} onOpenChange={value=>!value&&setArchiveTarget(null)} title="Archiver ce concours ?" description={`Le concours « ${archiveTarget?.libcnc || ''} » ne sera plus proposé aux candidats. Les candidatures existantes seront conservées.`} confirmLabel="Archiver" pending={deleteMutation.isPending} onConfirm={()=>archiveTarget&&deleteMutation.mutate(archiveTarget.id,{onSuccess:()=>setArchiveTarget(null)})} />
        </Card>
    );
};

export default Concours;
