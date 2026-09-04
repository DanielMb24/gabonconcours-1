import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    LayoutDashboard,
    FileText,
    CreditCard,
    Bell,
    User,
    LogOut,
    CheckCircle,
    Clock,
    Plus,
    ArrowRight,
    GraduationCap,
    MapPin,
    Calendar,
    ChevronDown,
    ChevronRight,
    AlertCircle,
    MessageSquare,
    Award,
    Settings,
    Menu,
    X
} from 'lucide-react';
import { candidatePortalService } from '@/services/candidatePortalService';
import { BACKEND_ORIGIN } from '@/services/api';
import { toast } from '@/hooks/use-toast';

// Import des composants existants
import NotificationPanel from '@/components/candidate/NotificationPanel';
import DocumentsManager from '@/components/candidat/DocumentsManager';
import MessagerieCandidat from '@/components/MessagerieCandidat';
import GradesBulletin from '@/components/candidat/GradesBulletin';

interface Candidature {
    nupcan: string;
    concours: {
        id: string | number;
        libcnc: string;
        etablissement: string;
    };
    filiere: {
        id: string | number;
        nomfil: string;
    };
    statut: string;
    progression: number;
    created_at: string;
    documents_count: number;
    documents_requis?: number;
    documents_deposes?: number;
    documents_valides: number;
    paiement_statut: string | null;
    etapes: {
        inscription: boolean;
        documents: boolean;
        paiement: boolean;
        resultats: boolean;
    };
}

interface DashboardData {
    candidat: {
        id: string;
        nipcan: string;
        nomcan: string;
        prncan: string;
        maican: string;
        telcan: string;
        phtcan: string;
    };
    candidatures: Candidature[];
    statistiques: {
        total: number;
        en_cours: number;
        completes: number;
    };
}

