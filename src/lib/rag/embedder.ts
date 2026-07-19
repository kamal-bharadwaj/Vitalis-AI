import { google } from '@ai-sdk/google'
import { embed, embedMany } from 'ai'

// Use 'gemini-embedding-2' as the default Google embedding model
const embeddingModel = google.embedding('gemini-embedding-2')

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
    providerOptions: {
      google: {
        outputDimensionality: 1536,
      },
    },
  })
  return embedding
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
    providerOptions: {
      google: {
        outputDimensionality: 1536,
      },
    },
  })
  return embeddings
}
