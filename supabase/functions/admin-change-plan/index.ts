import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Body = {
  targetUserId: string;
  newPlan: 'free' | 'pro' | 'master';
  adminEmail?: string;
  adminPassword: string;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase environment secrets missing');
    }

    const body = (await req.json()) as Body;
    const { targetUserId, newPlan, adminEmail, adminPassword } = body;
    if (!targetUserId || !newPlan || !adminPassword) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: authUserData } = await supabase.auth.getUser();
    const adminId = authUserData?.user?.id || '';
    const adminMail = adminEmail || authUserData?.user?.email || '';
    if (!adminId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    if (adminId === targetUserId) {
      return new Response(JSON.stringify({ error: 'Self modification is blocked' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    // Revalidar senha do admin via signInWithPassword
    const { data: reauth, error: reauthErr } = await adminClient.auth.signInWithPassword({
      email: adminMail,
      password: adminPassword,
    });
    if (reauthErr || !reauth?.user) {
      return new Response(JSON.stringify({ error: 'Invalid admin credentials' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Verificar papel super_admin
    const { data: adminProfile } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('id', adminId)
      .single();
    if (!adminProfile || adminProfile.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Admin not permitted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Buscar plano atual do usuário alvo
    const { data: targetProfile, error: targetErr } = await adminClient
      .from('profiles')
      .select('id, email, plan_type, plano')
      .eq('id', targetUserId)
      .single();
    if (targetErr || !targetProfile) {
      return new Response(JSON.stringify({ error: 'Target user not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const previousPlan = String(targetProfile.plan_type || 'free');
    const planoPt = newPlan === 'pro' ? 'Pró' : newPlan === 'master' ? 'Master' : 'Free';

    // Atualizar plano do alvo
    const { error: updErr } = await adminClient
      .from('profiles')
      .update({ plan_type: newPlan, plano: planoPt })
      .eq('id', targetUserId);
    if (updErr) {
      return new Response(JSON.stringify({ error: 'Update failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Registrar log
    await adminClient
      .from('admin_plan_change_logs')
      .insert({
        user_id: targetUserId,
        admin_id: adminId,
        previous_plan: previousPlan,
        new_plan: newPlan,
      });

    // Notificar por e-mail (opcional)
    try {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      if (RESEND_API_KEY && targetProfile.email) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'no-reply@linksic.app',
            to: targetProfile.email,
            subject: 'Seu plano foi atualizado',
            html: `<p>Olá! Seu plano foi alterado para <strong>${planoPt}</strong>.</p>`,
          })
        });
      }
    } catch (_e) {
      // Falha de e-mail não bloqueia a ação
    }

    return new Response(JSON.stringify({
      ok: true,
      userId: targetUserId,
      previousPlan,
      newPlan,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || 'Bad Request' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

