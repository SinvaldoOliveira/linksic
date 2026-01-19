import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, Star, Heart, CheckCircle2, User, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FormattedText } from '@/components/FormattedText';

//--- Data Interfaces ---
interface PageConfig {
    profilePhoto?: string;
    headerImage?: string;
    bio?: string;
    links?: any[];
    colorPalette?: any;
    companyName?: string;
    jobTitle?: string;
    location?: string;
    displayOnClub?: boolean;
}


interface PageData {
    user_id: string;
    user_name: string;
    config: PageConfig;
    // New fields from catalog_visible_profiles
    affiliate_slug?: string | null;
    affiliate_name?: string | null;
    profiles: {
        page_slug: string;
        role?: string;
        plan_type?: string;
        city?: string;
        referrals?: {
            affiliates?: {
                slug?: string;
                name?: string;
                type?: string;
            } | null;
        }[];
    };
}

const ClubMyLinksss = () => {
    const [creators, setCreators] = useState<PageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [allAffiliates, setAllAffiliates] = useState<Array<{ name: string, type: string, photo_url?: string }>>([]);


    // New Filters
    const [filterLocation, setFilterLocation] = useState('all');
    const [filterInfluencer, setFilterInfluencer] = useState('all');
    const [filterGroup, setFilterGroup] = useState('all');

    // Derived lists for dropdowns
    const locations = Array.from(new Set(creators.map(c => c.profiles?.city || c.config?.location).filter(Boolean))).sort();

    // Extract Influencers - from allAffiliates (populated from db)
    const influencers = Array.from(new Set(
        allAffiliates
            .filter(a => a.type === 'influencer')
            .map(a => a.name)
    )).sort();

    // Extract Groups - companyName from creators
    const groups = Array.from(new Set(
        creators
            .map(c => c.config?.companyName)
            .filter(Boolean)
    )).sort();

    // Função para limpar todos os filtros
    const clearAllFilters = () => {
        setFilterLocation('all');
        setFilterInfluencer('all');
        setFilterGroup('all');
    };

    // Filter Logic with Try-Catch safety
    const filteredCreators = creators.filter(creator => {
        try {
            // Location Filter
            if (filterLocation !== 'all') {
                const loc = creator.profiles?.city || creator.config?.location;
                if (!loc || loc !== filterLocation) return false;
            }

            // Influencer Filter - Use affiliate_name from catalog_visible_profiles
            if (filterInfluencer !== 'all') {
                if (creator.affiliate_name !== filterInfluencer) return false;
            }

            // Group Filter
            if (filterGroup !== 'all') {
                if (creator.config?.companyName !== filterGroup) return false;
            }

            return true;
        } catch (e) {
            console.error('Filter error for creator:', creator.user_name, e);
            return false;
        }
    });


    // Data fetching logic continues below...


    const [partnerPhotos, setPartnerPhotos] = useState<Record<string, string>>({});

    useEffect(() => {
        async function fetchCreators() {
            try {
                setLoading(true);

                // 1. Fetch affiliates for the dropdown and sidebar
                const { data: affiliatesData } = await supabase
                    .from('affiliates')
                    .select('name, type, photo_url')
                    .eq('status', 'active');

                if (affiliatesData) {
                    setAllAffiliates(affiliatesData);

                    // Fetch photos for influencers if they have a user profile with the same name
                    const influencerNames = affiliatesData
                        .filter(a => a.type === 'influencer')
                        .map(a => a.name);

                    if (influencerNames.length > 0) {
                        const { data: photoData } = await supabase
                            .from('pages')
                            .select('user_name, config')
                            .in('user_name', influencerNames);

                        if (photoData) {
                            const photosMap: Record<string, string> = {};
                            photoData.forEach((p: any) => {
                                if (p.config?.profilePhoto) {
                                    photosMap[p.user_name] = p.config.profilePhoto;
                                }
                            });
                            setPartnerPhotos(photosMap);
                        }
                    }
                }

                // 2. Fetch authoritative list from catalog_visible_profiles
                // This view contains the correct affiliate links as requested
                const { data: visibleProfiles, error: visibleError } = await supabase
                    .from('catalog_visible_profiles')
                    .select('*');

                if (visibleError) {
                    console.error('Error fetching visible profiles:', visibleError);
                    return;
                }

                if (!visibleProfiles || visibleProfiles.length === 0) {
                    setCreators([]);
                    return;
                }

                // Get IDs to fetch details
                // Note: The view column is 'id', which corresponds to profile/user id
                const userIds = visibleProfiles.map(p => p.id);

                // 3. Fetch detailed page data for these users
                const { data: pagesData, error: pagesError } = await supabase
                    .from('pages')
                    .select(`
                        user_id,
                        user_name,
                        config,
                        profiles:user_id (
                            page_slug,
                            role,
                            plan_type,
                            city
                        )
                    `)
                    .in('user_id', userIds);

                if (pagesError) {
                    console.error('Error fetching pages:', pagesError);
                    return;
                }

                if (pagesData) {
                    // 4. Merge data
                    // We map over pagesData and find the corresponding info from visibleProfiles
                    const mergedData: PageData[] = pagesData.map((page: any) => {
                        const viewData = visibleProfiles.find(vp => vp.id === page.user_id);
                        return {
                            ...page,
                            // Add affiliate info from the view
                            affiliate_slug: viewData?.affiliate_slug || null,
                            affiliate_name: viewData?.affiliate_name || null,
                            // Ensure profiles object exists and has consistent structure
                            profiles: {
                                ...page.profiles,
                                referrals: [] // We don't need this deep nested structure anymore for tags
                            }
                        };
                    });

                    // Filter creators who have authorized display in config
                    // (Assuming filtering by displayOnClub is still desired on top of the view, 
                    // or if the view already handles it. The user request implies the view is the source of truth for visibility too,
                    // but usually config.displayOnClub is a user setting. Let's keep it safe.)
                    const finalData = mergedData.filter(item => item.config?.displayOnClub === true);

                    setCreators(finalData);
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchCreators();
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-orange-500/30">
            {/* Navbar Minimalista */}
            <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Club My Linksss</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                        <a href="#" className="hover:text-white transition-colors">Início</a>
                        <a href="#" className="text-white">Comunidade</a>
                        <a href="#" className="hover:text-white transition-colors">Criadores</a>
                        <a href="#" className="hover:text-white transition-colors">Contato</a>
                    </div>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-full px-6">
                        Começar agora
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <section
                className="pt-32 pb-20 relative overflow-hidden bg-cover bg-center min-h-[600px] flex items-center justify-center"
                style={{ backgroundImage: 'url("/hero-eucurtir.png")' }}
            >
                <div className="absolute inset-0 bg-black/50 md:bg-black/30" /> {/* Overlay for readability */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] -z-10" />

                <div className="container mx-auto px-6 text-center relative z-10">

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 mb-8">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Mais de {creators.length > 0 ? creators.length : 500} empreendedores ativos
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white drop-shadow-md">
                        Conecte-se com <br />
                        <span className="text-orange-500">empreendedores incríveis</span>
                    </h1>

                    <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow-sm">
                        Descubra talentos, encontre oportunidades e faça parte da maior comunidade de empreendedores do Brasil.
                    </p>

                    <Button className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white text-lg rounded-full shadow-lg shadow-orange-500/20 transition-all hover:scale-105">
                        Acessar a comunidade <ChevronRight className="ml-2 w-5 h-5" />
                    </Button>

                </div>
            </section>

            {/* Static Community Banner */}
            <section className="py-10">
                <div className="container mx-auto px-6">
                    <div className="w-full bg-gradient-to-r from-orange-400/20 to-black border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden group">
                        {/* Background decorative elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-orange-500/20 transition-all duration-700" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/5 rounded-full -ml-24 -mb-24 blur-2xl" />

                        {/* Banner Content */}
                        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10 justify-between text-center md:text-left">
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-semibold text-orange-400 mb-6 uppercase tracking-wider">
                                    <Star className="w-3 h-3 fill-orange-400" /> Comunidade Exclusiva
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
                                    Venha fazer parte da <span className="text-orange-500">melhor comunidade</span> de empreendedores da cidade!
                                </h2>
                                <p className="text-gray-400 text-lg max-w-xl leading-relaxed">
                                    Conecte-se com profissionais de alto nível, compartilhe experiências e acelere seu crescimento no Club My Linksss.
                                </p>
                            </div>

                            <div className="flex-shrink-0">
                                <Button className="bg-orange-500 hover:bg-orange-600 text-white text-xl font-bold px-12 py-8 rounded-2xl shadow-2xl shadow-orange-500/30 transition-all hover:scale-105 active:scale-95 group" asChild>
                                    <a href="/auth?mode=register">
                                        Entrar para o Club <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Content Grid Section */}
            <section className="py-16">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row gap-10">

                        {/* Sidebar filter - Desktop */}
                        <div className="w-full lg:w-64 space-y-8 flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Filtrar por</h3>
                                <div className="flex flex-col gap-4">
                                    {/* Location Filter */}
                                    <Select value={filterLocation} onValueChange={setFilterLocation}>
                                        <SelectTrigger className="w-full bg-orange-500 text-white border-none font-bold rounded-lg h-12">
                                            <SelectValue placeholder="Localidade" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-orange-500 text-white border-orange-600">
                                            <SelectItem value="all" className="focus:bg-orange-600 focus:text-white cursor-pointer">Todas as Cidades</SelectItem>
                                            {locations.map(loc => (
                                                <SelectItem key={loc} value={String(loc)} className="focus:bg-orange-600 focus:text-white cursor-pointer">{loc}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Influencer Filter */}
                                    <Select value={filterInfluencer} onValueChange={setFilterInfluencer}>
                                        <SelectTrigger className="w-full bg-orange-500 text-white border-none font-bold rounded-lg h-12">
                                            <SelectValue placeholder="Todos os Influenciadores" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-orange-500 text-white border-orange-600">
                                            <SelectItem value="all" className="focus:bg-orange-600 focus:text-white cursor-pointer">Todos Influenciadores</SelectItem>
                                            {influencers.map(inf => (
                                                <SelectItem key={inf} value={String(inf)} className="focus:bg-orange-600 focus:text-white cursor-pointer">{inf}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Group Filter */}
                                    <Select value={filterGroup} onValueChange={setFilterGroup}>
                                        <SelectTrigger className="w-full bg-orange-500 text-white border-none font-bold rounded-lg h-12">
                                            <SelectValue placeholder="Todos os Grupos" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-orange-500 text-white border-orange-600">
                                            <SelectItem value="all" className="focus:bg-orange-600 focus:text-white cursor-pointer">Todos os Grupos</SelectItem>
                                            {groups.map(grp => (
                                                <SelectItem key={grp} value={String(grp)} className="focus:bg-orange-600 focus:text-white cursor-pointer">{grp}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Clear Filters Button */}
                                    {(filterLocation !== 'all' || filterInfluencer !== 'all' || filterGroup !== 'all') && (
                                        <Button
                                            onClick={clearAllFilters}
                                            variant="outline"
                                            className="w-full border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-all"
                                        >
                                            Limpar Filtros
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-4">Parceiros</h3>
                                <div className="space-y-6">
                                    {/* Influencers Section */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Influenciadores</h4>
                                        <div className="space-y-3">
                                            {allAffiliates.filter(a => a.type === 'influencer').map(influencer => (
                                                <div key={influencer.name} className="flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 border border-white/10">
                                                        {influencer.photo_url ? (
                                                            <img src={influencer.photo_url} className="w-full h-full object-cover" alt={influencer.name} />
                                                        ) : partnerPhotos[influencer.name] ? (
                                                            <img src={partnerPhotos[influencer.name]} className="w-full h-full object-cover" alt={influencer.name} />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-orange-500/10">
                                                                <User className="w-5 h-5 text-orange-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-sm truncate group-hover:text-orange-400 transition-colors">{influencer.name}</div>
                                                        <div className="text-xs text-gray-500 truncate">Influencer</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {allAffiliates.filter(a => a.type === 'influencer').length === 0 && (
                                                <div className="text-xs text-gray-600 px-2 italic">Nenhum influenciador ativo.</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Groups Section */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Grupos Empresariais</h4>
                                        <div className="space-y-3">
                                            {groups.map(group => (
                                                <div key={group} className="flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 border border-white/10 flex items-center justify-center">
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-blue-500/10">
                                                            <Star className="w-5 h-5 text-blue-400" />
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-sm truncate group-hover:text-blue-400 transition-colors">{group}</div>
                                                        <div className="text-xs text-gray-500 truncate">Grupo</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {groups.length === 0 && (
                                                <div className="text-xs text-gray-600 px-2 italic">Nenhum grupo encontrado.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Grid */}
                        <div className="flex-1">
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredCreators.length === 0 ? (
                                        <div className="col-span-full py-10 text-center text-gray-400 bg-white/5 rounded-2xl border border-white/5">
                                            Nenhum resultado encontrado para os filtros selecionados.
                                        </div>
                                    ) : (
                                        filteredCreators.map(creator => (
                                            <Card key={creator.user_id} className="bg-[#121212] border-white/5 hover:border-orange-500/30 overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/5 flex flex-col h-full">
                                                <div className="h-32 bg-gray-800 relative overflow-hidden flex-shrink-0">
                                                    {creator.config.headerImage ? (
                                                        <img src={creator.config.headerImage} alt="Cover" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 opacity-60" />
                                                    )}
                                                    <div className="absolute top-3 left-3 flex gap-2">
                                                        {(creator.profiles?.plan_type === 'pro' || creator.profiles?.plan_type === 'master') && (
                                                            <Badge className="bg-black/60 backdrop-blur-md border-0 text-[10px] hover:bg-black/80 text-green-400 font-normal">
                                                                Top Criador
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                <CardContent className="p-5 pt-0 relative flex flex-col flex-grow">
                                                    <div className="flex items-start gap-3 -mt-8 mb-3">
                                                        <div className="rounded-full p-1 bg-[#121212] flex-shrink-0 z-10">
                                                            {creator.config.profilePhoto ? (
                                                                <img src={creator.config.profilePhoto} alt={creator.user_name} className="w-16 h-16 rounded-full object-cover border-2 border-[#121212]" />
                                                            ) : (
                                                                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center border-2 border-[#121212]">
                                                                    <User className="w-8 h-8 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="pt-9 min-w-0 flex-1">
                                                            <div className="flex items-center gap-1">
                                                                <h3 className="font-bold text-lg leading-tight truncate text-white">{creator.user_name}</h3>
                                                                {creator.profiles?.plan_type === 'pro' && (
                                                                    <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                                                )}
                                                            </div>
                                                            {(creator.config.jobTitle || creator.config.companyName) && (
                                                                <div className="text-xs text-gray-400 truncate font-medium">
                                                                    {creator.config.companyName || creator.config.jobTitle}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mb-4 flex-grow">
                                                        <p className="text-gray-300 text-sm line-clamp-3 leading-relaxed">
                                                            {creator.config.bio
                                                                ? (creator.config.bio.length > 100 ? creator.config.bio.substring(0, 100) + '...' : creator.config.bio)
                                                                : 'Sem descrição disponível.'}
                                                        </p>
                                                    </div>

                                                    <div className="mt-auto space-y-4">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {/* Influencer Tag - Destacada */}
                                                            {creator.affiliate_slug && (
                                                                <Badge className="bg-orange-500/20 border-orange-500 text-orange-400 text-[10px] font-semibold py-0 h-5">
                                                                    Club-{creator.affiliate_slug}
                                                                </Badge>
                                                            )}

                                                            {/* Plan Type Badge */}
                                                            {creator.profiles?.plan_type === 'pro' && (
                                                                <Badge variant="outline" className="border-green-500/30 text-green-400 text-[10px] font-normal py-0 h-5">
                                                                    Pro
                                                                </Badge>
                                                            )}

                                                            {/* Location */}
                                                            {creator.config.location && (
                                                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                                    • {creator.config.location}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <Button className="w-full bg-orange-500 hover:bg-orange-600 font-medium text-white transition-all group-hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]" asChild>
                                                            <a
                                                                href={`/u/${creator.profiles?.page_slug}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-center w-full h-full cursor-pointer"
                                                            >
                                                                <User className="w-4 h-4 mr-2" /> Perfil mylinksss
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </section>

            {/* Simple Footer */}
            <footer className="border-t border-white/5 py-12 bg-black">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-center md:text-left">
                            <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Club My Linksss</span>
                            <p className="text-gray-500 text-sm mt-2 max-w-xs">
                                A maior comunidade de criadores do Brasil. Conectando talentos a oportunidades.
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
                            <div className="flex flex-col gap-2">
                                <span className="font-bold text-white mb-1">Link</span>
                                <a href="#" className="hover:text-orange-400">Início</a>
                                <a href="#" className="hover:text-orange-400">Comunidade</a>
                                <a href="#" className="hover:text-orange-400">Criadores</a>
                                <a href="#" className="hover:text-orange-400">Contato</a>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="font-bold text-white mb-1">Legal</span>
                                <a href="#" className="hover:text-orange-400">Termos de uso</a>
                                <a href="#" className="hover:text-orange-400">Política de privacidade</a>
                                <a href="#" className="hover:text-orange-400">Cookies</a>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-400 mr-2">Redes sociais</span>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors cursor-pointer"><div className="font-bold text-xs">IG</div></div>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors cursor-pointer"><div className="font-bold text-xs">X</div></div>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors cursor-pointer"><div className="font-bold text-xs">YT</div></div>
                        </div>
                    </div>
                    <div className="border-t border-white/5 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
                        <p>&copy; 2026 Club My Linksss. Todos os direitos reservados</p>
                        <p className="flex items-center gap-1">Todos os direitos reservados| Agência WebSic| ConectyIA| Desenvolvido por Sinvaldo Oliveira.</p>
                    </div>
                </div>
            </footer>
        </div >
    );
};

export default ClubMyLinksss;
