'use client'

import { useState, useEffect } from "react"
import { Users, UserPlus, Settings, MoreVertical } from "lucide-react"
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-body">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-headline font-bold text-[#032416] mb-2 tracking-tight">Organization Team</h1>
          <p className="text-[#424843] font-medium text-sm">Manage members, roles, and access across your AI Shield organization.</p>
        </div>
        
        <button onClick={() => toast('Invite team member flow coming soon', { icon: '🧑‍💻' })} className="flex items-center space-x-2 px-5 py-2.5 bg-[#1a3a2a] hover:bg-[#032416] text-white rounded-xl text-sm font-bold transition-all shadow-[0_4px_14px_rgba(26,58,42,0.4)]">
          <UserPlus className="w-4 h-4 ml-[-4px]" />
          <span>Invite Member</span>
        </button>
      </div>

      <div className="bg-white rounded-[16px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#f1eedf] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#424843] text-sm font-medium">Loading team members...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] text-[#424843] uppercase bg-[#fdfaea] border-b border-[#f1eedf] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1eedf]">
              {members.map((user) => (
                <tr key={user._id} className="hover:bg-[#fdfaea]/60 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-[#f1eedf] flex items-center justify-center font-bold text-[#5e51ad]">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[#032416]">{user.name}</div>
                        <div className="text-xs text-[#424843]">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="font-semibold text-[#032416] capitalize">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${user.isActive ? 'bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]' : 'bg-[#ffebee] text-[#c62828] border-[#ffcdd2]'}`}>
                      {user.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-[#424843] font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right">
                    <button onClick={() => toast(`Options for ${user.name} coming soon`, { icon: '⚙️' })} className="text-[#c1c8c2] hover:text-[#032416] p-2 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
