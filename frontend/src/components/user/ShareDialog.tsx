import { useState } from 'react'
import { createShare, revokeShare, setSharePassword } from '@/services/user'

type Duration = '7d' | '30d' | null

interface Props {
  sessionId: string
  hasShare: boolean
  onClose: () => void
}

export default function ShareDialog({ sessionId, hasShare, onClose }: Props) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState<Duration>(null)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [regenerateError, setRegenerateError] = useState<string | null>(null)

  async function handleCreate() {
    setBusy(true)
    try {
      const data = await createShare(sessionId, duration)
      setShareUrl(data.share_url)
    } catch {
      alert('Erreur lors de la création du lien de partage')
    } finally {
      setBusy(false)
    }
  }

  async function handleRegenerate() {
    setRegenerateError(null)
    setBusy(true)
    try {
      await revokeShare(sessionId)
    } catch {
      alert('Erreur lors de la révocation')
      setBusy(false)
      return
    }
    try {
      const data = await createShare(sessionId, duration)
      setShareUrl(data.share_url)
    } catch {
      setRegenerateError(
        'Le lien précédent a été révoqué, mais la création du nouveau lien a échoué. Utilisez le bouton "Créer un lien de partage" pour réessayer.',
      )
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
    } catch {
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
    } catch {
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

  // "Already shared" state: hasShare=true but we don't have the URL (not recoverable)
  const showRegenerateBlock = hasShare && !shareUrl && !regenerateError

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Partager la session</h2>

        {/* Duration selector — shown when creating a new link */}
        {(!hasShare || regenerateError) && !shareUrl && (
          <div className="flex flex-col gap-1">
            <p className="text-sm text-gray-600 font-medium">Durée du lien</p>
            <div className="flex gap-4">
              {([null, '7d', '30d'] as Duration[]).map((d) => (
                <label key={String(d)} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="duration"
                    checked={duration === d}
                    onChange={() => setDuration(d)}
                  />
                  {d === null ? 'Illimité' : d === '7d' ? '7 jours' : '30 jours'}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Create button (new link) */}
        {!hasShare && !shareUrl && (
          <button
            disabled={busy}
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Créer un lien de partage
          </button>
        )}

        {/* Already shared — show regenerate block */}
        {showRegenerateBlock && (
          <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              Le lien original ne peut plus être affiché. Vous pouvez révoquer l'ancien lien et en créer un nouveau.
            </p>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-gray-600 font-medium">Durée du nouveau lien</p>
              <div className="flex gap-4">
                {([null, '7d', '30d'] as Duration[]).map((d) => (
                  <label key={String(d)} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="duration-regen"
                      checked={duration === d}
                      onChange={() => setDuration(d)}
                    />
                    {d === null ? 'Illimité' : d === '7d' ? '7 jours' : '30 jours'}
                  </label>
                ))}
              </div>
            </div>
            <button
              disabled={busy}
              onClick={handleRegenerate}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 self-start"
            >
              Révoquer et créer un nouveau lien
            </button>
          </div>
        )}

        {/* Regenerate error fallback */}
        {regenerateError && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-red-600">{regenerateError}</p>
            <button
              disabled={busy}
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 self-start"
            >
              Créer un lien de partage
            </button>
          </div>
        )}

        {/* New link display */}
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

        {/* Password + revoke — shown when share is active */}
        {(hasShare || shareUrl) && !regenerateError && (
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
