import { useParams } from 'react-router-dom';
import { getUserPage } from '@/contexts/AuthContext';
import { User } from 'lucide-react';

export default function UserPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  
  // Find user by slug
  const users = localStorage.getItem('users');
  let userData = null;
  
  if (users) {
    const parsed = JSON.parse(users);
    const userEntry = Object.values(parsed).find((u: any) => u.user.pageSlug === slug);
    if (userEntry) {
      userData = (userEntry as any).user;
    }
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <div className="text-center">
          <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h1 className="text-2xl font-bold">Página não encontrada</h1>
          <p className="text-muted-foreground mt-2">Esta página não existe ou foi removida.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-primary">
            {userData.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <h1 className="text-2xl font-bold">{userData.name}</h1>
        <p className="text-muted-foreground mt-1">@{userData.pageSlug}</p>
        
        <div className="mt-8 space-y-3">
          <div className="h-14 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground">
            Em breve...
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-12">
          Criado com PageBuilder
        </p>
      </div>
    </div>
  );
}
