import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, UserPage, PageConfig, DEFAULT_PAGE_CONFIG, PageLink } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import { normalizeSlug } from '@/lib/utils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeStorageRef = (ref: string) => {
  let r = ref.trim();
  r = r.replace(/^https?:\/\/[^/]*\/storage\/v1\/object\/public\/images\//i, '');
  r = r.replace(/^\/?storage\/files\/buckets\/images\/?/i, '');
  r = r.replace(/^images\//i, '');
  return r;
};

const generateSlug = (name: string, id?: string) => {
  const clean = normalizeSlug(name);
  if (id) {
    return clean + '-' + id.slice(-4);
  }
  return clean;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, status, created_at, page_slug, theme, plan_type')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser && authUser.id === userId) {
          const name = authUser.user_metadata.name || 'Usuário';
          const pageSlug = authUser.user_metadata.pageSlug || generateSlug(name, Math.random().toString(36).substr(2, 4));

          const insertPayload = {
            id: userId,
            name: name,
            email: authUser.email || '',
            role: 'user',
            status: 'active',
            page_slug: pageSlug,
            theme: 'light'
          };
          await supabase.from('profiles').insert(insertPayload).select();
          await supabase.from('pages').insert({
            user_id: userId,
            user_name: name,
            config: DEFAULT_PAGE_CONFIG
          });

          const newUser: User = {
            id: insertPayload.id,
            name: insertPayload.name,
            email: insertPayload.email,
            role: insertPayload.role as 'user',
            status: insertPayload.status as 'active',
            createdAt: new Date().toISOString(),
            pageSlug: insertPayload.page_slug,
            theme: 'light',
            plan_type: 'free'
          };
          setUser(newUser);
        }
      } else if (data) {
        const mapped: User = {
          id: data.id,
          name: data.name,
          email: data.email || '',
          role: data.role,
          status: data.status,
          createdAt: data.created_at,
          pageSlug: data.page_slug,
          theme: data.theme || 'light',
          plan_type: data.plan_type || 'free'
        };
        setUser(mapped);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Email não confirmado. Verifique sua caixa de entrada.';
        }
        return { success: false, error: errorMessage };
      }

      if (data.user) {
        await fetchProfile(data.user.id);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Ocorreu um erro ao fazer login' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Generate a temporary ID for slug generation (will be replaced by actual ID in DB trigger if needed, 
      // but here we just need a unique suffix. Supabase ID is not available yet.
      // We can use a random string for the slug suffix)
      const randomSuffix = Math.random().toString(36).substr(2, 4);
      const pageSlug = normalizeSlug(name);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'user',
            pageSlug,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Explicitly create profile and page to ensure name and email are saved
        // as requested by the user, avoiding sole reliance on DB triggers.
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            name: name,
            email: email,
            role: 'user',
            status: 'active',
            page_slug: pageSlug,
            theme: 'light'
          });

          await supabase.from('pages').upsert({
            user_id: data.user.id,
            user_name: name,
            config: DEFAULT_PAGE_CONFIG
          });
        } catch (dbError) {
          console.error('Error in manual profile/page creation:', dbError);
          // We don't block the registration success if this fails, 
          // as the trigger might have actually worked or it might be an RLS issue.
        }

        return { success: true };
      }

      return { success: false, error: 'Erro ao criar conta' };
    } catch (error) {
      return { success: false, error: 'Ocorreu um erro ao registrar' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
  };

  const updateTheme = async (theme: 'light' | 'dark') => {
    if (!user) return;

    // UI Update
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // State Update
    setUser(prev => prev ? { ...prev, theme } : null);

    // DB Update
    try {
      await supabase
        .from('profiles')
        .update({ theme })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const updatePageSlug = async (requestedSlug: string) => {
    if (!user) return;

    const newSlug = normalizeSlug(requestedSlug);

    if (!newSlug) {
      throw new Error('O slug não pode ser vazio.');
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(newSlug)) {
      throw new Error('O link deve conter apenas letras minúsculas, números e hífens.');
    }

    // Check if already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('page_slug', newSlug)
      .neq('id', user.id)
      .single();

    if (existingUser) {
      throw new Error('Este link já está em uso por outro usuário.');
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        page_slug: newSlug
      }, { onConflict: 'id' })
      .select();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Este link já está em uso.');
      }
      throw error;
    }

    // Sincronizar metadados de autenticação
    await supabase.auth.updateUser({
      data: { pageSlug: newSlug }
    });

    // Update local state
    setUser(prev => prev ? { ...prev, pageSlug: newSlug } : null);
  };

  const checkSlugAvailability = async (newSlug: string, currentUserId: string): Promise<boolean> => {
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(newSlug)) {
      return false; // Formato inválido, não disponível
    }

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('page_slug', newSlug)
      .neq('id', currentUserId)
      .single();
    
    return !existingUser; // Retorna true se não houver usuário existente com esse slug
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateTheme, updatePageSlug, checkSlugAvailability }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helpers agora precisam ser chamados via Supabase diretamente nos componentes, 
// mas para compatibilidade (e para não quebrar tudo de uma vez), 
// vamos exportar funções que façam o fetch. 
// ATENÇÃO: Componentes que esperam retorno síncrono VÃO QUEBRAR se não forem atualizados.

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, status, created_at, page_slug, plan_type, plano');

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    email: row.email || '',
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    pageSlug: row.page_slug,
    plan_type: row.plan_type as ('free' | 'pro' | 'master') | undefined
  }));
}

