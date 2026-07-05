'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { loginSchema, registerSchema } from '@/lib/validations'
import { loginLimiter } from '@/lib/rate-limiter'
import { headers } from 'next/headers'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate input — Zod v4 uses .issues instead of .errors
  const result = loginSchema.safeParse({ email, password })
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Invalid input' }
  }

  // Rate limit by email
  try {
    await loginLimiter.consume(email)
  } catch {
    return {
      error: 'Too many login attempts. Please wait 15 minutes before trying again.',
      rateLimited: true,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Generic error to prevent user enumeration
    return { error: 'Invalid email or password.' }
  }

  // Role redirection is handled by middleware
  redirect('/')
}

export async function register(formData: FormData) {
  const acceptTermsRaw = formData.get('acceptTerms')
  const acceptDataRaw = formData.get('acceptDataProcessing')

  const rawData = {
    fullName: formData.get('fullName') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
    phone: (formData.get('phone') as string) || undefined,
    gender: (formData.get('gender') as string) || undefined,
    dateOfBirth: (formData.get('dateOfBirth') as string) || undefined,
    acceptTerms: acceptTermsRaw === 'on' ? (true as const) : (false as unknown as true),
    acceptDataProcessing: acceptDataRaw === 'on' ? (true as const) : (false as unknown as true),
  }

  // Zod v4 uses .issues instead of .errors
  const result = registerSchema.safeParse(rawData)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        full_name: result.data.fullName,
        role: 'patient',
        phone: result.data.phone,
        gender: result.data.gender,
        date_of_birth: result.data.dateOfBirth,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  })

  if (error) {
    return { error: 'Registration failed. Please try again.' }
  }

  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
