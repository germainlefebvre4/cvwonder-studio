import { useState } from 'react'
import { getSharedSession, UserSession } from '@/services/user'
import { useParams } from 'react-router-dom'

export default function SharedSessionPage() {
  const { id, token } = useParams<{ id: string; token: string }>()
  const [session, setSession] = useState<UserSession | null>(null)
  const [needsPassword, setNeedsPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchSession(pwd?: string) {
    setLoading(true)
    try {
      const s = await getSharedSession(id!, token!, pwd)
      setSession(s)
      setNeedsPassword(false)
    } catch (e: any) {
      if (e.message.includes('401') || e.message.includes('403')) {
        setNeedsPassword(true)
        if (pwd) setError('Mot de passe incorrect')
      } else if (e.message.includes('404')) {
        setError('Session introuvable ou lien expiré.')
      } else {
        setError('Erreur lors du chargement de la session.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useState(() => {
    fetchSession()
  })

  if (loading && !needsPassword) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement…</div>
  }

  if (error && !needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/" className="text-blue-600 hover:underline">Créer une nouvelle session</a>
        </div>
      </div>
    )
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl border p-8 flex flex-col gap-4 w-full max-w-sm shadow">
          <h1 className="text-lg font-semibold">Session protégée par mot de passe</h1>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchSession(password)}
            className="border rounded px-3 py-2 text-sm"
          />
          <button
            onClick={() => fetchSession(password)}
            className="bg-blue-600 text-white rounded py-2 text-sm hover:bg-blue-700"
          >
            Accéder
          </button>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-semibold text-gray-900">
            {session.name ?? `Session partagée`}
          </h1>
          <a href="/" className="text-sm text-blue-600 hover:underline">Créer mon CV →</a>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 flex-1">
        <div className="bg-white rounded border p-4">
          <p className="text-xs text-gray-500 mb-2">Lecture seule</p>
          <pre className="text-sm font-mono whitespace-pre-wrap text-gray-700 overflow-auto max-h-[70vh]">
            {session.yaml_content}
          </pre>
        </div>
      </main>
    </div>
  )
}
