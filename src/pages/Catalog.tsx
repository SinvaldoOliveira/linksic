import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, MapPin, Users, MessageCircle, ExternalLink, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Catalog() {
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;

    // Filters
    const [search, setSearch] = useState('');
    const [city, setCity] = useState('all');
    const [affiliateSlug, setAffiliateSlug] = useState('all');

    // Options
    const [cities, setCities] = useState<string[]>([]);
    const [affiliates, setAffiliates] = useState<any[]>([]);

    useEffect(() => {
        const fetchFilters = async () => {
            // Fetch unique cities from profiles
            const { data: cityData } = await supabase.from('profiles').select('city').not('city', 'is', null);
            if (cityData) {
                const uniqueCities = Array.from(new Set(cityData.map(c => c.city))).filter(Boolean) as string[];
                setCities(uniqueCities.sort());
            }

            // Fetch active affiliates
            const { data: affData } = await supabase.from('affiliates').select('name, slug').eq('status', 'active');
            if (affData) setAffiliates(affData);
        };
        fetchFilters();
    }, []);

    const fetchProfiles = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.rpc('search_catalog', {
                p_search: search || null,
                p_city: city === 'all' ? null : city,
                p_affiliate_slug: affiliateSlug === 'all' ? null : affiliateSlug,
                p_limit: ITEMS_PER_PAGE,
                p_offset: (currentPage - 1) * ITEMS_PER_PAGE
            });

            if (error) throw error;
            setProfiles(data || []);
            setTotalCount(data?.[0]?.total_count || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage, city, affiliateSlug]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchProfiles();
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-orange-500/30">
            {/* Header Section */}
            <section className="pt-20 pb-10">
                <div className="container mx-auto px-6">
                    <div className="w-full bg-gradient-to-r from-orange-500/20 to-black border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-orange-500/20 transition-all duration-700" />
                        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10 justify-between">
                            <div className="flex-1 text-center md:text-left">
                                <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 mb-4 px-3 py-1 font-semibold uppercase tracking-wider text-[10px]">Catálogo MyLinksss</Badge>
                                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white leading-tight">
                                    Encontre o que você precisa na <span className="text-orange-500">melhor comunidade</span> de empreendedores da cidade!
                                </h1>
                                <p className="text-gray-400 text-lg max-w-xl leading-relaxed">
                                    Conheça profissionais, compare perfis e conecte-se com os melhores talentos da nossa rede exclusiva.
                                </p>
                            </div>
                            <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-14 px-10 rounded-2xl shadow-2xl shadow-orange-500/20 transition-all hover:scale-105" onClick={() => navigate('/cadastro')}>
                                Quero aparecer aqui
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Filter Sticky Bar */}
            <section className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-md border-y border-white/5 py-4 shadow-2xl">
                <div className="container mx-auto px-6">
                    <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <Input
                                placeholder="Buscar por nome ou nicho..."
                                className="pl-10 h-11 bg-white/5 border-white/10 text-white focus:border-orange-500 transition-colors"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="w-full lg:w-48">
                                <Select value={city} onValueChange={(val) => { setCity(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-11 bg-white/5 border-white/10 hover:border-white/20 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <SelectValue placeholder="Cidade" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#121212] border-white/10 text-white">
                                        <SelectItem value="all">Todas as cidades</SelectItem>
                                        {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full lg:w-56">
                                <Select value={affiliateSlug} onValueChange={(val) => { setAffiliateSlug(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-11 bg-white/5 border-white/10 hover:border-white/20 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            <SelectValue placeholder="Influenciador" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#121212] border-white/10 text-white">
                                        <SelectItem value="all">Filtro por Afiliado</SelectItem>
                                        {affiliates.map(a => <SelectItem key={a.slug} value={a.slug}>{a.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button type="submit" className="h-11 bg-white/10 hover:bg-white/20 text-white px-8 font-semibold">Pesquisar</Button>
                    </form>
                </div>
            </section>

            {/* Profile Grid */}
            <section className="py-12">
                <div className="container mx-auto px-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
                            <p className="text-gray-500 animate-pulse">Consultando base de dados...</p>
                        </div>
                    ) : profiles.length === 0 ? (
                        <div className="text-center py-32 border border-white/5 rounded-3xl bg-white/5 max-w-4xl mx-auto">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-10 h-10 text-gray-700" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Nenhum perfil disponível</h3>
                            <p className="text-gray-500">Tente buscar por outro termo ou cidade.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {profiles.map(item => (
                                <Card key={item.id} className="bg-[#121212] border-white/5 overflow-hidden group hover:border-orange-500/30 transition-all duration-300 flex flex-col h-full shadow-lg">
                                    <div className="h-28 bg-gradient-to-br from-gray-800 to-black relative flex-shrink-0">
                                        {item.banner_image && (
                                            <img src={item.banner_image} className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" alt="" />
                                        )}
                                        {item.plan_type === 'pro' && (
                                            <div className="absolute top-3 right-3">
                                                <Badge className="bg-orange-500 text-white border-0 shadow-lg"><Star className="w-3 h-3 mr-1 fill-white" /> Pro</Badge>
                                            </div>
                                        )}
                                    </div>
                                    <CardContent className="p-6 pt-0 relative flex flex-col flex-1">
                                        <div className="flex items-start gap-4 -mt-8 mb-4">
                                            <div className="w-16 h-16 rounded-full border-4 border-[#121212] bg-[#1a1a1a] overflow-hidden shadow-2xl z-10">
                                                {item.profile_photo ? (
                                                    <img src={item.profile_photo} className="w-full h-full object-cover" alt={item.name} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xl uppercase">
                                                        {item.name?.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="pt-9 flex-1 min-w-0">
                                                <h3 className="font-bold text-lg truncate text-white leading-tight">{item.name}</h3>
                                                <p className="text-[10px] text-orange-500 font-bold truncate tracking-widest uppercase">/u/{item.page_slug}</p>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-400 line-clamp-3 min-h-[3rem] mb-6 leading-relaxed">
                                            {item.bio || 'Empreendedor visionário focado em resultados e conexões.'}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 mb-6 mt-auto">
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5">
                                                <MapPin className="w-3 h-3" /> {item.city || 'Nacional'}
                                            </div>
                                            {item.affiliate_name && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-orange-500/10 text-orange-400">
                                                    <Users className="w-3 h-3" /> {item.affiliate_name}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <Button variant="outline" className="border-white/10 hover:border-white/30 hover:bg-white/5 text-[11px] font-semibold text-white h-10" asChild>
                                                <a href={`/u/${item.page_slug}`} target="_blank" rel="noopener">
                                                    Visitar <ExternalLink className="ml-2 w-3 h-3" />
                                                </a>
                                            </Button>
                                            <Button className="bg-orange-500/10 hover:bg-orange-500 hover:text-white text-orange-500 border-0 text-[11px] font-semibold flex items-center gap-2 h-10 transition-colors">
                                                WhatsApp <MessageCircle className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Pagination Bar */}
                    {!loading && totalCount > ITEMS_PER_PAGE && (
                        <div className="flex items-center justify-center gap-6 mt-16 pb-20">
                            <Button
                                variant="ghost"
                                className="text-gray-400 hover:text-white"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                <ChevronLeft className="w-5 h-5 mr-2" /> Anterior
                            </Button>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-orange-500">{currentPage}</span>
                                <span className="text-gray-600"> de </span>
                                <span className="text-gray-400">{Math.ceil(totalCount / ITEMS_PER_PAGE)}</span>
                            </div>
                            <Button
                                variant="ghost"
                                className="text-gray-400 hover:text-white"
                                disabled={currentPage >= Math.ceil(totalCount / ITEMS_PER_PAGE)}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                Próximo <ChevronRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* Footer Upgrade Prompt */}
            {!loading && profiles.length > 0 && (
                <section className="py-20 border-t border-white/5">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="text-3xl font-bold mb-4">Gostaria de aparecer em destaque?</h2>
                        <p className="text-gray-500 mb-8">Torne-se um membro Pró e tenha prioridade no catálogo e em todas as buscas.</p>
                        <Button className="bg-white text-black hover:bg-gray-200 font-bold px-12 h-14 rounded-2xl" onClick={() => navigate('/dashboard/settings')}>
                            Fazer Upgrade Agora
                        </Button>
                    </div>
                </section>
            )}
        </div>
    );
}
