import 'server-only'

// Magic bytes for common file types
const MAGIC_BYTES = {
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  jpg: [0xFF, 0xD8, 0xFF],
}

export async function validateFileType(file: File): Promise<boolean> {
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  if (file.size > MAX_SIZE) return false

  const buffer = await file.slice(0, 8).arrayBuffer()
  const bytes = new Uint8Array(buffer)

  const isPdf = MAGIC_BYTES.pdf.every((b, i) => b === bytes[i])
  const isPng = MAGIC_BYTES.png.every((b, i) => b === bytes[i])
  const isJpg = MAGIC_BYTES.jpg.every((b, i) => b === bytes[i])

  if (!isPdf && !isPng && !isJpg) {
    return false
  }

  // Double check MIME type matches magic bytes
  if (isPdf && file.type !== 'application/pdf') return false
  if (isPng && file.type !== 'image/png') return false
  if (isJpg && file.type !== 'image/jpeg') return false

  return true
}