const DashboardNipcan: React.FC = () => {
    const { nipcan: paramValue } = useParams<{ nipcan: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [candidaturesOpen, setCandidaturesOpen] = useState(true);
    const [selectedCandidature, setSelectedCandidature] = useState<string | null>(null);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [actualNipcan, setActualNipcan] = useState<string>('');
    const [isLoadingNipcan, setIsLoadingNipcan] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [desktopMenuOpen, setDesktopMenuOpen] = useState(true);
    const { data: notificationsResponse } = useQuery({
        queryKey: ['notifications', selectedCandidature],
        queryFn: () => candidatePortalService.getNotifications(selectedCandidature as string),
        enabled: Boolean(selectedCandidature),
        refetchInterval: 10000,
    });
    const unreadNotifications = notificationsResponse?.success && Array.isArray(notificationsResponse.data)
        ? notificationsResponse.data.filter((notification: { statut?: string }) => notification.statut === 'non_lu').length
        : 0;

    useEffect(() => {
        const convertToNipcan = async () => {
            if (!paramValue) {
                setIsLoadingNipcan(false);
                return;
            }

            if (paramValue.startsWith('NIP')) {
                setActualNipcan(paramValue);
                setIsLoadingNipcan(false);
                return;
            }

            try {
                const response = await candidatePortalService.getNipcan<{ nipcan: string; nupcan: string }>(paramValue);

                if (response.success && response.data) {
                    setActualNipcan(response.data.nipcan);
                    navigate(`/dashboard/${response.data.nipcan}`, { replace: true });
                }
            } catch (error) {
                console.error('Erreur conversion:', error);
            } finally {
                setIsLoadingNipcan(false);
            }
        };

        convertToNipcan();
    }, [paramValue, navigate]);

    const loadDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await candidatePortalService.getDashboard<DashboardData>(actualNipcan);
            
            if (response.success && response.data) {
                setDashboardData(response.data);
                if (response.data.candidatures.length > 0) {
                    setSelectedCandidature(response.data.candidatures[0].nupcan);
                }
            } else {
                console.error('Erreur chargement dashboard:', response.message);
                toast({
                    title: "Erreur",
                    description: response.message || "Impossible de charger vos données",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Erreur chargement dashboard:', error);
            const errorMessage = error instanceof Error ? error.message : "Impossible de charger vos données";
            toast({
                title: "Erreur de connexion",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [actualNipcan]);

    useEffect(() => {
        if (actualNipcan && !isLoadingNipcan) {
            loadDashboardData();
        }
    }, [actualNipcan, isLoadingNipcan, loadDashboardData]);

    // Détecter si on doit recharger (paramètre refresh dans l'URL)
    useEffect(() => {
        if (searchParams.get('refresh') === 'true' && actualNipcan) {
            loadDashboardData();
            // Nettoyer le paramètre refresh de l'URL
            navigate(window.location.pathname, { replace: true });
        }
    }, [searchParams, actualNipcan, loadDashboardData, navigate]);

    // Recharger automatiquement quand la page redevient visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && actualNipcan) {
                console.log('📱 Page visible, rechargement des données...');
                loadDashboardData();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [actualNipcan, loadDashboardData]);

    const handleLogout = () => {
        localStorage.removeItem('candidat_nipcan');
        navigate('/connexion');
    };

    const handleNouvelleCandidature = () => {
        navigate('/concours');
    };

    const getStatutBadge = (statut: string) => {
        const styles = {
            en_cours: 'bg-blue-100 text-blue-800',
            complete: 'bg-green-100 text-green-800',
            en_attente: 'bg-yellow-100 text-yellow-800'
        };
        return styles[statut as keyof typeof styles] || styles.en_attente;
    };

    const getStatutIcon = (statut: string) => {
        switch (statut) {
            case 'complete':
                return <CheckCircle className="h-4 w-4" />;
            case 'en_cours':
                return <Clock className="h-4 w-4" />;
            default:
                return <AlertCircle className="h-4 w-4" />;
        }
    };

    if (loading || isLoadingNipcan) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center space-y-4">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Accès refusé</h3>
                            <p className="text-gray-600 mt-2">
                                Impossible de charger vos données. Votre NIPCAN est peut-être invalide ou vous n'avez pas encore de candidature.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Button onClick={() => navigate('/connexion')} className="w-full">
                                Retour à la connexion
                            </Button>
                            <Button 
                                onClick={() => navigate('/concours')} 
                                variant="outline" 
                                className="w-full"
                            >
                                Créer une candidature
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const renderContent = () => {
        if (activeTab === 'overview') {
            return (
                <div className="space-y-6">
                    <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-5 text-white shadow-sm sm:p-6">
                        <h2 className="text-2xl font-bold">Vue d’ensemble</h2>
                        <p className="mt-1 text-blue-100">Bienvenue {dashboardData.candidat.prncan} {dashboardData.candidat.nomcan}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-l-4 border-l-blue-500">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Total Candidatures</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardData.statistiques?.total || 0}</p>
                                    </div>
                                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <FileText className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-yellow-500">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">En cours</p>
                                        <p className="text-3xl font-bold text-yellow-600 mt-2">{dashboardData.statistiques?.en_cours || 0}</p>
                                    </div>
                                    <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                        <Clock className="h-6 w-6 text-yellow-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-green-500">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Completes</p>
                                        <p className="text-3xl font-bold text-green-600 mt-2">{dashboardData.statistiques?.completes || 0}</p>
                                    </div>
                                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {dashboardData.candidatures.length === 0 ? (
                        <Card className="border-2 border-dashed border-gray-300">
                            <CardContent className="pt-12 pb-12 text-center">
                                <div className="max-w-md mx-auto space-y-4">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                        <GraduationCap className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        Aucune candidature pour le moment
                                    </h3>
                                    <p className="text-gray-600">
                                        Commencez votre parcours en créant votre première candidature à un concours.
                                    </p>
                                    <Button 
                                        onClick={handleNouvelleCandidature} 
                                        size="lg" 
                                        className="gap-2 mt-4"
                                    >
                                        <Plus className="h-5 w-5" />
                                        Créer ma première candidature
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Candidatures recentes</span>
                                    <Button onClick={handleNouvelleCandidature} size="sm" className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Nouvelle
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {dashboardData.candidatures.slice(0, 3).map((candidature) => (
                                        <div key={candidature.nupcan} className="flex flex-col gap-4 p-4 border rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-colors sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <GraduationCap className="h-4 w-4 text-gray-400" />
                                                    <h4 className="font-semibold text-gray-900">{candidature.concours.libcnc}</h4>
                                                </div>
                                                <p className="text-sm text-gray-600 ml-6">{candidature.filiere.nomfil}</p>
                                                <p className="text-xs text-gray-500 mt-1 ml-6">NUPCAN: {candidature.nupcan}</p>
                                                <div className="flex flex-col gap-2 ml-6 mt-2 sm:flex-row sm:items-center sm:gap-4">
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <FileText className="h-3 w-3 text-blue-600" />
                                                        <span className="text-gray-600">
                                                            Documents déposés: <span className="font-semibold text-blue-600">{candidature.documents_deposes || 0}/{candidature.documents_requis || 0}</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <CreditCard className="h-3 w-3 text-green-600" />
                                                        <span className="text-gray-600">
                                                            Paiement: <span className="font-semibold">{candidature.paiement_statut || 'Non payé'}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                                                <div className="text-right">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {getStatutIcon(candidature.statut)}
                                                        <Badge className={getStatutBadge(candidature.statut)}>
                                                            {candidature.statut}
                                                        </Badge>
                                                    </div>
                                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-blue-600 h-2 rounded-full transition-all"
                                                            style={{ width: `${candidature.progression}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">{candidature.progression}%</p>
                                                </div>
                                                <Button 
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedCandidature(candidature.nupcan);
                                                        setActiveTab('candidatures');
                                                    }}
                                                    className="gap-2"
                                                >
                                                    Voir
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            );
        }

        if (activeTab === 'candidatures') {
            const currentCandidature = dashboardData.candidatures.find(c => c.nupcan === selectedCandidature);
            
            if (dashboardData.candidatures.length === 0) {
                return (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Gestion des candidatures</h2>
                        </div>

                        <Card className="border-2 border-dashed border-gray-300">
                            <CardContent className="pt-12 pb-12 text-center">
                                <div className="max-w-md mx-auto space-y-4">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto">
                                        <FileText className="h-10 w-10 text-blue-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        Commencez votre parcours
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        Vous n'avez pas encore de candidature. Explorez les concours disponibles 
                                        et créez votre première candidature pour démarrer votre inscription.
                                    </p>
                                    <div className="pt-4">
                                        <Button 
                                            onClick={handleNouvelleCandidature} 
                                            size="lg" 
                                            className="gap-2"
                                        >
                                            <Plus className="h-5 w-5" />
                                            Découvrir les concours
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            }
            
            return (
                <div className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">Gestion des candidatures</h2>
                        <Button onClick={handleNouvelleCandidature} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nouvelle candidature
                        </Button>
                    </div>

                    {currentCandidature ? (
                        <Card>
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-xl">{currentCandidature.concours.libcnc}</CardTitle>
                                        <p className="text-sm text-gray-600 mt-1">{currentCandidature.filiere.nomfil}</p>
                                        <p className="text-xs text-gray-500 mt-2">NUPCAN: {currentCandidature.nupcan}</p>
                                    </div>
                                    <Badge className={getStatutBadge(currentCandidature.statut)}>
                                        {currentCandidature.statut}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <MapPin className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-600">Etablissement</p>
                                                <p className="font-semibold text-sm">{currentCandidature.concours.etablissement}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-600">Date de creation</p>
                                                <p className="font-semibold text-sm">{new Date(currentCandidature.created_at).toLocaleDateString('fr-FR')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                            <div>
                                                <p className="text-xs text-gray-600">Documents</p>
                                                <p className="font-semibold text-sm">
                                                    {currentCandidature.documents_valides || 0} / {currentCandidature.documents_count || 0} validés
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                            <CreditCard className="h-5 w-5 text-green-600" />
                                            <div>
                                                <p className="text-xs text-gray-600">Paiement</p>
                                                <p className="font-semibold text-sm">
                                                    {currentCandidature.paiement_statut || 'Non payé'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium text-gray-700">Progression globale</p>
                                            <p className="text-sm font-bold text-blue-600">{currentCandidature.progression}%</p>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div 
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                                                style={{ width: `${currentCandidature.progression}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                                        <Button 
                                            className="gap-2" 
                                            onClick={() => setActiveTab('documents')}
                                        >
                                            <FileText className="h-4 w-4" />
                                            Gerer documents
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="gap-2"
                                            onClick={() => navigate(`/paiement/continue/${encodeURIComponent(currentCandidature.nupcan)}`)}
                                        >
                                            <CreditCard className="h-4 w-4" />
                                            Paiement
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-gray-600">Selectionnez une candidature dans la sidebar</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            );
        }

        if (activeTab === 'profil') {
            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Mon profil</h2>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    {dashboardData.candidat.phtcan ? (
                                        <img 
                                            src={dashboardData.candidat.phtcan.startsWith('data:') ? dashboardData.candidat.phtcan : `${BACKEND_ORIGIN}/uploads/photos/${dashboardData.candidat.phtcan}`}
                                            alt="Photo"
                                            className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-4 border-blue-100">
                                            <User className="h-12 w-12 text-blue-600" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">{dashboardData.candidat.prncan} {dashboardData.candidat.nomcan}</h3>
                                        <p className="text-gray-600 mt-1">{dashboardData.candidat.maican}</p>
                                        <Badge variant="outline" className="mt-2">
                                            NIPCAN: {dashboardData.candidat.nipcan}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-6 border-t">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600 mb-1">Telephone</p>
                                        <p className="font-semibold text-gray-900">{dashboardData.candidat.telcan}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600 mb-1">Email</p>
                                        <p className="font-semibold text-gray-900">{dashboardData.candidat.maican}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        if (activeTab === 'settings') {
            return (
                <div className="space-y-6">
                    <div><h2 className="text-2xl font-bold text-gray-900">Paramètres</h2><p className="mt-1 text-gray-600">Gérez votre session et vos préférences d’accès.</p></div>
                    <Card><CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-gray-900">Session candidat</p><p className="text-sm text-gray-600">Déconnectez-vous lorsque vous utilisez un appareil partagé.</p></div><Button variant="destructive" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4"/>Se déconnecter</Button></CardContent></Card>
                </div>
            );
        }

        if (activeTab === 'documents' && selectedCandidature) {
            return (
                <div className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">Mes documents</h2>
                        <Badge variant="outline">NUPCAN: {selectedCandidature}</Badge>
                    </div>
                    <DocumentsManager nupcan={selectedCandidature} />
                </div>
            );
        }

        if (activeTab === 'notifications' && selectedCandidature) {
            return (
                <div className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                        <Badge variant="outline">NUPCAN: {selectedCandidature}</Badge>
                    </div>
                    <NotificationPanel nupcan={selectedCandidature} />
                </div>
            );
        }

        if (activeTab === 'messages' && selectedCandidature) {
            return (
                <div className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">Messagerie</h2>
                        <Badge variant="outline">NUPCAN: {selectedCandidature}</Badge>
                    </div>
                    <MessagerieCandidat nupcan={selectedCandidature} />
                </div>
            );
        }

        if (activeTab === 'resultats' && selectedCandidature) {
            const currentCandidature = dashboardData.candidatures.find(c => c.nupcan === selectedCandidature);
            
            return (
                <div className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">Mes résultats</h2>
                        <Badge variant="outline">NUPCAN: {selectedCandidature}</Badge>
                    </div>
                    {currentCandidature ? (
                        <GradesBulletin 
                            nupcan={selectedCandidature}
                            candidat={{
                                nomcan: dashboardData.candidat.nomcan,
                                prncan: dashboardData.candidat.prncan,
                                concourId: currentCandidature.concours.id,
                                libcnc: currentCandidature.concours.libcnc
                            }}
                        />
                    ) : (
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-gray-600">Sélectionnez une candidature pour voir les résultats</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {mobileMenuOpen && <button aria-label="Fermer le menu" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={()=>setMobileMenuOpen(false)}/>} 
            <aside className={`w-72 lg:w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-50 h-screen transition-transform duration-300 ${mobileMenuOpen?'translate-x-0':'-translate-x-full'} ${desktopMenuOpen?'lg:translate-x-0':'lg:-translate-x-full'}`}>
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between"><div><h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                        GABConcours
                    </h1><p className="text-sm text-gray-600 mt-1">Espace Candidat</p></div><Button variant="ghost" size="icon" className="lg:hidden" onClick={()=>setMobileMenuOpen(false)}><X className="h-5 w-5"/></Button></div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <button
                        onClick={() => {setActiveTab('overview');setMobileMenuOpen(false);}}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            activeTab === 'overview' 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        <LayoutDashboard className="h-5 w-5" />
                        <span className="font-medium">Vue d ensemble</span>
                    </button>

                    <div>
                        <button
                            onClick={() => {
                                setCandidaturesOpen(!candidaturesOpen);
                                setActiveTab('candidatures');
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                                activeTab === 'candidatures' 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5" />
                                <span className="font-medium">Mes Candidatures</span>
                            </div>
                            {candidaturesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        
                        {candidaturesOpen && (
                            <div className="ml-4 mt-1 space-y-1">
                                {dashboardData.candidatures.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-gray-500 italic">
                                        Aucune candidature
                                    </div>
                                ) : (
                                    <>
                                        {dashboardData.candidatures.map((candidature) => (
                                            <button
                                                key={candidature.nupcan}
                                                onClick={() => {
                                                    setSelectedCandidature(candidature.nupcan);
                                                    setActiveTab('candidatures');
                                                    setMobileMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all ${
                                                    selectedCandidature === candidature.nupcan
                                                        ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="truncate font-medium">{candidature.concours.libcnc}</div>
                                                <div className="text-xs text-gray-500 truncate mt-0.5">{candidature.nupcan}</div>
                                            </button>
                                        ))}
                                    </>
                                )}
                                <button
                                    onClick={handleNouvelleCandidature}
                                    className="w-full text-left px-4 py-2 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-2 font-medium"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nouvelle candidature
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => {setActiveTab('documents');setMobileMenuOpen(false);}}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            activeTab === 'documents' 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        disabled={!selectedCandidature}
                    >
                        <FileText className="h-5 w-5" />
                        <span className="font-medium">Documents</span>
                    </button>

                    <button
                        onClick={() => {setActiveTab('notifications');setMobileMenuOpen(false);}}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            activeTab === 'notifications' 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        disabled={!selectedCandidature}
                    >
                        <Bell className="h-5 w-5" />
                        <span className="font-medium">Notifications</span>
                    </button>

                    <button
                        onClick={() => {setActiveTab('messages');setMobileMenuOpen(false);}}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            activeTab === 'messages' 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        disabled={!selectedCandidature}
                    >
                        <MessageSquare className="h-5 w-5" />
                        <span className="font-medium">Messages</span>
                    </button>

                    <button
                        onClick={() => {setActiveTab('resultats');setMobileMenuOpen(false);}}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            activeTab === 'resultats' 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        disabled={!selectedCandidature}
                    >
                        <Award className="h-5 w-5" />
                        <span className="font-medium">Résultats</span>
                    </button>

                    <button
                        onClick={() => {setActiveTab('profil');setMobileMenuOpen(false);}}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            activeTab === 'profil' 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        <User className="h-5 w-5" />
                        <span className="font-medium">Mon Profil</span>
                    </button>
                    <button onClick={() => {setActiveTab('settings');setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'settings'?'bg-blue-600 text-white shadow-lg shadow-blue-200':'text-gray-700 hover:bg-gray-100'}`}><Settings className="h-5 w-5"/><span className="font-medium">Paramètres</span></button>
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all font-medium"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Deconnexion</span>
                    </button>
                </div>
            </aside>

            <main className={`flex h-screen min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-300 ${desktopMenuOpen?'lg:ml-64':'lg:ml-0'}`}>
                <header className="z-30 shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex w-full items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3"><Button variant="outline" size="icon" className="shrink-0" onClick={()=>{if(window.innerWidth>=1024)setDesktopMenuOpen(value=>!value);else setMobileMenuOpen(true);}} aria-label={desktopMenuOpen?'Replier le menu':'Ouvrir le menu'}><Menu className="h-5 w-5"/></Button><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{dashboardData.candidat.prncan} {dashboardData.candidat.nomcan}</p><p className="hidden truncate text-xs text-slate-500 sm:block">{dashboardData.candidat.nipcan}</p></div></div>
                        <div className="flex items-center gap-1 sm:gap-2"><Button variant="ghost" size="icon" className="relative" onClick={()=>setActiveTab('notifications')} disabled={!selectedCandidature} aria-label="Notifications"><Bell className="h-5 w-5"/>{unreadNotifications > 0 && <Badge variant="destructive" className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-[10px]">{unreadNotifications > 9 ? '9+' : unreadNotifications}</Badge>}</Button><Button variant="ghost" size="icon" onClick={()=>setActiveTab('profil')} aria-label="Profil"><User className="h-5 w-5"/></Button><Button variant="ghost" size="icon" onClick={()=>setActiveTab('settings')} aria-label="Paramètres"><Settings className="h-5 w-5"/></Button><Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Déconnexion" className="text-red-600 hover:bg-red-50 hover:text-red-700"><LogOut className="h-5 w-5"/></Button></div>
                    </div>
                </header>
                <div className="w-full min-w-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default DashboardNipcan;
