import React, {createContext, memo, useContext, useState} from 'react';
import {Outlet, Link, useLocation} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {
    Home,
    Trophy,
    Users,
    Building,
    FileText,
    Settings,
    BarChart3,
    DollarSign,
    Calendar,
    LogOut,
    UserCog,
    GraduationCap,
    BookOpen,
    Menu,
    X,
    Archive,
    MessageSquare,
    UserCircle
} from 'lucide-react';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import NotificationBadge from '@/components/admin/NotificationBadge';

const AdminLayoutContext = createContext(false);

interface AdminLayoutProps {
    children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = memo(({children}) => {
    const location = useLocation();
    const {admin, logout} = useAdminAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isNestedLayout = useContext(AdminLayoutContext);

    // Certaines anciennes pages incluent encore AdminLayout alors que la route le fournit déjà.
    // Dans ce cas, on évite de rendre une seconde barre latérale et un second en-tête.
    if (isNestedLayout) return <>{children || <Outlet/>}</>;

    // Menu items selon le rôle
    const getMenuItems = () => {
        const baseItems = [
            { path: '/admin/dashboard', label: 'Dashboard', icon: Home }
        ];

        // Super Admin voit tout
        if (admin?.role === 'super_admin') {
            return [
                ...baseItems,
                { path: '/admin/candList', label: 'Candidats', icon: Users },
                { path: '/admin/concours-filieres', label: 'Concours x Filières', icon: Trophy },
                { path: '/admin/filiere-matieres', label: 'Filières x Matières', icon: BookOpen },
                { path: '/admin/logs', label: 'Journal d\'activité', icon: FileText },
                { path: '/admin/support', label: 'Support client', icon: UserCog },
                { path: '/admin/statistiques', label: 'Statistiques', icon: BarChart3 },
                { path: '/admin/profile', label: 'Profil', icon: Settings }
            ];
        }

        // Les réviseurs travaillent sur les candidatures de leur établissement.
        if (admin?.role === 'admin' || admin?.role === 'admin_etablissement' || admin?.role === 'reviewer') {
            return [
                ...baseItems,
                { path: '/admin/concours', label: 'Concours', icon: Trophy },
                { path: '/admin/candidats', label: 'Candidatures', icon: Users },
                { path: '/admin/dossiers', label: 'Documents', icon: FileText },
                { path: '/admin/paiements', label: 'Paiements', icon: DollarSign },
                { path: '/admin/messagerie', label: 'Messages', icon: MessageSquare },
                { path: '/admin/notes', label: 'Notes', icon: GraduationCap },
                { path: '/admin/archives', label: 'Archives', icon: Archive },
                { path: '/admin/sous-admins', label: 'Sous-administrateurs', icon: UserCog },
                { path: '/admin/profile', label: 'Profil', icon: Settings }
            ];
        }

        if (admin?.role === 'sub_admin') {
            const role = admin.admin_role;
            const items = [...baseItems];
            if (['applications_manager', 'grades_entry', 'grades_validator'].includes(role)) items.push({ path: '/admin/concours', label: 'Concours', icon: GraduationCap });
            if (role === 'applications_manager') items.push({ path: '/admin/candidats', label: 'Candidatures', icon: Users });
            if (['applications_manager', 'documents_validator', 'documents_viewer'].includes(role)) items.push({ path: '/admin/dossiers', label: 'Documents', icon: FileText });
            if (role === 'grades_entry' || role === 'grades_validator') items.push({ path: '/admin/notes', label: 'Notes', icon: GraduationCap });
            if (role === 'reports_viewer') items.push({ path: '/admin/archives', label: 'Archives', icon: Archive });
            if (role === 'payments_viewer') items.push({ path: '/admin/paiements', label: 'Paiements', icon: DollarSign });
            if (role === 'reports_viewer') items.push({ path: '/admin/statistiques', label: 'Statistiques', icon: BarChart3 });
            if (role === 'messaging_agent') items.push({ path: '/admin/messagerie', label: 'Messages', icon: Settings });
            items.push({ path: '/admin/profile', label: 'Profil', icon: Settings });
            return items;
        }

        return baseItems;
    };

    const menuItems = getMenuItems();

    const isActive = (path: string) => {
        if (path === '/admin/dashboard') {
            return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <AdminLayoutContext.Provider value={true}>
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            {mobileMenuOpen && <button aria-label="Fermer le menu" className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileMenuOpen(false)}/>} 
            <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col shadow-xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shadow-none ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6">
                    <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-foreground">GabConcours Admin</h2><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(false)}><X className="h-5 w-5"/></Button></div>
                    <p className="text-sm text-muted-foreground mt-1">Panel d'administration</p>
                </div>

                <nav className="px-4 pb-4 space-y-1 flex-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${
                                isActive(item.path)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <item.icon className="h-5 w-5"/>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-border">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">
                {admin?.prenom?.charAt(0) || 'A'}
              </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                                {admin?.prenom} {admin?.nom}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {admin?.email}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" className="w-full justify-start" onClick={logout}>
                        <LogOut className="h-4 w-4 mr-2"/>
                        Déconnexion
                    </Button>
                    <Button variant="ghost" className="w-full justify-start mt-2" asChild>
                        <Link to="/">
                            <Home className="h-4 w-4 mr-2"/>
                            Retour au site
                        </Link>
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="min-w-0 flex-1 flex flex-col">
                <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-3">
                    <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Ouvrir le menu"><Menu className="h-5 w-5"/></Button>
                            <div>
                            <h1 className="text-lg font-semibold text-foreground">Administration</h1>
                            <p className="hidden sm:block text-sm text-muted-foreground">
                                {admin?.etablissement_nom || 'Gestion de la plateforme GabConcours'}
                            </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <NotificationBadge />
                            <Button variant="ghost" size="icon" asChild aria-label="Profil administrateur"><Link to="/admin/profile"><UserCircle className="h-5 w-5"/></Link></Button>
                            <Button variant="ghost" size="icon" asChild aria-label="Paramètres"><Link to="/admin/profile"><Settings className="h-5 w-5"/></Link></Button>
                            <Button variant="ghost" size="icon" onClick={logout} aria-label="Déconnexion" className="text-red-600 hover:bg-red-50 hover:text-red-700"><LogOut className="h-5 w-5"/></Button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
                    <div className="mx-auto max-w-[1600px]">{children || <Outlet/>}</div>
                </main>
            </div>
        </div>
        </AdminLayoutContext.Provider>
    );
});

export default AdminLayout;
