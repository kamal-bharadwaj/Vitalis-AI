# MedicBot — Security Protocol Document

> Every design decision in this document assumes **zero trust**: every request is potentially malicious, every input is hostile, and every user may be an attacker trying to access another patient's data.

---

## Table of Contents

1. [Threat Model](#1-threat-model)
2. [Attack Matrix & Defenses](#2-attack-matrix--defenses)
3. [Defense Layer Architecture](#3-defense-layer-architecture)
4. [Layer 1 — HTTP Security Headers](#4-layer-1--http-security-headers)
5. [Layer 2 — Middleware Route Protection](#5-layer-2--middleware-route-protection)
6. [Layer 3 — Server-Side Auth Verification](#6-layer-3--server-side-auth-verification)
7. [Layer 4 — IDOR Prevention (URL Manipulation)](#7-layer-4--idor-prevention-url-manipulation)
8. [Layer 5 — Row Level Security (Database)](#8-layer-5--row-level-security-database)
9. [Layer 6 — Input Validation & Sanitization](#9-layer-6--input-validation--sanitization)
10. [Layer 7 — File Upload Security](#10-layer-7--file-upload-security)
11. [Layer 8 — Rate Limiting & Brute Force Protection](#11-layer-8--rate-limiting--brute-force-protection)
12. [Layer 9 — Storage Access Security](#12-layer-9--storage-access-security)
13. [Layer 10 — API Security](#13-layer-10--api-security)
14. [Layer 11 — Session & Token Security](#14-layer-11--session--token-security)
15. [Layer 12 — Data Protection & Caching](#15-layer-12--data-protection--caching)
16. [Environment Variable Security](#16-environment-variable-security)
17. [Dependencies & Supply Chain](#17-dependencies--supply-chain)
18. [Security Packages to Install](#18-security-packages-to-install)
19. [Full Security Checklist](#19-full-security-checklist)

---

## 1. Threat Model

### Who are the attackers?

| Attacker Type | Capability | Goal |
|--------------|-----------|------|
| **Curious Patient** | Authenticated, basic skills | View another patient's reports or chat |
| **Malicious User** | Authenticated, dev tools knowledge | Manipulate URLs/requests to access unauthorized data |
| **External Attacker** | Unauthenticated, automated tools | Brute force login, scrape data, inject scripts |
| **Script Kiddie** | Automated scanning tools | Find common vulnerabilities (SQLi, XSS, IDOR) |

### What are they targeting?

| Asset | Sensitivity | Impact if Leaked |
|-------|------------|-----------------|
| Patient medical reports (PDF) | **CRITICAL** | Privacy violation, legal liability |
| Patient personal data (name, DOB, phone) | **HIGH** | Identity theft, discrimination |
| Chat conversations (medical Q&A) | **HIGH** | Privacy violation |
| Admin credentials | **CRITICAL** | Full system compromise |
| API keys (OpenAI, Supabase service key) | **CRITICAL** | Financial damage, data exposure |

---

## 2. Attack Matrix & Defenses

| # | Attack | Description | Severity | Defense |
|---|--------|-------------|----------|---------|
| A1 | **IDOR / URL Manipulation** | Change `/patient/chat/abc123` to another session ID | 🔴 Critical | RLS + server-side ownership check |
| A2 | **Broken Access Control** | Patient accesses `/admin/patients` | 🔴 Critical | Middleware + RLS + server re-check |
| A3 | **XSS (Cross-Site Scripting)** | Inject `<script>` in chat messages or file names | 🔴 Critical | CSP headers + DOMPurify + React escaping |
| A4 | **CSRF (Cross-Site Request Forgery)** | Trick user into making unwanted requests | 🟡 High | SameSite cookies + Origin validation |
| A5 | **SQL Injection** | Malicious input in search/filter fields | 🔴 Critical | Parameterized queries (Supabase SDK) |
| A6 | **Brute Force Login** | Automated password guessing | 🟡 High | Rate limiting + account lockout |
| A7 | **File Upload Exploit** | Upload malicious file disguised as PDF | 🔴 Critical | MIME validation + magic bytes + size limit |
| A8 | **Session Hijacking** | Steal session token from cookies | 🟡 High | HttpOnly + Secure + SameSite cookies |
| A9 | **API Key Exposure** | Service role key leaks to client bundle | 🔴 Critical | `server-only` package + env separation |
| A10 | **Enumeration Attack** | Guess UUIDs to find valid patient/document IDs | 🟢 Medium | UUIDs (non-sequential) + RLS |
| A11 | **Man-in-the-Middle** | Intercept data in transit | 🔴 Critical | HTTPS everywhere (Vercel/Supabase default) |
| A12 | **Clickjacking** | Embed app in iframe to trick actions | 🟢 Medium | X-Frame-Options + CSP frame-ancestors |
| A13 | **Data Caching Leak** | Browser/CDN caches sensitive medical data | 🟡 High | Cache-Control: no-store on all patient routes |
| A14 | **Storage Direct Access** | Guess Supabase storage URL to download files | 🔴 Critical | Private bucket + signed URLs (60s TTL) |
| A15 | **Privilege Escalation** | Patient changes `role` to `admin` in request | 🔴 Critical | Server-only role assignment + RLS |

---

## 3. Defense Layer Architecture

```
                   INCOMING REQUEST
                         │
                         ▼
          ┌──────────────────────────────┐
          │   Layer 1: HTTP Headers      │  CSP, HSTS, X-Frame-Options,
          │   (next.config.ts)           │  X-Content-Type-Options
          └──────────────┬───────────────┘
                         │
                         ▼
          ┌──────────────────────────────┐
          │   Layer 2: Rate Limiter      │  Block excessive requests
          │   (middleware.ts)            │  per IP / per user
          └──────────────┬───────────────┘
                         │
                         ▼
          ┌──────────────────────────────┐
          │   Layer 3: Middleware         │  Session exists? Role correct?
          │   (middleware.ts)            │  Redirect if unauthorized
          └──────────────┬───────────────┘
                         │
                         ▼
          ┌──────────────────────────────┐
          │   Layer 4: Server Auth       │  Re-verify auth in EVERY
          │   (API routes / Server      │  Server Action / API Route
          │    Components)              │  NEVER trust middleware alone
          └──────────────┬───────────────┘
                         │
                         ▼
          ┌──────────────────────────────┐
          │   Layer 5: Input Validation  │  Zod schemas on ALL inputs
          │   (Zod + DOMPurify)         │  Sanitize before storage
          └──────────────┬───────────────┘
                         │
                         ▼
          ┌──────────────────────────────┐
          │   Layer 6: Ownership Check   │  resource.patient_id === auth.uid()
          │   (IDOR Prevention)         │  BEFORE any data operation
          └──────────────┬───────────────┘
                         │
                         ▼
          ┌──────────────────────────────┐
          │   Layer 7: Row Level Security│  Database enforces access
          │   (PostgreSQL RLS)          │  Even if app code has bugs
          └──────────────┬───────────────┘
                         │
                         ▼
                   DATA RETURNED
```

> **Key principle:** If ANY single layer fails, the other layers still protect the data. This is **defense in depth**.

---

## 4. Layer 1 — HTTP Security Headers

### Implementation in `next.config.ts`

```typescript
// next.config.ts
const securityHeaders = [
  // Prevent clickjacking — app cannot be embedded in iframes
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Control referrer information leakage
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Restrict browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  // Force HTTPS
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",     // Tighten with nonces later
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co https://api.openai.com",
      "frame-ancestors 'none'",                                // No iframing
      "form-action 'self'",                                    // Forms only submit to self
      "base-uri 'self'",                                       // Prevent base tag hijacking
      "object-src 'none'",                                     // No Flash/Java
    ].join('; '),
  },
  // Prevent browsers from caching sensitive pages
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'off',
  },
]

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Extra strict caching for patient routes
      {
        source: '/patient/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      // Extra strict caching for admin routes
      {
        source: '/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ]
  },
  // Limit Server Action body size (file uploads)
  serverActions: {
    bodySizeLimit: '10mb',
  },
}

export default nextConfig
```

### What Each Header Prevents

| Header | Attack Prevented |
|--------|-----------------|
| `X-Frame-Options: DENY` | Clickjacking — no one can iframe your app |
| `X-Content-Type-Options: nosniff` | MIME confusion attacks |
| `Referrer-Policy` | URL leakage to third parties |
| `Permissions-Policy` | Malicious camera/mic access |
| `Strict-Transport-Security` | Downgrade to HTTP |
| `Content-Security-Policy` | XSS, data exfiltration, code injection |
| `Cache-Control: no-store` | Cached medical data on shared computers |

---

## 5. Layer 2 — Middleware Route Protection

### Enhanced Middleware with Rate Limit Awareness

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Public routes that don't require authentication
const PUBLIC_ROUTES = new Set(['/', '/login', '/register'])

// Routes accessible by each role
const ROLE_ROUTES: Record<string, string> = {
  admin: '/admin',
  patient: '/patient',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  // ── Create authenticated Supabase client ──
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // ── ALWAYS use getUser() not getSession() ──
  // getUser() validates the JWT against Supabase Auth server
  // getSession() only decodes the JWT locally (can be tampered)
  const { data: { user }, error } = await supabase.auth.getUser()

  // ── Public route handling ──
  if (PUBLIC_ROUTES.has(pathname)) {
    if (user && !error) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role) {
        const dashboardUrl = `${ROLE_ROUTES[profile.role]}/dashboard`
        return NextResponse.redirect(new URL(dashboardUrl, request.url))
      }
    }
    return response
  }

  // ── Auth check for protected routes ──
  if (!user || error) {
    // Clear any stale cookies
    response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    return response
  }

  // ── Role-based access control ──
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // User exists in auth but no profile — corrupted state
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // BLOCK: Patient trying to access admin routes
  if (pathname.startsWith('/admin') && profile.role !== 'admin') {
    return NextResponse.redirect(new URL('/patient/dashboard', request.url))
  }

  // BLOCK: Admin trying to access patient routes
  if (pathname.startsWith('/patient') && profile.role !== 'patient') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // BLOCK: API routes for wrong roles
  if (pathname.startsWith('/api/admin') && profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets/|api/auth/).*)',
  ],
}
```

### Why `getUser()` instead of `getSession()`

```
❌ getSession() — Decodes JWT locally. An attacker can forge/modify the JWT.
✅ getUser()   — Validates JWT against Supabase Auth server. Cannot be faked.
```

> **CRITICAL**: Always use `supabase.auth.getUser()` in security-sensitive code. `getSession()` is only for non-sensitive UI rendering.

---

## 6. Layer 3 — Server-Side Auth Verification

### The Golden Rule

> **NEVER trust the middleware alone. Re-verify authentication inside EVERY API route, Server Action, and Server Component that touches data.**

### Auth Guard Utility

```typescript
// src/lib/auth-guard.ts
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type AuthUser = {
  id: string
  email: string
  role: 'admin' | 'patient'
}

/**
 * Verifies the user is authenticated and returns their profile.
 * Use this at the TOP of every Server Component and API Route.
 * Redirects to /login if not authenticated.
 */
export async function requireAuth(): Promise<AuthUser> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user || error) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return {
    id: user.id,
    email: profile.email,
    role: profile.role as 'admin' | 'patient',
  }
}

/**
 * Requires the user to be an admin. Throws 403 if not.
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.role !== 'admin') {
    redirect('/patient/dashboard')
  }
  return user
}

/**
 * Requires the user to be a patient. Throws 403 if not.
 */
export async function requirePatient(): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.role !== 'patient') {
    redirect('/admin/dashboard')
  }
  return user
}
```

### Usage in Every Protected Page/Route

```typescript
// src/app/(patient)/reports/page.tsx
import { requirePatient } from '@/lib/auth-guard'

export default async function ReportsPage() {
  const user = await requirePatient()  // ← ALWAYS the first line

  // Now fetch data scoped to this user
  const supabase = await createClient()
  const { data: reports } = await supabase
    .from('documents')
    .select('*')
    .eq('patient_id', user.id)  // ← ALWAYS filter by authenticated user
    .order('uploaded_at', { ascending: false })

  return <ReportsList reports={reports} />
}
```

```typescript
// src/app/api/chat/route.ts
import { requirePatient } from '@/lib/auth-guard'

export async function POST(request: Request) {
  const user = await requirePatient()  // ← ALWAYS the first line

  const body = await request.json()
  // ... rest of handler
}
```

---

## 7. Layer 4 — IDOR Prevention (URL Manipulation)

### What is IDOR?

```
Patient A is logged in. Their chat session URL is:
  /patient/chat/abc-123-def

Patient A manually changes the URL to:
  /patient/chat/xyz-789-ghi  ← This is Patient B's session!

Without IDOR protection, Patient A sees Patient B's medical conversations.
```

### Defense Strategy: Triple-Layer Ownership Verification

```
  1. Application Level  →  Verify ownership BEFORE querying
  2. Database Level      →  RLS blocks unauthorized rows
  3. Response Level      →  Never return data you haven't verified
```

### Implementation: Ownership Check Utility

```typescript
// src/lib/ownership.ts
import { createClient } from '@/lib/supabase/server'

/**
 * Verify that a resource belongs to the authenticated user.
 * Call this BEFORE any data operation on a specific resource.
 *
 * Returns true if the user owns the resource.
 * Returns false (or throws) if they don't.
 */
export async function verifyOwnership(
  table: 'documents' | 'chat_sessions' | 'chat_messages' | 'document_chunks',
  resourceId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(table)
    .select('patient_id')
    .eq('id', resourceId)
    .single()

  if (error || !data) return false

  return data.patient_id === userId
}
```

### IDOR-Safe Page Example

```typescript
// src/app/(patient)/chat/[sessionId]/page.tsx
import { requirePatient } from '@/lib/auth-guard'
import { verifyOwnership } from '@/lib/ownership'
import { notFound } from 'next/navigation'

export default async function ChatPage({
  params,
}: {
  params: { sessionId: string }
}) {
  // Step 1: Verify the user is authenticated
  const user = await requirePatient()

  // Step 2: Validate the URL parameter format (prevent injection)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(params.sessionId)) {
    notFound()  // Invalid UUID format → 404, not error details
  }

  // Step 3: Verify the session belongs to THIS user
  const isOwner = await verifyOwnership('chat_sessions', params.sessionId, user.id)
  if (!isOwner) {
    notFound()  // NOT 403! Don't reveal that the resource exists
  }

  // Step 4: Now safe to fetch the data
  const supabase = await createClient()
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', params.sessionId)
    .eq('patient_id', user.id)  // Double-filter for safety
    .order('created_at', { ascending: true })

  return <ChatInterface messages={messages} sessionId={params.sessionId} />
}
```

### Why `notFound()` Instead of `403 Forbidden`?

```
❌ 403 Response → Tells attacker: "This resource EXISTS but you can't see it"
                  → Attacker now knows the ID is valid and can try other exploits

✅ 404 Response → Tells attacker: "This resource doesn't exist" (even if it does)
                  → Attacker learns nothing — no information leakage
```

### All Dynamic Routes That Need IDOR Protection

| Route | Parameter | Ownership Table |
|-------|-----------|----------------|
| `/patient/chat/[sessionId]` | `sessionId` | `chat_sessions` |
| `/patient/reports/[id]` | `id` | `documents` |
| `/admin/patients/[id]` | `id` | `profiles` (admin check, not ownership) |
| `/api/documents/[id]` | `id` | `documents` |
| `/api/chat/sessions/[id]` | `id` | `chat_sessions` |

---

## 8. Layer 5 — Row Level Security (Database)

RLS is the **last line of defense**. Even if every other layer has a bug, RLS prevents unauthorized data access at the database level.

### Enhanced RLS Policies

```sql
-- ══════════════════════════════════════════
-- PROFILES — Users can only see their own data
-- ══════════════════════════════════════════
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;  -- Also applies to table owner!

-- Patients see only themselves
CREATE POLICY "patients_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users update only their own profile
CREATE POLICY "users_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())  -- CANNOT change own role!
  );

-- ══════════════════════════════════════════
-- DOCUMENTS — Patient scoped
-- ══════════════════════════════════════════
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;

CREATE POLICY "patients_select_own_documents"
  ON documents FOR SELECT TO authenticated
  USING (
    auth.uid() = patient_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "patients_insert_own_documents"
  ON documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "patients_delete_own_documents"
  ON documents FOR DELETE TO authenticated
  USING (auth.uid() = patient_id);

-- ══════════════════════════════════════════
-- DOCUMENT_CHUNKS — Patient scoped (no direct mutation by users)
-- ══════════════════════════════════════════
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks FORCE ROW LEVEL SECURITY;

CREATE POLICY "patients_select_own_chunks"
  ON document_chunks FOR SELECT TO authenticated
  USING (auth.uid() = patient_id);

-- INSERT is done via service role (server-side processing)
-- No INSERT/UPDATE/DELETE policies for regular users

-- ══════════════════════════════════════════
-- CHAT_SESSIONS — Strictly patient-only
-- ══════════════════════════════════════════
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions FORCE ROW LEVEL SECURITY;

CREATE POLICY "patients_own_sessions"
  ON chat_sessions FOR ALL TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- ══════════════════════════════════════════
-- CHAT_MESSAGES — Strictly patient-only
-- ══════════════════════════════════════════
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages FORCE ROW LEVEL SECURITY;

CREATE POLICY "patients_own_messages"
  ON chat_messages FOR ALL TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);
```

### Critical: `FORCE ROW LEVEL SECURITY`

```
ENABLE ROW LEVEL SECURITY  → RLS applies to regular users
FORCE ROW LEVEL SECURITY   → RLS ALSO applies to the table owner (extra safe)
```

### RLS Anti-Bypass: Role Escalation Prevention

```sql
-- This policy line prevents a patient from changing their role to 'admin':
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  -- ^^^ role in UPDATE must match current role — cannot be changed
);
```

---

## 9. Layer 6 — Input Validation & Sanitization

### Zod Schemas for All Inputs

```typescript
// src/lib/validations.ts
import { z } from 'zod'

// ── Auth Schemas ──
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email')
    .max(255, 'Email too long')
    .transform(v => v.toLowerCase().trim()),
  password: z.string()
    .min(8, 'Minimum 8 characters')
    .max(128, 'Maximum 128 characters'),
})

export const registerSchema = z.object({
  fullName: z.string()
    .min(2, 'Name too short')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Name contains invalid characters'),
  email: z.string()
    .email('Invalid email')
    .max(255)
    .transform(v => v.toLowerCase().trim()),
  password: z.string()
    .min(8, 'Minimum 8 characters')
    .max(128)
    .regex(/(?=.*[a-z])/, 'Must contain lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Must contain uppercase letter')
    .regex(/(?=.*[0-9])/, 'Must contain number'),
  confirmPassword: z.string(),
  phone: z.string()
    .regex(/^\+?[0-9\s\-()]+$/, 'Invalid phone format')
    .max(20)
    .optional()
    .or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')
    .optional()
    .or(z.literal('')),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// ── Chat Schemas ──
export const chatMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message too long (max 5000 chars)')
    .transform(v => v.trim()),
  sessionId: z.string().uuid('Invalid session ID'),
})

// ── Profile Update Schema ──
export const profileUpdateSchema = z.object({
  fullName: z.string().min(2).max(100)
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Invalid characters').optional(),
  phone: z.string().regex(/^\+?[0-9\s\-()]+$/).max(20).optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
})

// ── UUID Parameter Validation ──
export const uuidParamSchema = z.string().uuid('Invalid ID format')

// ── Search/Filter Schema ──
export const searchSchema = z.object({
  query: z.string()
    .max(200, 'Search too long')
    .transform(v => v.trim())
    .optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
```

### Validation Usage Pattern

```typescript
// In every API route / Server Action:
export async function POST(request: Request) {
  const user = await requirePatient()

  // Parse and validate input
  const body = await request.json()
  const result = chatMessageSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { message, sessionId } = result.data  // ← Safe, validated data
  // ... continue with clean data
}
```

### XSS Prevention in Chat Messages

```typescript
// src/lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize text that will be rendered in the UI.
 * Strips all HTML tags, scripts, and event handlers.
 */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],          // No HTML tags allowed
    ALLOWED_ATTR: [],          // No attributes allowed
  })
}

/**
 * Sanitize filename from user uploads.
 * Remove path traversal attempts and special characters.
 */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._\-\s]/g, '')   // Only safe chars
    .replace(/\.{2,}/g, '.')               // No .. (path traversal)
    .replace(/^\.+/, '')                    // No leading dots
    .trim()
    .substring(0, 255)                      // Max length
}
```

---

## 10. Layer 7 — File Upload Security

### Attack Vectors & Defenses

| Attack | How It Works | Defense |
|--------|-------------|---------|
| Malware disguised as PDF | Upload `virus.exe` renamed to `report.pdf` | Check magic bytes, not just extension |
| Path traversal | Filename: `../../../etc/passwd` | Rename to UUID, sanitize filename |
| Storage exhaustion | Upload 100GB of files | File size limit (10MB) |
| Polyglot files | File valid as both PDF and HTML | Strict MIME + magic byte validation |
| Script in PDF metadata | JavaScript embedded in PDF metadata | Extract text only, never execute |

### Secure Upload Implementation

```typescript
// src/lib/upload-security.ts

const ALLOWED_TYPES = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46],  // %PDF magic bytes
} as const

