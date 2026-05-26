import { useMemo, useState } from 'react'
import './App.css'

const toIframeUrl = (remote, fallback) =>
  (import.meta.env[remote] || fallback).replace(/\/assets\/remoteEntry\.js$/, '')

function App() {
  const [activeTab, setActiveTab] = useState('movies')

  const tabs = useMemo(
    () => [
      { key: 'movies', label: 'Movies', url: toIframeUrl('VITE_REMOTE_MOVIES', 'http://localhost:4311/assets/remoteEntry.js') },
      { key: 'users', label: 'Users', url: toIframeUrl('VITE_REMOTE_USERS', 'http://localhost:4312/assets/remoteEntry.js') },
      { key: 'screenings', label: 'Screenings', url: toIframeUrl('VITE_REMOTE_SCREENINGS', 'http://localhost:4313/assets/remoteEntry.js') },
      { key: 'reservations', label: 'Reservations', url: toIframeUrl('VITE_REMOTE_RESERVATIONS', 'http://localhost:4314/assets/remoteEntry.js') },
    ],
    [],
  )

  const activeMfe = tabs.find((tab) => tab.key === activeTab)

  return (
    <div className="shell">
      <header>
        <h1>Cinema Micro Frontends</h1>
        <p>Host aplikacija nalaga posamezne domenske module (MFE) prek iframe kompozicije.</p>
      </header>

      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? 'active' : ''}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="content">
        <iframe
          key={activeMfe?.key}
          title={`mfe-${activeMfe?.key}`}
          src={activeMfe?.url}
          className="mfe-frame"
        />
      </main>
    </div>
  )
}

export default App
