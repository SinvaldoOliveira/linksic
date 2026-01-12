import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const token = String(body?.token || '');
    const kiwifyWebhookToken = Deno.env.get('KIWIFY_WEBHOOK_TOKEN');

    if (!kiwifyWebhookToken || token !== kiwifyWebhookToken) {
      console.warn('Tentativa de acesso não autorizado ao webhook Kiwify.', { token });
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const email = String(body?.email || '').trim().toLowerCase();
    const evento = String(body?.evento || '').trim().toLowerCase();
    const produtoRaw = String(body?.produto || '').trim().toLowerCase();

    if (!email) {
      throw new Error('E-mail ausente no corpo do webhook.');
    }

    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Variáveis de ambiente da Supabase não configuradas.');
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    let nextPlan: 'free' | 'pro' | 'master' = 'free';
    if (evento.includes('cancelada') || evento.includes('atrasada') || evento.includes('cancelado') || evento.includes('atrasado')) {
      nextPlan = 'free';
    } else if (evento.includes('renovada') || evento.includes('aprovada') || evento.includes('renovado') || evento.includes('aprovado')) {
      if (produtoRaw.includes('pro')) {
        nextPlan = 'pro';
      } else if (produtoRaw.includes('master')) {
        nextPlan = 'master';
      } else {
        nextPlan = 'free'; // Default para 'free' se o produto não for 'pro' ou 'master'
      }
    }

    // Log do evento recebido
    await supabaseAdmin.from('webhook_logs').insert({ email, evento });

    const planoPt = nextPlan === 'pro' ? 'Pró' : nextPlan === 'master' ? 'Master' : 'Free';

    // Atualiza o plano do usuário
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ plan_type: nextPlan, plano: planoPt })
      .eq('email', email);

    if (error) {
      console.error(`Erro ao atualizar o plano para ${email}:`, error);
      // Mesmo com erro, retornamos 200 para evitar que a Kiwify envie o mesmo webhook repetidamente.
      // O erro já foi logado.
    }

    return new Response(JSON.stringify({ ok: true, plan: nextPlan }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Erro ao processar webhook da Kiwify:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Bad Request' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
