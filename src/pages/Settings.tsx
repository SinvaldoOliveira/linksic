import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { User, Image, Link, Palette, Plus, Trash2, ExternalLink, Copy } from 'lucide-react';
import { PageConfig, PageLink, DEFAULT_PAGE_CONFIG } from '@/types/auth';
import { PhonePreview } from '@/components/PhonePreview';

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

  const publicUrl = `${window.location.origin}/u/${user.pageSlug}`;

  const savePageConfig = (newConfig: PageConfig, showToast = true) => {
    const pages = localStorage.getItem('userPages');
    if (pages) {
      const parsed = JSON.parse(pages);
      if (parsed[user.id]) {
        parsed[user.id].config = newConfig;
        localStorage.setItem('userPages', JSON.stringify(parsed));
        setPageConfig(newConfig);
        if (showToast) {
          toast({ title: 'Salvo!', description: 'Alterações aplicadas' });
        }
      }
    }
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        savePageConfig({ ...pageConfig, profilePhoto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHeaderImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        savePageConfig({ ...pageConfig, headerImage: reader.result as string });
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
    savePageConfig({ ...pageConfig, links: [...pageConfig.links, newLink] });
    setNewLinkLabel('');
    setNewLinkUrl('');
  };

  const updateLink = (id: string, updates: Partial<PageLink>) => {
    const newLinks = pageConfig.links.map(link => 
      link.id === id ? { ...link, ...updates } : link
    );
    savePageConfig({ ...pageConfig, links: newLinks }, false);
  };

  const removeLink = (id: string) => {
    const newLinks = pageConfig.links.filter(link => link.id !== id);
    savePageConfig({ ...pageConfig, links: newLinks });
  };

  const selectPalette = (palette: typeof COLOR_PALETTES[0]) => {
    savePageConfig({
      ...pageConfig,
      colorPalette: {
        primary: palette.primary,
        secondary: palette.secondary,
        background: palette.background,
        text: palette.text
      }
    });
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast({ title: 'Copiado!', description: 'URL copiada para a área de transferência' });
  };

  return (
    <DashboardLayout type="user">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
        {/* Left Panel - Configuration */}
        <div className="flex-1 overflow-y-auto pr-2">
          {/* Header with URL */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Editor de Página</h2>
              <p className="text-muted-foreground text-sm">Personalize sua página pública</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {publicUrl}
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyUrl}>
                  <Copy className="h-3 w-3" />
                </Button>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              </div>
            </div>
          </div>

          <Tabs defaultValue="links" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="links" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Links
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Aparência
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>
            </TabsList>

            {/* Links Tab */}
            <TabsContent value="links" className="space-y-4">
              {/* Add New Link Button */}
              <Button onClick={addLink} className="w-full h-12 text-base" variant="default">
                <Plus className="h-5 w-5 mr-2" />
                Adicionar Novo Link
              </Button>

              {/* Add Link Form */}
              {(newLinkLabel || newLinkUrl || pageConfig.links.length === 0) && (
                <Card className="border-primary/30 border-dashed">
                  <CardContent className="pt-4 space-y-3">
                    <Input 
                      value={newLinkLabel}
                      onChange={(e) => setNewLinkLabel(e.target.value)}
                      placeholder="Nome do botão (ex: Meu Site)"
                      className="h-11"
                    />
                    <Input 
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="URL (ex: https://meusite.com)"
                      className="h-11"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Existing Links */}
              <div className="space-y-3">
                {pageConfig.links.map((link) => (
                  <Card key={link.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Input 
                              value={link.label}
                              onChange={(e) => updateLink(link.id, { label: e.target.value })}
                              className="font-medium h-9"
                            />
                            <Switch 
                              checked={link.enabled}
                              onCheckedChange={(checked) => updateLink(link.id, { enabled: checked })}
                            />
                          </div>
                          <Input 
                            value={link.url}
                            onChange={(e) => updateLink(link.id, { url: e.target.value })}
                            className="text-sm text-muted-foreground h-9"
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeLink(link.id)}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {pageConfig.links.length === 0 && !newLinkLabel && !newLinkUrl && (
                <div className="text-center py-8 text-muted-foreground">
                  <Link className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum link adicionado ainda</p>
                  <p className="text-sm">Clique no botão acima para adicionar</p>
                </div>
              )}
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-4">
              {/* Color Palettes */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Temas</CardTitle>
                  <CardDescription>Escolha uma paleta de cores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {COLOR_PALETTES.map((palette) => (
                      <button
                        key={palette.name}
                        onClick={() => selectPalette(palette)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          pageConfig.colorPalette.primary === palette.primary 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        style={{ backgroundColor: palette.background }}
                      >
                        <div className="flex gap-1 mb-2 justify-center">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.primary }} />
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.secondary }} />
                        </div>
                        <p className="text-xs font-medium" style={{ color: palette.text }}>
                          {palette.name}
                        </p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Custom Colors */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Cores Personalizadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Cor Primária</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="color" 
                          value={pageConfig.colorPalette.primary}
                          onChange={(e) => savePageConfig({
                            ...pageConfig,
                            colorPalette: { ...pageConfig.colorPalette, primary: e.target.value }
                          }, false)}
                          className="w-10 h-10 p-1 cursor-pointer"
                        />
                        <Input 
                          value={pageConfig.colorPalette.primary}
                          onChange={(e) => savePageConfig({
                            ...pageConfig,
                            colorPalette: { ...pageConfig.colorPalette, primary: e.target.value }
                          }, false)}
                          className="flex-1 h-10 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Cor Secundária</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="color" 
                          value={pageConfig.colorPalette.secondary}
                          onChange={(e) => savePageConfig({
                            ...pageConfig,
                            colorPalette: { ...pageConfig.colorPalette, secondary: e.target.value }
                          }, false)}
                          className="w-10 h-10 p-1 cursor-pointer"
                        />
                        <Input 
                          value={pageConfig.colorPalette.secondary}
                          onChange={(e) => savePageConfig({
                            ...pageConfig,
                            colorPalette: { ...pageConfig.colorPalette, secondary: e.target.value }
                          }, false)}
                          className="flex-1 h-10 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Cor de Fundo</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="color" 
                          value={pageConfig.colorPalette.background}
                          onChange={(e) => savePageConfig({
                            ...pageConfig,
                            colorPalette: { ...pageConfig.colorPalette, background: e.target.value }
                          }, false)}
                          className="w-10 h-10 p-1 cursor-pointer"
                        />
                        <Input 
                          value={pageConfig.colorPalette.background}
                          onChange={(e) => savePageConfig({
                            ...pageConfig,
                            colorPalette: { ...pageConfig.colorPalette, background: e.target.value }
                          }, false)}
                          className="flex-1 h-10 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Cor do Texto</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="color" 
                          value={pageConfig.colorPalette.text}
                          onChange={(e) => savePageConfig({
                            ...pageConfig,
                            colorPalette: { ...pageConfig.colorPalette, text: e.target.value }
                          }, false)}
                          className="w-10 h-10 p-1 cursor-pointer"
                        />
                        <Input 
                          value={pageConfig.colorPalette.text}
                          onChange={(e) => savePageConfig({
                            ...pageConfig,
                            colorPalette: { ...pageConfig.colorPalette, text: e.target.value }
                          }, false)}
                          className="flex-1 h-10 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Header Image */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Imagem de Cabeçalho
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pageConfig.headerImage && (
                    <div className="relative w-full h-24 rounded-lg overflow-hidden mb-3">
                      <img src={pageConfig.headerImage} alt="Header" className="w-full h-full object-cover" />
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="absolute top-2 right-2 h-7"
                        onClick={() => savePageConfig({ ...pageConfig, headerImage: '' })}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <Label htmlFor="headerImage" className="cursor-pointer block">
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
                      <Image className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Clique para adicionar</p>
                    </div>
                    <Input id="headerImage" type="file" accept="image/*" className="hidden" onChange={handleHeaderImageChange} />
                  </Label>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              {/* Profile Photo */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Foto de Perfil</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {pageConfig.profilePhoto ? (
                        <img src={pageConfig.profilePhoto} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-border" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                          <User className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="profilePhoto" className="cursor-pointer">
                        <div className="border-2 border-dashed border-border rounded-lg p-3 text-center hover:border-primary transition-colors">
                          <p className="text-sm text-muted-foreground">Clique para selecionar</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG até 2MB</p>
                        </div>
                        <Input id="profilePhoto" type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoChange} />
                      </Label>
                    </div>
                  </div>
                  {pageConfig.profilePhoto && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => savePageConfig({ ...pageConfig, profilePhoto: '' })}
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Remover foto
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Account Info */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Informações da Conta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Nome</span>
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Conta criada</span>
                    <span className="font-medium">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">Ativa</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="hidden lg:flex flex-col items-center justify-start pt-8 px-4 bg-muted/30 rounded-2xl min-w-[340px]">
          <p className="text-sm text-muted-foreground mb-4">Preview ao vivo</p>
          <PhonePreview config={pageConfig} userName={user.name} />
        </div>
      </div>
    </DashboardLayout>
  );
}
