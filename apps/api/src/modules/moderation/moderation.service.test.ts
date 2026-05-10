import { describe, it, expect } from 'vitest'
import { runPromptPrecheck } from './moderation.service'

describe('runPromptPrecheck', () => {
  it('returns safe for clean SFW prompt', () => {
    const result = runPromptPrecheck({
      prompt: 'A fashion portrait of a woman in an elegant dress at a rooftop bar',
      platform: 'instagram',
      contentRating: 'sfw',
    })
    expect(result.rating).toBe('safe')
    expect(result.detectedIssues).toHaveLength(0)
  })

  it('rejects prompt containing nudity terms', () => {
    const result = runPromptPrecheck({
      prompt: 'A nude portrait on a beach',
      platform: 'instagram',
      contentRating: 'sfw',
    })
    expect(result.rating).toBe('rejected')
    expect(result.detectedIssues).toContain('nude')
  })

  it('rejects prompt containing porn term', () => {
    const result = runPromptPrecheck({
      prompt: 'A porn style image',
      platform: 'tiktok',
      contentRating: 'sfw',
    })
    expect(result.rating).toBe('rejected')
    expect(result.detectedIssues).toContain('porn')
  })

  it('rejects adult content on instagram', () => {
    const result = runPromptPrecheck({
      prompt: 'A beautiful portrait',
      platform: 'instagram',
      contentRating: 'adult',
    })
    expect(result.rating).toBe('rejected')
    expect(result.detectedIssues).toContain('adult content not allowed for platform')
  })

  it('rejects adult content on tiktok', () => {
    const result = runPromptPrecheck({
      prompt: 'A beautiful portrait',
      platform: 'tiktok',
      contentRating: 'adult',
    })
    expect(result.rating).toBe('rejected')
  })

  it('flags borderline terms like lingerie', () => {
    const result = runPromptPrecheck({
      prompt: 'A woman wearing lingerie in a studio',
      platform: 'instagram',
      contentRating: 'sfw',
    })
    expect(result.rating).toBe('borderline')
    expect(result.detectedIssues).toContain('lingerie')
  })

  it('flags borderline terms like bikini', () => {
    const result = runPromptPrecheck({
      prompt: 'Beach photo in a bikini',
      platform: 'instagram',
      contentRating: 'sfw',
    })
    expect(result.rating).toBe('borderline')
    expect(result.detectedIssues).toContain('bikini')
  })

  it('rejects minor/underage/child terms', () => {
    for (const term of ['minor', 'underage', 'child']) {
      const result = runPromptPrecheck({
        prompt: `A ${term} portrait`,
        platform: 'instagram',
        contentRating: 'sfw',
      })
      expect(result.rating).toBe('rejected', `expected rejection for "${term}"`)
    }
  })

  it('rejects explicit sex term', () => {
    const result = runPromptPrecheck({
      prompt: 'explicit sex scene',
      platform: 'instagram',
      contentRating: 'sfw',
    })
    expect(result.rating).toBe('rejected')
    expect(result.detectedIssues).toContain('explicit sex')
  })

  it('allows adult content on other platforms when not sfw', () => {
    const result = runPromptPrecheck({
      prompt: 'A beautiful portrait',
      platform: 'other',
      contentRating: 'adult',
    })
    expect(result.rating).toBe('safe')
  })

  it('returns suggested fixes when rejected', () => {
    const result = runPromptPrecheck({
      prompt: 'nude photo',
      platform: 'instagram',
      contentRating: 'sfw',
    })
    expect(result.suggestedFixes.length).toBeGreaterThan(0)
  })

  it('returns suggested fixes when borderline', () => {
    const result = runPromptPrecheck({
      prompt: 'sensual pose',
      platform: 'instagram',
      contentRating: 'sfw',
    })
    expect(result.suggestedFixes.length).toBeGreaterThan(0)
  })
})
