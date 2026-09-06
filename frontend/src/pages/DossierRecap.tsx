import {useQuery} from '@tanstack/react-query';
import {useNavigate, useParams} from 'react-router-dom';
import {AlertCircle, CheckCircle2, Clock3, CreditCard, FileText, LayoutDashboard} from 'lucide-react';
import Layout from '@/components/Layout';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {candidatureService} from '@/services/candidatureService';
import {documentService} from '@/services/documentService';

const DossierRecap = () => {
  const {nupcan = ''} = useParams();
  const navigate = useNavigate();
  const identifier = decodeURIComponent(nupcan).trim().toUpperCase();
  const query = useQuery({queryKey:['dossier-recap',identifier],queryFn:async()=>{const [application,checklist]=await Promise.all([candidatureService.getCandidatureByNupcan(identifier),documentService.getChecklist(identifier)]);return {application,checklist};},enabled:Boolean(identifier)});
  if(query.isLoading)return <Layout><div className="grid min-h-[60vh] place-items-center"><Clock3 className="h-10 w-10 animate-pulse text-primary"/></div></Layout>;
  if(query.isError||!query.data)return <Layout><div className="mx-auto max-w-xl px-4 py-16"><Card className="border-red-200"><CardContent className="py-10 text-center"><AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500"/><h1 className="text-xl font-bold">Dossier introuvable</h1><p className="mt-2 text-muted-foreground">Vérifiez votre NUPCAN puis reconnectez-vous.</p><Button className="mt-5" onClick={()=>navigate('/connexion')}>Se connecter</Button></CardContent></Card></div></Layout>;
  const {application,checklist}=query.data;
  const submitted=checklist.summary.submitted, required=checklist.summary.required, missing=checklist.summary.missing;
  const documentProgress=required ? Math.round((submitted/required)*100) : 100;
  const paymentStatus=application.paiement?.statut || 'non_paye';
  const canPay=missing===0;
  const dashboardId=application.candidat?.nipcan;
  return <Layout><main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12"><div className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white"><p className="text-sm text-blue-100">Récapitulatif du dossier</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">{application.concours?.libcnc || 'Votre candidature'}</h1><p className="mt-2 text-blue-100">NUPCAN : {identifier}</p></div><div className="mt-6 grid gap-5 lg:grid-cols-3"><Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/>Avancement documentaire</CardTitle></CardHeader><CardContent><div className="mb-2 flex justify-between text-sm"><span>{submitted} document(s) envoyé(s) sur {required} requis</span><strong>{documentProgress}%</strong></div><Progress value={documentProgress}/><div className="mt-5 space-y-3">{checklist.checklist.map(({requirement,document})=><div key={requirement.id} className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{requirement.nom}</p><p className="text-sm text-muted-foreground">{requirement.description || 'Pièce demandée pour ce concours'}</p></div>{document?<Badge className={document.document_statut==='rejete'?'bg-red-100 text-red-800':document.document_statut==='valide'?'bg-green-100 text-green-800':'bg-amber-100 text-amber-800'}>{document.document_statut}</Badge>:<Badge variant="outline">Manquant</Badge>}</div>)}</div></CardContent></Card><div className="space-y-5"><Card><CardHeader><CardTitle className="text-base">État du dossier</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex items-center justify-between"><span>Inscription</span><CheckCircle2 className="h-5 w-5 text-green-600"/></div><div className="flex items-center justify-between"><span>Documents</span>{canPay?<CheckCircle2 className="h-5 w-5 text-green-600"/>:<AlertCircle className="h-5 w-5 text-amber-600"/>}</div><div className="flex items-center justify-between"><span>Paiement</span><Badge variant="outline">{paymentStatus}</Badge></div></CardContent></Card><Card><CardContent className="pt-6"><p className="font-semibold">Étape suivante</p><p className="mt-1 text-sm text-muted-foreground">{canPay?'Votre dossier documentaire est prêt. Vous pouvez continuer vers le paiement.':`Ajoutez encore ${missing} pièce(s) obligatoire(s) avant le paiement.`}</p></CardContent></Card></div></div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="outline" onClick={()=>dashboardId?navigate(`/dashboard/${encodeURIComponent(dashboardId)}`):navigate('/connexion')}><LayoutDashboard className="mr-2 h-4 w-4"/>Accéder au dashboard</Button><Button disabled={!canPay} onClick={()=>navigate(`/paiement/continue/${encodeURIComponent(identifier)}`)}><CreditCard className="mr-2 h-4 w-4"/>Continuer vers le paiement</Button></div></main></Layout>;
};
export default DossierRecap;
