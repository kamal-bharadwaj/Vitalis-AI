import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema, chatMessageSchema } from '@/lib/validations'

describe('loginSchema', () => {
  it('should pass on valid inputs', () => {
    const valid = { email: 'patient@vitalis.ai', password: 'password123' }
    const result = loginSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should fail on invalid email address', () => {
    const invalid = { email: 'not-an-email', password: 'password123' }
    const result = loginSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid email address')
    }
  })

  it('should fail on empty password', () => {
    const invalid = { email: 'patient@vitalis.ai', password: '' }
    const result = loginSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  const baseValidData = {
    fullName: 'Jane Doe',
    email: 'jane@vitalis.ai',
    password: 'password123',
    confirmPassword: 'password123',
    acceptTerms: true,
    acceptDataProcessing: true,
  }

  it('should pass with valid information', () => {
    const result = registerSchema.safeParse(baseValidData)
    expect(result.success).toBe(true)
  })

  it('should fail if passwords do not match', () => {
    const invalid = { ...baseValidData, confirmPassword: 'differentpassword' }
    const result = registerSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Passwords do not match')
    }
  })

  it('should fail if password is too short', () => {
    const invalid = { ...baseValidData, password: 'short', confirmPassword: 'short' }
    const result = registerSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 8 characters')
    }
  })

  it('should fail if consent checkboxes are not true', () => {
    const invalidTerms = { ...baseValidData, acceptTerms: false }
    const result1 = registerSchema.safeParse(invalidTerms)
    expect(result1.success).toBe(false)

    const invalidProcessing = { ...baseValidData, acceptDataProcessing: false }
    const result2 = registerSchema.safeParse(invalidProcessing)
    expect(result2.success).toBe(false)
  })
})

describe('chatMessageSchema', () => {
  it('should pass for standard message', () => {
    const result = chatMessageSchema.safeParse({ content: 'Hello MedicBot!' })
    expect(result.success).toBe(true)
  })

  it('should fail for empty message', () => {
    const result = chatMessageSchema.safeParse({ content: '' })
    expect(result.success).toBe(false)
  })

  it('should fail for message exceeding 2000 characters', () => {
    const longMessage = 'a'.repeat(2001)
    const result = chatMessageSchema.safeParse({ content: longMessage })
    expect(result.success).toBe(false)
  })
})
