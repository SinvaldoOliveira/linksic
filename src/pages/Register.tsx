import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function Register() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [affiliateInfo, setAffiliateInfo] = useState<any>(null);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [city, setCity] = useState('');
    const [pageSlug, setPageSlug] = useState('');

    useEffect(() => {
        // Check for tracked affiliate
        const trackSlug = localStorage.getItem('affiliate_track_slug');
        const trackExpiry = localStorage.getItem('affiliate_track_expiry');

        if (trackSlug && trackExpiry && parseInt(trackExpiry) > Date.now()) {
            const fetchAffiliate = async () => {
                const { data } = await supabase
                    .from('affiliates')
                    .select('*')
                    .eq('slug', trackSlug)
                    .single();
                if (data) setAffiliateInfo(data);
            };
            fetchAffiliate();
        }
    }, []);

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
            const userId = authData.user?.id;
            if (!userId) throw new Error('Falha ao criar usuário');

            // 2. Base Profile
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

            // 3. Referral (if tracked)
            if (affiliateInfo) {
                await supabase.from('referrals').insert({
                    affiliate_id: affiliateInfo.id,
                    referred_user_id: userId,
                    referred_email: email,
                    source: 'catalog'
                });
            }

            // 4. Page Config
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
                    displayOnClub: !!affiliateInfo // Visível se indicado, oculto se cadastro manual free
                }
            });

            toast({ title: 'Sucesso!', description: 'Sua conta foi criada.' });
            navigate('/dashboard');

        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg space-y-8">
                <div className="text-center">
                    <img src="/logo.png" alt="Mylinksss" className="h-12 mx-auto mb-6" />
                    {affiliateInfo && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs mb-4">
                            <CheckCircle2 className="w-3 h-3" /> Recomendado por {affiliateInfo.name}
                        </div>
                    )}
                    <h1 className="text-3xl font-bold text-white tracking-tight">Crie sua página gratuita</h1>
                    <p className="text-gray-400 mt-2">Personalize seu link e comece a compartilhar agora.</p>
                </div>

                <Card className="bg-[#121212] border-white/5 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-white">Cadastro</CardTitle>
                        <CardDescription>O catálogo público é exclusivo para usuários Pró ou convidados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-gray-300">Seu Nome</Label>
                                <Input
                                    id="name"
                                    className="bg-black/50 border-white/10 text-white"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
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
                                <Input id="email" className="bg-black/50 border-white/10 text-white" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password" className="text-gray-300">Senha</Label>
                                <Input id="password" className="bg-black/50 border-white/10 text-white" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="city" className="text-gray-300">Cidade</Label>
                                    <Input id="city" className="bg-black/50 border-white/10 text-white" value={city} onChange={(e) => setCity(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="slug" className="text-gray-300">Slug da Página</Label>
                                    <div className="flex items-center gap-1 bg-black/50 border border-white/10 rounded-md px-3 h-10">
                                        <span className="text-gray-500 text-xs">/u/</span>
                                        <input
                                            id="slug"
                                            className="bg-transparent border-0 focus:ring-0 text-white text-sm w-full outline-none"
                                            value={pageSlug}
                                            onChange={(e) => setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 mt-4" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</>
                                ) : (
                                    <>Criar Conta Gratuita <ChevronRight className="ml-2 w-4 h-4" /></>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <div className="text-center">
                    <Button variant="link" className="text-gray-500" onClick={() => navigate('/auth')}>
                        Já tem uma conta? Entre aqui
                    </Button>
                </div>
            </div>
        </div>
    );
}
