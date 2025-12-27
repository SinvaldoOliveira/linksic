import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/DashboardLayout';
import { FileText, ExternalLink, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const pageUrl = `/u/${user.pageSlug}`;

  return (
    <DashboardLayout type="user">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Olá, {user.name}!</h2>
          <p className="text-muted-foreground">Bem-vindo ao seu painel de controle.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Minha Página</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">Ativa</div>
              <p className="text-xs text-muted-foreground mt-1">
                Página pública configurada
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">URL Pública</CardTitle>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-mono bg-muted/50 p-2 rounded truncate">
                {pageUrl}
              </div>
              <Link to={pageUrl} target="_blank">
                <Button variant="link" className="p-0 h-auto mt-2 text-xs">
                  Visualizar página →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membro Desde</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(user.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(user.createdAt).getFullYear()}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
            <CardDescription>Complete a configuração da sua página</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">1</div>
                <div>
                  <p className="font-medium text-sm">Personalize sua página</p>
                  <p className="text-xs text-muted-foreground">Adicione seus links e informações</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 opacity-60">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm">2</div>
                <div>
                  <p className="font-medium text-sm">Escolha um template</p>
                  <p className="text-xs text-muted-foreground">Em breve</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 opacity-60">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm">3</div>
                <div>
                  <p className="font-medium text-sm">Compartilhe sua página</p>
                  <p className="text-xs text-muted-foreground">Em breve</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
