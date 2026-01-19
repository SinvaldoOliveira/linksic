import { determinePlan } from './index.ts'

Deno.test('determinePlan assigns Pro for paid invoice', async () => {
  const fake: any = {
    id: 'evt_test_1',
    type: 'invoice.payment_succeeded',
    data: {
      object: {
        amount_paid: 1499,
        lines: { data: [{ price: { id: 'price_pro_monthly', recurring: { interval: 'month' } } }] }
      }
    }
  }
  const res = await determinePlan(fake)
  if (res.nextPlan !== 'pro' || res.linkLimit !== 30) {
    throw new Error('Expected Pro plan with 30 limit')
  }
})
