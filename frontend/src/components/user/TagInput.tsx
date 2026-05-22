import { useState, useEffect, KeyboardEvent } from 'react'
import { getUserTags } from '@/services/user'

interface Props {
  tags: string[]
  onChange: (tags: string[]) => void
  maxTags?: number
}

const TAG_REGEX = /^[a-zA-Z0-9_-]{1,30}$/

export default function TagInput({ tags, onChange, maxTags = 10 }: Props) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [allUserTags, setAllUserTags] = useState<string[]>([])

  useEffect(() => {
    getUserTags().then(setAllUserTags).catch(() => {})
  }, [])

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([])
      return
    }
    const lower = input.toLowerCase()
    setSuggestions(
      allUserTags.filter(
        (t) => t.toLowerCase().includes(lower) && !tags.includes(t),
      ).slice(0, 5),
    )
  }, [input, allUserTags, tags])

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (!trimmed || !TAG_REGEX.test(trimmed)) return
    if (tags.includes(trimmed)) return
    if (tags.length >= maxTags) return
    onChange([...tags, trimmed])
    setInput('')
    setSuggestions([])
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1 items-center border rounded px-2 py-1 min-h-[36px] bg-white focus-within:ring-2 focus-within:ring-blue-500">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:text-red-500 leading-none"
              aria-label={`Supprimer ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        {tags.length < maxTags && (
          <input
            className="flex-1 min-w-[80px] text-sm outline-none py-0.5"
            placeholder="Ajouter un tag…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        )}
      </div>
      {suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border rounded shadow mt-1 w-full text-sm">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50"
                onClick={() => addTag(s)}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-gray-400 mt-1">
        {tags.length}/{maxTags} tags · Lettres, chiffres, tirets, underscores
      </p>
    </div>
  )
}
