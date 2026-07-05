import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth-guard'
import { validateFileType } from '@/lib/upload-security'

export async function POST(request: Request) {
  try {
    const user = await getUser()

    if (!user || user.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const isValid = await validateFileType(file)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid file type or size' }, { status: 400 })
    }

    // Generate a unique file name to avoid collisions
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`
    const filePath = `${user.id}/${uniqueFileName}`

    const supabase = await createClient()

    // 1. Upload to Storage
    const { error: storageError } = await supabase
      .storage
      .from('medical-reports')
      .upload(filePath, file)

    if (storageError) {
      console.error('Storage error:', storageError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // 2. Create document record
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        patient_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        status: 'pending',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Cleanup storage if db insert fails
      await supabase.storage.from('medical-reports').remove([filePath])
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 })
    }

    return NextResponse.json({ id: document.id, status: document.status })
  } catch (error) {
    console.error('Upload handler error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
