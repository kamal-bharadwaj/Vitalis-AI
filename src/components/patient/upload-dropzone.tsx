'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, Loader2 } from 'lucide-react'
import { useDocuments } from '@/hooks/use-documents'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function UploadDropzone() {
  const [file, setFile] = useState<File | null>(null)
  const { uploadDocument, isUploading } = useDocuments()
  const router = useRouter()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 1,
    multiple: false,
    disabled: isUploading,
  })

  const handleUpload = async () => {
    if (!file) return
    try {
      await uploadDocument(file)
      setFile(null)
      toast.success('Document processed successfully')
      router.push('/patient/reports')
    } catch (error) {
      // Error is handled in the hook
      console.error(error)
    }
  }

  return (
    <div className="w-full">
      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-card'
          }`}
        >
          <input {...getInputProps()} />
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
            <Upload className="size-6" />
          </div>
          <h3 className="text-lg font-semibold mb-1">
            {isDragActive ? 'Drop your report here' : 'Drag & drop your report'}
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
            Upload a PDF, JPG, or PNG medical report. Maximum file size is 10MB.
          </p>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors">
            Select File
          </button>
        </div>
      ) : (
        <div className="border border-border rounded-xl p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="size-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                <File className="size-5 text-primary" />
              </div>
              <div className="overflow-hidden">
                <p className="font-medium text-sm truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            {!isUploading && (
              <button
                onClick={() => setFile(null)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
                aria-label="Remove file"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium flex justify-center items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing Report...
              </>
            ) : (
              'Upload and Process'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
