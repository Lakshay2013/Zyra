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
    onSuccess: (data) => {
      setNewKey(data)
      setKeyName('')
      queryClient.invalidateQueries(['api-keys'])
    }
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
        <p>Manage keys for SDK authentication</p>
      </div>
      <div className="page-body">

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setNewKey(null) }}>
            + Generate New Key
          </button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? <div className="loading"><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Prefix</th>
                  <th>Status</th>
                  <th>Last Used</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.keys?.length === 0 && (
                  <tr><td colSpan={6}><div className="empty-state">No API keys yet</div></td></tr>
                )}
                {data?.keys?.map((key) => (
                  <tr key={key._id}>
                    <td style={{ fontWeight: 600 }}>{key.name}</td>
                    <td><code style={{ color: 'var(--cyan)', fontSize: '11px' }}>{key.prefix}...</code></td>
                    <td>
                      <span className={`risk-badge ${key.isActive ? 'risk-low' : 'risk-high'}`}>
                        {key.isActive ? 'active' : 'revoked'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {key.isActive && (
                        <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '10px' }}
                          onClick={() => revokeMutation.mutate(key._id)}>
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
                <h3>Generate API Key</h3>
                <p>Give this key a name so you can identify it later.</p>
                <div className="form-group">
                  <label className="form-label">Key Name</label>
                  <input className="form-input" placeholder="e.g. Production SDK"
                    value={keyName} onChange={e => setKeyName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && createMutation.mutate(keyName)} />
                </div>
                <div className="modal-actions">
                  <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => createMutation.mutate(keyName)}
                    disabled={!keyName || createMutation.isPending}>
                    {createMutation.isPending ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Key Generated ✓</h3>
                <p>Copy this key now — it will <strong style={{ color: 'var(--red)' }}>never be shown again</strong>.</p>
                <div className="key-display">{newKey.key}</div>
                <div className="modal-actions">
                  <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Close</button>
                  <button className="btn btn-primary" onClick={copyKey}>
                    {copied ? '✓ Copied!' : 'Copy Key'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}