const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB

export interface FileValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate a file upload with multiple security checks.
 */
export async function validateUpload(file: File): Promise<FileValidationResult> {
  // 1. Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Maximum size is 10MB.` }
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' }
  }

  // 2. Check MIME type (first defense — can be spoofed)
  if (!Object.keys(ALLOWED_TYPES).includes(file.type)) {
    return { valid: false, error: 'Only PDF files are allowed.' }
  }

  // 3. Check magic bytes (cannot be spoofed easily)
  const buffer = await file.arrayBuffer()
  const header = new Uint8Array(buffer.slice(0, 4))
  const expectedBytes = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES]

  const magicBytesMatch = expectedBytes.every(
    (byte, index) => header[index] === byte
  )

  if (!magicBytesMatch) {
    return { valid: false, error: 'File content does not match a valid PDF.' }
  }

  return { valid: true }
}

/**
 * Generate a safe storage path for the uploaded file.
 * Uses UUID to prevent filename-based attacks.
 */
export function generateStoragePath(
  patientId: string,
  originalName: string
): string {
  const uuid = crypto.randomUUID()
  const sanitizedName = originalName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 100)
  return `${patientId}/${uuid}_${sanitizedName}`
}
```

### Upload API Route

```typescript
// src/app/api/documents/upload/route.ts
export async function POST(request: Request) {
  const user = await requirePatient()

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate file security
  const validation = await validateUpload(file)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  // Generate safe storage path (UUID-based, not user-supplied)
  const storagePath = generateStoragePath(user.id, file.name)

  // Upload to Supabase Storage (private bucket)
  const supabase = await createClient()
  const { error: uploadError } = await supabase.storage
    .from('medical-reports')
    .upload(storagePath, file, {
      contentType: 'application/pdf',  // Force content type
      upsert: false,                   // Never overwrite
    })

  if (uploadError) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  // Create document record
  const { data: doc, error: dbError } = await supabase
    .from('documents')
    .insert({
      patient_id: user.id,  // ALWAYS the authenticated user's ID
      file_name: sanitizeFileName(file.name),
      file_path: storagePath,
      file_type: 'pdf',
      file_size: file.size,
      status: 'pending',
    })
    .select()
    .single()

  // ... trigger processing
}
```

---

## 11. Layer 8 — Rate Limiting & Brute Force Protection

### Install Rate Limiter

```bash
npm install rate-limiter-flexible
```

### Rate Limit Configuration

```typescript
// src/lib/rate-limiter.ts

