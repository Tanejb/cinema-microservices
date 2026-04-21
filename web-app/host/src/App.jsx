import { useMemo, useState } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('movies')

  const tabs = useMemo(
    () => [
      { key: 'movies', label: 'Movies', url: 'http://localhost:4311' },
      { key: 'users', label: 'Users', url: 'http://localhost:4312' },
      { key: 'screenings', label: 'Screenings', url: 'http://localhost:4313' },
      { key: 'reservations', label: 'Reservations', url: 'http://localhost:4314' },
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
