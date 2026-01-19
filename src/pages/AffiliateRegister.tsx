import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, ChevronRight } from 'lucide-react';

export default function AffiliateRegister() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [affiliate, setAffiliate] = useState<any>(null);
    const [loadingSlug, setLoadingSlug] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [city, setCity] = useState('');
    const [pageSlug, setPageSlug] = useState('');

    useEffect(() => {
        console.log('[AffiliateRegister] Checking slug:', slug);
        const verifySlug = async () => {
            if (!slug) {
                setLoadingSlug(false);
                return;
            }
            try {
                setLoadingSlug(true);
                const { data, error } = await supabase
                    .from('affiliates')
                    .select('*')
                    .eq('slug', slug)
                    .eq('status', 'active')
                    .single();

                console.log('[AffiliateRegister] Supabase result:', data, error);

                if (error || !data) {
                    setAffiliate(null);
                } else {
                    setAffiliate(data);
                    // Save to localStorage for 30 days tracking
                    localStorage.setItem('affiliate_track_slug', slug);
                    localStorage.setItem('affiliate_track_id', data.id);
                    localStorage.setItem('affiliate_track_expiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
                }
            } catch (err) {
                console.error('[AffiliateRegister] Error:', err);
            } finally {
                setLoadingSlug(false);
            }
        };

        verifySlug();
    }, [slug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !email || !password || !city || !pageSlug) {
            toast({ title: 'Atenção', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
            return;
        }

        try {
            setIsSubmitting(true);

            // 1. Auth SignUp
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        role: 'user',
                        pageSlug
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Não foi possível criar o usuário');

            const userId = authData.user.id;

            // 2. Update Profile (city, etc.)
            // We use upsert because the trigger might have already created it
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: userId,
                name,
                email,
                city,
                page_slug: pageSlug,
                status: 'active',
                plano: 'Free',
                plan_type: 'free'
            });

            if (profileError) throw profileError;

            // 3. Create Referral
            if (affiliate) {
                const { error: refError } = await supabase.from('referrals').insert({
                    affiliate_id: affiliate.id,
                    referred_user_id: userId,
                    referred_email: email,
                    source: 'signup'
                });
                if (refError) console.error('Error creating referral:', refError);
            }

            // 4. Create initial page config
            await supabase.from('pages').upsert({
                user_id: userId,
                user_name: name,
                config: {
                    profilePhoto: '',
                    headerImage: '',
                    bio: '',
                    links: [],
                    colorPalette: {
                        background: '#0a0a0a',
                        text: '#ffffff',
                        card: 'rgba(255, 255, 255, 0.05)',
                        cardText: '#ffffff',
                        accent: '#f97316'
                    },
                    displayOnClub: true
                }
            });

            toast({ title: 'Conta criada!', description: 'Bem-vindo ao MyLinksss Club.' });
            navigate('/dashboard');

        } catch (error: any) {
            toast({ title: 'Erro no cadastro', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingSlug) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!affiliate) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-4xl font-bold mb-4 text-white">Link Inválido</h1>
                <p className="text-gray-400 mb-8 max-w-md">
                    O link de indicação <strong>"{slug}"</strong> não existe ou não está ativo no momento.
                    Você ainda pode criar uma conta normalmente no botão abaixo.
                </p>
                <div className="flex flex-col gap-4">
                    <Button onClick={() => navigate('/cadastro')} className="bg-orange-500 hover:bg-orange-600">
                        Cadastrar sem indicação
                    </Button>
                    <Button variant="ghost" onClick={() => navigate('/auth')} className="text-gray-500 underline">
                        Já tenho conta / Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-lg space-y-8">
                <div className="text-center space-y-2">
                    <img src="/logo.png" alt="Mylinksss" className="h-12 mx-auto mb-6" />
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Indicação de: {affiliate.name}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mt-4">Entre para a nossa comunidade</h1>
                    <p className="text-gray-400">Ao se cadastrar por este link, seu perfil terá destaque no nosso catálogo.</p>
                </div>

                <Card className="bg-[#121212] border-white/5 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-white">Crie sua conta</CardTitle>
                        <CardDescription>Preencha os dados abaixo para começar.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-gray-300">Nome Completo</Label>
                                <Input
                                    id="name"
                                    placeholder="Ex: João Silva"
                                    className="bg-black/50 border-white/10 text-white"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        // Auto-slug generator (only if not set manually)
                                        if (e.target.value.length > 0) {
                                            const normalized = e.target.value
                                                .toLowerCase()
                                                .normalize('NFD')
                                                .replace(/[\u0300-\u036f]/g, '')
                                                .replace(/[^a-z0-9]/g, '-')
                                                .replace(/-+/g, '-')
                                                .replace(/^-|-$/g, '');
                                            setPageSlug(normalized);
                                        }
                                    }}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-gray-300">E-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="bg-black/50 border-white/10 text-white"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password" className="text-gray-300">Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    className="bg-black/50 border-white/10 text-white"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="city" className="text-gray-300">Cidade</Label>
                                    <Input
                                        id="city"
                                        placeholder="Ex: São Paulo"
                                        className="bg-black/50 border-white/10 text-white"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="slug" className="text-gray-300">Link da sua página</Label>
                                    <div className="flex items-center gap-1 bg-black/50 border border-white/10 rounded-md px-3">
                                        <span className="text-gray-500 text-sm">/u/</span>
                                        <input
                                            id="slug"
                                            className="bg-transparent border-0 focus:ring-0 text-sm py-2 w-full outline-none text-white"
                                            placeholder="seu-nome"
                                            value={pageSlug}
                                            onChange={(e) => setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 mt-4" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando conta...</>
                                ) : (
                                    <>Finalizar Cadastro <ChevronRight className="ml-2 w-4 h-4" /></>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
