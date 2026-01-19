import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature, x-webhook-token',
}

function parseAllowed(allowed: string | null): Array<{ type: 'ip' | 'cidr'; value: string; base?: string; mask?: number }> {
  if (!allowed) return []
  return allowed
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      if (s.includes('/')) {
        const [base, maskStr] = s.split('/')
        return { type: 'cidr', value: s, base, mask: Number(maskStr) }
      }
      return { type: 'ip', value: s }
    })
}

function ipToInt(ip: string): number {
  const parts = ip.split('.').map(n => Number(n))
  if (parts.length !== 4 || parts.some(n => isNaN(n))) return -1
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]
}

function isIpAllowed(ipHeader: string | null, allowedList: ReturnType<typeof parseAllowed>): boolean {
  if (!allowedList.length) return true
  const ip = (ipHeader || '').split(',')[0]?.trim() || ''
  if (!ip) return false
  const ipInt = ipToInt(ip)
  if (ipInt < 0) return false
  for (const a of allowedList) {
    if (a.type === 'ip' && a.value === ip) return true
    if (a.type === 'cidr' && a.base && typeof a.mask === 'number') {
      const baseInt = ipToInt(a.base)
      if (baseInt < 0) continue
      const mask = -1 << (32 - (a.mask || 32))
      if ((ipInt & mask) === (baseInt & mask)) return true
    }
  }
  return false
}

