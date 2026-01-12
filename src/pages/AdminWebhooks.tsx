import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function AdminWebhooks() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [evento, setEvento] = useState('assinatura renovada');
  const [produto, setProduto] = useState('Pro');
  const [logs, setLogs] = useState<any[]>([]);
  const endpointUrl = `${window.location.origin}/api/webhooks/kiwify`;

  const loadLogs = async () => {
    const { data } = await supabase
      .from('webhook_logs')
      .select('created_at, email, evento')
      .order('created_at', { ascending: false })
      .limit(10);
    setLogs(data || []);
  };

  useEffect(() => { loadLogs(); }, []);

  const simulate = async () => {
    try {
      const body = { email, evento, produto, token: '24y0ovdwa2e' };
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Falha na simulação');
      toast({ title: 'Webhook simulado', description: 'Plano atualizado conforme regras' });
      await loadLogs();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Simulador de Webhooks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm">Endpoint</label>
              <div className="flex gap-2">
                <Input value={endpointUrl} readOnly />
                <Button onClick={() => { navigator.clipboard.writeText(endpointUrl); toast({ title: 'Copiado' }); }}>Copiar</Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@exemplo.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Evento</label>
              <Select value={evento} onValueChange={setEvento}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="assinatura cancelada">assinatura cancelada</SelectItem>
                  <SelectItem value="assinatura renovada">assinatura renovada</SelectItem>
                  <SelectItem value="assinatura atrasada">assinatura atrasada</SelectItem>
                  <SelectItem value="assinatura aprovada">assinatura aprovada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm">Produto</label>
              <Select value={produto} onValueChange={setProduto}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                  <SelectItem value="Master">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={simulate}>Simular Webhook</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 text-sm font-medium">
              <div>Data/Hora</div>
              <div>Email</div>
              <div>Evento recebido</div>
              <div>Plano aplicado</div>
            </div>
            <div className="mt-2 space-y-2">
              {logs.map((l, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 text-sm">
                  <div>{new Date(l.created_at).toLocaleString()}</div>
                  <div>{l.email}</div>
                  <div>{l.evento}</div>
                  <div>-</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
