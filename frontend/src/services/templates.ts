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

export async function getTemplateContent(slug: string): Promise<string> {
  const res = await fetch(`/api/v1/templates/${encodeURIComponent(slug)}`)
  if (!res.ok) throw new Error(`getTemplateContent: ${res.status}`)
  const data: { yaml_content: string } = await res.json()
  return data.yaml_content
}