export async function getAllowedLinkTypes(userId: string): Promise<Array<'button'|'banner'|'youtube'|'whatsapp'>> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_type')
    .eq('id', userId)
    .single();
  const planType = (profile?.plan_type as 'free' | 'pro') || 'free';
  const allowed = planType === 'free' ? ['button','banner'] : ['button','banner','youtube','whatsapp'];
  try {
    await supabase.from('feature_access_audit').insert({
      user_id: userId,
      plan_type: planType,
      feature: allowed.join(','),
      action: 'options_refreshed'
    });
  } catch {}
  return allowed;
}

export async function updateUserStatus(userId: string, status: 'active' | 'blocked') {
  const { error } = await supabase
    .from('profiles')
    .update({ status })
    .eq('id', userId);

  if (error) console.error('Error updating status:', error);
}

export async function getLinks(userId: string): Promise<PageLink[]> {
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching links:', error);
    return [];
  }

  return data.map((link: any) => {
    let imageUrl = link.image_url;
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      const key = normalizeStorageRef(imageUrl);
      const { data: pu } = supabase.storage.from('images').getPublicUrl(key);
      imageUrl = pu.publicUrl;
    }
    return {
      id: link.id,
      label: link.label,
      url: link.link_url,
      enabled: link.enabled,
      type: link.type || 'button',
      imageUrl,
      position: link.position || 0,
      videoId: link.video_id || undefined,
      whatsappPhone: link.whatsapp_phone || undefined,
      whatsappMessage: link.whatsapp_message || undefined
    };
  });
}

export async function saveLink(userId: string, link: PageLink) {
  console.log('Tentando salvar link:', { userId, link });

  // Validar HTTPS se for um link externo
  if (link.type !== 'whatsapp') {
    if (link.url && !link.url.startsWith('http://') && !link.url.startsWith('https://')) {
      link.url = 'https://' + link.url;
    }
  }

  // Checar plano e limite de links no servidor
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', userId)
      .single();

    const planType = (profile?.plan_type as 'free' | 'pro') || 'free';
    if (planType === 'free' && (link.type === 'youtube' || link.type === 'whatsapp')) {
      try {
        await supabase.from('feature_access_audit').insert({
          user_id: userId,
          plan_type: planType,
          feature: link.type,
          action: 'attempt_premium_feature'
        });
      } catch {}
      const err = new Error('Recurso indisponível no plano gratuito.');
      (err as any).code = 'FEATURE_NOT_AVAILABLE';
      throw err;
    }
    if (planType === 'free') {
      const { count } = await supabase
        .from('links')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if ((count || 0) >= 3) {
        // Registrar tentativa para análise
        await supabase.from('link_limit_events').insert({ user_id: userId });
        const err = new Error('Limite do plano gratuito atingido. Faça upgrade para adicionar mais links.');
        // Anexar um código para tratamento específico no frontend
        (err as any).code = 'FREE_PLAN_LIMIT_EXCEEDED';
        throw err;
      }
    }
  } catch (precheckError) {
    if ((precheckError as any)?.code === 'FREE_PLAN_LIMIT_EXCEEDED') {
      throw precheckError;
    }
    // Se houver erro inesperado na checagem, prosseguir para tentar salvar (RLS/trigger podem proteger)
  }

  const { data: maxPosData } = await supabase
    .from('links')
    .select('position')
    .eq('user_id', userId)
    .order('position', { ascending: false })
    .limit(1);
  const nextPosition = (maxPosData?.[0]?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from('links')
    .insert({
      user_id: userId,
      label: link.label,
      link_url: link.type === 'whatsapp' ? null : link.url,
      enabled: link.enabled,
      type: link.type || 'button',
      image_url: link.imageUrl ? normalizeStorageRef(link.imageUrl) : null,
      video_id: link.videoId || null,
      position: nextPosition,
      whatsapp_phone: link.whatsappPhone || null,
      whatsapp_message: link.whatsappMessage || null
    })
    .select();

  if (error) {
    console.error('Erro detalhado do Supabase (saveLink):', error);

    // Auto-fix: Se o erro for de chave estrangeira (usuário sem perfil), tentar criar o perfil
    if (error.code === '23503') { // 23503 é foreign_key_violation no Postgres
      console.log('Detectado usuário sem perfil. Tentando corrigir automaticamente...');

      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser && authUser.id === userId) {
        const name = authUser.user_metadata.name || 'Usuário';
        const pageSlug = authUser.user_metadata.pageSlug || generateSlug(name, Math.random().toString(36).substr(2, 4));

        // 1. Criar Perfil
        const { error: profileError } = await supabase.from('profiles').insert({
          id: userId,
          name: name,
          email: authUser.email || '',
          role: 'user',
          status: 'active',
          page_slug: pageSlug
        });

        if (profileError) console.error('Erro ao criar perfil fallback:', profileError);

        // 2. Criar Página
        const { error: pageError } = await supabase.from('pages').insert({
          user_id: userId,
          user_name: name,
          config: DEFAULT_PAGE_CONFIG
        });

        if (pageError) console.error('Erro ao criar página fallback:', pageError);

        // 3. Tentar salvar o link novamente
        const { error: retryError } = await supabase.from('links').insert({
          user_id: userId,
          label: link.label,
          link_url: link.url,
          enabled: link.enabled
        });

        if (retryError) throw retryError;
        return; // Sucesso no retry
      }
    }

    throw error;
  }
  console.log('Link salvo com sucesso:', data);
}

