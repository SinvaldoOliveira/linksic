import { describe, it, expect, vi } from 'vitest'
import { saveLink, getAllowedLinkTypes } from '@/contexts/AuthContext'

vi.mock('@/lib/supabase', () => {
  const planTypeByUser: Record<string, 'free'|'pro'> = { 'user-free': 'free', 'user-pro': 'pro' }
  const profiles = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(function(this: any) {
      return { data: { plan_type: planTypeByUser[this.__userId || 'user-free'] } }
    })
  }
  const links = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: [{}], error: null })
  }
  const from = (table: string) => {
    const api: any = table === 'profiles' ? profiles : links
    api.eq = vi.fn((col: string, val: string) => {
      api.__userId = val
      return api
    })
    return api
  }
  return {
    supabase: {
      from,
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-pro', user_metadata: {}, email: 't@t.com' } } }) },
      storage: { from: vi.fn().mockReturnValue({ getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }) }) }
    }
  }
})

describe('getAllowedLinkTypes', () => {
  it('retorna apenas button/banner para Free', async () => {
    const types = await getAllowedLinkTypes('user-free')
    expect(types).toEqual(['button','banner'])
  })
  it('retorna todas opções para Pró', async () => {
    const types = await getAllowedLinkTypes('user-pro')
    expect(types).toEqual(['button','banner','youtube','whatsapp'])
  })
})

describe('saveLink valida tipos por plano', () => {
  it('bloqueia youtube no plano Free', async () => {
    await expect(saveLink('user-free', {
      id: '',
      label: 'YT',
      url: '',
      enabled: true,
      type: 'youtube',
      position: 0
    } as any)).rejects.toMatchObject({ code: 'FEATURE_NOT_AVAILABLE' })
  })
  it('permite whatsapp no plano Pró', async () => {
    await expect(saveLink('user-pro', {
      id: '',
      label: 'WA',
      url: '',
      enabled: true,
      type: 'whatsapp',
      position: 0,
      whatsappPhone: '5511999999999'
    } as any)).resolves.toBeUndefined()
  })
}
) 
