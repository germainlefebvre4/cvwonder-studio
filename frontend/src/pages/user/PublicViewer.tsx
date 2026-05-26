import { useParams } from 'react-router-dom'

/**
 * Public CV viewer page - embeds the backend-served /p/:id endpoint in an iframe.
 * The backend injects the CVWonder bandeau, so we just frame it.
 */
export default function PublicViewerPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <iframe
        src={`/p/${id}`}
        title="CV public"
        className="flex-1 w-full border-0"
        style={{ minHeight: '100vh' }}
      />
    </div>
  )
}
