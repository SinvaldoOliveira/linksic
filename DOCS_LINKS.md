
# Documentação da Solução de Salvamento de Links

## Visão Geral
Esta solução implementa um sistema robusto para salvar o slug da página pública do usuário (que define a URL do mini-site) e links externos, garantindo integridade de dados e segurança.

## 1. Estrutura do Banco de Dados (Schema)

A tabela principal envolvida é a `public.profiles`.

```sql
create table public.profiles (
  id uuid references auth.users not null primary key,
  page_slug text unique, -- O "link público" do usuário
  updated_at timestamp with time zone
  -- outros campos...
);
```

## 2. Implementação do Salvamento (UPSERT)

A função `updatePageSlug` no arquivo `src/contexts/AuthContext.tsx` utiliza a estratégia de UPSERT (Update or Insert) para garantir que a operação funcione mesmo em casos de borda onde o registro possa estar inconsistente.

### Código SQL Equivalente
A operação realizada pelo cliente Supabase equivale ao seguinte SQL:

```sql
INSERT INTO public.profiles (id, page_slug, updated_at)
VALUES ('user_uuid', 'novo-slug', NOW())
ON CONFLICT (id)
DO UPDATE SET
  page_slug = EXCLUDED.page_slug,
  updated_at = NOW();
```

### Código TypeScript Implementado

```typescript
// src/contexts/AuthContext.tsx

export async function updatePageSlug(userId: string, newSlug: string) {
  // 1. Validação de Formato
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(newSlug)) {
    throw new Error('O link deve conter apenas letras minúsculas, números e hífens.');
  }

  // 2. Verificação de Unicidade
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('page_slug', newSlug)
    .neq('id', userId)
    .single();

  if (existingUser) {
    throw new Error('Este link já está em uso por outro usuário.');
  }

  // 3. Execução do UPSERT
  const { error } = await supabase
    .from('profiles')
    .upsert({ 
        id: userId, 
        page_slug: newSlug,
        updated_at: new Date().toISOString()
    }, { onConflict: 'id' })
    .select();

  if (error) throw error;
}
```

## 3. Validação de Links Externos (HTTPS)

Para links externos adicionados à página ("Meus Links"), foi adicionada uma validação automática na função `saveLink` que garante o uso de HTTPS.

```typescript
export async function saveLink(userId: string, link: PageLink) {
   // Auto-fix: adicionar https:// se não tiver protocolo
   if (link.url && !link.url.startsWith('http://') && !link.url.startsWith('https://')) {
       link.url = 'https://' + link.url;
   }
   // ... insert logic
}
```

## 4. Testes e Verificação

### Teste Manual de Slug
1. Acesse o Editor de Página (`/dashboard/settings`).
2. Clique no ícone de lápis ao lado do link público.
3. Tente inserir um slug inválido (ex: "Link Com Espaço"). O sistema deve bloquear.
4. Tente inserir um slug já existente (de outro usuário). O sistema deve alertar erro.
5. Insira um slug válido e salve. A página deve recarregar com o novo link.
6. Tente acessar `http://localhost:8080/u/novo-slug`. O mini-site deve carregar.

### Teste de Link Externo
1. Na aba "Links", adicione um link com URL `www.google.com` (sem https).
2. Clique em Adicionar.
3. Verifique no banco de dados ou na lista: a URL deve ter sido salva como `https://www.google.com`.

