import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export default function ApiKeys() {
  const [showModal, setShowModal] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [newKey, setNewKey] = useState(null)
  const [copied, setCopied] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.get('/keys').then(r => r.data)
  })

  const createMutation = useMutation({
    mutationFn: (name) => api.post('/keys', { name }).then(r => r.data),
    onSuccess: (data) => { setNewKey(data); setKeyName(''); queryClient.invalidateQueries(['api-keys']) }
  })

  const revokeMutation = useMutation({
    mutationFn: (id) => api.delete(`/keys/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['api-keys'])
  })

  const copyKey = () => {
    navigator.clipboard.writeText(newKey.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="page-header">
        <h2>API Keys</h2>
        <p>Manage authentication keys for the Zyra SDK and proxy</p>
      </div>
      <div className="page-body">

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ background: 'var(--accent-light)', border: '1px solid #C7CDFB', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: 'var(--accent)', maxWidth: 500 }}>
            Use your API key in the <code style={{ background: 'rgba(91,110,245,0.1)', padding: '1px 6px', borderRadius: 4 }}>x-api-key</code> header when calling the Zyra proxy or SDK.
          </div>
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setNewKey(null) }}>
            + Generate new key
          </button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? <div className="loading"><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Key prefix</th>
                  <th>Status</th>
                  <th>Last used</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {!data?.keys?.length && (
                  <tr><td colSpan={6}><div className="empty-state">No API keys yet — generate one to get started</div></td></tr>
                )}
                {data?.keys?.map((key) => (
                  <tr key={key._id}>
                    <td style={{ fontWeight: 600 }}>{key.name}</td>
                    <td><code style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-light)', padding: '2px 8px', borderRadius: 4 }}>{key.prefix}...</code></td>
                    <td><span className={`risk-badge ${key.isActive ? 'risk-low' : 'risk-high'}`}>{key.isActive ? 'Active' : 'Revoked'}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{new Date(key.createdAt).toLocaleDateString()}</td>
                    <td>
                      {key.isActive && (
                        <button className="btn btn-danger" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => revokeMutation.mutate(key._id)}>
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {!newKey ? (
              <>
                <h3>Generate API key</h3>
                <p>Give this key a name to identify where it's used.</p>
                <div className="form-group">
                  <label className="form-label">Key name</label>
                  <input className="form-input" placeholder="e.g. Production, Staging, Local dev" value={keyName} onChange={e => setKeyName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createMutation.mutate(keyName)} />
                </div>
                <div className="modal-actions">
                  <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => createMutation.mutate(keyName)} disabled={!keyName || createMutation.isPending}>
                    {createMutation.isPending ? 'Generating...' : 'Generate key'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Key generated successfully</h3>
                <p>Copy this key now — it will <strong style={{ color: 'var(--red)' }}>never be shown again</strong> once you close this dialog.</p>
                <div className="key-display">{newKey.key}</div>
                <div className="modal-actions">
                  <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Close</button>
                  <button className="btn btn-primary" onClick={copyKey}>{copied ? '✓ Copied!' : 'Copy key'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}