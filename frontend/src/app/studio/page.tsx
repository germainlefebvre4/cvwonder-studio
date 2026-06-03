import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

import { getSession, updateSession } from '@/services/sessions'
import { getSessionById, updateSessionContent } from '@/services/user'
import { listThemes } from '@/services/themes'
import { getTemplateContent } from '@/services/templates'
import { useStudioStore } from '@/store/studio'
import { useUserStore } from '@/store/user'
import { usePreview } from '@/hooks/usePreview'
import { useValidation } from '@/hooks//useValidation'

import YamlEditor from '@/components/features/editor/YamlEditor'
import PreviewFrame from '@/components/features/preview/PreviewFrame'
import ThemeSelector from '@/components/features/theme/ThemeSelector'
import TemplatePicker from '@/components/features/onboarding/TemplatePicker'
import { Button } from '@/components/ui/Button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip'
import ExpiryWarningBanner from '@/components/user/ExpiryWarningBanner'
import PrivacyNotice from '@/components/user/PrivacyNotice'
import UserHeader from '@/components/user/UserHeader'

export default function StudioPage() {
  const { token } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session') // ?session=:uuid for authenticated access
  const navigate = useNavigate()

  const { setYamlContent, setSelectedThemeId, reset, yamlContent } = useStudioStore()
  const { isAuthenticated } = useUserStore()
  const [loading, setLoading] = useState(true)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  // Controls whether the TemplatePicker is shown. Set once at load time,
  // never flips back to true even if the user clears their YAML.
  const [showPicker, setShowPicker] = useState(false)

  // Enable live preview & validation hooks — support both token and UUID modes.
  const {} = usePreview(token ?? null, sessionId)
  useValidation(token ?? null, sessionId)

  // Load session on mount — either via ?session=:uuid (authenticated) or :token (anon/shared).
  useEffect(() => {
    if (sessionId) {
      // Authenticated owner access via UUID.
      reset()
      getSessionById(sessionId)
        .then(async (session) => {
          if (!session) {
            navigate('/404-session')
            return
          }
          setYamlContent(session.yaml_content)
          if (session.theme_id) {
            setSelectedThemeId(session.theme_id)
          } else {
            try {
              const themes = await listThemes()
              if (themes.length > 0) {
                setSelectedThemeId(themes[0].id)
              }
            } catch {
              // Silent failure.
            }
          }
          setExpiresAt(session.expires_at)
        })
        .catch(() => navigate('/404-session'))
        .finally(() => setLoading(false))
      return
    }

    if (!token) return
    reset()
    getSession(token)
      .then(async (session) => {
        if (!session) {
          navigate('/404-session')
          return
        }
        setYamlContent(session.yaml_content)

        if (session.theme_id) {
          setSelectedThemeId(session.theme_id)
        } else {
          // Auto-select first available theme when session has none.
          try {
            const themes = await listThemes()
            if (themes.length > 0) {
              setSelectedThemeId(themes[0].id)
              updateSession(token, { theme_id: themes[0].id }).catch(() => {})
            }
          } catch {
            // Silent failure - Studio continues without a theme.
          }
        }

        setExpiresAt(session.expires_at)
        // Store anon token in localStorage for session claiming.
        if (!isAuthenticated) {
          localStorage.setItem('anon_session_token', token)
        }
        // Show the template picker only for fresh empty sessions.
        if (!session.yaml_content) {
          setShowPicker(true)
        }
      })
      .catch(() => navigate('/404-session'))
      .finally(() => setLoading(false))
  }, [token, sessionId, navigate, reset, setYamlContent, setSelectedThemeId, isAuthenticated])

  const handleYamlChange = async (yaml: string) => {
    setYamlContent(yaml)
    // Update via UUID API if authenticated, otherwise token-based
    if (sessionId) {
      await updateSessionContent(sessionId, { yaml_content: yaml }).catch(() => {})
    } else if (token) {
      await updateSession(token, { yaml_content: yaml }).catch(() => {})
    }
  }

  const handleThemeChange = async (themeId: string) => {
    // Update via UUID API if authenticated, otherwise token-based
    if (sessionId) {
      await updateSessionContent(sessionId, { theme_id: themeId }).catch(() => {})
    } else if (token) {
      await updateSession(token, { theme_id: themeId }).catch(() => {})
    }
  }

  const handleTemplateSelect = async (slug: string) => {
    const content = await getTemplateContent(slug)
    setShowPicker(false)
    await handleYamlChange(content)
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
          {isAuthenticated ? (
            <UserHeader />
          ) : (
            <a
              href="/login"
              className="text-xs px-2 py-1 bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] rounded hover:bg-[var(--color-surface-muted)]"
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
            {showPicker ? (
              <TemplatePicker onSelect={handleTemplateSelect} />
            ) : (
              <YamlEditor token={token!} onUpdate={handleYamlChange} />
            )}
          </Panel>
          <PanelResizeHandle className="w-1 bg-[var(--color-border)] hover:bg-[var(--color-accent)] transition-colors cursor-col-resize" />
          <Panel defaultSize={50} minSize={20}>
            <div className="flex flex-col h-full">
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
