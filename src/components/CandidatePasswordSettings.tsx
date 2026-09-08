import {useState} from 'react';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {apiService} from '@/services/api';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
export default function CandidatePasswordSettings() {
    const cache = useQueryClient();
    const [currentPassword,setCurrent] = useState('');
    const [password,setPassword] = useState('');
    const [confirmation,setConfirmation] = useState('');
    const [message,setMessage] = useState('');
    const [busy,setBusy] = useState(false);
    const {data} = useQuery({queryKey:['candidate-password-status'],queryFn:async()=> (await apiService.makeRequest<{mustChangePassword:boolean}>('/candidate-auth/me','GET')).data});
    async function submit(e:React.FormEvent) {
        e.preventDefault();setMessage('');
        if(password!==confirmation){setMessage('Les mots de passe ne correspondent pas.');return;}
        setBusy(true);
        try {const response=await apiService.makeRequest('/candidate-auth/password','PUT',{currentPassword,password});if(!response.success)throw new Error(response.message);setCurrent('');setPassword('');setConfirmation('');sessionStorage.removeItem('candidate_initial_credentials');setMessage('Mot de passe modifié.');await cache.invalidateQueries({queryKey:['candidate-password-status']});}
        catch(error){setMessage((error as Error).message);}finally{setBusy(false);}
    }
    return <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-6"><h3 className="font-semibold">Modifier mon mot de passe</h3>{data?.mustChangePassword && <p className="text-amber-700">Vous utilisez encore votre mot de passe temporaire. Choisissez votre mot de passe personnel.</p>}<label className="block">Mot de passe actuel<Input required type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrent(e.target.value)}/></label><label className="block">Nouveau mot de passe<Input required minLength={10} type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label className="block">Confirmer le mot de passe<Input required minLength={10} type="password" autoComplete="new-password" value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>{message&&<p role="status">{message}</p>}<Button disabled={busy}>{busy?'Enregistrement…':'Modifier mon mot de passe'}</Button></form>;
}
