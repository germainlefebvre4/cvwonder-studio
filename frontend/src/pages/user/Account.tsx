import { useState, useEffect } from 'react'
import { useUserStore } from '@/store/user'
import { exportAccount, deleteAccount, updateDefaultTheme } from '@/services/user'
import { listThemes, Theme } from '@/services/themes'
import { useNavigate } from 'react-router-dom'
import UserHeader from '@/components/user/UserHeader'

export default function AccountPage() {
  const { user, setUser } = useUserStore()
  const navigate = useNavigate()
  const [themes, setThemes] = useState<Theme[]>([])
  const [selectedTheme, setSelectedTheme] = useState<string | null>(user?.default_theme_id ?? null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    listThemes().then(setThemes).catch(() => {})
  }, [])

  useEffect(() => {
    setSelectedTheme(user?.default_theme_id ?? null)
  }, [user])

  async function handleExport() {
    try {
      const blob = await exportAccount()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'cvwonder-account-export.zip'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Erreur lors de l\'export')
    }
  }

  async function handleDeleteAccount() {
    if (
      !confirm(
        '⚠️ Supprimer définitivement votre compte, toutes vos sessions et vos données ? Cette action est irréversible.',
      )
    )
      return
    setBusy(true)
    try {
      await deleteAccount()
      setUser(null)
      navigate('/')
    } catch (e) {
      alert('Erreur lors de la suppression du compte')
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveDefaultTheme() {
    setBusy(true)
    try {
      await updateDefaultTheme(selectedTheme)
      if (user) {
        setUser({ ...user, default_theme_id: selectedTheme })
      }
    } catch (e) {
      alert('Erreur lors de la mise à jour du thème par défaut')
    } finally {
      setBusy(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <a href="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">← Dashboard</a>
          <span className="flex-1" />
          <UserHeader />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 flex-1 flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-gray-900">Mon compte</h1>

        {/* Profile */}
        <section className="bg-white rounded-lg border p-6 flex gap-4 items-center">
          {user.avatar_url && (
            <img src={user.avatar_url} alt={user.name} className="w-16 h-16 rounded-full" />
          )}
          <div>
            <p className="font-semibold text-gray-900">{user.name}</p>
            <p className="text-gray-500 text-sm">{user.email}</p>
            <p className="text-gray-400 text-xs mt-1">
              Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </section>

        {/* Default theme */}
        <section className="bg-white rounded-lg border p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-800">Thème par défaut</h2>
          <select
            className="border rounded px-3 py-2 text-sm"
            value={selectedTheme ?? ''}
            onChange={(e) => setSelectedTheme(e.target.value || null)}
          >
            <option value="">Aucun (utiliser le thème par défaut)</option>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={handleSaveDefaultTheme}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Enregistrer
            </button>
            <button
              disabled={busy}
              onClick={() => { setSelectedTheme(null); updateDefaultTheme(null).catch(() => {}) }}
              className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50"
            >
              Réinitialiser
            </button>
          </div>
        </section>

        {/* Data export */}
        <section className="bg-white rounded-lg border p-6 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-800">Mes données (RGPD)</h2>
          <p className="text-sm text-gray-500">
            Téléchargez une archive ZIP contenant toutes vos informations et sessions.
          </p>
          <button
            onClick={handleExport}
            className="self-start px-4 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50"
          >
            Télécharger mes données
          </button>
        </section>

        {/* Danger zone */}
        <section className="bg-white rounded-lg border border-red-200 p-6 flex flex-col gap-3">
          <h2 className="font-semibold text-red-700">Zone de danger</h2>
          <p className="text-sm text-gray-500">
            La suppression de votre compte est définitive et entraîne la suppression de toutes vos sessions
            et données. <button onClick={handleExport} className="text-blue-600 hover:underline">Téléchargez vos données</button> avant de continuer.
          </p>
          <button
            disabled={busy}
            onClick={handleDeleteAccount}
            className="self-start px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Supprimer mon compte définitivement
          </button>
        </section>
      </main>
    </div>
  )
}
