export interface Template {
  slug: string
  name: string
  description: string
}

export async function getTemplates(): Promise<Template[]> {
  const res = await fetch('/api/v1/templates')
  if (!res.ok) throw new Error(`getTemplates: ${res.status}`)
  return res.json()
}
