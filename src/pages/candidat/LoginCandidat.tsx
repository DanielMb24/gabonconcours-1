import {useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import Layout from '@/components/Layout';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {apiService} from '@/services/api';

export default function LoginCandidat() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [register, setRegister] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const [form, setForm] = useState({identifier: '', password: '', email: '', phone: '', username: '', firstName: '', lastName: '', nipcan: '', code: ''});
    const field = (key: keyof typeof form, label: string, type = 'text', required = true) => <label className="block space-y-2 text-sm font-medium" key={key}>{label}<Input type={type} required={required} value={form[key]} autoComplete={key === 'password' ? (register ? 'new-password' : 'current-password') : key === 'identifier' ? 'username' : undefined} minLength={key === 'password' && register ? 10 : undefined} onChange={e => {setForm({...form, [key]: e.target.value}); if (key === 'email') setVerificationId('');}}/></label>;
    async function submit(e: React.FormEvent) {
        e.preventDefault(); setBusy(true); setError('');
        try {
            const response = await apiService.makeRequest<any>(register ? verificationId ? '/candidate-auth/register' : '/candidate-auth/code' : '/candidate-auth/login', 'POST', {...form, verificationId});
            if (!response.success) throw new Error(response.message);
            if (register && !verificationId) {setVerificationId(response.data.verificationId); return;}
            localStorage.setItem('candidate_token', response.data.token);
            localStorage.setItem('candidat_nipcan', response.data.nipcan);
            const target = params.get('redirect');
            navigate(target?.startsWith('/candidature/') ? target : `/dashboard/${response.data.nipcan}`);
        } catch (error) {setError((error as Error).message || 'Connexion impossible');}
        finally {setBusy(false);}
    }
    return <Layout><div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-2 md:items-center">
        <div className="space-y-5"><p className="text-sm font-semibold uppercase tracking-widest text-primary">Espace candidat</p><h1 className="text-4xl font-bold">Un seul compte pour tous vos concours.</h1><p className="text-muted-foreground">Retrouvez vos candidatures, documents et résultats. Votre NIPCAN conserve vos informations personnelles pour vos prochaines inscriptions.</p><div className="rounded-xl bg-primary/5 p-5 text-sm">Première candidature ? Votre compte et votre mot de passe temporaire seront créés automatiquement en remplissant le formulaire de candidature.</div></div>
        <Card><CardHeader><CardTitle>{register ? 'Récupérer mon compte' : 'Connexion'}</CardTitle></CardHeader><CardContent><Button variant="outline" className="mb-4 w-full" onClick={() => navigate("/concours")}>Faire ma première candidature</Button><form onSubmit={submit} className="space-y-4">
            <fieldset disabled={busy} className="space-y-4">
                {register ? <><div className="grid grid-cols-2 gap-3">{field('firstName', 'Prénom')}{field('lastName', 'Nom')}</div>{field('email', 'Adresse email', 'email')}{field('phone', 'Téléphone (avec indicatif)', 'tel')}{field('username', 'Nom d’utilisateur')}{field('nipcan', 'NIPCAN existant (facultatif)', 'text', false)}</> : field('identifier', 'Email, téléphone ou nom d’utilisateur')}
                {field('password', register ? 'Mot de passe (10 caractères minimum)' : 'Mot de passe', 'password')}
                {register && verificationId && <><p className="text-sm text-green-700">Un code a été envoyé à votre email. Il est valable 10 minutes.</p>{field('code', 'Code de vérification')}</>}
                {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <Button type="submit" className="w-full">{busy ? 'Veuillez patienter…' : register ? verificationId ? 'Vérifier et ouvrir mon compte' : 'Recevoir le code par email' : 'Se connecter'}</Button>
            </fieldset>
            <Button type="button" variant="ghost" disabled={busy} className="h-auto w-full whitespace-normal" onClick={() => {setRegister(!register); setVerificationId(''); setError('');}}>{register ? 'J’ai déjà un compte : me connecter' : 'Activer un ancien NIPCAN / mot de passe oublié'}</Button>
        </form></CardContent></Card>
    </div></Layout>;
}
