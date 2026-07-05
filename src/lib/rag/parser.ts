export interface ParsedDocument {
  text: string
  pageCount: number
  pages: { pageNumber: number; text: string }[]
  metadata: {
    title?: string
    author?: string
    creationDate?: string
  }
}

export async function parsePDF(buffer: Buffer): Promise<ParsedDocument> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdf = require('pdf-parse')
  const data = await pdf(buffer)

  return {
    text: data.text,
    pageCount: data.numpages,
    pages: extractPages(data.text),
    metadata: {
      title: data.info?.Title,
      author: data.info?.Author,
      creationDate: data.info?.CreationDate,
    },
  }
}

function extractPages(text: string) {
  // Split by page markers or distribute evenly
  const pages = text.split(/\f/) // Form feed character
  return pages.map((pageText, index) => ({
    pageNumber: index + 1,
    text: pageText.trim(),
  }))
}
