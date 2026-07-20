import { vi } from 'vitest'

// Mock server-only package
vi.mock('server-only', () => ({}))

// Set environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-project.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// Create standard mock database response helper
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockFrom = vi.fn().mockReturnValue({
  insert: mockInsert,
})

const mockSupabase = {
  from: mockFrom,
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
}

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => mockSupabase),
  createServerClient: vi.fn(() => mockSupabase),
}))

// Helper exports for tests to access mocks
export { mockSupabase, mockInsert, mockFrom }
