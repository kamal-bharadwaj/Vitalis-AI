export interface TextChunk {
  content: string
  chunkIndex: number
  metadata: {
    pageNumber?: number
    charStart: number
    charEnd: number
    tokenEstimate: number
  }
}

export function chunkText(
  text: string,
  options: {
    maxTokens?: number    // Default: 600
    overlapTokens?: number // Default: 75
    pageNumber?: number
  } = {}
): TextChunk[] {
  const {
    maxTokens = 600,
    overlapTokens = 75,
    pageNumber,
  } = options

  const chunks: TextChunk[] = []

  // Step 1: Split by paragraphs (semantic boundaries)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)

  let currentChunk = ''
  let currentStart = 0
  let chunkIndex = 0

  for (const paragraph of paragraphs) {
    const estimatedTokens = estimateTokens(currentChunk + '\n\n' + paragraph)

    if (estimatedTokens > maxTokens && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        content: currentChunk.trim(),
        chunkIndex: chunkIndex++,
        metadata: {
          pageNumber,
          charStart: currentStart,
          charEnd: currentStart + currentChunk.length,
          tokenEstimate: estimateTokens(currentChunk),
        },
      })

      // Start new chunk with overlap
      const overlapText = getOverlapText(currentChunk, overlapTokens)
      currentStart = currentStart + currentChunk.length - overlapText.length
      currentChunk = overlapText + '\n\n' + paragraph
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      chunkIndex: chunkIndex,
      metadata: {
        pageNumber,
        charStart: currentStart,
        charEnd: currentStart + currentChunk.length,
        tokenEstimate: estimateTokens(currentChunk),
      },
    })
  }

  return chunks
}

function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4)
}

function getOverlapText(text: string, overlapTokens: number): string {
  const chars = overlapTokens * 4
  return text.slice(-chars)
}
