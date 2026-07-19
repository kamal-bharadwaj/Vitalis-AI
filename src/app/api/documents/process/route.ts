import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth-guard'
import { parsePDF } from '@/lib/rag/parser'
import { chunkText } from '@/lib/rag/chunker'
import { embedTexts } from '@/lib/rag/embedder'

export async function POST(request: Request) {
  const supabase = await createClient()
  let documentId: string | undefined

  try {
    const user = await getUser()

    if (!user || user.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    documentId = body.documentId

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }

    // 1. Verify ownership and get document
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('patient_id', user.id)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 2. Update status to processing
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId)

    // 3. Download from Storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('medical-reports')
      .download(document.file_path)

    if (downloadError || !fileData) {
      throw new Error('Failed to download file from storage')
    }

    // 4. Parse PDF
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const parsedDoc = await parsePDF(buffer)

    // 5. Chunk Text
    const chunks = chunkText(parsedDoc.text, {
      maxTokens: 600,
      overlapTokens: 75,
    })

    // 6. Generate embeddings for the chunks
    const chunkContents = chunks.map(c => c.content)
    const embeddings = chunkContents.length > 0 ? await embedTexts(chunkContents) : []

    const chunksToInsert = chunks.map((chunk, index) => ({
      document_id: documentId,
      patient_id: user.id,
      content: chunk.content,
      chunk_index: chunk.chunkIndex,
      embedding: embeddings[index],
      metadata: { ...chunk.metadata, ...parsedDoc.metadata },
    }))

    if (chunksToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('document_chunks')
        .insert(chunksToInsert)

      if (insertError) {
        throw new Error('Failed to insert document chunks: ' + insertError.message)
      }
    }

    // 7. Update status to completed
    await supabase
      .from('documents')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString(),
        metadata: parsedDoc.metadata
      })
      .eq('id', documentId)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Process handler error:', error)
    
    // Update status to failed if we have a documentId
    if (documentId) {
      await supabase
        .from('documents')
        .update({ status: 'failed' })
        .eq('id', documentId)
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error'

    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    )
  }
}
