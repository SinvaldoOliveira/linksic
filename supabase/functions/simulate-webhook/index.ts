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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase environment secrets missing');
    }

    const { email, evento, produto } = await req.json();
    if (!email || !evento || !produto) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Chamar a função kiwify-webhook internamente
    const { data, error } = await supabaseAdmin.functions.invoke('kiwify-webhook', {
      body: {
        email,
        evento,
        produto,
        // O token é validado na função 'kiwify-webhook'
        token: Deno.env.get('KIWIFY_WEBHOOK_TOKEN'),
      },
    });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ ok: true, data }), {
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
