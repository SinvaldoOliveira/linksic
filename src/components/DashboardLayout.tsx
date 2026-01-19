import { ReactNode, useEffect, useState } from 'react';
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
import { LayoutDashboard, FileText, Settings, LogOut, Users, Shield, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { InstallPrompt } from '@/components/InstallPrompt';
import { ProPlansModal } from '@/components/ProPlansModal';

interface DashboardLayoutProps {
  children: ReactNode;
  type: 'user' | 'admin' | 'super';
}

const userMenuItems = [
  { title: 'Visão Geral', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Configurações', url: '/dashboard/settings', icon: Settings },
];

const adminBaseMenuItems = [
  { title: 'Visão Geral', url: '/admin', icon: LayoutDashboard },
  { title: 'Usuários', url: '/admin/users', icon: Users },
  { title: 'Afiliados', url: '/admin/affiliates', icon: Heart },
];

export function DashboardLayout({ children, type }: DashboardLayoutProps) {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showProPlansModal, setShowProPlansModal] = useState(false);
  const isSuperAdmin = !!user && (user.role === 'super_admin' || user.email === 'sinvaldo.p.oliveira@gmail.com');
  const isAdminRole = !!user && (user.role === 'admin' || isSuperAdmin);
  const isFreeUser = !!user && (!user.plan_type || user.plan_type === 'free');
  const menuItems = (() => {
    if (type === 'admin' || type === 'super') {
      const items = [...adminBaseMenuItems];
      if (user?.role === 'super_admin') {
        items.push({ title: 'Super Admin', url: '/admin/super', icon: Shield });
      }
      return items;
    }
    return userMenuItems;
  })();

  useEffect(() => {
    const path = window.location.pathname;
    console.log('[DashboardLayout] Auth State Check:', {
      isLoading,
      hasUser: !!user,
      userEmail: user?.email,
      path,
      type
    });

    if (!isLoading) {
      if (!user) {
        if (path !== '/auth' && path !== '/' && !path.startsWith('/u/')) {
          console.log('[DashboardLayout] No user found, redirecting to /auth from:', path);
          navigate('/auth');
        }
      } else {
        const isUserPath = path.startsWith('/dashboard');
        const isAdminPath = path.startsWith('/admin');

        if (isAdminPath && !isAdminRole) {
          console.warn('[DashboardLayout] Unauthorized access to admin path. Redirecting to /dashboard');
          navigate('/dashboard');
        } else if (isUserPath && isAdminRole && path === '/dashboard') {
          // If admin lands on plain /dashboard, maybe they want the admin panel
          // But we don't force it to avoid loops
          console.log('[DashboardLayout] Admin on user dashboard');
        }
      }
    }
  }, [user, isLoading, navigate, type, isAdminRole]);

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Redirecionando...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <Sidebar className="border-r border-border/50">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                {type === 'admin' ? (
                  <Shield className="h-5 w-5 text-primary" />
                ) : (
                  <img
                    src="/logo.png"
                    alt="Mylinksss Logo"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-sm">{type === 'admin' ? 'Admin' : type === 'super' ? 'Super Admin' : 'Mylinksss'}</h2>
                <p className="text-xs text-muted-foreground truncate max-w-[120px]">{user?.email || 'N/A'}</p>
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

          <div className="mt-auto">
            <div className="p-4">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>

            {/* Pro Upgrade Banner - Only for free users */}
            {isFreeUser && type === 'user' && (
              <div className="p-4 pt-0">
                <div
                  className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-2xl p-6 cursor-pointer overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => setShowProPlansModal(true)}
                >
                  {/* Background decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12" />

                  <div className="relative z-10">
                    <div className="mb-4">
                      <div className="text-white text-sm font-medium mb-1">my</div>
                      <div className="text-white text-2xl font-bold">linksss.com</div>
                      <div className="text-white/90 text-xs mt-1">Sua bio link personalizada</div>
                    </div>

                    <h3 className="text-white text-xl font-bold mb-2">Seja Pró</h3>

                    <Button
                      className="w-full bg-white text-orange-600 hover:bg-white/90 font-semibold rounded-xl shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowProPlansModal(true);
                      }}
                    >
                      Assinar agora
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-lg font-semibold">
                {type === 'admin' ? 'Painel Administrativo' : type === 'super' ? 'Super Admin' : 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <InstallPrompt />
              <ThemeToggle />
            </div>
          </header>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      <ProPlansModal
        isOpen={showProPlansModal}
        onClose={() => setShowProPlansModal(false)}
      />
    </SidebarProvider>
  );
}