// Simple in-memory rate limiter (use Redis for production at scale)
const rateLimits = new Map<string, { count: number; resetAt: number }>()

interface RateLimitConfig {
  windowMs: number    // Time window in milliseconds
  maxRequests: number // Max requests in that window
}

const LIMITS: Record<string, RateLimitConfig> = {
  // Auth endpoints — strictest limits
  login:          { windowMs: 15 * 60 * 1000, maxRequests: 5  },   // 5 attempts per 15 min
  register:       { windowMs: 60 * 60 * 1000, maxRequests: 3  },   // 3 registrations per hour
  passwordReset:  { windowMs: 60 * 60 * 1000, maxRequests: 3  },   // 3 resets per hour

  // API endpoints — moderate limits
  chat:           { windowMs: 60 * 1000,      maxRequests: 20 },   // 20 messages per minute
  upload:         { windowMs: 60 * 60 * 1000, maxRequests: 10 },   // 10 uploads per hour

  // General — generous limits
  api:            { windowMs: 60 * 1000,      maxRequests: 60 },   // 60 requests per minute
}

export function checkRateLimit(
  key: string,
  limitType: keyof typeof LIMITS
): { allowed: boolean; retryAfterMs?: number } {
  const config = LIMITS[limitType]
  const identifier = `${limitType}:${key}`
  const now = Date.now()

  const entry = rateLimits.get(identifier)

  if (!entry || now > entry.resetAt) {
    rateLimits.set(identifier, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true }
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      retryAfterMs: entry.resetAt - now,
    }
  }

  entry.count++
  return { allowed: true }
}
```

### Usage in Login Route

```typescript
// src/app/(auth)/login/actions.ts
'use server'

