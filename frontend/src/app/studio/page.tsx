import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

import { getSession, updateSession } from '@/services/sessions'
import { useStudioStore } from '@/store/studio'
import { usePreview } from '@/hooks/usePreview'
import { useValidation } from '@/hooks//useValidation'

import YamlEditor from '@/components/features/editor/YamlEditor'
import PreviewFrame from '@/components/features/preview/PreviewFrame'
import ThemeSelector from '@/components/features/theme/ThemeSelector'
import { Button } from '@/components/ui/Button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip'

export default function StudioPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const { setYamlContent, setSelectedThemeId, reset } = useStudioStore()
  const [loading, setLoading] = useState(true)

  // Enable live preview & validation hooks.
  usePreview(token ?? null)
  useValidation(token ?? null)

  // Load session on mount.
  useEffect(() => {
    if (!token) return
    reset()
    getSession(token)
      .then((session) => {
        if (!session) {
          navigate('/')
          return
        }
        setYamlContent(session.yaml_content)
        if (session.theme_id) setSelectedThemeId(session.theme_id)
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [token, navigate, reset, setYamlContent, setSelectedThemeId])

  const handleYamlChange = async (yaml: string) => {
    setYamlContent(yaml)
    if (token) {
      await updateSession(token, { yaml_content: yaml }).catch(() => {})
    }
  }

  const handleThemeChange = async (themeId: string) => {
    if (token) {
      await updateSession(token, { theme_id: themeId }).catch(() => {})
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-[var(--color-text-muted)]">
        Loading session…
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] shrink-0">
        <div className="flex items-center gap-3">
          <span
            className="text-base font-semibold text-[var(--color-text-primary)] cursor-pointer"
            onClick={() => navigate('/')}
          >
            CVWonder Studio
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSelector onThemeChange={handleThemeChange} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleCopyLink}>
                🔗 Share
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy session link</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* ── Editor / Preview panels ──────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          <Panel defaultSize={50} minSize={20}>
            <YamlEditor token={token!} onUpdate={handleYamlChange} />
          </Panel>
          <PanelResizeHandle className="w-1 bg-[var(--color-border)] hover:bg-[var(--color-accent)] transition-colors cursor-col-resize" />
          <Panel defaultSize={50} minSize={20}>
            <PreviewFrame />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}
