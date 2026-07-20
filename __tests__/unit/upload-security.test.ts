import { describe, it, expect } from 'vitest'
import { validateFileType } from '@/lib/upload-security'

// Helper to create a mock File object
function createMockFile(options: {
  size: number
  type: string
  name: string
  contentBytes: number[]
}): File {
  const blob = new Blob([new Uint8Array(options.contentBytes)])
  const file = new File([blob], options.name, { type: options.type })
  
  // Override size if requested (e.g. to simulate large files without allocating memory)
  if (options.size !== file.size) {
    Object.defineProperty(file, 'size', { value: options.size })
  }
  
  return file
}

describe('validateFileType', () => {
  it('should accept a valid PDF file with matching magic bytes and MIME type', async () => {
    const file = createMockFile({
      size: 1024,
      type: 'application/pdf',
      name: 'report.pdf',
      contentBytes: [0x25, 0x50, 0x44, 0x46, 0x31, 0x2E, 0x34], // %PDF1.4
    })

    const result = await validateFileType(file)
    expect(result).toBe(true)
  })

  it('should accept a valid PNG file with matching magic bytes and MIME type', async () => {
    const file = createMockFile({
      size: 2048,
      type: 'image/png',
      name: 'scan.png',
      contentBytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    })

    const result = await validateFileType(file)
    expect(result).toBe(true)
  })

  it('should accept a valid JPEG file with matching magic bytes and MIME type', async () => {
    const file = createMockFile({
      size: 2048,
      type: 'image/jpeg',
      name: 'scan.jpg',
      contentBytes: [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46],
    })

    const result = await validateFileType(file)
    expect(result).toBe(true)
  })

  it('should reject a file exceeding the 10MB limit', async () => {
    const file = createMockFile({
      size: 11 * 1024 * 1024, // 11MB
      type: 'application/pdf',
      name: 'huge.pdf',
      contentBytes: [0x25, 0x50, 0x44, 0x46],
    })

    const result = await validateFileType(file)
    expect(result).toBe(false)
  })

  it('should reject a file if the magic bytes are invalid (masqueraded executable)', async () => {
    const file = createMockFile({
      size: 512,
      type: 'application/pdf',
      name: 'virus.pdf',
      contentBytes: [0x4D, 0x5A, 0x90, 0x00], // MZ executable header
    })

    const result = await validateFileType(file)
    expect(result).toBe(false)
  })

  it('should reject a file if magic bytes and MIME type do not match', async () => {
    const file = createMockFile({
      size: 512,
      type: 'image/png', // MIME claims PNG
      name: 'fake.png',
      contentBytes: [0x25, 0x50, 0x44, 0x46], // Header is PDF
    })

    const result = await validateFileType(file)
    expect(result).toBe(false)
  })
})
