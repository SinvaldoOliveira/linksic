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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAdmin = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;
    const token = String(body?.token || '');
    const kiwifyWebhookToken = Deno.env.get('KIWIFY_WEBHOOK_TOKEN');

    if (token !== kiwifyWebhookToken) {
      if (supabaseAdmin) {
        const emailRaw = String(body?.email || '').trim().toLowerCase();
        const eventoRaw = String(body?.evento || '').trim().toLowerCase() || 'unauthorized';
        try { await supabaseAdmin.from('webhook_logs').insert({ email: emailRaw, evento: 'unauthorized', plano_aplicado: 'free' }); } catch {}
      }
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const email = String(body?.email || '').trim().toLowerCase();
    const rawEvento = String(body?.evento || '').trim().toLowerCase();
    const produto = String(body?.produto || '').trim();

    const evento = (() => {
      const e = rawEvento.replace(/\s+/g, '.');
      if (/(cancelada|cancelado|canceled)/.test(e)) return 'assinatura.cancelada';
      if (/(atrasada|atrasado|overdue|past_due|delinquent)/.test(e)) return 'assinatura.atrasada';
      if (/(renovada|renovado|renewed|approved|aprovada|aprovado|paid|payment_success)/.test(e)) return 'assinatura.renovada';
      return rawEvento || 'desconhecido';
    })();

    if (!email) {
      throw new Error('E-mail ausente no corpo do webhook.');
    }

    if (!supabaseUrl || !serviceKey || !supabaseAdmin) {
      throw new Error('Variáveis de ambiente da Supabase não configuradas.');
    }

    let nextPlan: 'free' | 'pro' | 'master' = 'free';
    let linkLimit = 3;

    if (evento.includes('cancelada')) {
      nextPlan = 'free';
      linkLimit = 3;
    } else if (evento.includes('atrasada')) {
      if (supabaseAdmin) {
        const { data: lastPaid } = await supabaseAdmin
          .from('webhook_logs')
          .select('email, evento, created_at')
          .eq('email', email)
          .in('evento', ['assinatura.renovada', 'aprovada', 'approved', 'payment_success'])
          .order('created_at', { ascending: false })
          .limit(1);
        const lastTs = (lastPaid && lastPaid[0] && (lastPaid[0] as any).created_at) ? new Date((lastPaid[0] as any).created_at) : null;
        if (lastTs) {
          const diffDays = Math.floor((Date.now() - lastTs.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 39) {
            nextPlan = 'pro';
            linkLimit = 30;
          } else {
            nextPlan = 'free';
            linkLimit = 3;
          }
        } else {
          nextPlan = 'free';
          linkLimit = 3;
        }
      }
    } else if (evento.includes('renovada') || evento.includes('aprovada')) {
      if (/pro/i.test(produto)) {
        nextPlan = 'pro';
        linkLimit = 30;
      } else if (/master/i.test(produto)) {
        nextPlan = 'master';
        linkLimit = 30;
      } else {
        nextPlan = 'free';
        linkLimit = 3;
      }
    }

    const planoPt = nextPlan === 'pro' ? 'Pró' : nextPlan === 'master' ? 'Master' : 'Free';

    // Atualiza o plano e o limite de links do usuário
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ plan_type: nextPlan, plano: planoPt, link_limit: linkLimit })
      .eq('email', email);

    if (updateError) {
      console.error(`Erro ao atualizar o plano para ${email}:`, updateError);
    }

    // Log do evento recebido
    await supabaseAdmin.from('webhook_logs').insert({ email, evento, plano_aplicado: nextPlan });

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
