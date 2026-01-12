import { useState, useEffect, useRef } from 'react';
import { useAuth, getUserPageById, saveUserPageConfig, saveLink, deleteLink, updateLink, getLinks, reorderLinks, getAllowedLinkTypes } from '@/contexts/AuthContext';
import { normalizeSlug, extractYouTubeId } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { User, Image, Link, Palette, Plus, Trash2, ExternalLink, Copy, Menu, ChevronLeft, LayoutDashboard, FileText, Settings as SettingsIcon, LogOut, Check, X, Pencil, GripVertical, ImageIcon } from 'lucide-react';
import { PageConfig, PageLink, DEFAULT_PAGE_CONFIG } from '@/types/auth';
import { PhonePreview } from '@/components/PhonePreview';
import { useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/lib/storage';
import { Loader2, Upload } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UpgradeModal } from '@/components/UpgradeModal'; // Importar o modal
import { Badge } from '@/components/ui/badge';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Componente para item de lista ordenável
function SortableLinkItem({ link, pageConfig, setPageConfig, updateLink, removeLink, toggleLink }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "mb-3",
        isDragging && "opacity-75 shadow-lg rotate-1"
      )}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div 
              {...attributes} 
              {...listeners} 
              className="cursor-grab text-muted-foreground hover:text-foreground touch-none p-1 hover:bg-accent rounded"
            >
              <GripVertical className="h-5 w-5" />
            </div>

            {link.type === 'banner' && (
              <div className="h-10 w-16 bg-muted rounded overflow-hidden flex-shrink-0 border border-border relative">
                {link.imageUrl ? (
                  <img src={link.imageUrl} alt="Banner" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
            )}

            <div className="flex-1">
              <Input
                value={link.label}
                placeholder={link.type === 'banner' ? "Texto alternativo (opcional)" : "Título do botão"}
                onChange={(e) => {
                  const newConfig = {
                    ...pageConfig,
                    links: pageConfig.links.map((l: any) => l.id === link.id ? { ...l, label: e.target.value } : l)
                  };
                  setPageConfig(newConfig);
                }}
                onBlur={() => updateLink(link.id, { label: link.label })}
                className="font-medium h-9"
              />
            </div>

            <Switch
              checked={link.enabled}
              onCheckedChange={() => toggleLink(link.id)}
            />
            
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => removeLink(link.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="pl-10">
            <Input
              value={link.url}
              placeholder="https://..."
              onChange={(e) => {
                const newConfig = {
                  ...pageConfig,
                  links: pageConfig.links.map((l: any) => l.id === link.id ? { ...l, url: e.target.value } : l)
                };
                setPageConfig(newConfig);
              }}
              onBlur={() => updateLink(link.id, { url: link.url })}
              className="text-sm text-muted-foreground h-9"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SortableLinkItemCompact({ link }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md border bg-card mb-2",
        isDragging && "opacity-75 shadow-lg rotate-1"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground touch-none p-1 hover:bg-accent rounded"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex-1 text-sm font-medium truncate">
        {link.label || "(sem título)"}
      </div>
    </div>
  );
}

const COLOR_PALETTES = [
  { name: 'Roxo', primary: '#8B5CF6', secondary: '#A78BFA', background: '#1A1A2E', text: '#FFFFFF' },
  { name: 'Azul', primary: '#3B82F6', secondary: '#60A5FA', background: '#0F172A', text: '#FFFFFF' },
  { name: 'Verde', primary: '#10B981', secondary: '#34D399', background: '#064E3B', text: '#FFFFFF' },
  { name: 'Rosa', primary: '#EC4899', secondary: '#F472B6', background: '#500724', text: '#FFFFFF' },
  { name: 'Laranja', primary: '#F97316', secondary: '#FDBA74', background: '#431407', text: '#FFFFFF' },
  { name: 'Escuro', primary: '#333333', secondary: '#666666', background: '#000000', text: '#FFFFFF' },
  { name: 'Claro', primary: '#000000', secondary: '#333333', background: '#F3F4F6', text: '#000000' },
];

export default function Settings() {
  const { user, logout, isLoading, updatePageSlug, checkSlugAvailability } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pageConfig, setPageConfig] = useState<PageConfig>(DEFAULT_PAGE_CONFIG);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [menuOpen, setMenuOpen] = useState(true);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [editedSlug, setEditedSlug] = useState('');
  const [slugError, setSlugError] = useState('');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailabilityMessage, setSlugAvailabilityMessage] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingHeader, setIsUploadingHeader] = useState(false);
  const [headerPreviewUrl, setHeaderPreviewUrl] = useState<string>('');
  const [headerPendingFile, setHeaderPendingFile] = useState<File | null>(null);
  const [newLinkType, setNewLinkType] = useState<'button' | 'banner' | 'youtube' | 'whatsapp'>('button');
  const [allowedTypes, setAllowedTypes] = useState<Array<'button'|'banner'|'youtube'|'whatsapp'>>(['button','banner']);
  const [newLinkImage, setNewLinkImage] = useState('');
  const [isUploadingLinkImage, setIsUploadingLinkImage] = useState(false);
  const [newYouTubeUrl, setNewYouTubeUrl] = useState('');
  const videoId = extractYouTubeId(newYouTubeUrl);
  const [newWhatsappPhone, setNewWhatsappPhone] = useState('');
  const [newWhatsappMessage, setNewWhatsappMessage] = useState('');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false); // Estado para o modal

  // TODO: Substituir pela sua URL de checkout real da Kiwify
  const kiwifyCheckoutUrl = 'https://pay.kiwify.com.br/9NE5HJQ';

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const reorderTimerRef = useRef<any>(null);

  const saveOrderDebounced = (links: any[]) => {
    try {
      localStorage.setItem(`pageLinks_${user?.id}`, JSON.stringify(links));
    } catch (error) {
      toast({
        title: 'Aviso',
        description: 'Não foi possível salvar a ordem localmente.',
        variant: 'destructive',
      });
    }
    if (user) {
      if (reorderTimerRef.current) {
        clearTimeout(reorderTimerRef.current);
      }
      reorderTimerRef.current = setTimeout(() => {
        reorderLinks(user.id, links)
          .then(() => {
            toast({ title: 'Sucesso', description: 'Ordem dos links atualizada!' });
          })
          .catch(error => {
            console.error(error);
            toast({
              title: 'Erro de Sincronização',
              description: 'Não foi possível salvar a nova ordem no servidor. A ordem está salva localmente.',
              variant: 'destructive',
            });
          });
      }, 400);
    }
  };

  useEffect(() => {
    const fetchAllowed = async () => {
      if (!user) return;
      const types = await getAllowedLinkTypes(user.id);
      setAllowedTypes(types);
      if (!types.includes(newLinkType)) {
        setNewLinkType(types[0]);
      }
    };
    fetchAllowed();
  }, [user?.id, user?.plan_type]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPageConfig((currentConfig) => {
        const oldIndex = currentConfig.links.findIndex((item) => item.id === active.id);
        const newIndex = currentConfig.links.findIndex((item) => item.id === over.id);
        
        const newLinks = arrayMove(currentConfig.links, oldIndex, newIndex);

        saveOrderDebounced(newLinks);
        
        return {
          ...currentConfig,
          links: newLinks,
        };
      });
    }
  };

  const handleLinkImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Erro', description: 'Selecione uma imagem válida.', variant: 'destructive' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Erro', description: 'Máximo 2MB.', variant: 'destructive' });
      return;
    }

    setIsUploadingLinkImage(true);

    try {
      const publicUrl = await uploadFile(file);
      setNewLinkImage(publicUrl);
      toast({ title: 'Sucesso', description: 'Imagem carregada!' });
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Erro', description: 'Falha no upload.', variant: 'destructive' });
    } finally {
      setIsUploadingLinkImage(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
    if (!isLoading && user && user.role === 'admin') {
      navigate('/admin');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      // 1. Load from localStorage first for instant UI
      try {
        const localLinksData = localStorage.getItem(`pageLinks_${user.id}`);
        if (localLinksData) {
          const localLinks = JSON.parse(localLinksData);
          if (localLinks && localLinks.length > 0) {
            setPageConfig(prevConfig => ({ ...prevConfig, links: localLinks }));
          }
        }
      } catch (error) {
        console.error("Failed to load from localStorage", error);
        // Optional: toast notification if localStorage is corrupt
      }

      // 2. Fetch from DB to get the most recent state
      getUserPageById(user.id).then(page => {
        if (page?.config) {
          // Merge configs, giving precedence to DB links if they exist
          const dbLinks = page.config.links || [];
          setPageConfig(currentConfig => ({
            ...page.config,
            links: dbLinks.length > 0 ? dbLinks : currentConfig.links,
          }));

          // Update localStorage with fresh data from DB
          if (dbLinks.length > 0) {
            try {
              localStorage.setItem(`pageLinks_${user.id}`, JSON.stringify(dbLinks));
            } catch (error) {
              console.error("Failed to update localStorage with DB data", error);
            }
          }
        }
      });
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) return null;

  const publicUrl = `${window.location.origin}/u/${user.pageSlug}`;

  const handleSlugEdit = () => {
    setEditedSlug(user.pageSlug || '');
    setIsEditingSlug(true);
    setSlugError('');
  };

  const handleSlugCheck = async () => {
    if (!user || !editedSlug) return;

    setSlugError('');
    setSlugAvailabilityMessage('');
    setIsCheckingSlug(true);

    try {
      const isAvailable = await checkSlugAvailability(editedSlug, user.id);
      if (isAvailable) {
        setSlugAvailabilityMessage('Link disponível!');
      } else {
        setSlugError('Este link já está em uso ou é inválido.');
      }
    } catch (error) {
      console.error('Erro ao verificar slug:', error);
      setSlugError('Erro ao verificar disponibilidade do link.');
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const handleSlugSave = async () => {
    try {
      if (editedSlug === user.pageSlug) {
        setIsEditingSlug(false);
        return;
      }

      await updatePageSlug(editedSlug);
      setIsEditingSlug(false);
      toast({ title: 'Sucesso', description: 'Slug atualizado!' });
    } catch (error: any) {
      setSlugError(error.message);
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const savePageConfig = async (newConfig: PageConfig, showToast = true) => {
    try {
      await saveUserPageConfig(user.id, newConfig);
      setPageConfig(newConfig);
      if (showToast) {
        toast({ title: 'Salvo!', description: 'Alterações aplicadas' });
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Falha ao salvar configurações', variant: 'destructive' });
    }
  };

  const addLink = async () => {
    // Limitação para o plano gratuito
    if (user?.plan_type === 'free' && pageConfig.links.length >= 3) {
      setIsUpgradeModalOpen(true);
      return;
    }

    if (newLinkType === 'banner' && !newLinkImage) {
        toast({ title: 'Erro', description: 'Faça upload da imagem para o banner', variant: 'destructive' });
        return;
    }
    if (newLinkType === 'button' && (!newLinkLabel || !newLinkUrl)) {
        toast({ title: 'Erro', description: 'Preencha o título do botão', variant: 'destructive' });
        return;
    }
    if (newLinkType === 'youtube') {
      if (!newYouTubeUrl || !videoId) {
        toast({ title: 'Erro', description: 'Informe uma URL válida do YouTube', variant: 'destructive' });
        return;
      }
    }
    if (newLinkType === 'whatsapp') {
      const phone = (newWhatsappPhone || '').trim();
      if (!phone || !/^[0-9]{12,15}$/.test(phone)) {
        toast({ title: 'Erro', description: 'Informe um telefone válido com 12 a 15 dígitos', variant: 'destructive' });
        return;
      }
      // Sanitização extra da mensagem: bloquear links
      const urlPattern = new RegExp('https?://', 'i');
      if (newWhatsappMessage && urlPattern.test(newWhatsappMessage)) {
        toast({ title: 'Erro', description: 'A mensagem não deve conter links externos', variant: 'destructive' });
        return;
      }
    }

    const newLink: PageLink = {
      id: '', // ID será gerado pelo banco
      label: newLinkType === 'youtube' ? (newLinkLabel || 'YouTube') : (newLinkType === 'whatsapp' ? (newLinkLabel || 'Falar no WhatsApp') : newLinkLabel),
      url: newLinkType === 'youtube' ? '' : (newLinkType === 'whatsapp' ? '' : newLinkUrl),
      enabled: true,
      type: newLinkType,
      imageUrl: newLinkImage,
      position: pageConfig.links.length,
      videoId: newLinkType === 'youtube' ? videoId || '' : undefined,
      whatsappPhone: newLinkType === 'whatsapp' ? newWhatsappPhone : undefined,
      whatsappMessage: newLinkType === 'whatsapp' ? newWhatsappMessage : undefined
    };

    try {
      await saveLink(user.id, newLink);

      // Recarregar links
      const updatedLinks = await getLinks(user.id);
      const newConfig = { ...pageConfig, links: updatedLinks };
      setPageConfig(newConfig);

      setNewLinkLabel('');
      setNewLinkUrl('');
      setNewLinkImage('');
      setNewYouTubeUrl('');
      setNewWhatsappPhone('');
      setNewWhatsappMessage('');
      toast({ title: 'Sucesso', description: 'Link salvo com sucesso!' });
    } catch (error: any) {
      console.error('Erro ao salvar link (Frontend):', error);
      if (error?.code === 'FREE_PLAN_LIMIT_EXCEEDED' || /FREE_PLAN_LIMIT_EXCEEDED/i.test(error?.message || '')) {
        setIsUpgradeModalOpen(true);
        toast({
          title: 'Limite atingido',
          description: 'Seu plano gratuito permite até 3 links. Faça upgrade para liberar ilimitado.',
          variant: 'destructive'
        });
        return;
      }
      toast({
        title: 'Erro ao salvar',
        description: error.message || error.details || 'Verifique o console para mais detalhes',
        variant: 'destructive'
      });
    }
  };

  const removeLink = async (id: string) => {
    try {
      await deleteLink(id);

      // Atualizar estado local
      const newConfig = {
        ...pageConfig,
        links: pageConfig.links.filter(link => link.id !== id)
      };
      setPageConfig(newConfig);
      toast({ title: 'Sucesso', description: 'Link removido' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Erro ao remover link', variant: 'destructive' });
    }
  };

  const toggleLink = async (id: string) => {
    const linkToUpdate = pageConfig.links.find(l => l.id === id);
    if (!linkToUpdate) return;

    try {
      const newState = !linkToUpdate.enabled;
      await updateLink(id, { enabled: newState });

      // Atualizar estado local
      const newConfig = {
        ...pageConfig,
        links: pageConfig.links.map(link =>
          link.id === id ? { ...link, enabled: newState } : link
        )
      };
      setPageConfig(newConfig);
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Erro ao atualizar link', variant: 'destructive' });
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast({ title: 'Copiado!', description: 'URL copiada para a área de transferência' });
  };

  const handlePaletteSelect = (palette: typeof COLOR_PALETTES[0]) => {
    const newConfig = {
      ...pageConfig,
      colorPalette: {
        primary: palette.primary,
        secondary: palette.secondary,
        background: palette.background,
        text: palette.text
      }
    };
    savePageConfig(newConfig, false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'header') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      toast({ title: 'Erro', description: 'Formato inválido. Use JPEG ou PNG.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Erro', description: 'A imagem deve ter no máximo 5MB.', variant: 'destructive' });
      return;
    }

    if (type === 'photo') setIsUploadingPhoto(true);
    else setIsUploadingHeader(true);

    try {
      const publicUrl = await uploadFile(file);

      const newConfig = {
        ...pageConfig,
        [type === 'photo' ? 'profilePhoto' : 'headerImage']: publicUrl
      };

      await savePageConfig(newConfig);
      toast({ title: 'Sucesso', description: 'Imagem enviada com sucesso!' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Erro no upload', description: error.message || 'Falha ao enviar imagem', variant: 'destructive' });
    } finally {
      if (type === 'photo') setIsUploadingPhoto(false);
      else setIsUploadingHeader(false);
    }
  };

  const handleHeaderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      toast({ title: 'Erro', description: 'Formato inválido. Use JPEG ou PNG.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Erro', description: 'A imagem deve ter no máximo 5MB.', variant: 'destructive' });
      return;
    }
    setHeaderPendingFile(file);
    const url = URL.createObjectURL(file);
    setHeaderPreviewUrl(url);
  };

  const confirmHeaderUpload = async () => {
    if (!headerPendingFile) return;
    setIsUploadingHeader(true);
    try {
      const publicUrl = await uploadFile(headerPendingFile);
      const newConfig = {
        ...pageConfig,
        headerImage: publicUrl
      };
      await savePageConfig(newConfig);
      toast({ title: 'Sucesso', description: 'Banner atualizado!' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Erro no upload', description: error.message || 'Falha ao enviar imagem', variant: 'destructive' });
    } finally {
      setIsUploadingHeader(false);
      if (headerPreviewUrl) URL.revokeObjectURL(headerPreviewUrl);
      setHeaderPreviewUrl('');
      setHeaderPendingFile(null);
    }
  };

  const cancelHeaderPreview = () => {
    if (headerPreviewUrl) URL.revokeObjectURL(headerPreviewUrl);
    setHeaderPreviewUrl('');
    setHeaderPendingFile(null);
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-card border-r transition-transform duration-300 ease-in-out z-40 md:relative md:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full w-64">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-8" />
              <span className="font-bold text-lg">LinkSinc</span>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(false)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <NavLink
              to="/dashboard"
              end
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              activeClassName="bg-primary/10 text-primary font-medium"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/dashboard/settings"
              end
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              activeClassName="bg-primary/10 text-primary font-medium"
            >
              <SettingsIcon className="h-4 w-4" />
              <span>Configurações</span>
            </NavLink>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Minha Página</span>
            </a>
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {pageConfig.profilePhoto ? (
                  <img src={pageConfig.profilePhoto} alt="User" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold truncate">{user.name}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                {user.plan_type && (
                  <Badge 
                    variant={user.plan_type === 'pro' ? 'default' : 'secondary'}
                    className="mt-2"
                  >
                    Plano {user.plan_type.charAt(0).toUpperCase() + user.plan_type.slice(1)}
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </aside>

      {menuOpen && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setMenuOpen(false)}></div>}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b h-16 flex items-center px-6 justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Configurações</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                Ver minha página <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="sm" onClick={handleCopyUrl}>
              Copiar URL <Copy className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden md:overflow-visible">
          <div className="w-full md:w-7/12 lg:w-1/3 border-r overflow-y-auto p-4 md:p-6 space-y-8">
            <Tabs defaultValue="links">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="links">Links</TabsTrigger>
                <TabsTrigger value="appearance">Aparência</TabsTrigger>
              </TabsList>
              <TabsContent value="links" className="pt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Adicionar novo link</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup defaultValue={allowedTypes[0]} value={newLinkType} onValueChange={(value: any) => setNewLinkType(value)} className="grid grid-cols-2 gap-4">
                      {allowedTypes.includes('button') && (
                        <div>
                          <RadioGroupItem value="button" id="r1" className="peer sr-only" />
                          <Label htmlFor="r1" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Botão
                          </Label>
                        </div>
                      )}
                      {allowedTypes.includes('banner') && (
                        <div>
                          <RadioGroupItem value="banner" id="r2" className="peer sr-only" />
                          <Label htmlFor="r2" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Banner
                          </Label>
                        </div>
                      )}
                      {allowedTypes.includes('youtube') && (
                        <div>
                          <RadioGroupItem value="youtube" id="r3" className="peer sr-only" />
                          <Label htmlFor="r3" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Youtube
                          </Label>
                        </div>
                      )}
                      {allowedTypes.includes('whatsapp') && (
                        <div>
                          <RadioGroupItem value="whatsapp" id="r4" className="peer sr-only" />
                          <Label htmlFor="r4" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Whatsapp
                          </Label>
                        </div>
                      )}
                    </RadioGroup>

                    {newLinkType === 'button' && (
                      <>
                        <div className="space-y-1">
                          <Label htmlFor="new-link-label">Título do botão</Label>
                          <Input
                            id="new-link-label"
                            value={newLinkLabel}
                            onChange={(e) => setNewLinkLabel(e.target.value)}
                            placeholder="Ex: Meu Website"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="new-link-url">URL</Label>
                          <Input
                            id="new-link-url"
                            value={newLinkUrl}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </>
                    )}

                    {newLinkType === 'banner' && (
                      <div className="space-y-2">
                        <Label>Imagem do banner</Label>
                        <div className="flex items-center gap-4">
                          <div className="w-24 h-14 bg-muted rounded-md flex items-center justify-center border overflow-hidden">
                            {isUploadingLinkImage ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : newLinkImage ? (
                              <img src={newLinkImage} alt="Preview" className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <Input id="link-image-upload" type="file" accept="image/*" onChange={handleLinkImageUpload} className="hidden" />
                          <Button asChild variant="outline">
                            <Label htmlFor="link-image-upload">
                              <Upload className="mr-2 h-4 w-4" />
                              Carregar
                            </Label>
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="new-link-url-banner">URL de destino</Label>
                          <Input
                            id="new-link-url-banner"
                            value={newLinkUrl}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    )}

                    {allowedTypes.includes('youtube') && newLinkType === 'youtube' && (
                      <div className="space-y-2">
                        <Label htmlFor="youtube-url">URL do YouTube</Label>
                        <Input
                          id="youtube-url"
                          value={newYouTubeUrl}
                          onChange={(e) => setNewYouTubeUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </div>
                    )}

                    {allowedTypes.includes('whatsapp') && newLinkType === 'whatsapp' && (
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp-phone">Telefone (somente números)</Label>
                        <Input
                          id="whatsapp-phone"
                          value={newWhatsappPhone}
                          onChange={(e) => setNewWhatsappPhone(e.target.value)}
                          placeholder="Ex: 5511999999999"
                        />
                        <Label htmlFor="whatsapp-msg">Mensagem (sem links)</Label>
                        <Input
                          id="whatsapp-msg"
                          value={newWhatsappMessage}
                          onChange={(e) => setNewWhatsappMessage(e.target.value)}
                          placeholder="Sua mensagem..."
                        />
                      </div>
                    )}
                    <Button onClick={addLink} className="w-full">
                      <Plus className="mr-2 h-4 w-4" /> Adicionar Link
                    </Button>
                  </CardContent>
                </Card>

                <Separator className="my-6" />

                <h3 className="text-lg font-medium mb-4">Meus Links</h3>
                <div className="space-y-3">
                  {pageConfig.links.length === 0 && (
                    <div className="text-center text-muted-foreground py-6">
                      <p>Nenhum link adicionado ainda.</p>
                    </div>
                  )}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={pageConfig.links}
                      strategy={verticalListSortingStrategy}
                    >
                      {pageConfig.links.map(link => (
                        <SortableLinkItem
                          key={link.id}
                          link={link}
                          pageConfig={pageConfig}
                          setPageConfig={setPageConfig}
                          updateLink={updateLink}
                          removeLink={removeLink}
                          toggleLink={toggleLink}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              </TabsContent>
              <TabsContent value="appearance" className="pt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Perfil</CardTitle>
                    <CardDescription>Informações que aparecem na sua página.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center border overflow-hidden">
                        {isUploadingPhoto ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : pageConfig.profilePhoto ? (
                          <img src={pageConfig.profilePhoto} alt="Foto de Perfil" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <User className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <Input id="photo-upload" type="file" accept="image/jpeg,image/png" onChange={(e) => handleFileUpload(e, 'photo')} className="hidden" />
                      <Button asChild variant="outline">
                        <Label htmlFor="photo-upload">
                          <Upload className="mr-2 h-4 w-4" />
                          Carregar foto
                        </Label>
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="profile-title">Título</Label>
                      <Input
                        id="profile-title"
                        value={pageConfig.profileTitle}
                        onChange={(e) => setPageConfig({ ...pageConfig, profileTitle: e.target.value })}
                        onBlur={() => savePageConfig(pageConfig)}
                        placeholder="@seuusuario"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="profile-bio">Bio</Label>
                      <Input
                        id="profile-bio"
                        value={pageConfig.bio}
                        onChange={(e) => setPageConfig({ ...pageConfig, bio: e.target.value })}
                        onBlur={() => savePageConfig(pageConfig)}
                        placeholder="Uma breve descrição sobre você"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Banner do topo</CardTitle>
                    <CardDescription>Imagem exibida no topo do seu mini site.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="header-upload">Imagem do banner (JPEG/PNG, máx. 5MB)</Label>
                      <div className="w-full h-24 bg-muted rounded-md flex items-center justify-center border overflow-hidden">
                        {isUploadingHeader ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : headerPreviewUrl ? (
                          <img src={headerPreviewUrl} alt="Preview do banner" className="w-full h-full object-cover" loading="lazy" />
                        ) : pageConfig.headerImage ? (
                          <img src={pageConfig.headerImage} alt="Banner atual" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="text-sm text-muted-foreground">Nenhum banner definido</div>
                        )}
                      </div>
                      <Input id="header-upload" type="file" accept="image/jpeg,image/png" onChange={handleHeaderSelect} className="hidden" />
                      <div className="flex gap-2">
                        <Button asChild variant="outline">
                          <Label htmlFor="header-upload">
                            <Upload className="mr-2 h-4 w-4" />
                            Selecionar imagem
                          </Label>
                        </Button>
                        <Button onClick={confirmHeaderUpload} disabled={!headerPendingFile || isUploadingHeader}>
                          Salvar banner
                        </Button>
                        {headerPendingFile && (
                          <Button variant="ghost" onClick={cancelHeaderPreview}>
                            Cancelar
                          </Button>
                        )}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost">Ajuda</Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 text-sm">
                            <p className="font-medium mb-2">Como funciona o banner:</p>
                            <ul className="space-y-1">
                              <li>• Formatos permitidos: JPEG e PNG</li>
                              <li>• Tamanho máximo: 5MB</li>
                              <li>• Selecione a imagem para ver o preview</li>
                              <li>• Clique em “Salvar banner” para aplicar</li>
                              <li>• O banner aparece no topo do preview e da página pública</li>
                            </ul>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Link da Página</CardTitle>
                    <CardDescription>Personalize a URL da sua página pública.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isEditingSlug ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm whitespace-nowrap">{window.location.origin}/u/</span>
                          <Input
                            value={editedSlug}
                            onChange={(e) => setEditedSlug(normalizeSlug(e.target.value))}
                            className="h-9"
                          />
                        </div>
                        {slugError && <p className="text-sm text-destructive">{slugError}</p>}
                        {slugAvailabilityMessage && <p className="text-sm text-green-600">{slugAvailabilityMessage}</p>}
                        <div className="flex gap-2">
                          <Button onClick={handleSlugCheck} size="sm" disabled={isCheckingSlug}>
                            {isCheckingSlug ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Verificar
                          </Button>
                          <Button onClick={handleSlugSave} size="sm" variant="default">Salvar</Button>
                          <Button onClick={() => setIsEditingSlug(false)} size="sm" variant="ghost">Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-2 rounded-md bg-muted">
                        <span className="text-sm text-muted-foreground">{publicUrl}</span>
                        <Button onClick={handleSlugEdit} size="sm" variant="outline">
                          <Pencil className="mr-2 h-3 w-3" />
                          Editar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tema</CardTitle>
                    <CardDescription>Escolha uma paleta de cores para sua página.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {COLOR_PALETTES.map(palette => (
                        <button
                          key={palette.name}
                          onClick={() => handlePaletteSelect(palette)}
                          className={cn(
                            "p-2 rounded-lg border-2 transition-all",
                            pageConfig.colorPalette?.primary === palette.primary ? "border-primary" : "border-transparent hover:border-muted-foreground/50"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: palette.primary }}></div>
                            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: palette.secondary }}></div>
                          </div>
                          <div className="w-full h-8 rounded" style={{ backgroundColor: palette.background }}></div>
                          <p className="text-xs mt-2 text-center font-medium">{palette.name}</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="w-full md:w-5/12 lg:w-2/3 bg-muted/20 md:sticky md:top-16 md:h-[calc(100vh-4rem)] flex items-start justify-center p-4 md:p-6 overflow-auto">
            <PhonePreview config={pageConfig} />
          </div>
        </div>
        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          checkoutUrl={kiwifyCheckoutUrl}
        />
      </div>
    </div>
  );
}
