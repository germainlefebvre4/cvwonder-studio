import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { SplitButton } from '@/components/ui/SplitButton'
import { createSession, RateLimitError } from '@/services/sessions'
import { getTemplates, type Template } from '@/services/templates'

const features = [
  {
    icon: '✍️',
    title: 'YAML Editor',
    description: 'Write your CV in structured YAML with real-time validation and inline error highlighting.',
  },
  {
    icon: '🎨',
    title: 'Theme Gallery',
    description: 'Pick from built-in themes or install community themes from GitHub with one click.',
  },
  {
    icon: '⚡',
    title: 'Instant Preview',
    description: 'See your CV rendered live in the browser as you type — no rebuild, no refresh.',
  },
]

const steps = [
  { step: '01', title: 'Start a session', desc: 'Click "Start Building" to create a private editing session.' },
  { step: '02', title: 'Write your CV', desc: 'Paste or type your CV data in YAML. Errors surface inline.' },
  { step: '03', title: 'Choose a theme', desc: 'Select a theme from the dropdown to style your CV.' },
  { step: '04', title: 'Share & export', desc: 'Copy the session link or export to PDF.' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = React.useState<Template[]>([])
  const [rateLimitedUntil, setRateLimitedUntil] = React.useState<Date | null>(null)
  const [secondsLeft, setSecondsLeft] = React.useState(0)

  React.useEffect(() => {
    getTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]))
  }, [])

  React.useEffect(() => {
    if (!rateLimitedUntil) return
    const tick = () => {
      const remaining = Math.ceil((rateLimitedUntil.getTime() - Date.now()) / 1000)
      if (remaining <= 0) {
        setSecondsLeft(0)
        setRateLimitedUntil(null)
      } else {
        setSecondsLeft(remaining)
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [rateLimitedUntil])

  const handleRateLimitError = (err: unknown) => {
    if (err instanceof RateLimitError) {
      setRateLimitedUntil(new Date(Date.now() + err.retryAfter * 1000))
    }
  }

  const handleStart = async () => {
    try {
      const result = await createSession()
      navigate(`/studio/${result.token}`)
    } catch (err) {
      handleRateLimitError(err)
    }
  }

  const handleTemplateSelect = async (slug: string) => {
    try {
      const result = await createSession(undefined, slug)
      navigate(`/studio/${result.token}`)
    } catch (err) {
      handleRateLimitError(err)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 border-b border-[var(--color-border)]"
        style={{
          background: 'rgba(var(--slate-1-rgb, 250 250 252) / 0.85)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-[var(--color-text-primary)]">
            CVWonder Studio
          </span>
          <Button onClick={handleStart} size="sm">
            Start Building
          </Button>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 gap-8">
        <div className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-accent-subtle)] px-4 py-1.5 text-sm text-[var(--color-accent-text)]">
          Open Source · Self-Hostable
        </div>
        <h1 className="text-5xl font-bold tracking-tight max-w-2xl text-[var(--color-text-primary)]">
          Build beautiful CVs with{' '}
          <span className="text-[var(--color-accent)]">YAML & themes</span>
        </h1>
        <p className="text-xl text-[var(--color-text-secondary)] max-w-xl">
          CVWonder Studio is a lightweight editor for crafting structured CVs.
          Write once in YAML, render with any theme, share instantly.
        </p>
        <div className="flex gap-4">
          <SplitButton
            label={secondsLeft > 0 ? `Réessayez dans ${secondsLeft}s…` : "Start Building — it's free"}
            onClick={handleStart}
            size="lg"
            disabled={secondsLeft > 0}
            options={templates.map((t) => ({ label: t.name, value: t.slug, description: t.description }))}
            onOptionSelect={handleTemplateSelect}
          />
          <Button
            variant="secondary"
            size="lg"
            asChild
          >
            <a href="https://github.com/germainlefebvre4/cvwonder" target="_blank" rel="noreferrer">
              View on GitHub
            </a>
          </Button>
        </div>
        {secondsLeft > 0 && (
          <p className="text-sm text-[var(--color-text-secondary)]">
            Trop de tentatives. Réessayez dans <strong>{secondsLeft}s</strong> ou{' '}
            <a href="/login" className="underline text-[var(--color-accent-text)]">connectez-vous</a>.
          </p>
        )}
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="bg-[var(--color-surface-subtle)] border-y border-[var(--color-border)] py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-[var(--color-text-primary)]">
            Everything you need to create a great CV
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-default)] p-6 flex flex-col gap-3 hover:border-[var(--color-accent)] transition-colors"
              >
                <span className="text-3xl">{f.icon}</span>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{f.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-[var(--color-text-primary)]">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-4 items-start">
                <span className="text-3xl font-bold text-[var(--color-accent)] opacity-40 min-w-10">
                  {s.step}
                </span>
                <div>
                  <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">{s.title}</h4>
                  <p className="text-sm text-[var(--color-text-secondary)]">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--color-border)] py-8 px-6 text-center text-sm text-[var(--color-text-muted)]">
        CVWonder Studio is open source under the MIT license.{' '}
        <a
          href="https://github.com/germainlefebvre4/cvwonder-studio"
          target="_blank"
          rel="noreferrer"
          className="underline text-[var(--color-accent-text)] hover:text-[var(--color-accent)]"
        >
          GitHub
        </a>
      </footer>
    </div>
  )
}
