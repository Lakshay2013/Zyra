'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  User, PiggyBank, ShieldCheck, ScrollText, Lock, Users, CreditCard,
  Info, KeyRound, ArrowRight, FileText, Gavel, Monitor,
} from 'lucide-react'
import api from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Input, Textarea, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState, LoadingScreen } from '@/components/ui/empty-state'
import { Table, THead, TH, TBody, TR, TD } from '@/components/ui/table'

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="press-feedback relative h-6 w-11 shrink-0 rounded-full transition-colors"
      style={{ background: on ? 'var(--color-accent)' : 'var(--color-border-strong)' }}
    >
      <motion.span
        className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-sm"
        animate={{ left: on ? 23 : 3 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
      />
    </button>
  )
}

function SettingRow({ title, desc, right }: { title: string; desc: React.ReactNode; right: React.ReactNode }) {
  return (
    <Card padding="lg" className="flex items-center justify-between gap-6">
      <div>
        <p className="text-[14px] font-semibold text-text">{title}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">{desc}</p>
      </div>
      {right}
    </Card>
  )
}

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-bg-subtle p-4">
      <Info size={16} className="mt-0.5 shrink-0 text-text-tertiary" />
      <span className="text-[12px] leading-relaxed text-text-secondary">{children}</span>
    </div>
  )
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'optimization', label: 'Cost Optimization', icon: PiggyBank },
  { id: 'reliability', label: 'Reliability', icon: ShieldCheck },
  { id: 'policies', label: 'Policies', icon: ScrollText },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'billing', label: 'Billing', icon: CreditCard },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [orgData, setOrgData] = useState<any>(null)
  const [profile, setProfile] = useState({ displayName: '', username: '', email: '', bio: '' })
  const [loading, setLoading] = useState(true)

  const [policies, setPolicies] = useState<any>(null)
  const [optimizer, setOptimizer] = useState<any>(null)
  const [reliability, setReliability] = useState<any>(null)
  const [savingSection, setSavingSection] = useState<string | null>(null)

  const loadPolicies = async () => { try { const r = await api.get('/api/org/policies'); setPolicies(r.data.policies) } catch (e) { console.error(e) } }
  const loadOptimizer = async () => { try { const r = await api.get('/api/org/optimizer'); setOptimizer(r.data.optimizer) } catch (e) { console.error(e) } }
  const loadReliability = async () => { try { const r = await api.get('/api/org/reliability'); setReliability(r.data.reliability) } catch (e) { console.error(e) } }

  const savePolicies = async () => {
    setSavingSection('policies')
    try {
      const r = await api.put('/api/org/policies', {
        blockPII: policies.blockPII, blockInjection: policies.blockInjection, blockJailbreak: policies.blockJailbreak,
        maxTokensPerRequest: Number(policies.maxTokensPerRequest), sensitiveKeywords: policies.sensitiveKeywords || [],
      })
      setPolicies(r.data.policies)
      toast.success('Security policies saved')
    } catch { toast.error('Failed to save policies') } finally { setSavingSection(null) }
  }
  const saveOptimizer = async () => {
    setSavingSection('optimizer')
    try {
      const r = await api.put('/api/org/optimizer', { autoOptimize: optimizer.autoOptimize, qualityTier: optimizer.qualityTier })
      setOptimizer(r.data.optimizer)
      toast.success('Optimization settings saved')
    } catch { toast.error('Failed to save optimizer') } finally { setSavingSection(null) }
  }
  const saveReliability = async () => {
    setSavingSection('reliability')
    try {
      const r = await api.put('/api/org/reliability', { enableRetry: reliability.enableRetry, maxRetries: Number(reliability.maxRetries) })
      setReliability(r.data.reliability)
      toast.success('Reliability settings saved')
    } catch { toast.error('Failed to save reliability') } finally { setSavingSection(null) }
  }

  const [members, setMembers] = useState<any[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [billing, setBilling] = useState<any>(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/org/settings')
        setOrgData(res.data)
        setProfile({ displayName: res.data.name || '', username: res.data.slug || '', email: res.data.email || '', bio: res.data.bio || '' })
      } catch (err) { console.error('Failed to load settings', err) } finally { setLoading(false) }
    })()
  }, [])

  const handleSaveProfile = async () => {
    await toast.promise(
      api.put('/api/org/settings', { displayName: profile.displayName, email: profile.email, bio: profile.bio }),
      { loading: 'Saving...', success: 'Profile updated!', error: 'Failed to save' }
    ).catch(() => {})
  }

  const loadMembers = async () => {
    if (membersLoading) return
    setMembersLoading(true)
    try { const res = await api.get('/api/org/members'); setMembers(res.data.members || []) }
    catch (err) { console.error('Failed to load members', err) } finally { setMembersLoading(false) }
  }
  const loadBilling = async () => {
    if (billingLoading) return
    setBillingLoading(true)
    try { const res = await api.get('/api/org/billing'); setBilling(res.data.billing || {}) }
    catch (err) { console.error('Failed to load billing', err) } finally { setBillingLoading(false) }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'team' && members.length === 0) loadMembers()
    if (tab === 'billing' && !billing) loadBilling()
    if (tab === 'policies' && !policies) loadPolicies()
    if (tab === 'optimization' && !optimizer) loadOptimizer()
    if (tab === 'reliability' && !reliability) loadReliability()
  }

  if (loading) return <LoadingScreen label="Loading settings" />

  return (
    <div>
      <PageHeader title="Settings" subtitle={orgData?._id ? `Organization ID: ${orgData._id.slice(0, 12)}` : undefined} />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div className="md:col-span-3">
          <nav className="space-y-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="relative flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors"
                  style={{ color: active ? 'var(--color-text)' : 'var(--color-text-secondary)' }}
                >
                  {active && (
                    <motion.div layoutId="settings-nav-active" className="absolute inset-0 rounded-[var(--radius-sm)] bg-bg-subtle" transition={{ type: 'spring', bounce: 0, duration: 0.3 }} />
                  )}
                  <Icon size={16} className="relative z-10" strokeWidth={1.75} />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="md:col-span-9">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="type-h2 text-text">Public identity</h2>
                <p className="mt-1 text-[13px] text-text-secondary">Configure how you appear across the organization.</p>
              </div>

              <Card padding="lg" className="flex items-center gap-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-bg-subtle">
                  <User size={28} className="text-text-tertiary" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <Label>Display name</Label>
                  <Input value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} />
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Username</Label>
                  <Input value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} />
                </div>
                <div>
                  <Label>Email address</Label>
                  <Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                </div>
              </div>

              <div>
                <Label>Bio</Label>
                <Textarea rows={4} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="A brief overview of your role…" />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile}>Save changes</Button>
              </div>
            </div>
          )}

          {activeTab === 'optimization' && (
            <div className="space-y-5">
              <div>
                <h2 className="type-h2 text-text">Cost optimization</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
                  When enabled, Zyra classifies each request&apos;s complexity and routes it to the cheapest capable model among the providers you&apos;ve configured. It never routes above the quality tier you set here.
                </p>
              </div>

              {!optimizer ? <LoadingScreen label="Loading" /> : (
                <>
                  <SettingRow
                    title="Auto optimization"
                    desc={optimizer.autoOptimize ? 'Active — requests are routed to cheaper capable models.' : 'Off — requests go to exactly the model you specify.'}
                    right={<Toggle on={!!optimizer.autoOptimize} onClick={() => setOptimizer({ ...optimizer, autoOptimize: !optimizer.autoOptimize })} />}
                  />

                  <Card padding="lg" className="space-y-3">
                    <p className="text-[14px] font-semibold text-text">Quality tier floor</p>
                    <p className="text-[12px] text-text-secondary">The lowest tier Zyra is allowed to route to. Downgrades never go below this.</p>
                    {[
                      { id: 'economy', label: 'Economy', desc: 'Cheapest models (GPT-3.5, Claude Haiku, Llama 8B). Best for classification, extraction, short answers.' },
                      { id: 'standard', label: 'Standard', desc: 'Balanced models (GPT-4o-mini, Claude Sonnet, Llama 70B). Good default for most workloads.' },
                      { id: 'premium', label: 'Premium', desc: 'Most capable models (GPT-4o, Claude Opus, Gemini Pro). Optimizer only saves within this tier.' },
                    ].map((tier) => {
                      const active = optimizer.qualityTier === tier.id
                      return (
                        <button
                          key={tier.id}
                          onClick={() => setOptimizer({ ...optimizer, qualityTier: tier.id })}
                          className="flex w-full items-start gap-3 rounded-[var(--radius-sm)] border p-3.5 text-left transition-colors"
                          style={{ borderColor: active ? 'var(--color-accent)' : 'var(--color-border)' }}
                        >
                          <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${active ? 'border-accent' : 'border-border-strong'}`}>
                            {active && <div className="h-1.5 w-1.5 rounded-full bg-accent" />}
                          </div>
                          <span>
                            <span className="block text-[13px] font-semibold text-text">{tier.label}</span>
                            <span className="mt-0.5 block text-[12px] text-text-secondary">{tier.desc}</span>
                          </span>
                        </button>
                      )
                    })}
                  </Card>

                  <InfoBanner>
                    Complexity classification is heuristic (length + keyword based), not an ML model. Savings depend on your workload mix — Zyra routes toward lower-cost capable models, it doesn&apos;t guarantee a fixed percentage.
                  </InfoBanner>

                  <div className="flex justify-end">
                    <Button disabled={savingSection === 'optimizer'} onClick={saveOptimizer}>
                      {savingSection === 'optimizer' ? 'Saving…' : 'Save optimization settings'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'reliability' && (
            <div className="space-y-5">
              <div>
                <h2 className="type-h2 text-text">Reliability</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
                  Control retry and fallback behavior. Retries use bounded exponential backoff and only apply to transient errors (429, 5xx, timeouts). The provider fallback order is configured on the Providers page.
                </p>
              </div>

              {!reliability ? <LoadingScreen label="Loading" /> : (
                <>
                  <SettingRow
                    title="Automatic retries"
                    desc="Retry transient provider failures before falling back."
                    right={<Toggle on={reliability.enableRetry !== false} onClick={() => setReliability({ ...reliability, enableRetry: !(reliability.enableRetry !== false) })} />}
                  />

                  <Card padding="lg" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[14px] font-semibold text-text">Max retries</p>
                      <span className="font-mono text-[16px] font-semibold text-accent">{reliability.maxRetries ?? 2}</span>
                    </div>
                    <input
                      type="range" min={0} max={5} step={1} value={reliability.maxRetries ?? 2}
                      onChange={(e) => setReliability({ ...reliability, maxRetries: Number(e.target.value) })}
                      className="w-full accent-[var(--color-accent)]"
                    />
                    <p className="text-[12px] text-text-secondary">Per-provider retry attempts (0–5) before Zyra moves to the next provider in the fallback order.</p>
                  </Card>

                  <Link href="/dashboard/providers" className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-bg-elevated p-4 transition-colors hover:bg-bg-subtle">
                    <ShieldCheck size={17} className="text-accent" />
                    <span className="text-[13px] text-text">Configure provider fallback order</span>
                    <ArrowRight size={15} className="ml-auto text-text-tertiary" />
                  </Link>

                  <div className="flex justify-end">
                    <Button disabled={savingSection === 'reliability'} onClick={saveReliability}>
                      {savingSection === 'reliability' ? 'Saving…' : 'Save reliability settings'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="space-y-5">
              <div>
                <h2 className="type-h2 text-text">Security policies</h2>
                <p className="mt-1 text-[13px] text-text-secondary">Pre-flight checks that run before a request is sent to any provider. Blocked requests never reach the provider.</p>
              </div>

              {orgData && (
                <SettingRow
                  title="Demo mode"
                  desc="Serve every LLM call from Zyra's built-in simulator — no provider API key required. Routing, cost, risk analysis and logging all still run for real; responses are templated and clearly flagged as simulated."
                  right={<Toggle on={!!orgData.demoMode} onClick={async () => {
                    const next = !orgData.demoMode
                    setOrgData({ ...orgData, demoMode: next })
                    try { await api.put('/api/org/settings', { demoMode: next }); toast.success(`Demo mode ${next ? 'on' : 'off'}`) }
                    catch { toast.error('Failed'); setOrgData({ ...orgData, demoMode: !next }) }
                  }} />}
                />
              )}

              {!policies ? <LoadingScreen label="Loading" /> : (
                <>
                  <SettingRow
                    title="Block PII"
                    desc="Reject prompts containing email, phone, Aadhaar, PAN, credit card, SSN, API keys, passwords or JWT tokens. Regex detection; matched values are never logged."
                    right={<Toggle on={!!policies.blockPII} onClick={() => setPolicies({ ...policies, blockPII: !policies.blockPII })} />}
                  />
                  <SettingRow
                    title="Block prompt injection"
                    desc={'Reject prompts that try to override or exfiltrate the system prompt ("ignore previous instructions", "reveal system prompt"). Rule-based, not an ML classifier.'}
                    right={<Toggle on={!!policies.blockInjection} onClick={() => setPolicies({ ...policies, blockInjection: !policies.blockInjection })} />}
                  />
                  <SettingRow
                    title="Block jailbreak"
                    desc={'Reject role-play / persona-hijack / "DAN"-style prompts that try to escape the safety policy. Off by default — when off, jailbreaks still flow through and raise the risk score.'}
                    right={<Toggle on={!!policies.blockJailbreak} onClick={() => setPolicies({ ...policies, blockJailbreak: !policies.blockJailbreak })} />}
                  />

                  <Card padding="lg" className="space-y-2.5">
                    <p className="text-[14px] font-semibold text-text">Sensitive keywords</p>
                    <p className="text-[12px] text-text-secondary">Comma-separated watch-words. Flagged (not blocked) in the risk report, on top of the built-in list (confidential, credentials, private key…).</p>
                    <Input
                      placeholder="project titan, acquisition, internal-only"
                      value={(policies.sensitiveKeywords || []).join(', ')}
                      onChange={(e) => setPolicies({ ...policies, sensitiveKeywords: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })}
                    />
                  </Card>

                  <Card padding="lg" className="space-y-2.5">
                    <p className="text-[14px] font-semibold text-text">Max tokens per request</p>
                    <p className="text-[12px] text-text-secondary">Zyra clamps <code className="rounded bg-bg-subtle px-1">max_tokens</code> on every forwarded request to this ceiling.</p>
                    <Input type="number" min={1} max={32000} value={policies.maxTokensPerRequest ?? 2000} onChange={(e) => setPolicies({ ...policies, maxTokensPerRequest: e.target.value })} />
                  </Card>

                  <InfoBanner>
                    The composite risk score R = 0.35·I + 0.30·J + 0.20·P + 0.15·A is computed asynchronously after every request (see Security &amp; Risk). The toggles above are the only checks that block a request before it leaves Zyra.
                  </InfoBanner>

                  <div className="flex justify-end">
                    <Button disabled={savingSection === 'policies'} onClick={savePolicies}>
                      {savingSection === 'policies' ? 'Saving…' : 'Save policies'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="type-h2 text-text">Security settings</h2>
                <p className="mt-1 text-[13px] text-text-secondary">Manage authentication and access controls.</p>
              </div>

              <Card padding="lg" className="space-y-4">
                <div className="flex items-center gap-2.5"><Lock size={18} className="text-accent" /><h3 className="type-h3 text-text">Change password</h3></div>
                <div>
                  <Label>Current password</Label>
                  <Input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} placeholder="••••••••" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>New password</Label>
                    <Input type="password" value={passwords.newPass} onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })} placeholder="Min 8 characters" />
                  </div>
                  <div>
                    <Label>Confirm password</Label>
                    <Input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="Re-enter password" />
                  </div>
                </div>
                <Button onClick={async () => {
                  if (passwords.newPass !== passwords.confirm) return toast.error('Passwords do not match')
                  if (passwords.newPass.length < 8) return toast.error('Password must be at least 8 characters')
                  if (!passwords.current) return toast.error('Current password is required')
                  try {
                    await toast.promise(
                      api.put('/api/auth/change-password', { currentPassword: passwords.current, newPassword: passwords.newPass }),
                      { loading: 'Updating password...', success: 'Password updated successfully', error: 'Failed to update password' }
                    )
                    setPasswords({ current: '', newPass: '', confirm: '' })
                  } catch { /* toast.promise already surfaced the error */ }
                }}>Update password</Button>
              </Card>

              <SettingRow title="Two-factor authentication" desc="Add an extra layer of security to your account." right={<Badge tone="neutral">Coming soon</Badge>} />

              <Card padding="lg" className="space-y-3">
                <div className="flex items-center gap-2.5"><Monitor size={18} className="text-accent" /><h3 className="type-h3 text-text">Active sessions</h3></div>
                <div className="flex items-center justify-between rounded-[var(--radius-sm)] bg-bg-subtle p-3.5">
                  <div className="flex items-center gap-3">
                    <Monitor size={16} className="text-success" />
                    <div>
                      <div className="text-[13px] font-medium text-text">Current session</div>
                      <div className="text-[11px] text-text-tertiary">
                        Active now · {typeof window !== 'undefined' ? navigator.userAgent.split(' ').slice(-1)[0]?.split('/')[0] || 'Browser' : 'Browser'}
                      </div>
                    </div>
                  </div>
                  <Badge tone="success">Active</Badge>
                </div>
                <Button
                  variant="outline" className="w-full"
                  onClick={() => toast('Session revocation is not yet available. JWT-based sessions cannot be individually revoked without a token blocklist.', { icon: 'ℹ️', duration: 4000 })}
                >
                  Revoke all other sessions <span className="ml-2 text-[10px] text-text-tertiary">(coming soon)</span>
                </Button>
              </Card>

              <SettingRow
                title="API key management"
                desc="Rotate or revoke your API keys."
                right={<Link href="/dashboard/apikeys"><Button variant="outline" size="sm"><KeyRound size={14} className="mr-1.5" />Manage keys</Button></Link>}
              />

              <div className="flex gap-4">
                <Link href="/privacy" className="flex flex-1 items-center gap-3 rounded-[var(--radius-md)] border border-border bg-bg-elevated p-4 transition-colors hover:bg-bg-subtle">
                  <FileText size={16} className="text-text-tertiary" />
                  <span className="text-[13px] font-medium text-text">Privacy policy</span>
                  <ArrowRight size={14} className="ml-auto text-text-tertiary" />
                </Link>
                <Link href="/terms" className="flex flex-1 items-center gap-3 rounded-[var(--radius-md)] border border-border bg-bg-elevated p-4 transition-colors hover:bg-bg-subtle">
                  <Gavel size={16} className="text-text-tertiary" />
                  <span className="text-[13px] font-medium text-text">Terms of service</span>
                  <ArrowRight size={14} className="ml-auto text-text-tertiary" />
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="type-h2 text-text">Team members</h2>
                  <p className="mt-1 text-[13px] text-text-secondary">Manage your organization members and roles.</p>
                </div>
                <Button disabled variant="outline">Invite member</Button>
              </div>

              {membersLoading ? <LoadingScreen label="Loading team roster" /> : members.length > 0 ? (
                <Card padding="none" className="overflow-hidden">
                  <Table>
                    <THead><tr><TH>Member</TH><TH>Role</TH><TH>Joined</TH><TH>Status</TH></tr></THead>
                    <TBody>
                      {members.map((member: any, i: number) => (
                        <TR key={member._id || i}>
                          <TD>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[var(--color-accent-hover)] text-[12px] font-bold text-white">
                                {member.name?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <div className="text-[13px] font-medium text-text">{member.name}</div>
                                <div className="text-[12px] text-text-tertiary">{member.email}</div>
                              </div>
                            </div>
                          </TD>
                          <TD><Badge tone={member.role === 'admin' ? 'accent' : 'neutral'}>{member.role}</Badge></TD>
                          <TD className="text-text-tertiary">{new Date(member.createdAt).toLocaleDateString()}</TD>
                          <TD><Badge tone={member.isActive ? 'success' : 'danger'}>{member.isActive ? 'Active' : 'Inactive'}</Badge></TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </Card>
              ) : (
                <Card padding="lg"><EmptyState icon={Users} title="No team members found" sub="You are the sole operator." /></Card>
              )}

              <div className="flex flex-wrap items-center gap-8 rounded-[var(--radius-md)] border border-border bg-bg-elevated p-4">
                {[{ role: 'Admin', desc: 'Full access', tone: 'bg-accent' }, { role: 'Developer', desc: 'Read + write', tone: 'bg-text' }, { role: 'Viewer', desc: 'Read only', tone: 'bg-text-tertiary' }].map((r) => (
                  <div key={r.role} className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${r.tone}`} />
                    <span className="text-[12px] font-medium text-text">{r.role}</span>
                    <span className="text-[12px] text-text-tertiary">— {r.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div>
                <h2 className="type-h2 text-text">Billing &amp; usage</h2>
                <p className="mt-1 text-[13px] text-text-secondary">Manage your subscription and monitor usage limits.</p>
              </div>

              {billingLoading ? <LoadingScreen label="Loading billing data" /> : (
                <>
                  <Card padding="lg">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <div className="type-meta text-text-tertiary">Current plan</div>
                        <h3 className="mt-1 text-[2rem] font-bold capitalize text-text">{billing?.plan || 'Free'}</h3>
                      </div>
                      <Button onClick={() => toast('Upgrade flow coming in a future release', { icon: '⚡' })}>Upgrade plan</Button>
                    </div>
                    <div>
                      <div className="mb-2 flex justify-between text-[12px]">
                        <span className="font-medium text-text-secondary">Monthly request usage</span>
                        <span className="font-mono text-text">{(billing?.currentMonthlyLogs || 0).toLocaleString()} / {(billing?.monthlyLogLimit || 5000).toLocaleString()}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-bg-subtle">
                        <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${Math.min(((billing?.currentMonthlyLogs || 0) / (billing?.monthlyLogLimit || 5000)) * 100, 100)}%` }} />
                      </div>
                      <div className="mt-2 flex justify-between text-[11px] text-text-tertiary">
                        <span>{(((billing?.currentMonthlyLogs || 0) / (billing?.monthlyLogLimit || 5000)) * 100).toFixed(1)}% used</span>
                        <span>{((billing?.monthlyLogLimit || 5000) - (billing?.currentMonthlyLogs || 0)).toLocaleString()} remaining</span>
                      </div>
                    </div>
                  </Card>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[
                      { name: 'Builder', price: 'Free', limit: '1,000 req/mo', current: billing?.plan === 'free' },
                      { name: 'Pro', price: '₹999/mo', limit: '50,000 req/mo', current: billing?.plan === 'pro' },
                      { name: 'Growth', price: '₹3,999/mo', limit: 'Unlimited', current: billing?.plan === 'growth' },
                    ].map((plan) => (
                      <Card key={plan.name} padding="md" className={plan.current ? 'border-accent' : ''}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[14px] font-semibold text-text">{plan.name}</span>
                          {plan.current && <Badge tone="accent">Current</Badge>}
                        </div>
                        <div className="font-mono text-[18px] font-semibold text-text">{plan.price}</div>
                        <div className="mt-1 text-[12px] text-text-tertiary">{plan.limit}</div>
                      </Card>
                    ))}
                  </div>

                  <InfoBanner>Provider API costs (OpenAI, Anthropic, etc.) are billed directly by each provider. Zyra only charges for platform access.</InfoBanner>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
