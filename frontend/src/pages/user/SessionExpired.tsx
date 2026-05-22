export default function SessionExpiredPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-6 text-center px-4">
      <div className="text-6xl">🌊</div>
      <h1 className="text-2xl font-bold text-gray-900">Oups, cette session a expiré !</h1>
      <p className="text-gray-500 max-w-sm">
        Les sessions anonymes sont temporaires. Connectez-vous pour garder vos CVs au chaud indéfiniment.
      </p>
      <div className="flex gap-3">
        <a
          href="/"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Créer une nouvelle session
        </a>
        <a
          href="/login"
          className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Se connecter
        </a>
      </div>
    </div>
  )
}
