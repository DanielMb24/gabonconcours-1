import {useQuery} from '@tanstack/react-query';
import {Archive, Download, Eye, Search} from 'lucide-react';
import {useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {apiService, API_ORIGIN} from '@/services/api';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';

export default function Archives(){
  const navigate=useNavigate(); const [search,setSearch]=useState('');
  const {data=[],isLoading}=useQuery({queryKey:['admin-archives'],queryFn:async()=>{const response=await apiService.get<any[]>('/admin/archives');return response.data||[];}});
  const filtered=useMemo(()=>data.filter(item=>`${item.libcnc} ${item.etablissement_nom}`.toLowerCase().includes(search.toLowerCase())),[data,search]);
  const downloadAll=(id:string)=>window.open(`${API_ORIGIN}/admin/reports/contests/${id}/transcripts.pdf`,'_blank');
  return <div className="space-y-6"><div><h1 className="flex items-center gap-3 text-3xl font-bold"><Archive className="h-8 w-8 text-primary"/>Archives</h1><p className="text-muted-foreground">Les concours clôturés et leurs candidatures sont conservés en lecture seule.</p></div><div className="relative max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input className="pl-9" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Rechercher un concours…"/></div>{isLoading?<p>Chargement des archives…</p>:<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(item=><Card key={item.id}><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle className="text-lg">{item.libcnc}</CardTitle><Badge variant="secondary">Lecture seule</Badge></div></CardHeader><CardContent className="space-y-4"><div className="text-sm text-muted-foreground"><p>{item.etablissement_nom}</p><p>Clôturé le {item.fincnc?new Date(item.fincnc).toLocaleDateString('fr-FR'):'—'}</p><p>{item.total_candidatures||0} candidature(s)</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={()=>navigate(`/admin/concours?contest=${item.id}`)}><Eye className="mr-2 h-4 w-4"/>Consulter</Button><Button size="sm" onClick={()=>downloadAll(item.id)}><Download className="mr-2 h-4 w-4"/>Relevés PDF</Button></div></CardContent></Card>)}</div>}</div>;
}
