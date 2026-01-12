import { describe, it, expect, vi } from 'vitest';
import * as client from '@/lib/supabase';
import { applyPlanChange } from './planChange';

describe('applyPlanChange', () => {
  it('aplica mudança via função quando disponível e verifica sincronização', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { ok: true, previousPlan: 'free' }, error: null });
    const getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } } });
    const select = vi.fn().mockResolvedValue({ data: { plan_type: 'pro', plano: 'Pró' }, error: null });
    vi.spyOn(client, 'supabase', 'get').mockReturnValue({
      functions: { invoke } as any,
      auth: { getUser } as any,
      from: () => ({ select }) as any
    } as any);
    const res = await applyPlanChange({
      targetUserId: 'user-1',
      newPlan: 'pro',
      adminEmail: 'admin@example.com',
      adminPassword: 'secret'
    });
    expect(res.ok).toBe(true);
    expect(res.verified).toBe(true);
    expect(res.source).toBe('edge');
  });

  it('usa fallback quando função falha e registra verificação', async () => {
    const invoke = vi.fn().mockRejectedValue(new Error('network'));
    const getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } } });
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    const selectSingle = vi.fn().mockResolvedValue({ data: { plan_type: 'free' }, error: null });
    const update = vi.fn().mockResolvedValue({ error: null });
    const insert = vi.fn().mockResolvedValue({ error: null });
    vi.spyOn(client, 'supabase', 'get').mockReturnValue({
      functions: { invoke } as any,
      auth: { getUser, signInWithPassword } as any,
      from: () => ({ select: selectSingle, update, insert }) as any
    } as any);
    const res = await applyPlanChange({
      targetUserId: 'user-1',
      newPlan: 'pro',
      adminEmail: 'admin@example.com',
      adminPassword: 'secret'
    });
    expect(res.ok).toBe(true);
    expect(res.source).toBe('fallback');
  });
});

