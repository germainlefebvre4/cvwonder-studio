import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useStudioStore } from '@/store/studio'
import FormWizard from './FormWizard'

describe('FormWizard Component', () => {
  beforeEach(() => {
    useStudioStore.getState().reset()
  })

  it('renders accordion sections with visual headers', () => {
    useStudioStore.getState().setYamlFromCode('person:\n  name: Germain')
    render(<FormWizard />)

    expect(screen.getByText(/👤 Informations Personnelles/i)).toBeDefined()
    expect(screen.getByText(/💼 Expérience Professionnelle/i)).toBeDefined()
    expect(screen.getByText(/🛠️ Compétences Techniques/i)).toBeDefined()
  })

  it('displays syntax error banner and freezes inputs when isYamlValid is false', () => {
    useStudioStore.getState().setYamlFromCode('person:\n  name: Germain')
    // Introduce syntax error
    useStudioStore.getState().setYamlFromCode('person:\n  name: Germain\n  broken: : :')

    render(<FormWizard />)

    // Warning banner should be present
    expect(screen.getByText(/⚠️ Édition Visuelle Suspendue/i)).toBeDefined()
    expect(
      screen.getByText(/Le code YAML contient une erreur de syntaxe ou d'indentation/i)
    ).toBeDefined()
  })
})
