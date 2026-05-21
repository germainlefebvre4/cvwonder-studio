import CodeMirror from '@uiw/react-codemirror'
import { yaml } from '@codemirror/lang-yaml'
import { useStudioStore } from '@/store/studio'

interface YamlEditorProps {
  token: string
  onUpdate: (yaml: string) => void
}

export default function YamlEditor({ onUpdate }: YamlEditorProps) {
  const yamlContent = useStudioStore((s) => s.yamlContent)
  const validationErrors = useStudioStore((s) => s.validationErrors)

  return (
    <div className="flex flex-col h-full">
      <CodeMirror
        value={yamlContent}
        height="100%"
        extensions={[yaml()]}
        onChange={(value) => onUpdate(value)}
        theme="dark"
        style={{ height: '100%', fontSize: '14px' }}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          autocompletion: true,
        }}
      />
      {/* Validation errors strip */}
      {validationErrors.length > 0 && (
        <div className="border-t border-[var(--color-error)] bg-[var(--color-error-subtle)] px-4 py-2 max-h-32 overflow-y-auto">
          {validationErrors.map((e, i) => (
            <div key={i} className="text-xs text-[var(--color-error-text)] flex gap-2">
              <span className="font-mono opacity-70">{e.field}</span>
              <span>{e.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
