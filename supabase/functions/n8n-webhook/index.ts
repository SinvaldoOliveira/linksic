import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL') || ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const secretToken = Deno.env.get('N8N_SECRET_TOKEN') || ''
    if (!supabaseUrl || !serviceKey || !secretToken) {
      return new Response(JSON.stringify({ error: 'Env missing' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    const raw = await req.json()
    const payload = Array.isArray(raw) ? raw[0] : raw
    const token = String(payload?.N8N_SECRET_TOKEN || '')
    if (token !== secretToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
    }

    const email = String(payload?.email || '').trim().toLowerCase()
    const evento = String(payload?.evento || '').trim().toLowerCase()
    const nome = String(payload?.Nome_cliente || '').trim()
    const telefone = String(payload?.telefone || '').trim()
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email missing' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    let nextPlan: 'free' | 'pro' | 'master' = 'free'
    let linkLimit = 3
    if (evento.includes('approved') || evento.includes('aprovad')) {
      nextPlan = 'pro'
      linkLimit = 30
    } else if (evento.includes('atrasad')) {
      const supabase = createClient(supabaseUrl, serviceKey)
      const { data: lastPaid } = await supabase
        .from('webhook_logs')
        .select('email, evento, created_at')
        .eq('email', email)
        .in('evento', ['assinatura.renovada', 'aprovada', 'approved', 'payment_success'])
        .order('created_at', { ascending: false })
        .limit(1)
      const lastTs = (lastPaid && lastPaid[0] && (lastPaid[0] as any).created_at) ? new Date((lastPaid[0] as any).created_at) : null
      if (lastTs) {
        const diffDays = Math.floor((Date.now() - lastTs.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays <= 39) {
          nextPlan = 'pro'
          linkLimit = 30
        } else {
          nextPlan = 'free'
          linkLimit = 3
        }
      } else {
        nextPlan = 'free'
        linkLimit = 3
      }
    } else if (evento.includes('cancelad')) {
      nextPlan = 'free'
      linkLimit = 3
    }

    const planoPt = nextPlan === 'pro' ? 'Pró' : nextPlan === 'master' ? 'Master' : 'Free'
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    let userId = existing?.id || ''
    if (!userId) {
      const tempPass = crypto.randomUUID().replace(/-/g, '')
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password: tempPass,
        email_confirm: true,
        user_metadata: { name: nome, phone: telefone, source: 'n8n-kiwify' }
      })
      if (createErr || !created?.user?.id) {
        return new Response(JSON.stringify({ error: 'User creation failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
      }
      userId = created.user.id
      const { error: insertErr } = await supabase
        .from('profiles')
        .insert({ id: userId, email, name: nome, plan_type: nextPlan, plano: planoPt, link_limit: linkLimit, status: 'active', role: 'user' })
      if (insertErr) {
        return new Response(JSON.stringify({ error: 'Profile insert failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
      }
    } else {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ plan_type: nextPlan, plano: planoPt, link_limit: linkLimit })
        .eq('id', userId)
      if (updateErr) {
        return new Response(JSON.stringify({ error: 'Update failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
      }
    }

    await supabase.from('webhook_logs').insert({ email, evento, plano_aplicado: nextPlan })

    return new Response(JSON.stringify({ ok: true, plan: nextPlan }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || 'Bad Request' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
