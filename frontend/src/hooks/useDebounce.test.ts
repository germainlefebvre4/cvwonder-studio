import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300))
    expect(result.current).toBe('hello')
  })

  it('does not update before the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' },
    })

    rerender({ value: 'changed' })
    act(() => {
      vi.advanceTimersByTime(299)
    })

    expect(result.current).toBe('initial')
  })

  it('updates after the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' },
    })

    rerender({ value: 'changed' })
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('changed')
  })

  it('resets the timer on rapid updates', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    act(() => { vi.advanceTimersByTime(200) })
    rerender({ value: 'c' })
    act(() => { vi.advanceTimersByTime(200) })

    // Still on 'a' — timer was reset twice
    expect(result.current).toBe('a')

    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current).toBe('c')
  })
})
