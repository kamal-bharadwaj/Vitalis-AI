import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth-guard'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()

    if (!user || user.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params as per Next.js 15 routing changes
    const id = (await params).id

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Verify ownership and get file_path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', id)
      .eq('patient_id', user.id)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 2. Delete from Storage
    if (document.file_path) {
      const { error: storageError } = await supabase
        .storage
        .from('medical-reports')
        .remove([document.file_path])

      if (storageError) {
        console.error('Storage deletion error:', storageError)
        // We still proceed to delete the database record
      }
    }

    // 3. Delete from Database (cascades to chunks)
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('patient_id', user.id)

    if (dbError) {
      console.error('Database deletion error:', dbError)
      return NextResponse.json({ error: 'Failed to delete document record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete handler error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
