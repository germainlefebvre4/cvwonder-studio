import { useEffect } from 'react'
import Ajv from 'ajv'
import { useStudioStore } from '@/store/studio'
import { validateYaml } from '@/services/generation'
import { useDebounce } from './useDebounce'

const VALIDATION_DEBOUNCE_MS = 500

// Lazy-load the schema for AJV client-side validation.
let schema: object | null = null
const ajv = new Ajv({ allErrors: true })

async function getSchema(): Promise<object | null> {
  if (schema) return schema
  try {
    const res = await fetch('/schemas/cvwonder.schema.json')
    if (res.ok) {
      schema = await res.json()
      return schema
    }
  } catch {
    // Ignore; fall back to server-side validation only.
  }
  return null
}

export function useValidation(token: string | null) {
  const yamlContent = useStudioStore((s) => s.yamlContent)
  const setValidationErrors = useStudioStore((s) => s.setValidationErrors)

  const debouncedYaml = useDebounce(yamlContent, VALIDATION_DEBOUNCE_MS)

  useEffect(() => {
    if (!token || !debouncedYaml) return

    let cancelled = false

    const run = async () => {
      // 1. Client-side AJV validation (fast, no network).
      const sch = await getSchema()
      if (sch) {
        try {
          const parsed = JSON.parse(debouncedYaml)
          const validate = ajv.compile(sch)
          validate(parsed)
          if (!cancelled && validate.errors) {
            setValidationErrors(
              (validate.errors ?? []).map((e) => ({
                field: e.instancePath || e.schemaPath,
                message: e.message ?? 'validation error',
              })),
            )
            return
          }
        } catch {
          // YAML can't be parsed as JSON for AJV; skip client check.
        }
      }

      // 2. Server-side validation via cvwonder binary.
      try {
        const result = await validateYaml(token)
        if (!cancelled) {
          setValidationErrors(result.errors ?? [])
        }
      } catch {
        // Network error; ignore.
      }
    }

    run()
    return () => { cancelled = true }
  }, [debouncedYaml, token, setValidationErrors])
}
