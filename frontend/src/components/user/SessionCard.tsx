import { useState } from 'react'
import { UserSession } from '@/services/user'
import {
  renameSession,
  archiveSession,
  restoreSession,
  duplicateSession,
  deleteSession,
  exportSession,
} from '@/services/user'
import ShareDialog from './ShareDialog'

interface Props {
  session: UserSession
  onRefresh: () => void
  isArchived?: boolean
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function SessionCard({ session, onRefresh, isArchived = false }: Props) {
  const [renaming, setRenaming] = useState(false)
  const [nameInput, setNameInput] = useState(session.name ?? '')
  const [showShare, setShowShare] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleRename() {
    if (!nameInput.trim()) return
    try {
      await renameSession(session.id, nameInput.trim())
      setRenaming(false)
      onRefresh()
    } catch (e) {
      alert('Erreur lors du renommage')
    }
  }

  async function handleAction(action: () => Promise<void>, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return
    setBusy(true)
    try {
      await action()
      onRefresh()
    } catch (e: any) {
      alert(e.message ?? 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  async function handleExport() {
    try {
      const blob = await exportSession(session.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `session-${session.name ?? session.id}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Erreur lors de l\'export')
    }
  }

  const sessionName = session.name ?? `Session ${session.id.slice(0, 8)}`

  return (
    <div className="bg-white rounded-lg border p-4 flex flex-col gap-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {renaming ? (
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded px-2 py-1 text-sm"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                autoFocus
              />
              <button onClick={handleRename} className="text-sm text-blue-600">OK</button>
              <button onClick={() => setRenaming(false)} className="text-sm text-gray-400">Annuler</button>
            </div>
          ) : (
            <button
              onClick={() => setRenaming(true)}
              className="text-left font-medium truncate hover:underline text-gray-900"
              title="Cliquer pour renommer"
            >
              {sessionName}
            </button>
          )}
        </div>
        {session.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {session.tags.map((tag) => (
              <span key={tag} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 grid grid-cols-2 gap-1">
        <span>Thème : {session.theme_id ?? 'default'}</span>
        <span>Expire : {formatDate(session.expires_at)}</span>
        {session.last_generated_at && (
          <span>Généré : {formatDate(session.last_generated_at)}</span>
        )}
        {session.share_token_hash && (
          <span className="flex items-center gap-1">
            👁 {session.view_count} vue{session.view_count !== 1 ? 's' : ''}
            {session.last_viewed_at && ` · ${formatDate(session.last_viewed_at)}`}
          </span>
        )}
        {isArchived && session.archived_at && (
          <span>Archivée : {formatDate(session.archived_at)}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <a
          href={`/studio/${session.token}`}
          className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
        >
          Ouvrir
        </a>
        {!isArchived ? (
          <>
            <button
              disabled={busy}
              onClick={() => handleAction(() => duplicateSession(session.id))}
              className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
            >
              Dupliquer
            </button>
            <button
              disabled={busy}
              onClick={() => setShowShare(true)}
              className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
            >
              Partager
            </button>
            <button
              disabled={busy}
              onClick={() => handleAction(
                () => archiveSession(session.id),
                'Archiver cette session ?',
              )}
              className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100"
            >
              Archiver
            </button>
          </>
        ) : (
          <button
            disabled={busy}
            onClick={() => handleAction(() => restoreSession(session.id))}
            className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100"
          >
            Restaurer
          </button>
        )}
        <button
          disabled={busy}
          onClick={handleExport}
          className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
        >
          Exporter ZIP
        </button>
        <button
          disabled={busy}
          onClick={() => handleAction(
            () => deleteSession(session.id),
            '⚠️ Supprimer définitivement cette session et tous ses fichiers ? Cette action est irréversible.',
          )}
          className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
        >
          Supprimer
        </button>
      </div>

      {showShare && (
        <ShareDialog
          sessionId={session.id}
          hasShare={!!session.share_token_hash}
          onClose={() => { setShowShare(false); onRefresh() }}
        />
      )}
    </div>
  )
}
