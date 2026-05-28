import { useState } from 'react'
import { createShare, revokeShare, setSharePassword } from '@/services/user'

interface Props {
  sessionId: string
  hasShare: boolean
  onClose: () => void
}

export default function ShareDialog({ sessionId, hasShare, onClose }: Props) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCreate() {
    setBusy(true)
    try {
      const data = await createShare(sessionId)
      setShareUrl(data.share_url)
    } catch (e) {
      alert('Erreur lors de la création du lien de partage')
    } finally {
      setBusy(false)
    }
  }

  async function handleRevoke() {
    if (!confirm('Révoquer le lien de partage ?')) return
    setBusy(true)
    try {
      await revokeShare(sessionId)
      onClose()
    } catch (e) {
      alert('Erreur lors de la révocation')
    } finally {
      setBusy(false)
    }
  }

  async function handleSetPassword() {
    if (!password) return
    setBusy(true)
    try {
      await setSharePassword(sessionId, password)
      alert('Mot de passe défini.')
      setPassword('')
    } catch (e) {
      alert('Erreur lors de la définition du mot de passe')
    } finally {
      setBusy(false)
    }
  }

  function handleCopy() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Partager la session</h2>

        {!hasShare && !shareUrl && (
          <button
            disabled={busy}
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Créer un lien de partage
          </button>
        )}

        {shareUrl && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-500">
              Copiez ce lien maintenant - il ne sera plus affiché.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 border rounded px-2 py-1 text-sm font-mono"
              />
              <button onClick={handleCopy} className="text-sm text-blue-600">
                {copied ? '✓' : 'Copier'}
              </button>
            </div>
          </div>
        )}

        {(hasShare || shareUrl) && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Mot de passe (optionnel)</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Nouveau mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 border rounded px-2 py-1 text-sm"
                />
                <button
                  disabled={busy || !password}
                  onClick={handleSetPassword}
                  className="text-sm text-blue-600"
                >
                  Définir
                </button>
              </div>
            </div>
            <button
              disabled={busy}
              onClick={handleRevoke}
              className="text-sm text-red-600 hover:underline self-start"
            >
              Révoquer le lien
            </button>
          </>
        )}

        <button
          onClick={onClose}
          className="self-end text-sm px-3 py-1.5 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  )
}
