import { useAuth, getLinks, getPageViews } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  TrendingUp,
  Users,
  MousePointer2,
  Eye,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Plus,
  CheckCircle2,
  Circle,
  ArrowRight,
  Palette,
  Share2,
  Loader2 as LucideLoader
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { PageLink } from '@/types/auth';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const data = [
  { name: 'Jan', views: 400, clicks: 240 },
  { name: 'Feb', views: 300, clicks: 139 },
  { name: 'Mar', views: 200, clicks: 980 },
  { name: 'Apr', views: 278, clicks: 390 },
  { name: 'May', views: 189, clicks: 480 },
  { name: 'Jun', views: 239, clicks: 380 },
  { name: 'Jul', views: 349, clicks: 430 },
  { name: 'Aug', views: 320, clicks: 520 },
  { name: 'Sep', views: 450, clicks: 610 },
];

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [links, setLinks] = useState<PageLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [viewHistory, setViewHistory] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  console.log('[Dashboard] Rendering - isLoading:', isLoading, 'user:', user);

  useEffect(() => {
    console.log('[Dashboard useEffect] Triggered - isLoading:', isLoading, 'user:', user ? user.email : 'null');
    if (!isLoading && !user) {
      navigate('/auth');
    }
    if (user) {
      Promise.all([
        getLinks(user.id).catch(e => { console.error(e); return []; }),
        getPageViews(user.id).catch(e => { console.error(e); return []; })
      ]).then(([linksData, viewsData]) => {
        try {
          setLinks(linksData || []);
          setLinksLoading(false);

          // Transform view data for the chart
          const last30Days = Array.from({ length: 30 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            return d.toISOString().split('T')[0];
          });

          const chartDataMap = (viewsData || []).reduce((acc: any, curr: any) => {
            if (curr && curr.view_date) acc[curr.view_date] = curr.count;
            return acc;
          }, {});

          const formattedChartData = last30Days.map(date => {
            let label = date;
            try {
              const d = new Date(date + 'T12:00:00'); // Use noon to avoid TZ issues
              if (!isNaN(d.getTime())) {
                label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
              }
            } catch (e) { }

            return {
              name: label,
              views: chartDataMap[date] || 0,
              clicks: (linksData || []).reduce((sum, link) => sum + ((link && link.clicks) || 0), 0) / 30
            };
          });

          setViewHistory(formattedChartData);
          setStatsLoading(false);
        } catch (err) {
          console.error('Data processing error:', err);
          setLinksLoading(false);
          setStatsLoading(false);
        }
      }).catch(err => {
        console.error('Promise.all error:', err);
        setLinksLoading(false);
        setStatsLoading(false);
      });
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0813]">
        <div className="text-sm text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const totalViewsReal = (viewHistory || []).reduce((sum, day) => sum + ((day && day.views) || 0), 0);
  const totalViewsFormatted = (totalViewsReal || 0).toLocaleString('pt-BR');

  const totalClicksReal = (links || []).reduce((sum, link) => sum + ((link && link.clicks) || 0), 0);
  const totalClicksFormatted = (totalClicksReal || 0).toLocaleString('pt-BR');

  const stats = [
    { title: 'Total de Cliques', value: totalClicksFormatted, change: '+12.5%', trending: 'up', icon: MousePointer2, color: '#8A5CF6' },
    { title: 'Total de Visitas', value: totalViewsFormatted, change: '+6.7%', trending: 'up', icon: Eye, color: '#D946EF' },
    { title: 'Taxa de Retorno', value: '10.3%', change: '-2.4%', trending: 'down', icon: Zap, color: '#F97316' },
  ];

  const nextSteps = [
    {
      id: 1,
      title: 'Personalize sua página',
      description: 'Adicione seus links e informações para começar.',
      status: 'completed',
      icon: Palette,
      link: '/dashboard/settings'
    },
    {
      id: 2,
      title: 'Escolha um modelo',
      description: 'Em breve: selecione templates exclusivos para sua página.',
      status: 'upcoming',
      icon: Zap,
      link: '#'
    },
    {
      id: 3,
      title: 'Compartilhe sua página',
      description: 'Divulgue seu link único nas suas redes sociais.',
      status: 'upcoming',
      icon: Share2,
      link: '#'
    }
  ];

  return (
    <DashboardLayout type="user">
      <div className="space-y-8 pb-10">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-1"
          >
            <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
            <p className="text-muted-foreground text-sm font-medium">Bem-vindo de volta, {(user.name || 'Usuário').split(' ')[0]}!</p>
          </motion.div>
          <div className="flex items-center gap-3">
            <Button className="bg-[#1E1B2E] text-white border border-orange-500/20 hover:bg-[#2A273F] rounded-xl h-11 px-6 font-semibold shadow-sm transition-all hover:border-orange-500/50">
              Exportar PDF
            </Button>
            <Button asChild className="gradient-orange hover:opacity-90 text-white rounded-xl h-11 px-6 font-bold shadow-lg glow-orange transition-all hover:scale-[1.02]">
              <Link to="/dashboard/settings" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Link
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, i) => (
            <Card key={i} className="bg-[#13111C]/50 border-orange-500/20 backdrop-blur-md border overflow-hidden group hover:border-orange-500/40 transition-all duration-300 glow-orange">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                    <stat.icon className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full",
                    stat.trending === 'up' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                  )}>
                    {stat.trending === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {stat.change}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</p>
                  <div className="text-3xl font-bold text-white tracking-tight">{stat.value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart Section */}
        <div className="grid gap-6 lg:grid-cols-7">
          <Card className="lg:col-span-4 bg-[#13111C]/50 border-[#2A273F]/30 backdrop-blur-md rounded-2xl border hover:border-[#8A5CF6]/20 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold text-white">Visualizações do Mês</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{totalViewsFormatted}</span>
                  <span className="text-[11px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">+6.7%</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#1E1B2E] p-1 rounded-xl border border-[#2A273F]/50">
                <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs font-bold px-3 text-muted-foreground hover:text-white">Semanal</Button>
                <Button size="sm" className="h-8 rounded-lg text-xs font-bold px-3 bg-[#13111C] text-white shadow-sm shadow-black/20">Mensal</Button>
              </div>
            </CardHeader>
            <CardContent className="h-[350px] pl-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={viewHistory}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF8C42" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF8C42" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A273F" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#5C5977"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#5C5977"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#13111C', border: '1px solid #2A273F', borderRadius: '12px', color: '#F3F3FB' }}
                    itemStyle={{ color: '#F3F3FB' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#FF6B35"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorViews)"
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#FF8C42"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorClicks)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Side Widgets */}
          <div className="lg:col-span-3 h-full">
            <Card className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 border-none rounded-3xl p-1 shadow-2xl glow-orange-lg relative overflow-hidden group hover:scale-[1.01] transition-transform duration-500 h-full">
              <div className="bg-[#13111C]/90 backdrop-blur-3xl rounded-[22px] h-full p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/5">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-white/90">Estatísticas Rápidas</span>
                  </div>
                  <MoreHorizontal className="h-5 w-5 text-white/50" />
                </div>
                <div className="space-y-1 flex-1">
                  {[
                    { name: 'Página Ativa', val: 'Sim', up: '100%', color: 'text-green-400' },
                    { name: 'Links Criados', val: links.length, up: '', color: 'text-white' },
                    { name: 'Taxa de Cliques', val: '12.4%', up: '+2.1%', color: 'text-purple-400' },
                  ].map((item, id) => (
                    <div key={id} className="flex items-center justify-between text-xs py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors px-2 rounded-lg">
                      <span className="text-white/60 font-medium">{item.name}</span>
                      <div className="flex items-center gap-4">
                        <span className={`font-bold ${item.color}`}>{item.val}</span>
                        {item.up && <span className="text-green-400 font-bold">{item.up}</span>}
                      </div>
                    </div>
                  ))}
                  <div className="mt-8">
                    <Button className="w-full bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 rounded-xl h-12 font-bold transition-all">
                      Ver Analytics Completo
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Próximos Passos Section - Linear Design */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-white">Próximos Passos</h3>
              <p className="text-sm text-muted-foreground font-medium">Conclua a configuração para maximizar seu alcance.</p>
            </div>
          </div>

          <div className="grid gap-4">
            {nextSteps.map((step) => (
              <motion.div
                key={step.id}
                whileHover={{ x: 8 }}
                className="group relative bg-[#13111C]/40 border border-orange-500/20 backdrop-blur-sm rounded-2xl p-5 flex items-center gap-6 transition-all hover:bg-[#13111C]/60 hover:border-orange-500/40 overflow-hidden shadow-sm"
              >
                {/* Number/Icon Badge */}
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-all duration-300",
                  step.status === 'completed'
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-white/5 border border-white/10 group-hover:bg-orange-500/10 group-hover:border-orange-500/30"
                )}>
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                  ) : (
                    <step.icon className="h-6 w-6 text-muted-foreground group-hover:text-orange-400 transition-colors" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <h4 className="font-bold text-white text-lg group-hover:text-orange-400 transition-colors">{step.title}</h4>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{step.description}</p>
                </div>

                {/* Status & CTA */}
                <div className="flex items-center gap-6 pr-2">
                  <span className={cn(
                    "hidden sm:inline-flex text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors",
                    step.status === 'completed'
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-white/5 text-muted-foreground border-white/5 group-hover:border-white/10"
                  )}>
                    {step.status === 'completed' ? 'Concluído' : 'Pendente'}
                  </span>
                  <Link to={step.link}>
                    <div className="h-11 w-11 rounded-xl bg-[#1E1B2E] border border-orange-500/20 flex items-center justify-center hover:bg-orange-500 hover:border-orange-500 transition-all group-hover:shadow-[0_0_15px_rgba(255,107,53,0.3)] group-hover:scale-110 active:scale-95">
                      <ArrowRight className="h-5 w-5 text-white" />
                    </div>
                  </Link>
                </div>

                {/* Left Accent Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-orange-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-all duration-300" />

                {/* Background Shadow Glow */}
                <div className="absolute -inset-x-20 -inset-y-20 bg-orange-500/5 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Performance Links Section */}
        <Card className="bg-[#13111C]/50 border-orange-500/20 backdrop-blur-md rounded-2xl border hover:border-orange-500/30 transition-all duration-500">
          <CardHeader className="flex flex-row items-center justify-between pb-6">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold text-white">Performance dos Links</CardTitle>
              <CardDescription className="text-muted-foreground font-medium">Seus links mais clicados nos últimos 30 dias.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {linksLoading ? (
              <div className="flex justify-center p-12"><LucideLoader className="animate-spin h-10 w-10 text-[#8A5CF6]/50" /></div>
            ) : links.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {links.slice(0, 4).map((link, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-orange-500/10 group cursor-pointer hover:bg-orange-500/10 hover:border-orange-500/20 transition-all duration-300">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-[#1E1B2E] flex items-center justify-center border border-orange-500/20 group-hover:border-orange-500/40 transition-all duration-300 group-hover:scale-105">
                        <MousePointer2 className="h-7 w-7 text-orange-500" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">{link.label || 'Sem título'}</p>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{link.type}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="text-xl font-bold text-white tracking-tight">{link.clicks || 0}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Cliques</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center border border-white/5">
                  <Zap className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-bold text-white">Nenhum link ativo</p>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium">Você ainda não tem links cadastrados. Comece agora para ver seus dados de performance!</p>
                </div>
                <Button asChild className="gradient-orange hover:opacity-90 text-white rounded-2xl h-14 px-8 font-bold shadow-lg glow-orange transition-all hover:scale-105">
                  <Link to="/dashboard/settings" className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Criar meu primeiro link
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
