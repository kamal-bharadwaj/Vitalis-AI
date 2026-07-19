import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import type { RetrievedChunk } from './retriever'

const MEDICAL_SYSTEM_PROMPT = `
You are MedicBot, a helpful medical report assistant. Your role is to answer
patient questions STRICTLY based on the medical report data provided in the
context below.

RULES:
1. Only answer using information from the provided context.
2. If the context does not contain the answer, say "I could not find this
   information in your uploaded reports. Please ensure the relevant report
   has been uploaded and processed."
3. Never make up medical information or provide diagnoses.
4. Always mention which report or section your answer comes from.
5. Use clear, patient-friendly language. Explain medical terms when used.
6. If a value is abnormal, mention the normal range for reference.
7. Be concise but thorough.
`

export function buildPrompt(
  chunks: RetrievedChunk[],
  userQuestion: string
): string {
  const context = chunks
    .map((chunk, i) => {
      const fileName = chunk.metadata?.file_name || 'Report'
      const page = chunk.metadata?.pageNumber ? `Page ${chunk.metadata.pageNumber}` : 'General'
      return `[Source ${i + 1}] (${fileName} - ${page}, Similarity: ${(chunk.similarity * 100).toFixed(1)}%)\n${chunk.content}`
    })
    .join('\n\n---\n\n')

  return `
CONTEXT FROM PATIENT'S MEDICAL REPORTS:
${context || 'No relevant information found in uploaded reports.'}

PATIENT'S QUESTION:
${userQuestion}
`
}

export async function generateResponse(
  chunks: RetrievedChunk[],
  userQuestion: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = []
) {
  const prompt = buildPrompt(chunks, userQuestion)

  const result = streamText({
    model: google('gemini-3.5-flash'),
    system: MEDICAL_SYSTEM_PROMPT,
    messages: [
      ...chatHistory,
      { role: 'user', content: prompt },
    ],
  })

  return result
}
