'use client'

import { useState, useEffect } from 'react'
import { Users, MoreVertical } from 'lucide-react'
import api from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Metric } from '@/components/ui/metric'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { EmptyState, LoadingScreen } from '@/components/ui/empty-state'
import { Table, THead, TH, TBody, TR, TD } from '@/components/ui/table'

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchMembers() }, [])

  async function fetchMembers() {
    try {
      const res = await api.get('/api/org/members')
      setMembers(res.data.members || [])
    } catch (err) {
      console.error('Failed to load members', err)
    } finally { setLoading(false) }
  }

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="Manage members, roles, and access across your Zyra organization."
        right={
          <Tooltip label="Invitations are planned for a future release">
            <Button disabled variant="outline">Invite member</Button>
          </Tooltip>
        }
      />

      <div className="mb-6 flex flex-wrap gap-8">
        <Metric label="Total members" value={members.length} />
        <Metric label="Active" value={members.filter((m) => m.isActive).length} tone="success" />
        <Metric label="Admins" value={members.filter((m) => m.role === 'admin').length} />
      </div>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <LoadingScreen label="Loading team roster" />
        ) : members.length === 0 ? (
          <EmptyState icon={Users} title="No team members found" sub="You are the sole operator." />
        ) : (
          <Table>
            <THead>
              <tr><TH>Member</TH><TH>Role</TH><TH>Joined</TH><TH>Status</TH><TH /></tr>
            </THead>
            <TBody>
              {members.map((user) => (
                <TR key={user._id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[var(--color-accent-hover)] text-[12px] font-bold text-white">
                        {user.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-text">{user.name}</div>
                        <div className="text-[12px] text-text-tertiary">{user.email}</div>
                      </div>
                    </div>
                  </TD>
                  <TD><Badge tone={user.role === 'admin' ? 'accent' : 'neutral'}>{user.role}</Badge></TD>
                  <TD className="text-text-tertiary">{new Date(user.createdAt).toLocaleDateString()}</TD>
                  <TD><Badge tone={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Active' : 'Inactive'}</Badge></TD>
                  <TD align="right">
                    <Tooltip label="Member options are planned for a future release">
                      <button disabled className="rounded-[var(--radius-sm)] p-2 text-text-tertiary opacity-50" aria-label={`Options for ${user.name}`}>
                        <MoreVertical size={16} />
                      </button>
                    </Tooltip>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <div className="mt-6 flex flex-wrap items-center gap-8 rounded-[var(--radius-md)] border border-border bg-bg-elevated p-4">
        {[
          { role: 'Admin', desc: 'Full access', tone: 'bg-accent' },
          { role: 'Developer', desc: 'Read + write', tone: 'bg-text' },
          { role: 'Viewer', desc: 'Read only', tone: 'bg-text-tertiary' },
        ].map((r) => (
          <div key={r.role} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${r.tone}`} />
            <span className="text-[12px] font-medium text-text">{r.role}</span>
            <span className="text-[12px] text-text-tertiary">— {r.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
