'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { loginSchema, registerSchema } from '@/lib/validations'
import { loginLimiter } from '@/lib/rate-limiter'
import { headers } from 'next/headers'
import { logAction } from '@/lib/audit-logger'

async function getClientIp(): Promise<string | undefined> {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    undefined
  )
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const ip = await getClientIp()

  // Validate input — Zod v4 uses .issues instead of .errors
  const result = loginSchema.safeParse({ email, password })
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Invalid input' }
  }

  // Rate limit by email
  try {
    await loginLimiter.consume(email)
  } catch {
    logAction({ action: 'login_failed', details: { email, reason: 'rate_limited' }, ipAddress: ip })
    return {
      error: 'Too many login attempts. Please wait 15 minutes before trying again.',
      rateLimited: true,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Log failed login (without exposing reason to user)
    logAction({ action: 'login_failed', details: { email, reason: 'invalid_credentials' }, ipAddress: ip })
    // Generic error to prevent user enumeration
    return { error: 'Invalid email or password.' }
  }

  // Log successful login
  logAction({
    userId: data.user?.id,
    action: 'login',
    details: { email },
    ipAddress: ip,
  })

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
  const { data: { user } } = await supabase.auth.getUser()
  const ip = await getClientIp()

  await supabase.auth.signOut()

  logAction({
    userId: user?.id,
    action: 'logout',
    details: { email: user?.email },
    ipAddress: ip,
  })

  redirect('/login')
}
