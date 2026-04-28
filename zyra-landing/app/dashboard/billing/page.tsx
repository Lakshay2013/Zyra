'use client'

import { useState, useEffect, useCallback } from "react"
import { CreditCard, TrendingUp, AlertTriangle, Check, Zap, Crown, Rocket, ArrowRight, Clock, IndianRupee } from "lucide-react"
import toast from 'react-hot-toast'
import api from "@/lib/api"

// ── Plan config (must match backend) ──
const PLANS = {
  free: {
    name: 'Builder', icon: CreditCard, color: '#71717a',
    monthly: 0, yearly: 0,
    features: ['1,000 requests/mo', 'Basic cost optimizer', 'Standard logging', 'Community support'],
    limit: 1000
  },
  pro: {
    name: 'Pro', icon: Zap, color: '#ffa69e',
    monthly: 999, yearly: 799,
    features: ['50,000 requests/mo', 'Full contextual optimizer', 'Real-time dashboard', 'Priority support'],
    limit: 50000
  },
  growth: {
    name: 'Growth', icon: Crown, color: '#a78bfa',
    monthly: 3999, yearly: 3199,
    features: ['Unlimited requests', 'Custom routing logic', 'Team sharing & SSO', 'Dedicated SLA'],
    limit: 1000000
  }
}

type PlanKey = 'free' | 'pro' | 'growth'

// ── Razorpay type declaration ──
declare global {
  interface Window {
    Razorpay: any
  }
}

