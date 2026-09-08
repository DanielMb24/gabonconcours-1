import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Building, BookOpen, TrendingUp, Calendar, Filter } from 'lucide-react';
import { apiService } from '@/services/api';
import ErrorMessage from '@/components/ErrorMessage';

const StatistiquesPage = () => {
    const [filterEtablissement, setFilterEtablissement] = useState<string>('all');
    const [filterFiliere, setFilterFiliere] = useState<string>('all');
    const [filterConcours, setFilterConcours] = useState<string>('all');
    const [filterPeriode, setFilterPeriode] = useState<string>('all');

    // Récupérer les statistiques
    const { data: stats, isLoading, error, refetch } = useQuery({
        queryKey: ['super-admin-stats', filterEtablissement, filterFiliere, filterConcours, filterPeriode],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filterEtablissement !== 'all') params.append('etablissement_id', filterEtablissement);
            if (filterFiliere !== 'all') params.append('filiere_id', filterFiliere);
            if (filterConcours !== 'all') params.append('concours_id', filterConcours);
            params.append('periode', filterPeriode);
            
            const response = await apiService.makeRequest<any>(`/statistics/global?${params.toString()}`, 'GET');
            if (!response.success) throw new Error(response.message || "Statistiques indisponibles");
            return response.data;
        }
    });

    // Récupérer les listes pour les filtres
    const { data: etablissements } = useQuery({
        queryKey: ['etablissements'],
        queryFn: async () => {
            const response = await apiService.makeRequest<any[]>('/etablissements', 'GET');
            return Array.isArray(response.data) ? response.data : [];
        }
    });

    const { data: filieres } = useQuery({
        queryKey: ['filieres-stats', filterConcours],
        queryFn: async () => {
            const response = await apiService.makeRequest<any[]>(filterConcours === 'all' ? '/filieres' : `/concours/${filterConcours}/filieres`, 'GET');
            return Array.isArray(response.data) ? response.data : [];
        }
    });

    const { data: concours } = useQuery({
        queryKey: ['concours-stats', filterEtablissement],
        queryFn: async () => {
            const response = await apiService.makeRequest<any[]>(filterEtablissement === 'all' ? '/concours' : `/concours?etablissement_id=${filterEtablissement}`, 'GET');
            return Array.isArray(response.data) ? response.data : [];
        }
    });

    const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--destructive))'];

    if (isLoading) return <p className="p-6">Chargement des statistiques…</p>;

    if (error) {
        return <ErrorMessage message="Impossible de charger les statistiques" onRetry={refetch} />;
    }

    const statsCards = [
        {
            title: "Total Candidats",
            value: stats?.total_candidats || 0,
            icon: Users,
            color: "text-blue-600"
        },
        {
            title: "Établissements",
            value: stats?.total_etablissements || 0,
            icon: Building,
            color: "text-green-600"
        },
        {
            title: "Concours Actifs",
            value: stats?.concours_actifs || 0,
            icon: BookOpen,
            color: "text-purple-600"
        },
        {
            title: "Dossiers validés / dossiers décidés",
            value: `${stats?.taux_reussite || 0}%`,
            icon: TrendingUp,
            color: "text-orange-600"
        }
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Statistiques Globales</h1>
                    <p className="text-muted-foreground">Vue d'ensemble des performances de la plateforme</p>
                </div>
            </div>

            {/* Filtres */}
            <Card className="animate-fade-in">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtres Avancés
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Select value={filterEtablissement} onValueChange={value => {setFilterEtablissement(value); setFilterConcours('all'); setFilterFiliere('all');}}>
                            <SelectTrigger>
                                <SelectValue placeholder="Établissement" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les établissements</SelectItem>
                                {Array.isArray(etablissements) && etablissements.map((etab: any) => (
                                    <SelectItem key={etab.id} value={etab.id.toString()}>
                                        {etab.nomets || etab.nom}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterFiliere} onValueChange={setFilterFiliere}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filière" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes les filières</SelectItem>
                                {Array.isArray(filieres) && filieres.map((filiere: any) => (
                                    <SelectItem key={filiere.id} value={filiere.id.toString()}>
                                        {filiere.nomfil || filiere.nom}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterConcours} onValueChange={value => {setFilterConcours(value); setFilterFiliere('all');}}>
                            <SelectTrigger>
                                <SelectValue placeholder="Concours" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les concours</SelectItem>
                                {Array.isArray(concours) && concours.map((c: any) => (
                                    <SelectItem key={c.id} value={c.id.toString()}>
                                        {c.libcnc || c.nom}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterPeriode} onValueChange={setFilterPeriode}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="day">Aujourd'hui</SelectItem>
                                <SelectItem value="week">Cette semaine</SelectItem>
                                <SelectItem value="month">Ce mois</SelectItem>
                                <SelectItem value="year">Cette année</SelectItem>
                                <SelectItem value="all">Tout</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Cards de stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {statsCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <Card 
                            key={index}
                            className="hover-scale animate-fade-in"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">{card.title}</p>
                                        <p className="text-3xl font-bold">{card.value}</p>
                                    </div>
                                    <Icon className={`h-12 w-12 ${card.color}`} />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {stats?.total_candidatures === 0 && <p className="rounded-xl border bg-white p-6 text-muted-foreground">Aucune candidature pour ces filtres. Essayez une autre période.</p>}
            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Évolution des inscriptions */}
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle>Évolution des Inscriptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={stats?.evolution_inscriptions || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="inscriptions" stroke="hsl(var(--primary))" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Répartition par établissement */}
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle>Répartition par Établissement</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats?.repartition_etablissements || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="nom" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="candidats" fill="hsl(var(--primary))" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Statut des candidatures */}
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle>Statut des Candidatures</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats?.statut_candidatures || []}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                    outerRadius={100}
                                    fill="hsl(var(--primary))"
                                    dataKey="value"
                                >
                                    {(stats?.statut_candidatures || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Répartition par filière */}
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle>Répartition par Filière</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats?.repartition_filieres || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="nom" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="candidats" fill="hsl(var(--accent))" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default StatistiquesPage;
