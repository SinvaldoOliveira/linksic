import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL') || ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const stripeApiKey = Deno.env.get('STRIPE_API_KEY') || ''
  const reconcileToken = Deno.env.get('STRIPE_RECONCILE_TOKEN') || ''
  const tokenHdr = req.headers.get('x-reconcile-token') || ''
  if (!supabaseUrl || !serviceKey || !stripeApiKey) {
    return new Response(JSON.stringify({ error: 'Env missing' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
  if (reconcileToken && tokenHdr !== reconcileToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
  }

  const stripe = new Stripe(stripeApiKey, { apiVersion: '2023-10-16' })
  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    const now = Math.floor(Date.now() / 1000)
    const since = now - 60 * 60 // última 1 hora
    const types = [
      'invoice.payment_succeeded',
      'invoice.paid',
      'invoice.payment_failed',
      'checkout.session.completed',
      'customer.subscription.deleted',
      'customer.subscription.updated',
      'payment_intent.succeeded'
    ]
    const events = await stripe.events.list({ created: { gte: since }, limit: 100 })
    let processed = 0
    for (const ev of events.data) {
      if (!types.includes(ev.type)) continue
      const id = ev.id
      const { data: existing } = await supabase.from('webhook_logs').select('id').eq('stripe_event_id', id).limit(1)
      if (existing && existing.length) continue
      const obj: any = ev.data?.object || {}
      let email = String(
        obj?.customer_email ||
        obj?.receipt_email ||
        obj?.customer_details?.email ||
        obj?.billing_details?.email ||
        obj?.payment_method?.billing_details?.email ||
        ''
      ).trim().toLowerCase()
      if (!email) {
        try {
          const custId: string = String(obj?.customer || '')
          if (custId) {
            const cust: any = await stripe.customers.retrieve(custId)
            email = String(cust?.email || '').trim().toLowerCase()
          }
        } catch {}
      }
      let evento = 'desconhecido'
      if (ev.type === 'invoice.payment_succeeded' || ev.type === 'invoice.paid' || ev.type === 'checkout.session.completed' || ev.type === 'payment_intent.succeeded') {
        evento = 'payment_success'
      } else if (ev.type === 'customer.subscription.deleted') {
        evento = 'assinatura.cancelada'
      } else if (ev.type === 'invoice.payment_failed') {
        evento = 'assinatura.atrasada'
      }
      await supabase.from('webhook_logs').insert({ email, evento, stripe_event_id: id, payload: ev })
      processed++
    }
    // Alertas básicos: se processed == 0, registrar métrica/alerta via Resend
    try {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
      const ALERT_EMAIL = Deno.env.get('ALERT_EMAIL') || ''
      if (RESEND_API_KEY && ALERT_EMAIL && processed === 0) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'no-reply@linksic.app',
            to: ALERT_EMAIL,
            subject: 'Stripe reconcile: nenhum evento novo',
            html: '<p>Nenhum evento Stripe foi reconciliado na última janela.</p>'
          })
        })
      }
    } catch (_e) {}
    return new Response(JSON.stringify({ ok: true, processed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'Reconcile error' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
