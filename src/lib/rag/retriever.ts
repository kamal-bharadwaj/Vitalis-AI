import { createClient } from '@/lib/supabase/server'

export interface RetrievedChunk {
  id: string
  content: string
  metadata: Record<string, unknown>
  similarity: number
}

interface DatabaseChunk {
  id: string
  content: string
  metadata: Record<string, unknown> | null
  similarity: number
}

export async function retrieveRelevantChunks(
  queryEmbedding: number[],
  patientId: string,
  topK: number = 5,
  similarityThreshold: number = 0.5 // Set standard threshold
): Promise<RetrievedChunk[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: topK,
    filter_patient_id: patientId,
  })

  if (error) {
    console.error('match_documents RPC error:', error)
    throw error
  }

  const chunks = (data || []) as DatabaseChunk[]

  return chunks
    .map((chunk) => ({
      id: chunk.id,
      content: chunk.content,
      metadata: chunk.metadata || {},
      similarity: chunk.similarity,
    }))
    .filter((chunk: RetrievedChunk) => chunk.similarity >= similarityThreshold)
}
