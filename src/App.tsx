import { useState } from 'react'
import type { AppView } from './types'
import { useNow } from './hooks/useNow'
import { useSessions } from './hooks/useSessions'

import { SessionListView } from './components/SessionListView'
import { SessionFormView } from './components/SessionFormView'
import { SessionDetailView } from './components/SessionDetailView'

import './App.css'

function App() {
  const now = useNow()
  const {
    sessions,
    createSession,
    editSessionConfig,
    deleteSession,
    duplicateSession,
    pauseSession,
    resumeSession,
    endSession,
    updateSessionPoster,
    updateSessionOpacity,
  } = useSessions(now)

  const [appView, setAppView] = useState<AppView>('list')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  // Handlers for List View
  const handleCreateNew = () => {
    setSelectedSessionId(null)
    setAppView('create')
  }

  const handleOpenSession = (id: string) => {
    setSelectedSessionId(id)
    setAppView('session')
  }

  const handleEditSession = (id: string) => {
    setSelectedSessionId(id)
    setAppView('edit')
  }

  const handleDuplicateSession = (id: string) => {
    duplicateSession(id)
  }

  const handleDeleteSession = (id: string) => {
    deleteSession(id)
    if (selectedSessionId === id) {
      setSelectedSessionId(null)
      setAppView('list')
    }
  }

  // Handlers for Form View
  const handleSaveForm = (fields: {
    title: string
    date: string
    startTime: string
    durationHours: number
    posterUrl?: string | null
    posterOpacity?: number
  }) => {
    if (appView === 'create') {
      createSession(fields)
    } else if (appView === 'edit' && selectedSessionId) {
      editSessionConfig(selectedSessionId, fields)
      // also optionally update poster
      if (fields.posterUrl !== undefined) {
        updateSessionPoster(selectedSessionId, fields.posterUrl)
      }
      if (fields.posterOpacity !== undefined) {
        updateSessionOpacity(selectedSessionId, fields.posterOpacity)
      }
    }
    setAppView('list')
    setSelectedSessionId(null)
  }

  const handleCancelForm = () => {
    setAppView('list')
    setSelectedSessionId(null)
  }

  // Routing
  if (appView === 'create') {
    return (
      <SessionFormView
        editingSession={null}
        onSave={handleSaveForm}
        onCancel={handleCancelForm}
      />
    )
  }

  if (appView === 'edit') {
    const session = sessions.find((s) => s.id === selectedSessionId)
    if (!session) {
      // Fallback if deleted
      setAppView('list')
      return null
    }
    return (
      <SessionFormView
        editingSession={session}
        onSave={handleSaveForm}
        onCancel={handleCancelForm}
      />
    )
  }

  if (appView === 'session') {
    const session = sessions.find((s) => s.id === selectedSessionId)
    if (!session) {
      // Fallback if deleted
      setAppView('list')
      return null
    }
    return (
      <SessionDetailView
        session={session}
        now={now}
        onBack={() => {
          setAppView('list')
          setSelectedSessionId(null)
        }}
        onPause={pauseSession}
        onResume={resumeSession}
        onEnd={endSession}
        onUpdatePoster={updateSessionPoster}
        onUpdateOpacity={updateSessionOpacity}
      />
    )
  }

  // Default: list view
  return (
    <SessionListView
      sessions={sessions}
      now={now}
      onCreateNew={handleCreateNew}
      onOpenSession={handleOpenSession}
      onEditSession={handleEditSession}
      onDuplicateSession={handleDuplicateSession}
      onDeleteSession={handleDeleteSession}
    />
  )
}

export default App
