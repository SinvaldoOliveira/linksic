import { supabase } from '@/lib/supabase';

type Plan = 'free' | 'pro' | 'master';

const toPt = (p: Plan) => (p === 'pro' ? 'Pró' : p === 'master' ? 'Master' : 'Free');

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function applyPlanChange(params: {
  targetUserId: string;
  newPlan: Plan;
  adminEmail: string;
  adminPassword: string;
}): Promise<{ ok: boolean; previousPlan?: Plan; verified: boolean; source: 'edge' | 'fallback' }> {
  const { targetUserId, newPlan, adminEmail, adminPassword } = params;
  const pt = toPt(newPlan);

  // Try Edge Function with backoff
  const attempts = [200, 500, 1200];
  for (let i = 0; i < attempts.length; i++) {
    try {
      const { data, error } = await supabase.functions.invoke('admin-change-plan', {
        body: { targetUserId, newPlan, adminEmail, adminPassword }
      });
      if (error) throw error;
      if (data?.ok) {
        const verified = await verifySync(targetUserId, newPlan, pt);
        return { ok: true, previousPlan: (data.previousPlan as Plan) || 'free', verified, source: 'edge' };
      }
      throw new Error(data?.error || 'Edge function failed');
    } catch {
      if (i < attempts.length - 1) await sleep(attempts[i]);
      else break;
    }
  }

  // Fallback via RLS
  const { error: reauthErr } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
  if (reauthErr) {
    await logError({ targetUserId, adminEmail, requestedPlan: newPlan, source: 'fallback', message: reauthErr.message });
    throw new Error('Credenciais do administrador inválidas');
  }
  const { data: prof } = await supabase.from('profiles').select('plan_type').eq('id', targetUserId).single();
  const previousPlan = (prof?.plan_type as Plan) || 'free';
  const { error: updErr } = await supabase
    .from('profiles')
    .update({ plan_type: newPlan, plano: pt })
    .eq('id', targetUserId);
  if (updErr) {
    await logError({ targetUserId, adminEmail, requestedPlan: newPlan, previousPlan, source: 'fallback', message: updErr.message });
    throw new Error(updErr.message || 'Falha na atualização');
  }
  await supabase.from('admin_plan_change_logs').insert({
    user_id: targetUserId,
    admin_id: (await supabase.auth.getUser()).data.user?.id,
    previous_plan: previousPlan,
    new_plan: newPlan
  });
  const verified = await verifySync(targetUserId, newPlan, pt);
  return { ok: true, previousPlan, verified, source: 'fallback' };
}

async function verifySync(userId: string, plan: Plan, planoPt: string) {
  const { data } = await supabase
    .from('profiles')
    .select('plan_type, plano')
    .eq('id', userId)
    .single();
  return data?.plan_type === plan && data?.plano === planoPt;
}

async function logError(args: {
  targetUserId: string;
  adminEmail: string;
  requestedPlan: Plan;
  previousPlan?: Plan;
  source: 'edge' | 'fallback';
  message: string;
}) {
  const { data: adminUser } = await supabase.auth.getUser();
  await supabase.from('admin_action_errors').insert({
    user_id: args.targetUserId,
    admin_id: adminUser.user?.id,
    action: 'change_plan',
    requested_plan: args.requestedPlan,
    previous_plan: args.previousPlan,
    source: args.source,
    error_message: args.message
  });
}

