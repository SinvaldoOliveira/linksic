import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Body = {
  email?: string
  evento?: string
  produto?: string
  token?: string
}

function normalizeEvento(raw: string): string {
  const e = (raw || '').trim().toLowerCase()
  if (/(cancelad)/.test(e)) return 'assinatura.cancelada'
  if (/(atrasad|overdue|past_due|delinquent)/.test(e)) return 'assinatura.atrasada'
  if (/(renovad|aprovad|approved|paid|payment_success)/.test(e)) return 'assinatura.renovada'
  return e || 'desconhecido'
}

function mapProdutoToPlan(prod: string): { plan: 'free' | 'pro' | 'master'; limit: number } {
  const p = (prod || '').trim().toLowerCase()
  if (/master/.test(p)) return { plan: 'master', limit: 30 }
  if (/pro/.test(p)) return { plan: 'pro', limit: 30 }
  return { plan: 'free', limit: 3 }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL') || ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Env missing' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    const body = (await req.json()) as Body
    const token = String(body?.token || '')
    if (token !== 'token') {
      const supabase = createClient(supabaseUrl, serviceKey)
      try { await supabase.from('webhook_logs').insert({ email: String(body?.email || ''), evento: 'unauthorized' }) } catch {}
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
    }

    const email = String(body?.email || '').trim().toLowerCase()
    const eventoNorm = normalizeEvento(String(body?.evento || ''))
    const produto = String(body?.produto || '')
    if (!email) {
      const supabase = createClient(supabaseUrl, serviceKey)
      try { await supabase.from('webhook_logs').insert({ email: null, evento: 'email.missing' }) } catch {}
      return new Response(JSON.stringify({ error: 'Email missing' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 422 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    let nextPlan: 'free' | 'pro' | 'master' = 'free'
    let linkLimit = 3
    if (eventoNorm.includes('cancelada') || eventoNorm.includes('atrasada')) {
      nextPlan = 'free'
      linkLimit = 3
    } else if (eventoNorm.includes('renovada')) {
      const mapped = mapProdutoToPlan(produto)
      nextPlan = mapped.plan
      linkLimit = mapped.limit
    }

    const planoPt = nextPlan === 'pro' ? 'Pró' : nextPlan === 'master' ? 'Master' : 'Free'

    const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single()
    if (!profile?.id) {
      await supabase.from('webhook_logs').insert({ email, evento: 'profile.missing' })
      return new Response(JSON.stringify({ error: 'Profile not found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 })
    }

    const { error: updErr } = await supabase
      .from('profiles')
      .update({ plan_type: nextPlan, plano: planoPt, link_limit: linkLimit })
      .eq('id', profile.id)
    if (updErr) {
      return new Response(JSON.stringify({ error: 'Update failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    await supabase.from('webhook_logs').insert({ email, evento: eventoNorm })

    return new Response(JSON.stringify({ ok: true, plan: nextPlan, link_limit: linkLimit }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'Bad Request' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