import { checkRateLimit } from '@/lib/rate-limiter'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string

  // Rate limit by email (prevent brute force on specific account)
  const { allowed, retryAfterMs } = checkRateLimit(email, 'login')
  if (!allowed) {
    const minutes = Math.ceil((retryAfterMs || 0) / 60000)
    return {
      error: `Too many login attempts. Try again in ${minutes} minutes.`,
    }
  }

  // ... proceed with authentication
}
```

### Rate Limit Headers in API Responses

```typescript
// Add to API responses:
response.headers.set('X-RateLimit-Limit', '20')
response.headers.set('X-RateLimit-Remaining', String(remaining))
response.headers.set('X-RateLimit-Reset', String(resetAt))
```

---

## 12. Layer 9 — Storage Access Security

### Private Bucket — No Direct URL Access

```
❌ WRONG: Public bucket where anyone with the URL can download
   https://project.supabase.co/storage/v1/object/public/reports/patient-a/report.pdf

✅ RIGHT: Private bucket with short-lived signed URLs
   https://project.supabase.co/storage/v1/object/sign/reports/patient-a/report.pdf?token=xyz&expires=60
```

### Signed URL Generation (Server-Side Only)

```typescript
// src/lib/storage-security.ts
import { createClient } from '@/lib/supabase/server'

