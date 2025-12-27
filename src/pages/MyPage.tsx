import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function MyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const fullUrl = `${window.location.origin}/u/${user.pageSlug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast({ title: 'Copiado!', description: 'URL copiada para a área de transferência' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout type="user">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Minha Página</h2>
          <p className="text-muted-foreground">Gerencie sua página pública personalizada.</p>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>URL da Sua Página</CardTitle>
            <CardDescription>Compartilhe este link para que as pessoas vejam sua página</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/50 rounded-lg p-3 font-mono text-sm truncate">
                {fullUrl}
              </div>
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href={`/u/${user.pageSlug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Prévia da Página</CardTitle>
            <CardDescription>Assim sua página aparece para os visitantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-border/50 rounded-xl p-8 bg-gradient-to-br from-muted/30 to-muted/10 min-h-[300px] flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-bold">{user.name}</h3>
              <p className="text-muted-foreground text-sm mt-1">@{user.pageSlug}</p>
              
              <div className="mt-8 space-y-3 w-full max-w-xs">
                <div className="h-12 rounded-lg bg-muted/50 border border-dashed border-border/50 flex items-center justify-center text-xs text-muted-foreground">
                  Botão 1 (em breve)
                </div>
                <div className="h-12 rounded-lg bg-muted/50 border border-dashed border-border/50 flex items-center justify-center text-xs text-muted-foreground">
                  Botão 2 (em breve)
                </div>
                <div className="h-12 rounded-lg bg-muted/50 border border-dashed border-border/50 flex items-center justify-center text-xs text-muted-foreground">
                  Botão 3 (em breve)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary text-lg">✨</span>
              </div>
              <div>
                <h4 className="font-semibold">Editor Visual em Breve</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Em breve você poderá personalizar sua página com um editor visual completo, 
                  adicionar links, escolher templates e muito mais!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
