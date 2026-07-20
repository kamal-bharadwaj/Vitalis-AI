import { describe, it, expect } from 'vitest'
import { chunkText } from '@/lib/rag/chunker'

describe('chunkText', () => {
  it('should return a single chunk for short text', () => {
    const text = 'This is a short paragraph. It contains some basic text.'
    const result = chunkText(text, { maxTokens: 100, pageNumber: 1 })

    expect(result).toHaveLength(1)
    expect(result[0].content).toBe(text)
    expect(result[0].chunkIndex).toBe(0)
    expect(result[0].metadata.pageNumber).toBe(1)
    expect(result[0].metadata.charStart).toBe(0)
    expect(result[0].metadata.charEnd).toBe(text.length)
  })

  it('should split text by paragraphs when exceeding maxTokens', () => {
    // Each paragraph is approx 20-30 characters (approx 5-8 tokens)
    // Let's set maxTokens very small (e.g. 10 tokens = 40 characters)
    const p1 = 'Paragraph one text here.'
    const p2 = 'Paragraph two text here.'
    const text = `${p1}\n\n${p2}`

    // Max tokens 10, overlap 2 tokens (8 chars)
    const result = chunkText(text, { maxTokens: 10, overlapTokens: 2 })

    expect(result.length).toBeGreaterThan(1)
    expect(result[0].content).toContain(p1)
  })

  it('should respect overlapping tokens', () => {
    const p1 = 'This is the first paragraph of test data.'
    const p2 = 'This is the second paragraph of test data.'
    const text = `${p1}\n\n${p2}`

    // Set maxTokens to fit only p1, so p2 forces a split.
    // Overlap tokens = 5 (20 characters).
    const result = chunkText(text, { maxTokens: 12, overlapTokens: 5 })

    expect(result.length).toBe(2)
    // Overlap text is the last 20 characters of chunk 0
    const expectedOverlap = p1.slice(-20)
    expect(result[1].content.startsWith(expectedOverlap)).toBe(true)
  })

  it('should return an empty array for empty or whitespace-only input', () => {
    expect(chunkText('')).toHaveLength(0)
    expect(chunkText('   \n\n   ')).toHaveLength(0)
  })
})
