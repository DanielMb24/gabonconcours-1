import React, {useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Bell, CheckCircle, XCircle, Clock, Eye, ChevronLeft, ChevronRight, Trash2} from 'lucide-react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {apiService} from '@/services/api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

interface Notification {
    id: number;
    titre: string;
    message: string;
    type: string;
    statut: 'lu' | 'non_lu';
    created_at: string;
}

const NotificationPanel = ({nupcan}: { nupcan: string }) => {
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const {data: notificationsData, isLoading, error} = useQuery({
        queryKey: ['notifications', nupcan],
        queryFn: () => apiService.getCandidateNotifications<Notification[]>(nupcan),
        refetchInterval: 10000,
    });

    const markAsReadMutation = useMutation({
        mutationFn: (id: number) => {
            if (id == null) {
                console.error('ID est null ou undefined');
                return Promise.reject(new Error('ID de notification invalide'));
            }
            return apiService.markNotificationAsRead<null>(String(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['notifications', nupcan]});
        },
    });

    const deleteNotificationMutation = useMutation({
        mutationFn: (id: number) => {
            if (id == null) {
                console.error('ID est null ou undefined');
                return Promise.reject(new Error('ID de notification invalide'));
            }
            return apiService.deleteNotification(String(id));
        },
        onSuccess: (_data, deletedId) => {
            queryClient.invalidateQueries({queryKey: ['notifications', nupcan]});
            setSelectedIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(deletedId);
                return newSet;
            });
        },
    });

    const deleteAllNotificationsMutation = useMutation({
        mutationFn: () => apiService.deleteAllNotifications(nupcan),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['notifications', nupcan]});
            setSelectedIds(new Set());
        },
    });

    const notifications = notificationsData && notificationsData.success && Array.isArray(notificationsData.data)
        ? notificationsData.data
        : [];
    const unreadCount = notifications.filter((n: Notification) => n.statut === 'non_lu').length;

    const filteredNotifications = notifications.filter((n: Notification) => {
        if (filterStatus === 'all') return true;
        return n.statut === filterStatus;
    });

    const notificationsPerPage = 5;
    const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);
    const startIndex = (currentPage - 1) * notificationsPerPage;
    const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + notificationsPerPage);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'document_validation':
                return <CheckCircle className="h-4 w-4 text-green-500"/>;
            case 'document_rejection':
                return <XCircle className="h-4 w-4 text-red-500"/>;
            default:
                return <Bell className="h-4 w-4 text-blue-500"/>;
        }
    };

    const handleMarkAsRead = (id: number) => {
        markAsReadMutation.mutate(id);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleFilterChange = (status: string) => {
        setFilterStatus(status);
        setCurrentPage(1);
    };

    const openModal = (notification: Notification) => {
        setSelectedNotification(notification);
    };

    const closeModal = () => {
        setSelectedNotification(null);
    };

    const handleToggleSelect = (id: number) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleDeleteSelected = () => {
        if (selectedIds.size > 0) {
            selectedIds.forEach((id) => deleteNotificationMutation.mutate(id));
        }
    };

    const handleDeleteAll = () => {
        deleteAllNotificationsMutation.mutate();
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-sm ring-1 ring-slate-200">
            <CardHeader>
                <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center">
                        <Bell className="h-5 w-5 mr-2"/>
                        Notifications
                    </div>
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                            {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <select
                        value={filterStatus}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        className="border rounded p-1"
                    >
                        <option value="all">Tous</option>
                        <option value="lu">Lu</option>
                        <option value="non_lu">Non lu</option>
                    </select>
                    <Button variant="destructive" size="sm" onClick={handleDeleteAll}
                            disabled={notifications.length === 0}>
                        <Trash2 className="h-4 w-4 mr-2"/>
                        Tout supprimer
                    </Button>
                    {selectedIds.size > 0 && (
                        <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                            <Trash2 className="h-4 w-4 mr-2"/>
                            Supprimer sélection ({selectedIds.size})
                        </Button>
                    )}
                </div>
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-8">
                        <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
                        <p className="text-muted-foreground">Aucune notification ou erreur de chargement</p>
                        {error && <p className="text-red-500 text-sm mt-2">Erreur : {error.message}</p>}
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {paginatedNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                                        notification.statut === 'non_lu'
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-gray-50'
                                    }`}
                                    onClick={() => openModal(notification)}
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex min-w-0 flex-1 items-start space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(notification.id)}
                                                onChange={() => handleToggleSelect(notification.id)}
                                                className="mr-2 cursor-pointer"
                                            />
                                            {getNotificationIcon(notification.type)}
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-sm">{notification.titre}</h4>
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-2 flex items-center">
                                                    <Clock className="h-3 w-3 mr-1"/>
                                                    {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            {notification.statut === 'non_lu' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkAsRead(notification.id);
                                                    }}
                                                    disabled={markAsReadMutation.isPending}
                                                >
                                                    <Eye className="h-4 w-4"/>
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotificationMutation.mutate(notification.id);
                                                }}
                                                disabled={deleteNotificationMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-2"/>
                                Précédent
                            </Button>
                            <span>
                Page {currentPage} sur {totalPages}
              </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Suivant
                                <ChevronRight className="h-4 w-4 ml-2"/>
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
            <Dialog open={!!selectedNotification} onOpenChange={closeModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedNotification?.titre}</DialogTitle>
                        <DialogDescription>
                            <p>{selectedNotification?.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                                <Clock className="h-3 w-3 mr-1 inline"/>
                                {selectedNotification?.created_at &&
                                    new Date(selectedNotification.created_at).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                            </p>
                            {selectedNotification?.statut === 'non_lu' && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsRead(selectedNotification.id);
                                        closeModal();
                                    }}
                                    className="mt-4"
                                >
                                    <Eye className="h-4 w-4 mr-2"/> Marquer comme lu
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotificationMutation.mutate(selectedNotification.id);
                                    closeModal();
                                }}
                                className="mt-2"
                            >
                                <Trash2 className="h-4 w-4 mr-2"/> Supprimer
                            </Button>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default NotificationPanel;
