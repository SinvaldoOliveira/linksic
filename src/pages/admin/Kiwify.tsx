import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

type WebhookLog = {
  id: string;
  created_at: string;
  email: string;
  evento: string;
  plano_aplicado: string;
};

const AdminKiwify = () => {
  const [email, setEmail] = useState('');
  const [evento, setEvento] = useState('assinatura.renovada');
  const [produto, setProduto] = useState('Plano Pro');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const { toast } = useToast();

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }
      setLogs(data as WebhookLog[]);
    } catch (error: any) {
      toast({
        title: 'Erro ao buscar logs',
        description: error.message || 'Ocorreu um erro ao buscar os logs de webhooks.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);


  const handleSimulate = async () => {
    if (!email) {
      toast({
        title: 'Erro',
        description: 'O campo de e-mail é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('simulate-webhook', {
        body: { email, evento, produto },
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Sucesso!',
        description: `Webhook simulado para ${email} com o evento ${evento}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro na Simulação',
        description: error.message || 'Ocorreu um erro ao simular o webhook.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Kiwify</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Simulador de Webhooks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do Cliente</Label>
            <Input
              id="email"
              type="email"
              placeholder="cliente@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="evento">Evento</Label>
            <Select value={evento} onValueChange={setEvento}>
              <SelectTrigger id="evento">
                <SelectValue placeholder="Selecione o evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assinatura.renovada">Assinatura Renovada</SelectItem>
                <SelectItem value="assinatura.cancelada">Assinatura Cancelada</SelectItem>
                <SelectItem value="assinatura.atrasada">Assinatura Atrasada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="produto">Produto</Label>
            <Select value={produto} onValueChange={setProduto}>
              <SelectTrigger id="produto">
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Plano Pro">Plano Pro</SelectItem>
                <SelectItem value="Plano Master">Plano Master</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSimulate} disabled={isLoading}>
            {isLoading ? 'Simulando...' : 'Simular Webhook'}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Últimos Logs de Webhooks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <p>Carregando logs...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Plano Aplicado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                    <TableCell>{log.email}</TableCell>
                    <TableCell>{log.evento}</TableCell>
                    <TableCell>{log.plano_aplicado}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminKiwify;