serve(async (req) => {
  // [DIAGNOSTIC] Log Initial Request Code
  console.log('--- [WEBHOOK START] ---');
  console.log(`Method: ${req.method}, URL: ${req.url}`);
  console.log(`Headers - Content-Type: ${req.headers.get('content-type')}`);
  const sig = req.headers.get('Stripe-Signature') || '';
  console.log(`Headers - Stripe-Signature (first 10 chars): ${sig.substring(0, 10)}...`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL') || ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const stripeSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
  const stripeApiKey = Deno.env.get('STRIPE_API_KEY') || ''
  const allowedIps = Deno.env.get('WEBHOOK_ALLOWED_IPS') || ''
  const webhookToken = Deno.env.get('WEBHOOK_TOKEN') || ''

  // [DIAGNOSTIC] Environment Check
  console.log('Environment Check:');
  console.log('SUPABASE_URL set:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY set:', !!serviceKey);
  console.log('STRIPE_WEBHOOK_SECRET set:', !!stripeSecret);
  console.log('STRIPE_API_KEY set:', !!stripeApiKey);

  if (!supabaseUrl || !serviceKey || !stripeSecret) {
    console.error('[FATAL] Missing Environment Variables');
    return new Response(JSON.stringify({ error: 'Env missing' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // [DIAGNOSTIC] Log every hit to the database
  try {
    await supabase.from('webhook_logs').insert({
      evento: 'webhook.hit',
      payload: {
        method: req.method,
        has_signature: !!sig,
        content_type: req.headers.get('content-type')
      }
    })
  } catch (dbErr) {
    console.error('[DIAGNOSTIC] Failed to log hit to DB:', dbErr)
  }

  const ipOk = isIpAllowed(req.headers.get('x-forwarded-for'), parseAllowed(allowedIps))
  if (!ipOk) {
    console.warn('[FORBIDDEN] IP not allowed');
    return new Response(JSON.stringify({ error: 'Forbidden IP' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
  }

  const tokenHdr = req.headers.get('x-webhook-token') || ''
  if (webhookToken && tokenHdr !== webhookToken) {
    console.warn('[UNAUTHORIZED] Invalid Webhook Token');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
  }

  // [DIAGNOSTIC] Raw Body Read
  let rawBody: string;
  try {
    rawBody = await req.text();
    console.log(`Raw Body Size: ${rawBody.length} bytes`);
  } catch (err) {
    console.error('[FATAL] Failed to read request body:', err);
    return new Response(JSON.stringify({ error: 'Body read error' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }

  let event: Stripe.Event
  try {
    const stripe = new Stripe(stripeApiKey || 'sk_test_placeholder', { apiVersion: '2023-10-16' })
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, stripeSecret)
    // [DIAGNOSTIC] Event Parsed
    console.log(`[SUCCESS] Stripe Signature Verified. Event Type: ${event.type}, ID: ${event.id}`);
  } catch (err: any) {
    console.error(`[FATAL] Signature Verification Failed: ${err.message}`);
    // [DIAGNOSTIC] Log failure to DB
    await supabase.from('webhook_logs').insert({
      evento: 'stripe.signature_error',
      payload: {
        error: err.message,
        secret_prefix: stripeSecret.substring(0, 5) + '...',
        has_sig: !!sig,
        body_len: rawBody?.length
      }
    })
    return new Response(JSON.stringify({ error: 'Invalid signature', message: err.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }

  // [DIAGNOSTIC] Object Inspection
  const obj: any = event.data?.object || {};
  console.log('Event Object Details:');
  console.log('ID:', obj.id);
  console.log('Customer:', obj.customer);
  console.log('Subscription:', obj.subscription);
  console.log('Email (customer_details):', obj.customer_details?.email);
  console.log('Metadata:', JSON.stringify(obj.metadata || {}));
  console.log('Client Reference ID:', obj.client_reference_id);

  const supabase = createClient(supabaseUrl, serviceKey)

  async function getEmailFromEvent(e: Stripe.Event): Promise<string> {
    const obj: any = e.data?.object || {}
    let email = String(
      obj?.customer_email ||
      obj?.receipt_email ||
      obj?.customer_details?.email ||
      obj?.billing_details?.email ||
      obj?.payment_method?.billing_details?.email ||
      ''
    ).trim().toLowerCase()

    // [DIAGNOSTIC] Email Extraction 1
    console.log(`Extracted email from object direct fields: '${email}'`);

    if (email) return email
    const customerId: string = String(obj?.customer || '')
    if (customerId && stripeApiKey) {
      try {
        console.log(`Fetching customer ${customerId} from Stripe...`);
        const stripe = new Stripe(stripeApiKey, { apiVersion: '2023-10-16' })
        const customer = await stripe.customers.retrieve(customerId)
        const c: any = customer
        const ce = String(c?.email || '').trim().toLowerCase()
        console.log(`Extracted email from Stripe Customer fetch: '${ce}'`);
        if (ce) return ce
      } catch (err) {
        console.error('[ERROR] Failed to fetch customer from Stripe:', err);
      }
    }
    return ''
  }

  function parseIds(raw: string | undefined | null): string[] {
    if (!raw) return []
    return raw.split(',').map(s => s.trim()).filter(Boolean)
  }

  async function getPriceIdFromSession(obj: any): Promise<string> {
    const sessionId = String(obj?.id || '')
    if (!sessionId || !stripeApiKey) return ''
    try {
      console.log(`Fetching line items for session ${sessionId}...`);
      const stripe = new Stripe(stripeApiKey, { apiVersion: '2023-10-16' })
      const items = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 1 })
      const price = (items?.data?.[0] as any)?.price?.id || ''
      console.log(`Fetched Price ID: ${price}`);
      return String(price || '')
    } catch (err) {
      console.error('[ERROR] Failed to fetch session line items:', err);
      return ''
    }
  }

  async function determinePlan(e: Stripe.Event): Promise<{ nextPlan: 'free' | 'pro' | 'master'; linkLimit: number; status: 'success' | 'failed' | 'canceled' | 'pending'; interval?: string; amount?: number; variant?: 'pro_monthly' | 'pro_annual'; priceId?: string }> {
    const obj: any = e.data?.object || {}
    let interval = ''
    let amount = 0
    let priceId = ''

    // [DIAGNOSTIC] Plan Logic Start
    console.log('[LOGIC] Starting Plan Determination...');

    if (e.type.startsWith('invoice.')) {
      const line = obj?.lines?.data?.[0]?.price || {}
      interval = String(line?.recurring?.interval || '')
      amount = Number(obj?.amount_paid || 0)
      priceId = String(line?.id || '')
      console.log(`[LOGIC] Invoice Event - PriceID found in lines: ${priceId}`);
    } else if (e.type === 'checkout.session.completed') {
      interval = ''
      amount = Number(obj?.amount_total || 0)
      priceId = await getPriceIdFromSession(obj)
      console.log(`[LOGIC] Checkout Session - PriceID fetched: ${priceId}`);
    } else if (e.type === 'customer.subscription.updated') {
      // Handle subscription updates directly
      const price = obj?.items?.data?.[0]?.price?.id || ''
      priceId = String(price)
      console.log(`[LOGIC] Subscription Update - PriceID found in items: ${priceId}`);
    } else if (e.type === 'payment_intent.succeeded') {
      amount = Number(obj?.amount || 0)
    }

    let nextPlan: 'free' | 'pro' | 'master' = 'free'
    let linkLimit = 3
    let status: 'success' | 'failed' | 'canceled' | 'pending' = 'pending'
    let variant: 'pro_monthly' | 'pro_annual' | undefined = undefined

    const proMonthlyIds = parseIds(Deno.env.get('STRIPE_PRICE_PRO_MONTHLY') || '')
    const proAnnualIds = parseIds(Deno.env.get('STRIPE_PRICE_PRO_ANNUAL') || '')

    console.log(`[LOGIC] Env Price IDs - Monthly: [${proMonthlyIds.join(', ')}], Annual: [${proAnnualIds.join(', ')}]`);

    if (e.type === 'customer.subscription.deleted' || e.type === 'invoice.payment_failed') {
      status = 'failed'
      nextPlan = 'free'
      linkLimit = 3
      console.log('[LOGIC] Status is FAILED/CANCELED due to event type.');
    } else if (e.type === 'invoice.paid' || e.type === 'invoice.payment_succeeded' || e.type === 'checkout.session.completed' || e.type === 'payment_intent.succeeded' || e.type === 'customer.subscription.updated') {
      status = 'success'
      if (priceId && proMonthlyIds.includes(priceId)) {
        nextPlan = 'pro'
        linkLimit = 30
        variant = 'pro_monthly'
        console.log('[LOGIC] Match: Pro Monthly');
      } else if (priceId && proAnnualIds.includes(priceId)) {
        nextPlan = 'pro'
        linkLimit = 30
        variant = 'pro_annual'
        console.log('[LOGIC] Match: Pro Annual');
      } else {
        // Fallback or potentially other plans
        if (priceId) {
          console.warn(`[LOGIC] WARNING: Price ID ${priceId} did not match any configured Env Vars.`);
        } else {
          console.warn(`[LOGIC] WARNING: No Price ID found.`);
        }

        // Defaulting logic (preserve behavior or strict?)
        // Previous code defaulted to Pro if success but no match? 
        // "else { nextPlan = 'pro'... }" -> This seems dangerous if priceId is missing.
        // Let's keep existing logic but log heavily.
        console.log('[LOGIC] Defaulting to Pro (fallback logic from original code).');
        nextPlan = 'pro'
        linkLimit = 30
      }
    }
    return { nextPlan, linkLimit, status, interval, amount, variant, priceId }
  }

  async function applyGraceIfNeeded(email: string, status: string): Promise<{ plan: 'free' | 'pro'; linkLimit: number }> {
    if (status !== 'failed') return { plan: 'free', linkLimit: 3 }
    console.log('Checking Grace Period...');
    const { data: lastPaid } = await supabase
      .from('webhook_logs')
      .select('email, evento, created_at')
      .eq('email', email)
      .in('evento', ['assinatura.renovada', 'aprovada', 'approved', 'payment_success'])
      .order('created_at', { ascending: false })
      .limit(1)
    const lastTs = (lastPaid && lastPaid[0] && (lastPaid[0] as any).created_at) ? new Date((lastPaid[0] as any).created_at) : null
    if (!lastTs) return { plan: 'free', linkLimit: 3 }
    const diffDays = Math.floor((Date.now() - lastTs.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 39) {
      console.log(`Grace period active (${diffDays} days). Keeping Pro.`);
      return { plan: 'pro', linkLimit: 30 }
    }
    return { plan: 'free', linkLimit: 3 }
  }

  try {
    const email = await getEmailFromEvent(event)
    console.log(`Processando evento ${event.type} para e-mail: ${email}`)

    if (!email) {
      console.error('[ERROR] Could not extract email from event.');
      await supabase.from('webhook_logs').insert({ email: null, evento: `stripe.email_missing.${event.type}`, payload: event })
      return new Response(JSON.stringify({ error: 'Email missing' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 422 })
    }

    const res = await determinePlan(event)
    let nextPlan = res.nextPlan
    let linkLimit = res.linkLimit
    let eventoLog = 'desconhecido'

    if (res.status === 'success') {
      if (res.variant === 'pro_monthly') eventoLog = 'stripe.pro.monthly.payment_success'
      else if (res.variant === 'pro_annual') eventoLog = 'stripe.pro.annual.payment_success'
      else eventoLog = 'payment_success'
    }
    else if (event.type === 'customer.subscription.deleted') eventoLog = 'assinatura.cancelada'
    else if (res.status === 'failed') eventoLog = 'assinatura.atrasada'

    if (res.status === 'failed') {
      const g = await applyGraceIfNeeded(email, 'failed')
      nextPlan = g.plan
      linkLimit = g.linkLimit
    }

    const planoPt = nextPlan === 'pro' ? 'Pró' : nextPlan === 'master' ? 'Master' : 'Free'

    // Busca insensitiva ao caso (ilike) para evitar problemas de digitação
    const { data: profile, error: profileErr } = await supabase.from('profiles').select('id, name, role').ilike('email', email).single()
    let profileId = profile?.id as string | undefined

    if (!profileId) {
      console.log(`Perfil não encontrado para ${email}.`)
      if (res.status === 'success') {
        // Just record in logs, the trigger handle_new_user will pick it up upon manual registration
        await supabase.from('webhook_logs').insert({
          email,
          evento: eventoLog,
          stripe_event_id: (event as any).id,
          payload: {
            event_type: event.type,
            plan: nextPlan,
            plano: planoPt,
            full_event: event,
            price_id: res.priceId,
            note: 'Payment received before user registration'
          }
        })
        console.log(`Pagamento registrado para futuro cadastro de ${email}`)
        return new Response(JSON.stringify({ received: true, pending_registration: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
      } else {
        await supabase.from('webhook_logs').insert({ email, evento: 'stripe.profile_missing', payload: { event_type: event.type } })
        return new Response(JSON.stringify({ error: 'Profile not found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 422 })
      }
    }

    console.log(`Atualizando plano para o perfil ${profileId} (${email}) para: ${nextPlan}`)
    const { error: updErr } = await supabase
      .from('profiles')
      .update({ plan_type: nextPlan, plano: planoPt, link_limit: linkLimit })
      .eq('id', profileId)

    if (updErr) {
      console.error('Erro ao atualizar perfil:', updErr)
      await supabase.from('webhook_logs').insert({ email, evento: 'stripe.update_failed', payload: { error: updErr, profileId, event_type: event.type } })
      return new Response(JSON.stringify({ error: 'Update failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    await supabase.from('webhook_logs').insert({
      email,
      evento: eventoLog,
      stripe_event_id: (event as any).id,
      payload: {
        event_type: event.type,
        plan: nextPlan,
        plano: planoPt,
        profile_id: profileId,
        full_event: event,
        price_id: res.priceId // Logging the price ID to specific log
      }
    })

    console.log('--- [WEBHOOK SUCCESS] ---');
    return new Response(JSON.stringify({ received: true, updated: true, profileId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (err) {
    console.error('Erro global no processamento do webhook:', err)
    return new Response(JSON.stringify({ error: 'Processing error', details: String(err) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
