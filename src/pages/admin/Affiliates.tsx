import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Users, UserPlus, Copy, Edit, Loader2 } from 'lucide-react';


interface Affiliate {
    id: string;
    name: string;
    type: 'influencer' | 'grupo';
    slug: string;
    city: string | null;
    whatsapp: string | null;
    instagram: string | null;
    status: 'active' | 'inactive';
    created_at: string;
    referral_count?: number;
    photo_url?: string;
}

export default function Affiliates() {
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedAffiliate, setSelectedAffiliate] = useState<Partial<Affiliate> | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    const [referralsModalOpen, setReferralsModalOpen] = useState(false);
    const [selectedAffiliateReferrals, setSelectedAffiliateReferrals] = useState<any[]>([]);

    const loadAffiliates = async () => {
        try {
            setLoading(true);
            setDebugLog('Lendo lista de afiliados...');
            const { data, error } = await supabase
                .from('affiliates')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[Affiliates] load error:', error);
                throw error;
            }

            const formatted = await Promise.all((data || []).map(async (item: any) => {
                try {
                    const { count, error: countError } = await supabase
                        .from('referrals')
                        .select('*', { count: 'exact', head: true })
                        .eq('affiliate_id', item.id);

                    if (countError) console.warn(`[Affiliates] Could not load referrals for ${item.id}:`, countError);

                    return {
                        ...item,
                        referral_count: count || 0
                    };
                } catch (e) {
                    return { ...item, referral_count: 0 };
                }
            }));

            setAffiliates(formatted);
            setDebugLog('Lista carregada com sucesso.');
        } catch (error: any) {
            console.error('[Affiliates] loadAffiliates caught error:', error);
            setDebugLog('Erro ao carregar: ' + error.message);
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const loadReferrals = async (affiliateId: string) => {
        try {
            const { data, error } = await supabase
                .from('referrals')
                .select(`
          created_at,
          referred_email,
          referred_user_id,
          profiles:referred_user_id (
            name,
            plano,
            plan_type
          )
        `)
                .eq('affiliate_id', affiliateId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSelectedAffiliateReferrals(data || []);
            setReferralsModalOpen(true);
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
    };

    const [debugLog, setDebugLog] = useState<string>('');

    useEffect(() => {
        loadAffiliates();
    }, []);

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    };


    // Image Upload Handler
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `affiliates/${fileName}`;

        try {
            setUploading(true);
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            setSelectedAffiliate(prev => ({ ...prev, photo_url: publicUrl }));
            toast({ title: 'Sucesso', description: 'Imagem enviada com sucesso!' });
        } catch (error: any) {
            console.error('Error uploading image:', error);
            toast({
                title: 'Erro no Upload',
                description: 'Não foi possível enviar a imagem. Tente novamente.',
                variant: 'destructive'
            });
        } finally {
            setUploading(false);
        }
    };


    const handleOpenAdd = () => {
        setIsEditing(false);
        setSelectedAffiliate({
            name: '',
            type: 'influencer',
            slug: '',
            status: 'active',
            city: '',
            whatsapp: '',
            instagram: '',
            photo_url: ''
        });
        setModalOpen(true);
    };

    const handleOpenEdit = (affiliate: Affiliate) => {
        setIsEditing(true);
        setSelectedAffiliate(affiliate);
        setModalOpen(true);
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        setDebugLog('Iniciando salvamento...');

        if (!selectedAffiliate?.name || !selectedAffiliate?.slug) {
            setDebugLog('Erro: Nome ou Slug faltando');
            toast({ title: 'Atenção', description: 'Nome e Slug são obrigatórios', variant: 'destructive' });
            return;
        }

        if (!supabase) {
            console.error('[Affiliates] Supabase client is not initialized!');
            toast({ title: 'Erro Crítico', description: 'Cliente Supabase não inicializado.', variant: 'destructive' });
            return;
        }

        try {
            setSaving(true);
            setDebugLog('Preparando dados...');

            const dataToSave: any = {
                name: selectedAffiliate.name,
                type: selectedAffiliate.type || 'influencer',
                slug: selectedAffiliate.slug,
                city: selectedAffiliate.city || null,
                whatsapp: selectedAffiliate.whatsapp || null,
                instagram: selectedAffiliate.instagram || null,
                status: selectedAffiliate.status || 'active',
                photo_url: selectedAffiliate.photo_url || null
            };

            let result;
            if (isEditing && selectedAffiliate.id) {
                // Remove photo_url if it causes issues on existing records if column missing (but user requested it)
                // We will try to save. If it fails due to column missing, catch block handles it.
                setDebugLog('Enviando UPDATE para o banco...');
                result = await supabase
                    .from('affiliates')
                    .update(dataToSave)
                    .eq('id', selectedAffiliate.id)
                    .select();
            } else {
                setDebugLog('Enviando INSERT para o banco...');
                const { id, ...insertData } = dataToSave;
                result = await supabase
                    .from('affiliates')
                    .insert([insertData])
                    .select();
            }

            if (result.error) {
                setDebugLog('Erro do Supabase: ' + result.error.message);
                throw result.error;
            }

            setDebugLog('Sucesso total!');
            toast({ title: 'Sucesso', description: 'Dados salvos com sucesso!' });
            setModalOpen(false);
            loadAffiliates();
        } catch (error: any) {
            console.error('[Affiliates] handleSave caught error:', error);
            const errorMsg = error.message || JSON.stringify(error);
            setDebugLog('Falha: ' + errorMsg);

            if (errorMsg.includes('column "photo_url" of relation "affiliates" does not exist')) {
                toast({
                    title: 'Erro de Banco de Dados',
                    description: `A coluna 'photo_url' não existe na tabela. Contate o suporte para criar a coluna.`,
                    variant: 'destructive'
                });
            } else {
                toast({
                    title: 'Erro ao salvar',
                    description: `Detalhes: ${errorMsg}`,
                    variant: 'destructive'
                });
            }
        } finally {
            setSaving(false);
        }
    };

    const copyLink = (slug: string) => {
        const link = `${window.location.origin}/cadastro/${slug}`;
        navigator.clipboard.writeText(link);
        toast({ title: 'Copiado', description: 'Link de indicação copiado!' });
    };

    return (
        <DashboardLayout type="admin">
            <div className="space-y-6">

                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Afiliados</h2>
                        <p className="text-muted-foreground">Gerencie influenciadores e grupos que indicam usuários.</p>
                    </div>
                    <Button onClick={handleOpenAdd}>
                        <UserPlus className="mr-2 h-4 w-4" /> Novo Afiliado
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" /> Lista de Afiliados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Slug / Link</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Indicações</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {affiliates.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                Nenhum afiliado cadastrado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        affiliates.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{item.slug}</code>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyLink(item.slug)}>
                                                            <Copy className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{item.type === 'influencer' ? 'Influenciador' : 'Grupo'}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="link" className="p-0 h-auto" onClick={() => loadReferrals(item.id)}>
                                                        {item.referral_count}
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={item.status === 'active' ? 'default' : 'destructive'}>
                                                        {item.status === 'active' ? 'Ativo' : 'Inativo'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialog Content */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Editar Afiliado' : 'Cadastrar Novo Afiliado'}</DialogTitle>
                        <DialogDescription>Preencha os dados do afiliado para gerar o link de indicação.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave}>
                        <div className="grid gap-4 py-4 text-left">

                            {/* Image Upload Field */}
                            <div className="grid gap-2">
                                <Label>Foto do Perfil / Logo</Label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                                        {selectedAffiliate?.photo_url ? (
                                            <img src={selectedAffiliate.photo_url} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <Users className="w-8 h-8 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                            className="cursor-pointer"
                                        />
                                        {uploading && <p className="text-xs text-blue-500 mt-1">Enviando imagem...</p>}
                                    </div>
                                </div>
                            </div>


                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome / Razão Social</Label>
                                <Input
                                    id="name"
                                    value={selectedAffiliate?.name || ''}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        // Update slug ONLY if adding new and slug wasn't manually edited (simple heuristic)
                                        // or just follow previous logic: only if isEditing is false
                                        const slug = (!isEditing && selectedAffiliate?.slug === generateSlug(selectedAffiliate?.name || '')) || !selectedAffiliate?.slug
                                            ? generateSlug(name)
                                            : selectedAffiliate?.slug;

                                        setSelectedAffiliate(prev => ({
                                            ...prev,
                                            name,
                                            slug: (!isEditing) ? generateSlug(name) : prev?.slug
                                        }));
                                    }}
                                    required
                                />
                            </div>

                            {/* ... Rest of the form inputs (Slug, Type, Status, City, Whatsapp, Instagram) - copy strict from original but ensure selectedAffiliate is used */}
                            <div className="grid gap-2">
                                <Label htmlFor="slug">Slug Personalizado</Label>
                                <Input
                                    id="slug"
                                    value={selectedAffiliate?.slug || ''}
                                    onChange={(e) => setSelectedAffiliate(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                                    required
                                />
                                <p className="text-[10px] text-muted-foreground">Link final: {window.location.origin}/cadastro/<strong>{selectedAffiliate?.slug || '...'}</strong></p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2 text-left">
                                    <Label>Tipo</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedAffiliate?.type}
                                        onChange={(e) => setSelectedAffiliate(prev => ({ ...prev, type: e.target.value as any }))}
                                    >
                                        <option value="influencer">Influenciador</option>
                                        <option value="grupo">Grupo Empresarial</option>
                                    </select>
                                </div>
                                <div className="grid gap-2 text-left">
                                    <Label>Status</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedAffiliate?.status}
                                        onChange={(e) => setSelectedAffiliate(prev => ({ ...prev, status: e.target.value as any }))}
                                    >
                                        <option value="active">Ativo</option>
                                        <option value="inactive">Inativo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="city">Cidade (Opcional)</Label>
                                <Input
                                    id="city"
                                    value={selectedAffiliate?.city || ''}
                                    onChange={(e) => setSelectedAffiliate(prev => ({ ...prev, city: e.target.value }))}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="whatsapp">WhatsApp</Label>
                                    <Input
                                        id="whatsapp"
                                        value={selectedAffiliate?.whatsapp || ''}
                                        onChange={(e) => setSelectedAffiliate(prev => ({ ...prev, whatsapp: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="instagram">Instagram (@)</Label>
                                    <Input
                                        id="instagram"
                                        value={selectedAffiliate?.instagram || ''}
                                        onChange={(e) => setSelectedAffiliate(prev => ({ ...prev, instagram: e.target.value }))}
                                    />
                                </div>
                            </div>

                        </div>
                        {/* ... debugLog and footer */}
                        {debugLog && (
                            <div className="mb-4 p-2 bg-muted rounded text-[10px] font-mono whitespace-pre-wrap break-all border border-primary/20">
                                <strong>Status de Depuração:</strong><br />
                                {debugLog}
                            </div>
                        )}

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => {
                                setModalOpen(false);
                            }} disabled={saving}>Cancelar</Button>
                            <Button
                                type="button"
                                onClick={() => handleSave()}
                                disabled={saving || uploading}
                                className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
                            >
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isEditing ? 'Confirmar Alterações' : 'Salvar Afiliado (Direct)'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {/* ... referrals modal */}
            <Dialog open={referralsModalOpen} onOpenChange={setReferralsModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Relatório de Indicações</DialogTitle>
                        <DialogDescription>Lista detalhada de usuários que se cadastraram por este link.</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Indicação</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Plano</TableHead>
                                    <TableHead>Data</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedAffiliateReferrals.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                            Nenhuma indicação encontrada.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    selectedAffiliateReferrals.map((ref, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{ref.profiles?.name || 'Incompleto'}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{ref.referred_email}</TableCell>
                                            <TableCell>
                                                <Badge variant={ref.profiles?.plan_type === 'pro' ? 'default' : 'outline'}>
                                                    {ref.profiles?.plano || 'N/A'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {new Date(ref.created_at).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
