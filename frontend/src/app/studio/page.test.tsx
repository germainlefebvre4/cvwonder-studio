import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useStudioStore } from '@/store/studio'
import { TooltipProvider } from '@/components/ui/Tooltip'
import StudioPage from './page'

// Mock react-resizable-panels to simplify testing and assert on keys/remounts
vi.mock('react-resizable-panels', () => ({
  PanelGroup: ({ children, direction, ...props }: any) => (
    <div data-testid="panel-group" data-direction={direction} {...props}>
      {children}
    </div>
  ),
  Panel: ({ children, defaultSize }: any) => (
    <div data-testid="panel" data-default-size={defaultSize}>
      {children}
    </div>
  ),
  PanelResizeHandle: () => <div data-testid="resize-handle" />,
}))

// Mock services/hooks
vi.mock('@/services/sessions', () => ({
  getSession: vi.fn().mockResolvedValue({ id: '123', yaml_content: 'person:\n  name: Germain', theme_id: 'theme-123' }),
  updateSession: vi.fn().mockResolvedValue({}),
}))
vi.mock('@/services/user', () => ({
  getSessionById: vi.fn().mockResolvedValue({ id: '123', yaml_content: 'person:\n  name: Germain', theme_id: 'theme-123' }),
  updateSessionContent: vi.fn().mockResolvedValue({}),
  getConfigLimits: vi.fn().mockResolvedValue({ anon_session_ttl_hours: 24 }),
}))
vi.mock('@/services/themes', () => ({
  listThemes: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/hooks/usePreview', () => ({
  usePreview: vi.fn().mockReturnValue({ forceRefresh: vi.fn(), isCoolingDown: false }),
}))
vi.mock('@/hooks/useValidation', () => ({
  useValidation: vi.fn(),
}))

describe('StudioPage Layout Toggles', () => {
  beforeEach(() => {
    useStudioStore.getState().reset()
  })

  it('allows switching between Code, Visual, and Split layout modes', async () => {
    render(
      <TooltipProvider>
        <MemoryRouter initialEntries={['/studio/test-token']}>
          <Routes>
            <Route path="/studio/:token" element={<StudioPage />} />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    )

    // Wait for load to finish
    await waitFor(() => {
      expect(screen.queryByText(/Loading session/i)).toBeNull()
    })

    // Initially it starts in 'split' mode
    expect(useStudioStore.getState().viewLayout).toBe('split')

    // Click on Code mode button
    const codeBtn = screen.getByText(/📝 Code YAML/i)
    fireEvent.click(codeBtn)
    expect(useStudioStore.getState().viewLayout).toBe('code')

    // Click on Visual mode button
    const visualBtn = screen.getByText(/✨ Assistant Visuel/i)
    fireEvent.click(visualBtn)
    expect(useStudioStore.getState().viewLayout).toBe('visual')

    // Click on Split mode button
    const splitBtn = screen.getByText(/💻 Mode Split/i)
    fireEvent.click(splitBtn)
    expect(useStudioStore.getState().viewLayout).toBe('split')
  })
})

describe('StudioPage Visual Assistant Auto-save', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useStudioStore.getState().reset()
  })

  it('triggers debounced save to backend when form fields are modified', async () => {
    render(
      <TooltipProvider>
        <MemoryRouter initialEntries={['/studio/test-token']}>
          <Routes>
            <Route path="/studio/:token" element={<StudioPage />} />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    )

    // Wait for load to finish
    await waitFor(() => {
      expect(screen.queryByText(/Loading session/i)).toBeNull()
    })

    // Simulate changing a form field in the store
    // (this is what No-Code inputs trigger)
    const { updateFormField } = useStudioStore.getState()
    
    act(() => {
      updateFormField(['person', 'name'], 'Germain Lefebvre')
    })

    // Wait for the debounced save (300ms) to trigger updateSession
    const { updateSession } = await import('@/services/sessions')
    
    await waitFor(() => {
      expect(updateSession).toHaveBeenCalledWith('test-token', {
        yaml_content: expect.stringContaining('name: Germain Lefebvre'),
      })
    }, { timeout: 1000 })
  })

  it('re-initializes PanelGroup when layout switches by changing its key', async () => {
    render(
      <TooltipProvider>
        <MemoryRouter initialEntries={['/studio/test-token']}>
          <Routes>
            <Route path="/studio/:token" element={<StudioPage />} />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    )

    // Wait for load to finish
    await waitFor(() => {
      expect(screen.queryByText(/Loading session/i)).toBeNull()
    })

    const initialGroup = screen.getByTestId('panel-group')

    // Switch viewLayout to 'code'
    const codeBtn = screen.getByText(/📝 Code YAML/i)
    fireEvent.click(codeBtn)

    // The PanelGroup should have remounted, meaning the DOM element reference is completely different!
    const newGroup = screen.getByTestId('panel-group')
    expect(newGroup).not.toBe(initialGroup)
  })
})
