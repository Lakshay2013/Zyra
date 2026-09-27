'use client'

import { useState, useEffect, useCallback } from 'react'
import { CreditCard, TrendingUp, AlertTriangle, Check, Zap, Crown, ArrowRight, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingScreen } from '@/components/ui/empty-state'
import { Table, THead, TH, TBody, TR, TD } from '@/components/ui/table'

const PLANS = {
  free: { name: 'Builder', icon: CreditCard, monthly: 0, yearly: 0, features: ['1,000 requests/mo', 'Basic cost optimizer', 'Standard logging', 'Community support'], limit: 1000 },
  pro: { name: 'Pro', icon: Zap, monthly: 999, yearly: 799, features: ['50,000 requests/mo', 'Full contextual optimizer', 'Real-time dashboard', 'Priority support'], limit: 50000 },
  growth: { name: 'Growth', icon: Crown, monthly: 3999, yearly: 3199, features: ['Unlimited requests', 'Custom routing logic', 'Team sharing & SSO', 'Dedicated SLA'], limit: 1000000 },
}

type PlanKey = 'free' | 'pro' | 'growth'

declare global {
  interface Window { Razorpay: any }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function BillingPage() {
  const [billing, setBilling] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [isYearly, setIsYearly] = useState(false)

  const fetchBilling = useCallback(async () => {
    try {
      const [billingRes, historyRes] = await Promise.all([
        api.get('/api/org/billing'),
        api.get('/api/payments/history').catch(() => ({ data: { payments: [] } })),
      ])
      setBilling(billingRes.data.billing)
      setPayments(historyRes.data.payments || [])
    } catch (err) {
      console.error('Failed to load billing', err)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchBilling() }, [fetchBilling])

  const handleUpgrade = async (plan: 'pro' | 'growth') => {
    setUpgrading(plan)
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        toast.error('Failed to load payment gateway. Please try again.')
        setUpgrading(null)
        return
      }
      const cycle = isYearly ? 'yearly' : 'monthly'
      const { data } = await api.post('/api/payments/create-order', { plan, cycle })
      const options = {
        key: data.keyId, amount: data.amount, currency: data.currency,
        name: 'Zyra', description: data.label, order_id: data.orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await api.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            toast.success(verifyRes.data.message || 'Plan upgraded successfully!')
            fetchBilling()
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Payment verification failed')
          }
          setUpgrading(null)
        },
        modal: { ondismiss: () => setUpgrading(null) },
        prefill: {},
        theme: { color: '#4453E8' },
      }
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response: any) => {
        toast.error('Payment failed: ' + (response.error?.description || 'Unknown error'))
        setUpgrading(null)
      })
      rzp.open()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment')
      setUpgrading(null)
    }
  }

  if (loading) return <LoadingScreen label="Loading billing" />

  const currentPlan: PlanKey = billing?.plan || 'free'
  const usagePercent = billing ? Math.min(100, (billing.currentMonthlyLogs / billing.monthlyLogLimit) * 100) : 0
  const isNearLimit = usagePercent > 85
  const subscription = billing?.subscription
  const daysLeft = (() => {
    const now = new Date()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  })()

  return (
    <div>
      <PageHeader title="Billing & Usage" subtitle="Manage your subscription and monitor usage." />

      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <Card padding="lg" className="flex flex-col justify-between">
          <div>
            <div className="type-meta mb-3 text-text-tertiary">Current plan</div>
            <div className="text-[2rem] font-bold capitalize text-text">{PLANS[currentPlan]?.name || 'Builder'}</div>
            {subscription?.status === 'active' && subscription?.currentPeriodEnd && (
              <div className="mt-2 flex items-center gap-1.5 text-[12px] text-text-tertiary">
                <Clock size={13} /> Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>
          {currentPlan !== 'growth' && (
            <a href="#plans"><Button variant="outline" className="mt-6 w-full">Upgrade plan</Button></a>
          )}
        </Card>

        <Card padding="lg" className="md:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-accent" />
              <span className="type-h3 text-text">Requests usage</span>
            </div>
            <Badge tone="accent">Resets in {daysLeft} days</Badge>
          </div>
          <div className="flex justify-between text-[13px] font-semibold text-text">
            <span>{billing?.currentMonthlyLogs?.toLocaleString() || 0} requests</span>
            <span>{billing?.monthlyLogLimit?.toLocaleString() || 0} limit</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-bg-subtle">
            <div className={`h-full rounded-full transition-[width] duration-700 ${isNearLimit ? 'bg-danger' : 'bg-accent'}`} style={{ width: `${usagePercent}%` }} />
          </div>
          {isNearLimit ? (
            <div className="mt-3 flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-danger-subtle)] p-3 text-[12px] font-medium text-danger">
              <AlertTriangle size={15} className="shrink-0" /> Approaching monthly limit. Upgrade to avoid service interruptions.
            </div>
          ) : (
            <p className="mt-2 text-[12px] text-text-tertiary">{usagePercent.toFixed(1)}% of your limit used this billing cycle.</p>
          )}
        </Card>
      </div>

      <div id="plans">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="type-h2 text-text">Choose a plan</h2>
          <div className="flex items-center gap-2.5 text-[13px] font-medium">
            <span className={!isYearly ? 'text-text' : 'text-text-tertiary'}>Monthly</span>
            <button onClick={() => setIsYearly(!isYearly)} className="press-feedback relative h-6 w-11 rounded-full transition-colors" style={{ background: isYearly ? 'var(--color-accent)' : 'var(--color-border-strong)' }}>
              <span className="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-[left] duration-200" style={{ left: isYearly ? 24 : 4 }} />
            </button>
            <span className={isYearly ? 'text-text' : 'text-text-tertiary'}>Yearly <span className="text-[11px] text-accent">-20%</span></span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {(Object.entries(PLANS) as [PlanKey, typeof PLANS.free][]).map(([key, plan]) => {
            const isCurrent = currentPlan === key
            const isUpgrade = key !== 'free' && !isCurrent && (key === 'growth' || (key === 'pro' && currentPlan === 'free'))
            const isDowngrade = (key === 'free' && currentPlan !== 'free') || (key === 'pro' && currentPlan === 'growth')
            const price = isYearly ? plan.yearly : plan.monthly
            const Icon = plan.icon
            return (
              <Card key={key} padding="lg" className={`relative ${isCurrent ? 'border-accent' : ''}`}>
                {isCurrent && <div className="absolute right-4 top-4"><Badge tone="accent">Current</Badge></div>}
                <Icon size={18} className="mb-4 text-accent" strokeWidth={1.75} />
                <h3 className="text-[15px] font-semibold text-text">{plan.name}</h3>
                <div className="mb-5 mt-1 flex items-baseline gap-1.5">
                  {price === 0 ? <span className="text-[1.75rem] font-bold text-text">Free</span> : (
                    <>
                      <span className="text-[1.75rem] font-bold text-text">₹{price.toLocaleString('en-IN')}</span>
                      <span className="text-[12px] text-text-tertiary">/month</span>
                    </>
                  )}
                  {isYearly && price > 0 && <Badge tone="accent">billed yearly</Badge>}
                </div>
                <ul className="mb-6 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-text-secondary">
                      <Check size={14} className="shrink-0 text-accent" /> {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="w-full rounded-[var(--radius-sm)] bg-bg-subtle py-2.5 text-center text-[13px] font-medium text-text-tertiary">Active plan</div>
                ) : isUpgrade ? (
                  <Button className="w-full" disabled={upgrading !== null} onClick={() => handleUpgrade(key as 'pro' | 'growth')}>
                    {upgrading === key ? 'Processing…' : <>Upgrade <ArrowRight size={14} className="ml-1.5" /></>}
                  </Button>
                ) : isDowngrade ? (
                  <Button variant="outline" className="w-full" onClick={() => toast('Downgrade handling is planned for a future release', { icon: '📬' })}>
                    Downgrade
                  </Button>
                ) : null}
              </Card>
            )
          })}
        </div>
      </div>

      {payments.length > 0 && (
        <div className="mt-8">
          <h2 className="type-h2 mb-4 text-text">Payment history</h2>
          <Card padding="none" className="overflow-hidden">
            <Table>
              <THead><tr><TH>Date</TH><TH>Plan</TH><TH>Cycle</TH><TH align="right">Amount</TH><TH align="right">Status</TH></tr></THead>
              <TBody>
                {payments.map((p: any) => (
                  <TR key={p.orderId}>
                    <TD className="font-mono text-text-tertiary">{new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</TD>
                    <TD className="font-semibold capitalize">{p.plan}</TD>
                    <TD className="capitalize text-text-tertiary">{p.billingCycle}</TD>
                    <TD align="right" className="font-mono font-semibold">₹{(p.amount / 100).toLocaleString('en-IN')}</TD>
                    <TD align="right"><Badge tone={p.status === 'paid' ? 'success' : p.status === 'failed' ? 'danger' : 'accent'}>{p.status}</Badge></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  )
}
