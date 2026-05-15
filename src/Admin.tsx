import { useEffect, useState, useCallback } from 'react'
import './App.css'

interface Site {
  siteId: string
  name: string
  allowedOrigins: string[]
  model: {
    provider: string
    endpoint: string
    model: string
  }
  rag: {
    enabled: boolean
    topK: number
    indexPath: string
  }
}

interface QueryLog {
  siteId: string
  question: string
  pageUrl: string
  selectionKind: string
  at: string
}

const ADMIN_TOKEN = 'shake-debug-token'

export function Admin() {
  const [sites, setSites] = useState<Record<string, Site>>({})
  const [selectedKey, setSelectedKey] = useState<string>('')
  const [queries, setQueries] = useState<QueryLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSites = useCallback(async () => {
    try {
      const response = await fetch('https://shakeai.onrender.com/admin/sites', {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      })
      const data = await response.json()
      setSites(data)
      if (Object.keys(data).length > 0 && !selectedKey) {
        setSelectedKey(Object.keys(data)[0])
      }
    } catch (error) {
      console.error('Failed to fetch sites', error)
    } finally {
      setLoading(false)
    }
  }, [selectedKey])

  const fetchQueries = useCallback(async (key: string) => {
    try {
      const response = await fetch(`https://shakeai.onrender.com/admin/queries?siteKey=${key}`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      })
      const data = await response.json()
      setQueries(data.reverse())
    } catch (error) {
      console.error('Failed to fetch queries', error)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    async function startFetching() {
      await fetchSites()
    }
    if (!ignore) {
      startFetching()
    }
    return () => { ignore = true }
  }, [fetchSites])

  useEffect(() => {
    let ignore = false
    async function startFetching() {
      if (selectedKey) {
        await fetchQueries(selectedKey)
      }
    }
    if (!ignore) {
      startFetching()
    }
    return () => { ignore = true }
  }, [selectedKey, fetchQueries])

  const createSite = async () => {
    const name = prompt('Enter site name:')
    if (!name) return

    try {
      const response = await fetch('https://shakeai.onrender.com/admin/sites', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify({ name, siteId: name.toLowerCase().replace(/\s+/g, '-') }),
      })

      const data = await response.json()
      await fetchSites()
      setSelectedKey(data.siteKey)
    } catch (error) {
      console.error('Failed to create site', error)
    }
  }

  const selectedSite = sites[selectedKey]

  if (loading) return <div className="admin-loading">Loading configuration...</div>

  return (
    <div className="admin-container">
      <nav className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Projects</h2>
          <button className="icon-btn" onClick={createSite} title="New Project">+</button>
        </div>
        <div className="site-list">
          {Object.entries(sites).map(([key, site]) => (
            <button
              key={key}
              className={`site-item ${selectedKey === key ? 'active' : ''}`}
              onClick={() => setSelectedKey(key)}
            >
              {site.name}
            </button>
          ))}
        </div>
      </nav>

      <main className="admin-main">
        {selectedSite ? (
          <>
            <header className="admin-header">
              <h1>{selectedSite.name}</h1>
              <span className="site-id-badge">{selectedSite.siteId}</span>
            </header>

            <section className="admin-section">
              <h2>Installation</h2>
              <div className="install-snippet">
                <pre>
                  <code>{`import { AIOverlay } from '@shakecursor/overlay'

AIOverlay.init({
  siteKey: '${selectedKey}',
  apiBaseUrl: 'https://shakeai.onrender.com'
})`}</code>
                </pre>
              </div>
            </section>

            <div className="admin-grid">
              <section className="admin-section">
                <h2>Configuration</h2>
                <div className="config-details">
                  <div className="config-row">
                    <label>Provider:</label>
                    <span>{selectedSite.model.provider}</span>
                  </div>
                  <div className="config-row">
                    <label>Model:</label>
                    <span>{selectedSite.model.model}</span>
                  </div>
                  <div className="config-row">
                    <label>RAG:</label>
                    <span>{selectedSite.rag.enabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="config-row">
                    <label>Allowed Origins:</label>
                    <div className="tag-cloud">
                      {selectedSite.allowedOrigins.map((o) => (
                        <span key={o} className="tag">{o}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="admin-section">
                <h2>Recent Queries</h2>
                <div className="query-list">
                  {queries.length === 0 ? (
                    <p className="empty-state">No queries recorded yet.</p>
                  ) : (
                    queries.slice(0, 10).map((q, i) => (
                      <div key={i} className="query-item">
                        <p className="query-text">"{q.question}"</p>
                        <div className="query-meta">
                          <span>{q.selectionKind} on {new URL(q.pageUrl).pathname}</span>
                          <span>{new Date(q.at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </>
        ) : (
          <div className="empty-state">Select a project to view details</div>
        )}
      </main>
    </div>
  )
}
