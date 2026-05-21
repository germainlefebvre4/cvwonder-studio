import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { listThemes, type Theme } from '@/services/themes'
import { useStudioStore } from '@/store/studio'

interface ThemeSelectorProps {
  onThemeChange?: (themeId: string) => void
}

export default function ThemeSelector({ onThemeChange }: ThemeSelectorProps) {
  const [themes, setThemes] = useState<Theme[]>([])
  const selectedThemeId = useStudioStore((s) => s.selectedThemeId)
  const setSelectedThemeId = useStudioStore((s) => s.setSelectedThemeId)

  useEffect(() => {
    listThemes()
      .then(setThemes)
      .catch(console.error)
  }, [])

  const handleChange = (id: string) => {
    setSelectedThemeId(id)
    onThemeChange?.(id)
  }

  return (
    <Select value={selectedThemeId ?? ''} onValueChange={handleChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select theme…" />
      </SelectTrigger>
      <SelectContent>
        {themes.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
