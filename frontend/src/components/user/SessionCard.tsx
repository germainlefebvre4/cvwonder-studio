import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
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
import { formatRelativeDate, getExpiryUrgency } from '@/lib/date'
import { getSessionBorderStatus } from '@/lib/session'

interface Props {
  session: UserSession
  onRefresh: () => void
  isArchived?: boolean
}

const expiryColorMap = {
  muted: 'text-[var(--color-text-muted)]',
  warning: 'text-[var(--color-warning-text)]',
  error: 'text-[var(--color-error-text)]',
}

const borderColorMap = {
  expiring: 'border-l-[var(--color-warning)]',
  shared: 'border-l-[var(--color-accent)]',
  default: 'border-l-[var(--color-border)]',
}

const dropdownItemClass =
  'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none outline-none rounded-[var(--radius-sm)] text-[var(--color-text-primary)] data-[highlighted]:bg-[var(--color-surface-muted)]'

const dropdownItemDestructiveClass =
  'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none outline-none rounded-[var(--radius-sm)] text-[var(--color-error-text)] data-[highlighted]:bg-[var(--color-error-subtle)]'

export default function SessionCard({ session, onRefresh, isArchived = false }: Props) {
  const [renaming, setRenaming] = useState(false)
  const [nameInput, setNameInput] = useState(session.name ?? '')
  const [showShare, setShowShare] = useState(false)
  const [busy, setBusy] = useState(false)

  const sessionName = session.name ?? `Session ${session.id.slice(0, 8)}`
  const borderStatus = getSessionBorderStatus(session)
  const expiryUrgency = getExpiryUrgency(session.expires_at)
  const isShared = session.share_token_hash !== null

  async function handleRename() {
    if (!nameInput.trim()) return
    try {
      await renameSession(session.id, nameInput.trim())
      setRenaming(false)
      onRefresh()
    } catch {
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
    } catch {
      alert("Erreur lors de l'export")
    }
  }

  return (
    <div
      className={`bg-[var(--color-surface-default)] rounded-[var(--radius-lg)] border border-[var(--color-border)] border-l-4 ${borderColorMap[borderStatus]} p-4 flex flex-col gap-3 shadow-sm`}
    >
      {/* Header: name + tags + ⋯ menu */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {renaming ? (
            <div className="flex gap-2">
              <input
                className="flex-1 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2 py-1 text-sm bg-[var(--color-surface-default)]"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename()
                  if (e.key === 'Escape') setRenaming(false)
                }}
                autoFocus
              />
              <button onClick={handleRename} className="text-sm text-[var(--color-accent-text)] font-medium">OK</button>
              <button onClick={() => setRenaming(false)} className="text-sm text-[var(--color-text-muted)]">Annuler</button>
            </div>
          ) : (
            <a
              href={`/studio?session=${session.id}`}
              className="block font-semibold text-[var(--color-text-primary)] truncate hover:underline"
            >
              {sessionName}
            </a>
          )}
          {session.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {session.tags.map((tag) => (
                <span key={tag} className="text-xs bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ⋯ dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="flex-shrink-0 p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              aria-label="Actions"
            >
              <DotsHorizontalIcon className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className="z-50 min-w-[160px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-default)] shadow-lg p-1 animate-in fade-in-0 zoom-in-95"
            >
              {!isArchived && (
                <DropdownMenu.Item
                  onSelect={() => { setNameInput(sessionName); setRenaming(true) }}
                  className={dropdownItemClass}
                >
                  Renommer
                </DropdownMenu.Item>
              )}
              <DropdownMenu.Item
                disabled={busy}
                onSelect={() => handleAction(() => duplicateSession(session.id))}
                className={dropdownItemClass}
              >
                Dupliquer
              </DropdownMenu.Item>
              <DropdownMenu.Item
                disabled={busy}
                onSelect={handleExport}
                className={dropdownItemClass}
              >
                Exporter ZIP
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-[var(--color-border)] my-1" />
              <DropdownMenu.Item
                disabled={busy}
                onSelect={() =>
                  handleAction(
                    () => deleteSession(session.id),
                    '⚠️ Supprimer définitivement cette session et tous ses fichiers ? Cette action est irréversible.',
                  )
                }
                className={dropdownItemDestructiveClass}
              >
                Supprimer
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Metadata */}
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex items-center gap-3 text-[var(--color-text-muted)]">
          <span>🎨 {session.theme_id ?? 'default'}</span>
          {isArchived && session.archived_at ? (
            <span>Archivée {formatRelativeDate(session.archived_at)}</span>
          ) : (
            <span className={expiryColorMap[expiryUrgency]}>
              Expire {formatRelativeDate(session.expires_at)}
            </span>
          )}
        </div>
        {isShared && (
          <div className="flex items-center gap-1 text-[var(--color-accent-text)]">
            <span>🔗 Partagée</span>
            {session.view_count > 0 ? (
              <>
                <span>· {session.view_count} vue{session.view_count !== 1 ? 's' : ''}</span>
                {session.last_viewed_at && (
                  <span>· vu {formatRelativeDate(session.last_viewed_at)}</span>
                )}
              </>
            ) : (
              <span>· aucune vue</span>
            )}
          </div>
        )}
      </div>

      {/* Primary CTA */}
      <a
        href={`/studio?session=${session.id}`}
        className="block w-full text-center text-sm font-medium px-4 py-2 bg-[var(--color-accent)] text-[var(--color-text-inverse)] rounded-[var(--radius-md)] hover:bg-[var(--color-accent-hover)] transition-colors"
      >
        Ouvrir dans le studio →
      </a>

      {/* Secondary actions */}
      <div className="flex gap-2">
        {!isArchived ? (
          <>
            <button
              disabled={busy}
              onClick={() => setShowShare(true)}
              className="flex-1 text-xs px-2 py-1.5 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] transition-colors"
            >
              {isShared ? 'Gérer le partage' : 'Partager'}
            </button>
            <button
              disabled={busy}
              onClick={() =>
                handleAction(
                  () => archiveSession(session.id),
                  'Archiver cette session ?',
                )
              }
              className="flex-1 text-xs px-2 py-1.5 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] transition-colors"
            >
              Archiver
            </button>
          </>
        ) : (
          <button
            disabled={busy}
            onClick={() => handleAction(() => restoreSession(session.id))}
            className="flex-1 text-xs px-2 py-1.5 bg-[var(--color-success-subtle)] text-[var(--color-success-text)] rounded-[var(--radius-sm)] hover:bg-[var(--color-success-subtle)] transition-colors"
          >
            ↩ Restaurer
          </button>
        )}
      </div>

      {showShare && (
        <ShareDialog
          sessionId={session.id}
          hasShare={isShared}
          onClose={() => {
            setShowShare(false)
            onRefresh()
          }}
        />
      )}
    </div>
  )
}
