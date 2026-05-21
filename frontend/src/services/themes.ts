export interface Theme {
  id: string
  name: string
  slug: string
  github_url: string | null
  is_builtin: boolean
}

export async function listThemes(): Promise<Theme[]> {
  const res = await fetch('/api/v1/themes')
  if (!res.ok) throw new Error(`listThemes: ${res.status}`)
  return res.json()
}
