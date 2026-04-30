'use client'

import { useState, useEffect } from "react"
import toast from 'react-hot-toast'
import api from "@/lib/api"

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    try {
      const res = await api.get('/api/org/members')
      setMembers(res.data.members || [])
    } catch (err) {
      console.error("Failed to load members", err)
    } finally {
      setLoading(false)
    }
  }

  const cardStyle: React.CSSProperties = {
    background: '#201f20', borderRadius: 12, border: '1px solid rgba(83,67,65,0.05)',
  }

  return (
    <div>
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6" style={{ borderBottom: '1px solid rgba(83,67,65,0.1)' }}>
        <div>
          <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', color: '#e5e2e3', lineHeight: 1 }}>
            TEAM
          </h1>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#71717a', marginTop: 8 }}>
            Manage members, roles, and access across your <span style={{ color: '#ffa69e' }}>Zyra</span> organization.
          </p>
        </div>
        <button
          onClick={() => toast('Team invitations coming in v2.5', { icon: '📧' })}
          style={{
            background: '#ffa69e', padding: '8px 20px', borderRadius: 12, cursor: 'pointer',
            fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#3b0908', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
          Invite Member
        </button>
      </div>

      {/* ── METRIC STRIP ── */}
      <div className="flex items-center gap-8 mt-6 p-4 flex-wrap" style={{ background: '#1c1b1c', borderRadius: 12 }}>
        {[
          { label: 'Total Members', value: `${members.length}` },
          { label: 'Active', value: `${members.filter(m => m.isActive).length}`, accent: true },
          { label: 'Admins', value: `${members.filter(m => m.role === 'admin').length}` },
        ].map((m, i) => (
          <div key={i} className="flex flex-col">
            <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', marginBottom: 4 }}>{m.label}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: m.accent ? '#9be8cb' : '#e5e2e3' }}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* ── MEMBERS TABLE ── */}
      <div className="mt-6 overflow-hidden" style={{ ...cardStyle }}>
        {loading ? (
          <div className="flex gap-3 items-center justify-center py-20" style={{ color: '#ffa69e' }}>
            <span className="material-symbols-outlined animate-pulse">group</span>
            <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>Loading team roster...</span>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#353436' }}>group</span>
            <p style={{ fontSize: 14, color: '#534341', marginTop: 12 }}>No team members found. You are the sole operator.</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3" style={{ borderBottom: '1px solid rgba(83,67,65,0.1)', background: '#1c1b1c' }}>
              {['Member', 'Role', 'Joined', 'Status', ''].map((h, i) => (
                <div key={h || 'actions'} className={i === 0 ? 'col-span-4' : i === 4 ? 'col-span-1' : 'col-span-2'} style={{
                  fontSize: 10, letterSpacing: '0.15em', fontWeight: 700, color: '#71717a', textTransform: 'uppercase'
                }}>{h}</div>
              ))}
            </div>

            {/* Member Rows */}
            {members.map((user) => (
              <div key={user._id} className="grid grid-cols-12 gap-4 px-6 py-5 items-center transition-colors hover:bg-[#2a2a2b]" style={{ borderBottom: '1px solid rgba(83,67,65,0.05)' }}>
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #ffa69e, #904a45)' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{user.name?.[0]?.toUpperCase() || '?'}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e2e3' }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: '#71717a', fontFamily: "'JetBrains Mono', monospace" }}>{user.email}</div>
                  </div>
                </div>
                <div className="col-span-2">
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: user.role === 'admin' ? '#ffa69e' : '#71717a',
                    background: user.role === 'admin' ? 'rgba(255,166,158,0.1)' : '#353436',
                    padding: '4px 10px', borderRadius: 6,
                  }}>{user.role}</span>
                </div>
                <div className="col-span-2">
                  <span style={{ fontSize: 12, color: '#71717a', fontFamily: "'JetBrains Mono', monospace" }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="col-span-3 flex items-center gap-2">
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: user.isActive ? '#9be8cb' : '#ffb4ab',
                  }}>{user.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: user.isActive ? '#9be8cb' : '#ffb4ab' }} />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => toast(`Options for ${user.name} coming soon`, { icon: '⚙️' })}
                    className="p-2 transition-colors hover:bg-[#353436]"
                    style={{ borderRadius: 8, color: '#534341' }}
                    aria-label={`Options for ${user.name}`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>more_vert</span>
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* ── ROLES LEGEND ── */}
      <div className="flex items-center gap-8 p-4 mt-6" style={{ background: '#1c1b1c', borderRadius: 12 }}>
        {[
          { role: 'Admin', desc: 'Full access', color: '#ffa69e' },
          { role: 'Member', desc: 'Read + write', color: '#e5e2e3' },
          { role: 'Viewer', desc: 'Read only', color: '#71717a' },
        ].map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#e5e2e3' }}>{r.role}</span>
            <span style={{ fontSize: 10, color: '#71717a' }}>— {r.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