/**
 * Generate a short-lived signed URL for a patient's document.
 * ONLY generates URLs for documents the user OWNS.
 */
export async function getSecureFileUrl(
  documentId: string,
  userId: string
): Promise<string | null> {
  const supabase = await createClient()

  // Step 1: Verify document ownership
  const { data: doc } = await supabase
    .from('documents')
    .select('file_path, patient_id')
    .eq('id', documentId)
    .single()

  if (!doc || doc.patient_id !== userId) {
    return null  // Not found or not owned
  }

  // Step 2: Generate signed URL (60 second expiry)
  const { data: signedUrl } = await supabase.storage
    .from('medical-reports')
    .createSignedUrl(doc.file_path, 60)  // 60 seconds only!

  return signedUrl?.signedUrl || null
}
```

### Why 60 Seconds?

```
- Patient opens their report page → Server generates signed URL
- Patient clicks "View PDF" → URL works (within 60s)
- Patient copies URL and shares it → URL expires before anyone else can use it
- Attacker intercepts URL → By the time they try, it's expired
```

---

## 13. Layer 10 — API Security

### Secure API Route Template

```typescript
// Template for ALL API routes
import { NextResponse, type NextRequest } from 'next/server'
import { requirePatient } from '@/lib/auth-guard'
import { checkRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'

// 1. Define strict input schema
const requestSchema = z.object({
  // ... fields
})

export async function POST(request: NextRequest) {
  try {
    // 2. Rate limit check
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const { allowed } = checkRateLimit(ip, 'api')
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // 3. Auth check (NEVER skip this)
    const user = await requirePatient()

    // 4. Input validation
    const body = await request.json()
    const result = requestSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input' },  // DON'T leak validation details
        { status: 400 }
      )
    }

    // 5. Ownership verification (if accessing a specific resource)
    // ...

    // 6. Business logic
    // ...

    // 7. Return minimal data (don't over-expose)
    return NextResponse.json({ success: true, data: { /* only needed fields */ } })

  } catch (error) {
    // 8. NEVER leak internal errors to client
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Error Response Rules

```
❌ NEVER return:  { error: "Query failed: SELECT * FROM profiles WHERE id = ..." }
❌ NEVER return:  { error: error.message }   // Could contain SQL/stack traces
❌ NEVER return:  { error: "User abc-123 not found in table profiles" }

✅ ALWAYS return: { error: "Not found" }     // Generic, reveals nothing
✅ ALWAYS return: { error: "Invalid input" }  // No details about what's wrong
✅ ALWAYS return: { error: "Unauthorized" }   // No info about why
```

---

## 14. Layer 11 — Session & Token Security

### Cookie Configuration (via Supabase SSR)

Supabase SSR handles cookies, but ensure these settings:

```typescript
// Cookies set by @supabase/ssr automatically include:
{
  httpOnly: true,       // JavaScript cannot access the cookie
  secure: true,         // Only sent over HTTPS
  sameSite: 'lax',      // Prevents CSRF from other sites
  path: '/',            // Available on all routes
  maxAge: 60 * 60 * 24, // 24 hour expiry
}
```

### Session Security Rules

| Rule | Implementation |
|------|---------------|
| No session data in localStorage | Use cookies only (via `@supabase/ssr`) |
| No tokens in URL params | Never pass `?token=abc` in URLs |
| Session invalidation on logout | Call `supabase.auth.signOut()` + clear cookies |
| Re-auth for sensitive actions | Require password confirmation for profile changes |

---

## 15. Layer 12 — Data Protection & Caching

### Prevent Caching of Medical Data

```typescript
// In next.config.ts headers (already shown in Layer 1)
// Patient and admin routes: Cache-Control: no-store

// In API routes returning sensitive data:
const response = NextResponse.json(data)
response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
response.headers.set('Pragma', 'no-cache')
return response
```

### Next.js Page Caching

```typescript
// Force dynamic rendering for all patient/admin pages
// In each page.tsx or layout.tsx:
export const dynamic = 'force-dynamic'
export const revalidate = 0  // Never cache
```

### What NOT to Cache

| Data | Cache? | Reason |
|------|--------|--------|
| Landing page | ✅ Yes | Public, no sensitive data |
| Login page | ✅ Yes | Public, no sensitive data |
| Patient dashboard | ❌ No | Contains personal medical stats |
| Reports list | ❌ No | Contains medical document info |
| Chat messages | ❌ No | Contains medical Q&A |
| Admin patient list | ❌ No | Contains patient PII |
| API responses | ❌ No | All contain user-specific data |

---

## 16. Environment Variable Security

### Separation Rules

```
                     SAFE for client (browser)
                     ─────────────────────────
                     NEXT_PUBLIC_SUPABASE_URL        ✅ Public
                     NEXT_PUBLIC_SUPABASE_ANON_KEY   ✅ Public (RLS protects data)
                     NEXT_PUBLIC_APP_NAME             ✅ Public

                     SERVER-ONLY (never in browser)
                     ─────────────────────────────
                     SUPABASE_SERVICE_ROLE_KEY        🔒 Bypasses ALL RLS
                     OPENAI_API_KEY                   🔒 Financial exposure
                     GOOGLE_GENERATIVE_AI_API_KEY     🔒 Financial exposure
```

### Enforce Server-Only Imports

```typescript
// src/lib/supabase/admin.ts
import 'server-only'  // ← This line causes a BUILD ERROR if imported in client code

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // Service role — bypasses RLS
  )
}
```

```bash
# Install the server-only package
npm install server-only
```

---

## 17. Dependencies & Supply Chain

### Security Audit Process

```bash
# Run before every deployment:
npm audit

# Auto-fix vulnerabilities:
npm audit fix

# Check for outdated packages:
npm outdated
```

### Lock File

```
✅ ALWAYS commit package-lock.json to version control
✅ Use `npm ci` in CI/CD (installs from lock file exactly)
❌ NEVER run `npm install` in production builds
```

---

## 18. Security Packages to Install

```bash
# Input sanitization
npm install isomorphic-dompurify

# Prevent server-only code in client bundle
npm install server-only

# Zod (likely already installed from Phase 1)
npm install zod
```

---

## 19. Full Security Checklist

### Pre-Launch Checklist

#### Authentication & Authorization
- [ ] `getUser()` used everywhere (never `getSession()` for auth)
- [ ] Middleware protects all `/admin` and `/patient` routes
- [ ] Every API route re-verifies auth (doesn't rely on middleware alone)
- [ ] Role checks in every admin-only endpoint
- [ ] Admin seed script used (no admin registration in UI)
- [ ] Password minimum 8 chars + complexity requirements

#### IDOR Prevention
- [ ] Every dynamic route validates UUID format
- [ ] Every dynamic route checks ownership before returning data
- [ ] `notFound()` returned for unauthorized resources (not 403)
- [ ] All database queries filter by `patient_id = auth.uid()`

#### Row Level Security
- [ ] RLS enabled AND forced on ALL tables
- [ ] Patients can only see their own data
- [ ] Admins can see all patient data (read-only)
- [ ] Users cannot change their own `role` field
- [ ] `document_chunks` INSERT only via service role
- [ ] RLS enabled on `storage.objects`

#### Input Validation
- [ ] Zod schemas on every form and API input
- [ ] File upload validates MIME type + magic bytes + size
- [ ] File names sanitized (no path traversal)
- [ ] Chat messages sanitized before storage
- [ ] Search queries length-limited
- [ ] UUID params validated with regex

#### HTTP Security
- [ ] All security headers set in `next.config.ts`
- [ ] CSP blocks inline scripts and external resources
- [ ] `X-Frame-Options: DENY` prevents clickjacking
- [ ] HSTS forces HTTPS
- [ ] No-cache headers on all sensitive routes

#### Storage Security
- [ ] Storage bucket is PRIVATE (not public)
- [ ] Signed URLs used with 60-second TTL
- [ ] Storage RLS policies enforce patient-scoped access
- [ ] Files renamed to UUID on upload

#### Rate Limiting
- [ ] Login: 5 attempts per 15 minutes
- [ ] Registration: 3 per hour
- [ ] Chat: 20 messages per minute
- [ ] Upload: 10 per hour
- [ ] General API: 60 per minute

#### Data Protection
- [ ] `Cache-Control: no-store` on all patient/admin pages
- [ ] `export const dynamic = 'force-dynamic'` on sensitive pages
- [ ] No sensitive data in localStorage
- [ ] No tokens in URL parameters
- [ ] Error messages never leak internal details
- [ ] API responses return minimal data

#### Environment & Dependencies
- [ ] `server-only` package used on admin client and RAG modules
- [ ] Service role key NEVER used in client components
- [ ] `.env.local` in `.gitignore`
- [ ] `npm audit` returns 0 vulnerabilities
- [ ] `package-lock.json` committed

---

> **This document is the security contract for MedicBot. Every feature implemented MUST follow these protocols. No exceptions. No shortcuts.**
