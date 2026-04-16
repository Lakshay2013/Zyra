'use client'

import { useState, useEffect } from "react"
import { CreditCard, TrendingUp, AlertTriangle } from "lucide-react"
import toast from 'react-hot-toast'
import api from "@/lib/api"

export default function BillingPage() {
  const [billing, setBilling] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBilling()
  }, [])

  async function fetchBilling() {
    try {
      const res = await api.get('/api/org/billing')
      setBilling(res.data.billing)
    } catch (err) {
      console.error("Failed to load billing", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-12 text-center text-[#424843] font-body text-sm">Loading billing details...</div>

  const usagePercent = billing ? Math.min(100, (billing.currentMonthlyLogs / billing.monthlyLogLimit) * 100) : 0
  const isNearLimit = usagePercent > 85

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 font-body">
      <div>
        <h1 className="text-[32px] font-headline font-bold text-[#032416] mb-2 tracking-tight">Billing & Usage</h1>
        <p className="text-[#424843] font-medium text-sm">Manage your subscription, view current cycle usage, and upgrade limits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Plan Card */}
        <div className="bg-white rounded-[20px] p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#f1eedf] flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-[#5e51ad]/10 text-[#5e51ad] rounded-xl flex items-center justify-center mb-6">
              <CreditCard className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h2 className="text-sm font-bold text-[#424843] tracking-wide uppercase mb-1">Current Plan</h2>
            <p className="text-3xl font-headline font-bold text-[#032416] capitalize">
              {billing?.plan || 'Free'}
            </p>
          </div>
          <button onClick={() => toast('Plan management portal coming soon', { icon: '💳' })} className="mt-8 w-full py-3 bg-[#fdfaea] border border-[#f1eedf] text-[#032416] font-bold rounded-xl hover:bg-[#f1eedf] transition-colors text-sm">
            Change Plan
          </button>
        </div>

        {/* Usage Card */}
        <div className="bg-white rounded-[20px] p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#f1eedf] col-span-1 md:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-[#032416]">Requests Usage</h2>
            <div className="px-3 py-1 bg-[#fdfaea] border border-[#f1eedf] rounded-full text-xs font-bold text-[#424843]">
              Resets in {(() => {
                const now = new Date()
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
                return Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              })()} days
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm font-bold text-[#032416]">
              <span>{billing?.currentMonthlyLogs?.toLocaleString()} Requests</span>
              <span>{billing?.monthlyLogLimit?.toLocaleString()} Limit</span>
            </div>
            
            <div className="h-3 w-full bg-[#f1eedf] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${isNearLimit ? 'bg-[#d32f2f]' : 'bg-[#5e51ad]'}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>

            {isNearLimit && (
              <div className="flex items-start gap-2 pt-4 text-[#d32f2f] bg-red-50 p-4 rounded-xl border border-red-100">
                <AlertTriangle className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                <p className="text-sm font-semibold">
                  You are approaching your monthly request limit. Upgrades take effect immediately.
                </p>
              </div>
            )}
            {!isNearLimit && (
              <p className="text-sm font-medium text-[#424843] pt-2">
                You've used {usagePercent.toFixed(1)}% of your proxy limit this billing cycle.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
