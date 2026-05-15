import { useEffect, useState } from 'react'
import { AIOverlay } from '../packages/overlay-core/src'
import { Admin } from './Admin'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [view, setView] = useState<'host' | 'admin'>('host')
  const [events, setEvents] = useState<string[]>([])

  useEffect(() => {
    if (view !== 'host') return

    const overlay = AIOverlay.init({
      siteKey: 'pk_demo_shakecursor',
      apiBaseUrl: 'http://127.0.0.1:8787',
      trigger: {
        shake: true,
        keyboardShortcut: 'mod+k',
      },
      selection: {
        blockedSelectors: ['input[type="password"]', '[data-ai-private]', '[data-ai-overlay-ignore]'],
      },
      theme: {
        primaryColor: '#14b8a6',
        borderRadius: 8,
      },
      onActivate: () => {
        setEvents((current) => ['AI mode activated', ...current].slice(0, 5))
      },
      onSelection: (selection) => {
        setEvents((current) => [`Selected ${selection.kind}: ${selection.label}`, ...current].slice(0, 5))
      },
      onAsk: ({ question }) => {
        setEvents((current) => [`Asked: ${question}`, ...current].slice(0, 5))
      },
      onResponse: () => {
        setEvents((current) => ['Response returned', ...current].slice(0, 5))
      },
      onError: (error) => {
        setEvents((current) => [`Error: ${error.message}`, ...current].slice(0, 5))
      },
    })

    return () => {
      overlay.destroy()
    }
  }, [view])

  if (view === 'admin') {
    return (
      <>
        <Admin />
        <button className="admin-toggle-btn" onClick={() => setView('host')}>
          Back to Demo Page
        </button>
      </>
    )
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>Shake Cursor AI SDK</h1>
            <p>
              This page is now just a host site. The cursor gesture, selection capture, prompt box,
              and Ollama call all come from the framework-agnostic overlay SDK.
            </p>
          </div>
          <div className="install-card" data-ai-overlay-ignore>
            <code>{`AIOverlay.init({ siteKey: 'pk_demo_shakecursor' })`}</code>
          </div>
        </header>

        <section className="reading-surface" aria-label="Demo page content">
          <article className="copy-block">
            <h2>Research note</h2>
            <p>
              Local-first AI tools are most useful when they sit directly where work happens. A quick
              cursor gesture can turn any page into a workspace without forcing users to copy content,
              switch tabs, or break their reading flow.
            </p>
            <p>
              The SDK version should capture highlighted text, image metadata, and visible element text
              without depending on React, Vue, or any host-site framework. Later versions can add
              screenshot regions, OCR, page embeddings, and RAG-backed answers for the site owner.
            </p>
          </article>

          <figure className="media-block">
            <img src={heroImg} alt="Layered product artwork for a browser assistant prototype" />
            <figcaption>
              Images can be selected in AI mode. The current SDK sends image source, alt text, and size
              metadata to the configured model endpoint.
            </figcaption>
          </figure>

          <article className="copy-block compact">
            <h2>SDK surface</h2>
            <ul>
              <li>Shake gesture and keyboard shortcut activation.</li>
              <li>Text, image, and element-level selection capture.</li>
              <li>Configurable model transport for Ollama or custom endpoints.</li>
              <li>Callbacks for activation, selection, prompt submission, response, and errors.</li>
            </ul>
          </article>

          <aside className="event-log" data-ai-overlay-ignore>
            <h2>SDK events</h2>
            {events.length === 0 ? (
              <p>Shake the cursor or press Cmd/Ctrl + K, then select page content.</p>
            ) : (
              <ol>
                {events.map((event, index) => (
                  <li key={`${event}-${index}`}>{event}</li>
                ))}
              </ol>
            )}
          </aside>
        </section>
      </section>

      <button className="admin-toggle-btn" onClick={() => setView('admin')}>
        Open Admin Dashboard
      </button>
    </main>
  )
}

export default App
