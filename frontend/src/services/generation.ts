import type { ValidationError } from '@/store/studio'

export interface GeneratePreviewResponse {
  preview_url: string
}

export interface ValidateResponse {
  valid: boolean
  errors: ValidationError[]
}

export async function generatePreview(token: string): Promise<GeneratePreviewResponse> {
  const res = await fetch(`/api/v1/sessions/${token}/preview`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`generatePreview: ${res.status}`)
  return res.json()
}

export async function validateYaml(token: string): Promise<ValidateResponse> {
  const res = await fetch(`/api/v1/sessions/${token}/validate`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`validateYaml: ${res.status}`)
  return res.json()
}