export async function deleteLink(linkId: string) {
  const { error } = await supabase
    .from('links')
    .delete()
    .eq('id', linkId);

  if (error) throw error;
}

export async function updateLink(linkId: string, updates: Partial<PageLink>) {
  // Mapear campos do frontend para o backend
  const dbUpdates: any = {};
  if (updates.label !== undefined) dbUpdates.label = updates.label;
  if (updates.url !== undefined) dbUpdates.link_url = updates.url;
  if (updates.enabled !== undefined) dbUpdates.enabled = updates.enabled;
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl ? normalizeStorageRef(updates.imageUrl) : null;
  if (updates.position !== undefined) dbUpdates.position = updates.position;
  if (updates.videoId !== undefined) dbUpdates.video_id = updates.videoId || null;
  if (updates.whatsappPhone !== undefined) dbUpdates.whatsapp_phone = updates.whatsappPhone || null;
  if (updates.whatsappMessage !== undefined) dbUpdates.whatsapp_message = updates.whatsappMessage || null;

  const { error } = await supabase
    .from('links')
    .update(dbUpdates)
    .eq('id', linkId);

  if (error) throw error;
}

export async function reorderLinks(userId: string, links: PageLink[]) {
  const minimalUpdates = links.map((link, index) => ({
    id: link.id,
    position: index,
  }));

  const { error } = await supabase
    .from('links')
    .upsert(minimalUpdates, { onConflict: 'id' });

  if (error) {
    console.error('Error reordering links (upsert minimal):', error);
    // Fallback: tentar atualizar individualmente apenas a posição
    for (let i = 0; i < minimalUpdates.length; i++) {
      const u = minimalUpdates[i];
      const { error: updateError } = await supabase
        .from('links')
        .update({ position: u.position })
        .eq('id', u.id)
        .eq('user_id', userId);
      if (updateError) {
        console.error('Error reordering link (update fallback):', updateError);
        throw updateError;
      }
    }
  }
}

export async function getUserPage(slug: string): Promise<UserPage | null> {
  // Primeiro buscar o usuário pelo slug
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('page_slug', slug)
    .single();

  if (profileError || !profile) return null;

  // Depois buscar a página (config visual)
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('*')
    .eq('user_id', profile.id)
    .single();

  if (pageError) return null;

  // Buscar os links da tabela relacional
  const links = await getLinks(profile.id);

  // Mesclar links da tabela com a config visual
  const fullConfig = {
    ...page.config,
    links: links
  };

  return {
    userId: page.user_id,
    userName: page.config?.displayName || profile.name,
    createdAt: page.created_at,
    config: fullConfig
  } as UserPage;
}

// Helper para buscar config pelo ID do usuário (para Settings)
export async function getUserPageById(userId: string): Promise<UserPage | null> {
  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) return null;

  // Buscar os links da tabela relacional
  const links = await getLinks(userId);

  // Mesclar links da tabela com a config visual
  const fullConfig = {
    ...page.config,
    links: links
  };

  return {
    userId: page.user_id,
    userName: page.config?.displayName || page.user_name,
    createdAt: page.created_at,
    config: fullConfig
  } as UserPage;
}


export async function saveUserPageConfig(userId: string, config: PageConfig) {
  const { error } = await supabase
    .from('pages')
    .update({ config })
    .eq('user_id', userId);

  if (error) throw error;
}
