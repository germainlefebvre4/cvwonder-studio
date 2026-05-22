import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

import { getSession, updateSession } from '@/services/sessions'
import { useStudioStore } from '@/store/studio'
import { useUserStore } from '@/store/user'
import { usePreview } from '@/hooks/usePreview'
import { useValidation } from '@/hooks//useValidation'

import YamlEditor from '@/components/features/editor/YamlEditor'
import PreviewFrame from '@/components/features/preview/PreviewFrame'
import ThemeSelector from '@/components/features/theme/ThemeSelector'
import { Button } from '@/components/ui/Button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip'
import ExpiryWarningBanner from '@/components/user/ExpiryWarningBanner'
import PrivacyNotice from '@/components/user/PrivacyNotice'

export default function StudioPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const { setYamlContent, setSelectedThemeId, reset, yamlContent } = useStudioStore()
  const { isAuthenticated } = useUserStore()
  const [loading, setLoading] = useState(true)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  // Enable live preview & validation hooks.
  const { forceRefresh, isCoolingDown } = usePreview(token ?? null)
  useValidation(token ?? null)

  // Load session on mount.
  useEffect(() => {
    if (!token) return
    reset()
    getSession(token)
      .then((session) => {
        if (!session) {
          navigate('/404-session')
          return
        }
        setYamlContent(session.yaml_content)
        if (session.theme_id) setSelectedThemeId(session.theme_id)
        setExpiresAt(session.expires_at)
        // Store anon token in localStorage for session claiming (task 14.1)
        if (!isAuthenticated) {
          localStorage.setItem('anon_session_token', token)
        }
      })
      .catch(() => navigate('/404-session'))
      .finally(() => setLoading(false))
  }, [token, navigate, reset, setYamlContent, setSelectedThemeId, isAuthenticated])

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

  const handleYamlDownload = () => {
    const blob = new Blob([yamlContent], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resume.yaml'
    a.click()
    URL.revokeObjectURL(url)
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
      {/* Expiry warning for anonymous sessions */}
      {expiresAt && <ExpiryWarningBanner expiresAt={expiresAt} isAuthenticated={isAuthenticated} />}

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
              <Button variant="ghost" size="sm" onClick={handleYamlDownload}>
                ⬇ YAML
              </Button>
            </TooltipTrigger>
            <TooltipContent>Télécharger le YAML</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleCopyLink}>
                🔗 Share
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy session link</TooltipContent>
          </Tooltip>
          {!isAuthenticated && (
            <a
              href="/login"
              className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
            >
              Se connecter
            </a>
          )}
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
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-end px-2 py-1 border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={forceRefresh}
                      disabled={isCoolingDown}
                    >
                      ↺ Refresh
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isCoolingDown ? 'Please wait…' : 'Force refresh preview'}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex-1 overflow-hidden">
                <PreviewFrame />
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
      <PrivacyNotice />
    </div>
  )
}
