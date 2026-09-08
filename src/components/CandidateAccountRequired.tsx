import {useQuery} from '@tanstack/react-query';
import {Navigate, useLocation} from 'react-router-dom';
import {apiService} from '@/services/api';
export default function CandidateAccountRequired({children}: {children: React.ReactNode}) {
    const location = useLocation();
    const token = localStorage.getItem('candidate_token');
    const {data, isLoading} = useQuery({queryKey: ['candidate-session', token], enabled: !!token, retry: false, queryFn: async () => {const response = await apiService.makeRequest('/candidate-auth/me', 'GET'); if (!response.success) throw new Error(response.message); return response.data;}});
    if (token && isLoading) return <p className="p-8">Vérification du compte…</p>;
    if (!token || !data) return <Navigate replace to={`/connexion?redirect=${encodeURIComponent(location.pathname)}`}/>;
    return <>{children}</>;
}
