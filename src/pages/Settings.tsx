import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Calendar, Shield, Image, Link, Palette, Plus, Trash2, GripVertical } from 'lucide-react';
import { PageConfig, PageLink, DEFAULT_PAGE_CONFIG, UserPage } from '@/types/auth';

const COLOR_PALETTES = [
  { name: 'Roxo', primary: '#8B5CF6', secondary: '#A78BFA', background: '#1A1A2E', text: '#FFFFFF' },
  { name: 'Azul', primary: '#3B82F6', secondary: '#60A5FA', background: '#0F172A', text: '#FFFFFF' },
  { name: 'Verde', primary: '#10B981', secondary: '#34D399', background: '#064E3B', text: '#FFFFFF' },
  { name: 'Rosa', primary: '#EC4899', secondary: '#F472B6', background: '#500724', text: '#FFFFFF' },
  { name: 'Laranja', primary: '#F97316', secondary: '#FB923C', background: '#431407', text: '#FFFFFF' },
  { name: 'Claro', primary: '#6366F1', secondary: '#818CF8', background: '#F8FAFC', text: '#1E293B' },
];

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [pageConfig, setPageConfig] = useState<PageConfig>(DEFAULT_PAGE_CONFIG);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  useEffect(() => {
    if (user) {
      const pages = localStorage.getItem('userPages');
      if (pages) {
        const parsed = JSON.parse(pages);
        if (parsed[user.id]?.config) {
          setPageConfig(parsed[user.id].config);
        }
      }
    }
  }, [user]);

  if (!user) return null;

  const savePageConfig = (newConfig: PageConfig) => {
    const pages = localStorage.getItem('userPages');
    if (pages) {
      const parsed = JSON.parse(pages);
      if (parsed[user.id]) {
        parsed[user.id].config = newConfig;
        localStorage.setItem('userPages', JSON.stringify(parsed));
        setPageConfig(newConfig);
        toast({ title: 'Salvo!', description: 'Configurações da página atualizadas' });
      }
    }
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newConfig = { ...pageConfig, profilePhoto: reader.result as string };
        savePageConfig(newConfig);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHeaderImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newConfig = { ...pageConfig, headerImage: reader.result as string };
        savePageConfig(newConfig);
      };
      reader.readAsDataURL(file);
    }
  };

  const addLink = () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) {
      toast({ title: 'Erro', description: 'Preencha o nome e URL do link', variant: 'destructive' });
      return;
    }
    const newLink: PageLink = {
      id: 'link_' + Math.random().toString(36).substr(2, 9),
      label: newLinkLabel,
      url: newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`,
      enabled: true
    };
    const newConfig = { ...pageConfig, links: [...pageConfig.links, newLink] };
    savePageConfig(newConfig);
    setNewLinkLabel('');
    setNewLinkUrl('');
  };

  const updateLink = (id: string, updates: Partial<PageLink>) => {
    const newLinks = pageConfig.links.map(link => 
      link.id === id ? { ...link, ...updates } : link
    );
    const newConfig = { ...pageConfig, links: newLinks };
    savePageConfig(newConfig);
  };

  const removeLink = (id: string) => {
    const newLinks = pageConfig.links.filter(link => link.id !== id);
    const newConfig = { ...pageConfig, links: newLinks };
    savePageConfig(newConfig);
  };

  const selectPalette = (palette: typeof COLOR_PALETTES[0]) => {
    const newConfig = {
      ...pageConfig,
      colorPalette: {
        primary: palette.primary,
        secondary: palette.secondary,
        background: palette.background,
        text: palette.text
      }
    };
    savePageConfig(newConfig);
  };

  const handleSave = () => {
    toast({ title: 'Informação', description: 'Funcionalidade em desenvolvimento' });
  };

  return (
    <DashboardLayout type="user">
      <div className="space-y-6 max-w-3xl">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
          <p className="text-muted-foreground">Gerencie suas informações e personalize sua página.</p>
        </div>

        {/* Personal Info */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Atualize suas informações básicas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="pl-10 bg-muted/50"
                />
              </div>
              <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
            </div>
            <Button onClick={handleSave}>Salvar Alterações</Button>
          </CardContent>
        </Card>

        {/* Profile Photo */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Foto de Perfil
            </CardTitle>
            <CardDescription>Imagem que aparecerá na sua página pública</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="relative">
                {pageConfig.profilePhoto ? (
                  <img 
                    src={pageConfig.profilePhoto} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="profilePhoto" className="cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
                    <p className="text-sm text-muted-foreground">Clique para selecionar uma imagem</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG até 2MB</p>
                  </div>
                  <Input 
                    id="profilePhoto" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleProfilePhotoChange}
                  />
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Header Image */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Imagem do Cabeçalho
            </CardTitle>
            <CardDescription>Banner que aparecerá no topo da sua página</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pageConfig.headerImage && (
              <div className="relative w-full h-32 rounded-lg overflow-hidden">
                <img 
                  src={pageConfig.headerImage} 
                  alt="Header" 
                  className="w-full h-full object-cover"
                />
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={() => savePageConfig({ ...pageConfig, headerImage: '' })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Label htmlFor="headerImage" className="cursor-pointer block">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Clique para selecionar uma imagem de cabeçalho</p>
                <p className="text-xs text-muted-foreground mt-1">Recomendado: 1200x300px</p>
              </div>
              <Input 
                id="headerImage" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleHeaderImageChange}
              />
            </Label>
          </CardContent>
        </Card>

        {/* Links */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Links dos Botões
            </CardTitle>
            <CardDescription>Adicione links que aparecerão como botões na sua página</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Links */}
            {pageConfig.links.length > 0 && (
              <div className="space-y-3">
                {pageConfig.links.map((link) => (
                  <div key={link.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input 
                        value={link.label}
                        onChange={(e) => updateLink(link.id, { label: e.target.value })}
                        placeholder="Nome do botão"
                      />
                      <Input 
                        value={link.url}
                        onChange={(e) => updateLink(link.id, { url: e.target.value })}
                        placeholder="URL"
                      />
                    </div>
                    <Switch 
                      checked={link.enabled}
                      onCheckedChange={(checked) => updateLink(link.id, { enabled: checked })}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeLink(link.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add New Link */}
            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-medium">Adicionar novo link</p>
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  placeholder="Nome do botão (ex: Instagram)"
                />
                <Input 
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="URL (ex: instagram.com/usuario)"
                />
              </div>
              <Button onClick={addLink} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Link
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Paleta de Cores
            </CardTitle>
            <CardDescription>Escolha as cores da sua página pública</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {COLOR_PALETTES.map((palette) => (
                <button
                  key={palette.name}
                  onClick={() => selectPalette(palette)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    pageConfig.colorPalette.primary === palette.primary 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  style={{ backgroundColor: palette.background }}
                >
                  <div className="flex gap-2 mb-2">
                    <div 
                      className="w-6 h-6 rounded-full" 
                      style={{ backgroundColor: palette.primary }}
                    />
                    <div 
                      className="w-6 h-6 rounded-full" 
                      style={{ backgroundColor: palette.secondary }}
                    />
                  </div>
                  <p className="text-sm font-medium" style={{ color: palette.text }}>
                    {palette.name}
                  </p>
                </button>
              ))}
            </div>

            {/* Custom Colors */}
            <Separator />
            <p className="text-sm font-medium">Cores personalizadas</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primária</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    id="primaryColor"
                    value={pageConfig.colorPalette.primary}
                    onChange={(e) => savePageConfig({
                      ...pageConfig,
                      colorPalette: { ...pageConfig.colorPalette, primary: e.target.value }
                    })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input 
                    value={pageConfig.colorPalette.primary}
                    onChange={(e) => savePageConfig({
                      ...pageConfig,
                      colorPalette: { ...pageConfig.colorPalette, primary: e.target.value }
                    })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secundária</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    id="secondaryColor"
                    value={pageConfig.colorPalette.secondary}
                    onChange={(e) => savePageConfig({
                      ...pageConfig,
                      colorPalette: { ...pageConfig.colorPalette, secondary: e.target.value }
                    })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input 
                    value={pageConfig.colorPalette.secondary}
                    onChange={(e) => savePageConfig({
                      ...pageConfig,
                      colorPalette: { ...pageConfig.colorPalette, secondary: e.target.value }
                    })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bgColor">Fundo</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    id="bgColor"
                    value={pageConfig.colorPalette.background}
                    onChange={(e) => savePageConfig({
                      ...pageConfig,
                      colorPalette: { ...pageConfig.colorPalette, background: e.target.value }
                    })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input 
                    value={pageConfig.colorPalette.background}
                    onChange={(e) => savePageConfig({
                      ...pageConfig,
                      colorPalette: { ...pageConfig.colorPalette, background: e.target.value }
                    })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="textColor">Texto</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    id="textColor"
                    value={pageConfig.colorPalette.text}
                    onChange={(e) => savePageConfig({
                      ...pageConfig,
                      colorPalette: { ...pageConfig.colorPalette, text: e.target.value }
                    })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input 
                    value={pageConfig.colorPalette.text}
                    onChange={(e) => savePageConfig({
                      ...pageConfig,
                      colorPalette: { ...pageConfig.colorPalette, text: e.target.value }
                    })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Detalhes da Conta</CardTitle>
            <CardDescription>Informações sobre sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Conta criada em</span>
                </div>
                <span className="text-sm font-medium">
                  {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Status da conta</span>
                </div>
                <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">
                  Ativa
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            <CardDescription>Ações irreversíveis para sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" disabled>
              Excluir Conta
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Esta funcionalidade estará disponível em breve
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
