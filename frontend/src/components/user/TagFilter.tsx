interface Props {
  tags: string[]
  selected: string[]
  onChange: (tags: string[]) => void
}

export default function TagFilter({ tags, selected, onChange }: Props) {
  function toggle(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag))
    } else {
      onChange([...selected, tag])
    }
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs text-gray-500">Filtrer par tag :</span>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => toggle(tag)}
          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
            selected.includes(tag)
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {tag}
        </button>
      ))}
      {selected.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Réinitialiser
        </button>
      )}
    </div>
  )
}