// ── Load Razorpay checkout script ──
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
        api.get('/api/payments/history').catch(() => ({ data: { payments: [] } }))
      ])
      setBilling(billingRes.data.billing)
      setPayments(historyRes.data.payments || [])
    } catch (err) {
      console.error("Failed to load billing", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBilling()
  }, [fetchBilling])

  // ── Razorpay checkout handler ──
  const handleUpgrade = async (plan: 'pro' | 'growth') => {
    setUpgrading(plan)

    try {
      // Load Razorpay script
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        toast.error('Failed to load payment gateway. Please try again.')
        setUpgrading(null)
        return
      }

      // Create order on backend
      const cycle = isYearly ? 'yearly' : 'monthly'
      const { data } = await api.post('/api/payments/create-order', { plan, cycle })

      // Open Razorpay checkout
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Zyra',
        description: data.label,
        order_id: data.orderId,
        handler: async (response: any) => {
          // Verify payment on backend
          try {
            const verifyRes = await api.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            toast.success(verifyRes.data.message || 'Plan upgraded successfully!')
            fetchBilling() // Refresh billing data
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Payment verification failed')
          }
          setUpgrading(null)
        },
        modal: {
          ondismiss: () => {
            setUpgrading(null)
          }
        },
        prefill: {},
        theme: {
          color: '#ffa69e',
          backdrop_color: 'rgba(11, 11, 12, 0.85)'
        }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#ffa69e] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const currentPlan: PlanKey = billing?.plan || 'free'
  const usagePercent = billing ? Math.min(100, (billing.currentMonthlyLogs / billing.monthlyLogLimit) * 100) : 0
  const isNearLimit = usagePercent > 85
  const subscription = billing?.subscription

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-12">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: '#e5e2e3' }}>Billing & Usage</h1>
        <p className="text-sm" style={{ color: '#71717a' }}>Manage your subscription and monitor usage.</p>
      </div>

      {/* ── Current Plan + Usage ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Current Plan */}
        <div className="rounded-xl p-6 flex flex-col justify-between" style={{ background: '#1c1b1c', border: '1px solid rgba(63,63,70,0.3)' }}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,166,158,0.1)' }}>
                <CreditCard className="w-4 h-4" style={{ color: '#ffa69e' }} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#71717a' }}>Current Plan</span>
            </div>
            <div className="text-2xl font-bold capitalize" style={{ color: '#e5e2e3' }}>{PLANS[currentPlan]?.name || 'Builder'}</div>
            {subscription?.status === 'active' && subscription?.currentPeriodEnd && (
              <div className="flex items-center gap-1 mt-2 text-[11px]" style={{ color: '#71717a' }}>
                <Clock className="w-3 h-3" />
                Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>
          {currentPlan !== 'growth' && (
            <a href="#plans" className="mt-6 w-full py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.15em] rounded-lg transition-all hover:opacity-90" style={{ background: 'rgba(255,166,158,0.1)', color: '#ffa69e', border: '1px solid rgba(255,166,158,0.2)' }}>
              Upgrade Plan
            </a>
          )}
        </div>

        {/* Usage */}
        <div className="rounded-xl p-6 col-span-1 md:col-span-2" style={{ background: '#1c1b1c', border: '1px solid rgba(63,63,70,0.3)' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: '#ffa69e' }} />
              <span className="text-sm font-bold" style={{ color: '#e5e2e3' }}>Requests Usage</span>
            </div>
            <div className="px-3 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(255,166,158,0.08)', color: '#ffa69e' }}>
              Resets in {(() => {
                const now = new Date()
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
                return Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              })()} days
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-[12px] font-bold" style={{ color: '#e5e2e3' }}>
              <span>{billing?.currentMonthlyLogs?.toLocaleString() || 0} requests</span>
              <span>{billing?.monthlyLogLimit?.toLocaleString() || 0} limit</span>
            </div>
            <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(63,63,70,0.3)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${usagePercent}%`, background: isNearLimit ? '#ef4444' : '#ffa69e' }}
              />
            </div>
            {isNearLimit && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-[12px] font-semibold" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Approaching monthly limit. Upgrade to avoid service interruptions.
              </div>
            )}
            {!isNearLimit && (
              <p className="text-[12px] font-medium" style={{ color: '#71717a' }}>
                {usagePercent.toFixed(1)}% of your limit used this billing cycle.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Plans ── */}
      <div id="plans">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: '#e5e2e3' }}>Choose a Plan</h2>

          {/* Billing toggle */}
          <div className="flex items-center gap-2.5 text-[12px] font-semibold">
            <span style={{ color: !isYearly ? '#e5e2e3' : '#71717a' }}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-11 h-6 rounded-full transition-colors"
              style={{ background: isYearly ? '#ffa69e' : '#3f3f46' }}
            >
              <div
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
                style={{ left: isYearly ? 24 : 4 }}
              />
            </button>
            <span style={{ color: isYearly ? '#e5e2e3' : '#71717a' }}>
              Yearly <span className="text-[10px]" style={{ color: '#ffa69e' }}>-20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(Object.entries(PLANS) as [PlanKey, typeof PLANS.free][]).map(([key, plan]) => {
            const isCurrent = currentPlan === key
            const isUpgrade = key !== 'free' && !isCurrent && (
              key === 'growth' || (key === 'pro' && currentPlan === 'free')
            )
            const isDowngrade = (key === 'free' && currentPlan !== 'free') || (key === 'pro' && currentPlan === 'growth')
            const price = isYearly ? plan.yearly : plan.monthly
            const Icon = plan.icon

            return (
              <div
                key={key}
                className="rounded-xl p-6 relative overflow-hidden transition-all"
                style={{
                  background: isCurrent ? 'rgba(255,166,158,0.04)' : '#1c1b1c',
                  border: isCurrent ? '1px solid rgba(255,166,158,0.3)' : '1px solid rgba(63,63,70,0.3)',
                }}
              >
                {isCurrent && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-[0.15em]" style={{ background: '#ffa69e', color: '#0B0B0C' }}>
                    Current
                  </div>
                )}

                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: `${plan.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: plan.color }} />
                </div>

                <h3 className="text-base font-bold mb-1" style={{ color: '#e5e2e3' }}>{plan.name}</h3>

                <div className="flex items-baseline gap-1 mb-5">
                  {price === 0 ? (
                    <span className="text-2xl font-bold" style={{ color: '#e5e2e3' }}>Free</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold" style={{ color: '#e5e2e3' }}>
                        <span className="text-lg">₹</span>{price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[12px]" style={{ color: '#71717a' }}>/month</span>
                    </>
                  )}
                  {isYearly && price > 0 && (
                    <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,166,158,0.1)', color: '#ffa69e' }}>
                      billed yearly
                    </span>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-[12px]" style={{ color: '#a1a1aa' }}>
                      <Check className="w-3.5 h-3.5 shrink-0" style={{ color: '#ffa69e' }} />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.15em] rounded-lg" style={{ background: 'rgba(63,63,70,0.3)', color: '#71717a' }}>
                    Active Plan
                  </div>
                ) : isUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(key as 'pro' | 'growth')}
                    disabled={upgrading !== null}
                    className="w-full py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.15em] rounded-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: '#ffa69e', color: '#0B0B0C' }}
                  >
                    {upgrading === key ? (
                      <div className="w-4 h-4 border-2 border-[#0B0B0C] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Upgrade <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                ) : isDowngrade ? (
                  <button
                    onClick={() => toast('Downgrade handling coming in beta v2', { icon: '📬' })}
                    className="w-full py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.15em] rounded-lg transition-all hover:opacity-90"
                    style={{ background: 'rgba(63,63,70,0.2)', color: '#a1a1aa', border: '1px solid rgba(63,63,70,0.3)' }}
                  >
                    Downgrade
                  </button>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Payment History ── */}
      {payments.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#e5e2e3' }}>Payment History</h2>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(63,63,70,0.3)' }}>
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr style={{ background: '#1c1b1c' }}>
                  <th className="px-4 py-3 font-bold uppercase tracking-[0.15em] text-[10px]" style={{ color: '#71717a' }}>Date</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-[0.15em] text-[10px]" style={{ color: '#71717a' }}>Plan</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-[0.15em] text-[10px]" style={{ color: '#71717a' }}>Cycle</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-[0.15em] text-[10px] text-right" style={{ color: '#71717a' }}>Amount</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-[0.15em] text-[10px] text-right" style={{ color: '#71717a' }}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgba(63,63,70,0.2)' }}>
                {payments.map((p: any) => (
                  <tr key={p.orderId} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono" style={{ color: '#a1a1aa' }}>
                      {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-bold capitalize" style={{ color: '#e5e2e3' }}>{p.plan}</td>
                    <td className="px-4 py-3 capitalize" style={{ color: '#a1a1aa' }}>{p.billingCycle}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold" style={{ color: '#e5e2e3' }}>
                      ₹{(p.amount / 100).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-[0.1em]"
                        style={{
                          background: p.status === 'paid' ? 'rgba(74,222,128,0.1)' : p.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(255,166,158,0.1)',
                          color: p.status === 'paid' ? '#4ade80' : p.status === 'failed' ? '#ef4444' : '#ffa69e'
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
