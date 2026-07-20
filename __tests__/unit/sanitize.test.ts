import { describe, it, expect } from 'vitest'
import { sanitizeHtml, sanitizeFilename } from '@/lib/sanitize'

describe('sanitizeHtml', () => {
  it('should strip out script tags and inline scripts', () => {
    const malicious = 'Hello <script>alert("xss")</script> World'
    const result = sanitizeHtml(malicious)
    expect(result).toBe('Hello  World')
  })

  it('should strip out event handler attributes', () => {
    const malicious = '<p>Click <a href="http://example.com" onclick="alert(\'xss\')">here</a></p>'
    const result = sanitizeHtml(malicious)
    expect(result).toBe('<p>Click <a href="http://example.com">here</a></p>')
  })

  it('should remove disallowed tags while keeping allowed tags', () => {
    const html = '<div><b>Bold</b> <iframe>hidden</iframe> <i>Italic</i></div>'
    const result = sanitizeHtml(html)
    // <div> and <iframe> are not in ALLOWED_TAGS
    expect(result).toBe('<b>Bold</b>  <i>Italic</i>')
  })

  it('should preserve allowed attributes on links', () => {
    const html = '<a href="https://vitalis.ai" target="_blank" rel="noopener noreferrer">Vitalis</a>'
    const result = sanitizeHtml(html)
    expect(result).toBe(html)
  })
})

describe('sanitizeFilename', () => {
  it('should replace special characters and spaces with underscores', () => {
    const filename = 'my patient report #1.pdf'
    const result = sanitizeFilename(filename)
    expect(result).toBe('my_patient_report__1.pdf')
  })

  it('should replace path traversal characters', () => {
    const filename = '../../etc/passwd'
    const result = sanitizeFilename(filename)
    expect(result).not.toContain('/')
    expect(result).toBe('._._etc_passwd')
  })

  it('should collapse multiple consecutive dots', () => {
    const filename = 'document...pdf'
    const result = sanitizeFilename(filename)
    expect(result).toBe('document.pdf')
  })
})
