import { Metadata } from 'next'
import Link from 'next/link'
import { Upload, FileText, ArrowLeft } from 'lucide-react'

import { UploadDropzone } from '@/components/patient/upload-dropzone'

export const metadata: Metadata = {
  title: 'Upload Report',
}

export default function UploadReportPage() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <Link
        href="/patient/reports"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Reports
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Upload Report</h1>
        <p className="text-muted-foreground mt-1">
          Upload a medical report to get AI-powered insights
        </p>
      </div>

      <UploadDropzone />
    </div>
  )
}
