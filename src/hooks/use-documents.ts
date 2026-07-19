import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Document {
  id: string
  patient_id: string
  file_name: string
  file_type: string
  file_size: number
  status: DocumentStatus
  uploaded_at: string
  processed_at: string | null
}

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClient()

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('patient_id', user.id)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      setDocuments(data as Document[])
    } catch (error: unknown) {
      console.error('Error fetching documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDocuments()
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
        },
        () => {
          fetchDocuments() // Refetch on any change to keep it simple and accurate
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchDocuments, supabase])

  const uploadDocument = async (file: File) => {
    setIsUploading(true)
    try {
      // 1. Upload via API
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json()
        throw new Error(errorData.error || 'Failed to upload document')
      }

      const { id } = await uploadRes.json()

      toast.success('Document uploaded successfully. Processing...')

      // 2. Trigger processing
      const processRes = await fetch('/api/documents/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId: id }),
      })

      if (!processRes.ok) {
        const errorData = await processRes.json()
        throw new Error(errorData.error || 'Failed to process document')
      }

      toast.success('Document processed successfully')
    } catch (error: unknown) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Error uploading document')
    } finally {
      setIsUploading(false)
      fetchDocuments()
    }
  }

  const deleteDocument = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to delete document')
      }

      toast.success('Document deleted successfully')
      setDocuments(docs => docs.filter(doc => doc.id !== id))
    } catch (error: unknown) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Error deleting document')
    }
  }

  return {
    documents,
    isLoading,
    isUploading,
    uploadDocument,
    deleteDocument,
    refresh: fetchDocuments,
  }
}
