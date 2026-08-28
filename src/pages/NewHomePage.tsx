import {useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {ArrowRight, BookOpen, Building2, CalendarDays, Check, FileText, MapPin, Search, ShieldCheck, Smartphone, Headphones} from 'lucide-react';
import Layout from '@/components/Layout';
import {Button} from '@/components/ui/button';
import {apiService} from '@/services/api';

interface ApiResponse<T> { success: boolean; data?: T }

const compactText = (...parts: Array<string | null | undefined>) =>
  parts.map((value) => String(value || '').trim()).filter(Boolean).join(', ');

const NewHomePage = () => {
  const navigate = useNavigate();
  const {data: concoursResponse, isLoading} = useQuery<ApiResponse<any[]>>({queryKey: ['concours'], queryFn: () => apiService.getConcours<any[]>()});
  const {data: etablissementsResponse} = useQuery<ApiResponse<any[]>>({queryKey: ['etablissements'], queryFn: () => apiService.getEtablissements<any[]>()});
  const concours = (concoursResponse?.data || []).filter((item: any) => item.stacnc === '1').slice(0, 3);
  const etablissementItems = etablissementsResponse?.data || [];
  const etablissements = etablissementItems.length;
  const establishmentMap = new Map(
    etablissementItems.map((item: any) => [String(item.id || item._id), item]),
  );

  return (
    <Layout>
      <main className="overflow-x-hidden bg-white text-slate-950">
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[1.08fr_.92fr] lg:px-8">
            <div className="max-w-2xl">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Concours d’entrée au Gabon</p>
              <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">Candidatez aux concours de l’enseignement supérieur.</h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Consultez les concours ouverts, déposez votre dossier et suivez chaque étape depuis un espace unique.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={() => navigate('/concours')} className="h-12 px-6 text-base">Voir les concours <ArrowRight className="ml-2 h-4 w-4" /></Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/connexion')} className="h-12 bg-white px-6 text-base"><Search className="mr-2 h-4 w-4" /> Suivre une candidature</Button>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-slate-200 pt-6 text-sm text-slate-600">
                <span><strong className="text-slate-950">{concours.length}</strong> concours ouverts</span>
                <span><strong className="text-slate-950">{etablissements}</strong> établissements référencés</span>
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Données sécurisées</span>
              </div>
            </div>
            <div className="border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,.10)] sm:p-6">
              <img src="/université.png" alt="Étudiants dans un établissement d’enseignement supérieur" className="h-[320px] w-full object-cover sm:h-[400px]" />
              <div className="grid grid-cols-2 border-x border-b border-slate-200 bg-white">
                <div className="border-r border-slate-200 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Démarche</p><p className="mt-1 font-semibold">100 % en ligne</p></div>
                <div className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Suivi</p><p className="mt-1 font-semibold">Depuis votre espace</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-9 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-sm font-semibold text-blue-700">CANDIDATURES</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Concours ouverts</h2></div>
            <button onClick={() => navigate('/concours')} className="flex items-center gap-2 text-sm font-semibold text-blue-700">Tous les concours <ArrowRight className="h-4 w-4" /></button>
          </div>
          {isLoading ? <div className="h-44 animate-pulse bg-slate-100" /> : concours.length ? (
            <div className="space-y-4">
              {concours.map((item: any) => (
                <article key={item.id} className="grid overflow-hidden border border-slate-200 bg-white md:grid-cols-[1.15fr_.85fr]">
                  {(() => {
                    const establishment = establishmentMap.get(String(item.etablissement_object_id || item.etablissement_id || ''));
                    const locationText = compactText(
                      establishment?.adretes || establishment?.address,
                      establishment?.province,
                      item.lieu_examen,
                    ) || 'Gabon';
                    const mapsQuery = encodeURIComponent(
                      compactText(
                        item.etablissement_nomets || item.etablissement_nom,
                        establishment?.adretes || establishment?.address,
                        establishment?.province,
                        item.lieu_examen,
                        'Gabon',
                      ) || 'Gabon',
                    );

                    return (
                      <>
                  <div className="min-w-0 p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-3"><BookOpen className="h-6 w-6 text-blue-700" /><span className="bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Ouvert</span></div>
                    <h3 className="mt-8 break-words text-xl font-bold leading-snug sm:text-2xl">{item.libcnc}</h3>
                    <p className="mt-3 flex items-center gap-2 text-sm text-slate-500"><CalendarDays className="h-4 w-4 shrink-0" /> Clôture : {item.fincnc ? new Date(item.fincnc).toLocaleDateString('fr-FR') : 'à confirmer'}</p>
                    <button onClick={() => navigate(`/concours/${item.id}`)} className="mt-7 flex items-center gap-2 border-t border-slate-200 pt-4 text-sm font-semibold text-blue-700">Consulter <ArrowRight className="h-4 w-4" /></button>
                  </div>
                  <div className="flex flex-col justify-center border-t border-slate-200 bg-slate-50 p-6 sm:p-8 md:border-l md:border-t-0">
                    <Building2 className="h-6 w-6 text-blue-700" />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Établissement</p>
                    <p className="mt-1 text-lg font-bold">{item.etablissement_nomets || item.etablissement_nom || 'Établissement organisateur'}</p>
                    <div className="mt-5 flex items-start gap-3 border-t border-slate-200 pt-5 text-sm text-slate-600">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                      <div className="min-w-0">
                        <p className="break-words">{locationText}</p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
                        >
                          Ouvrir le GPS Google
                          <ArrowRight className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                      </>
                    );
                  })()}
                </article>
              ))}
            </div>
          ) : <div className="border border-slate-200 bg-slate-50 p-8 text-slate-600">Aucun concours n’est ouvert actuellement.</div>}
        </section>

        <section className="border-y border-slate-200 bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
              <div><p className="text-sm font-semibold text-blue-400">UN PARCOURS CLAIR</p><h2 className="mt-3 text-3xl font-bold">Votre dossier en quatre étapes.</h2></div>
              <div className="grid gap-px bg-slate-700 sm:grid-cols-2">
                {[[FileText, '1. Choisissez', 'Consultez les conditions et sélectionnez votre filière.'], [Check, '2. Renseignez', 'Complétez vos informations personnelles avec attention.'], [ShieldCheck, '3. Déposez', 'Ajoutez uniquement les pièces demandées.'], [Building2, '4. Suivez', 'Retrouvez documents, paiement et résultats dans votre espace.']].map(([Icon, title, text]: any) => (
                  <div key={title} className="bg-slate-900 p-6"><Icon className="h-5 w-5 text-blue-400" /><h3 className="mt-5 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl"><p className="text-sm font-semibold text-blue-700">POURQUOI GABCONCOURS</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Une démarche plus simple et mieux suivie.</h2></div>
            <div className="mt-10 grid gap-px border border-slate-200 bg-slate-200 md:grid-cols-3">
              {[[Smartphone, 'Accessible partout', 'Déposez et suivez votre dossier depuis un téléphone, une tablette ou un ordinateur.'], [ShieldCheck, 'Dossier sécurisé', 'Vos informations et documents sont centralisés dans votre espace candidat.'], [Headphones, 'Suivi continu', 'Consultez l’état de vos documents, du paiement et des résultats sans vous déplacer.']].map(([Icon, title, text]: any) => (
                <div key={title} className="bg-white p-7"><Icon className="h-6 w-6 text-blue-700" /><h3 className="mt-6 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[.75fr_1.25fr] lg:px-8 lg:py-20">
          <div><p className="text-sm font-semibold text-blue-700">AIDE</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Questions fréquentes</h2><p className="mt-4 text-slate-600">Les réponses essentielles avant de commencer votre candidature.</p></div>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {[
              ['Comment créer une candidature ?', 'Choisissez un concours ouvert, sélectionnez une filière puis complétez le formulaire avec les informations demandées.'],
              ['Comment suivre mon dossier ?', 'Connectez-vous avec votre NIPCAN pour retrouver toutes vos candidatures, les documents et le paiement.'],
              ['Puis-je remplacer un document ?', 'Oui. Un document rejeté peut être remplacé depuis votre espace candidat en tenant compte du motif indiqué.'],
              ['Comment savoir si mon inscription est complète ?', 'La progression et les étapes restantes sont affichées directement dans le dashboard candidat.'],
            ].map(([question, answer]) => <details key={question} className="group py-5"><summary className="cursor-pointer list-none pr-8 font-semibold marker:hidden">{question}<span className="float-right text-blue-700 group-open:rotate-45">+</span></summary><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{answer}</p></details>)}
          </div>
        </section>

        {etablissementItems.length > 0 && <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-semibold uppercase tracking-wider text-slate-500">Établissements référencés</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">{etablissementItems.slice(0, 8).map((item: any) => <span key={item.id || item._id} className="border border-slate-200 bg-white px-4 py-3 text-sm font-semibold">{item.nomets || item.name || item.nom}</span>)}</div>
          </div>
        </section>}

        <section className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div><h2 className="text-3xl font-bold tracking-tight">Prêt à déposer votre dossier ?</h2><p className="mt-2 text-slate-600">Commencez par consulter les concours actuellement disponibles.</p></div>
          <Button size="lg" onClick={() => navigate('/concours')} className="h-12 px-6">Consulter les concours <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </section>
      </main>
    </Layout>
  );
};

export default NewHomePage;
