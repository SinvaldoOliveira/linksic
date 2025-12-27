import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { LayoutDashboard, FileText, Settings, LogOut, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface DashboardLayoutProps {
  children: ReactNode;
  type: 'user' | 'admin';
}

const userMenuItems = [
  { title: 'Visão Geral', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Minha Página', url: '/dashboard/my-page', icon: FileText },
  { title: 'Configurações', url: '/dashboard/settings', icon: Settings },
];

const adminMenuItems = [
  { title: 'Visão Geral', url: '/admin', icon: LayoutDashboard },
  { title: 'Usuários', url: '/admin/users', icon: Users },
];

export function DashboardLayout({ children, type }: DashboardLayoutProps) {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const menuItems = type === 'admin' ? adminMenuItems : userMenuItems;

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
    if (!isLoading && user) {
      if (type === 'admin' && user.role !== 'admin') {
        navigate('/dashboard');
      }
      if (type === 'user' && user.role === 'admin') {
        navigate('/admin');
      }
    }
  }, [user, isLoading, navigate, type]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <Sidebar className="border-r border-border/50">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                {type === 'admin' ? (
                  <Shield className="h-5 w-5 text-primary" />
                ) : (
                  <span className="text-lg font-bold text-primary">P</span>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-sm">{type === 'admin' ? 'Admin' : 'PageBuilder'}</h2>
                <p className="text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          end={item.url === '/dashboard' || item.url === '/admin'}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          activeClassName="bg-primary/10 text-primary font-medium"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <div className="mt-auto p-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50 px-6 py-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-lg font-semibold">
                {type === 'admin' ? 'Painel Administrativo' : 'Dashboard'}
              </h1>
            </div>
          </header>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
