import { describe, it, expect } from 'vitest'
import { renderPromptTemplate } from './prompt-template.service'

describe('renderPromptTemplate', () => {
  it('replaces single variable', () => {
    const result = renderPromptTemplate('Hello {{name}}', { name: 'World' })
    expect(result).toBe('Hello World')
  })

  it('replaces multiple variables', () => {
    const result = renderPromptTemplate(
      '{{greeting}} {{name}}, welcome to {{place}}',
      { greeting: 'Hi', name: 'Alice', place: 'Lumora' },
    )
    expect(result).toBe('Hi Alice, welcome to Lumora')
  })

  it('handles missing variables by replacing with empty string', () => {
    const result = renderPromptTemplate('Hello {{name}}', {})
    expect(result).toBe('Hello ')
  })

  it('handles null values by replacing with empty string', () => {
    const result = renderPromptTemplate('Hello {{name}}', { name: null })
    expect(result).toBe('Hello ')
  })

  it('joins array values with comma and space', () => {
    const result = renderPromptTemplate(
      'Traits: {{traits}}',
      { traits: ['bold', 'elegant', 'confident'] },
    )
    expect(result).toBe('Traits: bold, elegant, confident')
  })

  it('handles whitespace inside braces', () => {
    const result = renderPromptTemplate('Hello {{ name }}', { name: 'World' })
    expect(result).toBe('Hello World')
  })

  it('returns unchanged template when no variables', () => {
    const result = renderPromptTemplate('No variables here', {})
    expect(result).toBe('No variables here')
  })

  it('handles numeric values', () => {
    const result = renderPromptTemplate('Size: {{width}}x{{height}}', { width: 1024, height: 768 })
    expect(result).toBe('Size: 1024x768')
  })

  it('handles dotted key paths', () => {
    const result = renderPromptTemplate('Model: {{model.name}}', { 'model.name': 'FLUX.1' })
    expect(result).toBe('Model: FLUX.1')
  })
})
