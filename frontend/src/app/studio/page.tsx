import { useEffect, useState, useRef } from 'react'
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
import { useDebounce } from '@/hooks/useDebounce'

import YamlEditor from '@/components/features/editor/YamlEditor'
import PreviewFrame from '@/components/features/preview/PreviewFrame'
import ThemeSelector from '@/components/features/theme/ThemeSelector'
import TemplatePicker from '@/components/features/onboarding/TemplatePicker'
import FormWizard from '@/components/features/editor/form/FormWizard'
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

  const {
    setYamlContent,
    setYamlFromCode,
    setSelectedThemeId,
    reset,
    yamlContent,
    viewLayout,
    setViewLayout,
  } = useStudioStore()
  const { isAuthenticated } = useUserStore()
  const [loading, setLoading] = useState(true)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  // Controls whether the TemplatePicker is shown. Set once at load time,
  // never flips back to true even if the user clears their YAML.
  const [showPicker, setShowPicker] = useState(false)

  // Track the last successfully saved YAML to avoid redundant saves
  const lastSavedYamlRef = useRef<string | null>(null)
  // Centralized debounced YAML for saving changes from the Visual Assistant
  const debouncedYamlToSave = useDebounce(yamlContent, 300)

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
          lastSavedYamlRef.current = session.yaml_content
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
        lastSavedYamlRef.current = session.yaml_content

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
    setYamlFromCode(yaml)
    lastSavedYamlRef.current = yaml
    // Update via UUID API if authenticated, otherwise token-based
    if (sessionId) {
      await updateSessionContent(sessionId, { yaml_content: yaml }).catch(() => {})
    } else if (token) {
      await updateSession(token, { yaml_content: yaml }).catch(() => {})
    }
  }

  // Auto-save YAML updates from Visual Assistant edits to the database
  useEffect(() => {
    if (!debouncedYamlToSave) return
    if (debouncedYamlToSave === lastSavedYamlRef.current) return

    lastSavedYamlRef.current = debouncedYamlToSave

    if (sessionId) {
      updateSessionContent(sessionId, { yaml_content: debouncedYamlToSave }).catch(() => {})
    } else if (token) {
      updateSession(token, { yaml_content: debouncedYamlToSave }).catch(() => {})
    }
  }, [debouncedYamlToSave, sessionId, token])

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
      <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] shrink-0 gap-4 overflow-x-auto">
        <div className="flex items-center gap-3">
          <span
            className="text-base font-semibold text-[var(--color-text-primary)] cursor-pointer mr-2 shrink-0"
            onClick={() => navigate('/')}
          >
            CVWonder Studio
          </span>
          
          {/* Layout Toggle Buttons Group */}
          <div className="flex bg-[var(--color-surface-muted)] p-0.5 rounded border border-[var(--color-border)] select-none shrink-0">
            <button
              onClick={() => setViewLayout('code')}
              className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                viewLayout === 'code'
                  ? 'bg-[var(--color-surface-default)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              📝 Code YAML
            </button>
            <button
              onClick={() => setViewLayout('visual')}
              className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                viewLayout === 'visual'
                  ? 'bg-[var(--color-surface-default)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              ✨ Assistant Visuel
            </button>
            <button
              onClick={() => setViewLayout('split')}
              className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                viewLayout === 'split'
                  ? 'bg-[var(--color-surface-default)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              💻 Mode Split
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
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
        {showPicker ? (
          <TemplatePicker onSelect={handleTemplateSelect} />
        ) : (
          <PanelGroup key={viewLayout} direction="horizontal" className="h-full">
            {/* Panel 1: YAML Code Editor */}
            {(viewLayout === 'code' || viewLayout === 'split') && (
              <>
                <Panel defaultSize={viewLayout === 'split' ? 30 : 50} minSize={15}>
                  <YamlEditor token={token ?? ''} onUpdate={handleYamlChange} />
                </Panel>
                <PanelResizeHandle className="w-1 bg-[var(--color-border)] hover:bg-[var(--color-accent)] transition-colors cursor-col-resize" />
              </>
            )}

            {/* Panel 2: Visual No-Code Form Wizard */}
            {(viewLayout === 'visual' || viewLayout === 'split') && (
              <>
                <Panel defaultSize={viewLayout === 'split' ? 35 : 50} minSize={15}>
                  <FormWizard />
                </Panel>
                <PanelResizeHandle className="w-1 bg-[var(--color-border)] hover:bg-[var(--color-accent)] transition-colors cursor-col-resize" />
              </>
            )}

            {/* Panel 3: Live PDF/HTML Preview */}
            <Panel defaultSize={viewLayout === 'split' ? 35 : 50} minSize={20}>
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-hidden">
                  <PreviewFrame />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        )}
      </div>
      <PrivacyNotice />
    </div>
  )
}
