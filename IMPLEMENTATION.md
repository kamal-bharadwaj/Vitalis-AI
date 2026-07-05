# MedicBot — Implementation Guide

> Step-by-step implementation roadmap for the RAG-based medical chatbot. Each phase lists exact files to create, dependencies to install, and code to write.

> ⚠️ **SECURITY FIRST**: Every feature in this guide follows the protocols defined in [SECURITY.md](file:///f:/medic bot/SECURITY.md). Read that document before starting implementation. All 12 defense layers must be applied — no shortcuts.

---

## Table of Contents

1. [Implementation Phases Overview](#1-implementation-phases-overview)
2. [Phase 1 — Project Setup & Foundation](#2-phase-1--project-setup--foundation)
3. [Phase 2 — Authentication System](#3-phase-2--authentication-system)
4. [Phase 3 — Admin Panel](#4-phase-3--admin-panel)
5. [Phase 4 — Patient Portal (UI)](#5-phase-4--patient-portal-ui)
6. [Phase 5 — Document Upload & Processing](#6-phase-5--document-upload--processing)
7. [Phase 6 — RAG Engine](#7-phase-6--rag-engine)
8. [Phase 7 — Chat System](#8-phase-7--chat-system)
9. [Phase 8 — Audit Trail & Error Monitoring](#9-phase-8--audit-trail--error-monitoring)
10. [Phase 9 — Notifications & Email](#10-phase-9--notifications--email)
11. [Phase 10 — Account Management, Data Export & Legal](#11-phase-10--account-management-data-export--legal)
12. [Phase 11 — Testing, Accessibility & CI/CD](#12-phase-11--testing-accessibility--cicd)
13. [Phase 12 — Polish & Hardening](#13-phase-12--polish--hardening)
14. [Environment Variables](#14-environment-variables)
15. [Database Migrations (SQL)](#15-database-migrations-sql)
16. [Deployment Checklist](#16-deployment-checklist)

---

## 1. Implementation Phases Overview

```
Phase 1:  Project Setup & Foundation       ██░░░░░░░░  ~2 hours
Phase 2:  Authentication System            ████░░░░░░  ~3 hours
Phase 3:  Admin Panel                      ██████░░░░  ~3 hours
Phase 4:  Patient Portal (UI)              ████████░░  ~4 hours
Phase 5:  Document Upload & Processing     ██████████  ~4 hours
Phase 6:  RAG Engine                       ██████████  ~5 hours
Phase 7:  Chat System                      ██████████  ~5 hours
Phase 8:  Audit Trail & Error Monitoring   ████████░░  ~4 hours
Phase 9:  Notifications & Email            ██████░░░░  ~3 hours
Phase 10: Account Mgmt, Export & Legal     ████████░░  ~5 hours
Phase 11: Testing, A11y & CI/CD           ████████░░  ~5 hours
Phase 12: Polish & Hardening               ████████████ ~8 hours
                                           ──────────────────────
                                           Total: ~51 hours
```

| Phase | What Gets Built | Key Files |
|-------|----------------|-----------|
| 1 | Next.js project, Supabase setup, DB migrations, Tailwind + shadcn | `package.json`, `migrations/*.sql`, `tailwind.config.ts` |
| 2 | Login, register, middleware, role-based routing | `middleware.ts`, `(auth)/*`, `lib/supabase/*` |
| 3 | Admin dashboard, patient list, patient detail | `(admin)/*`, `components/admin/*` |
| 4 | Patient dashboard, report list, profile page | `(patient)/*`, `components/patient/*` |
| 5 | File upload, PDF parsing, chunking, embedding | `api/documents/*`, `lib/rag/parser.ts`, `lib/rag/chunker.ts` |
| 6 | Embedding, vector search, LLM integration | `lib/rag/embedder.ts`, `lib/rag/retriever.ts`, `lib/rag/generator.ts` |
| 7 | Chat UI, streaming responses, session management | `chat/*`, `api/chat/*`, `components/patient/chat-*` |
| 8 | Audit log table, logging helper, Sentry integration | `lib/audit-logger.ts`, `sentry.*.config.ts`, `api/audit/*` |
| 9 | In-app notifications, email templates, Resend integration | `lib/email.ts`, `lib/notifications.ts`, `emails/*` |
| 10 | Account deletion/recovery, data export ZIP, legal pages | `lib/account-manager.ts`, `api/account/*`, `terms/privacy` |
| 11 | Unit tests, E2E tests, accessibility audit, GitHub Actions | `__tests__/*`, `playwright.config.ts`, `.github/workflows/ci.yml` |
| 12 | Dark mode, responsive, error handling, loading states, a11y | Cross-cutting across all files |

---

## 2. Phase 1 — Project Setup & Foundation

### 2.1 Initialize Next.js Project

```bash
# Create Next.js project with TypeScript and App Router
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### 2.2 Install Dependencies

```bash
# Core Supabase
npm install @supabase/supabase-js @supabase/ssr

# UI Components
npx shadcn@latest init
npx shadcn@latest add button card input label table badge avatar dialog dropdown-menu separator sheet skeleton tabs textarea toast

# Icons
npm install lucide-react

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# RAG Pipeline
npm install pdf-parse                     # PDF text extraction
npm install ai @ai-sdk/openai            # Vercel AI SDK + OpenAI provider
# OR
npm install ai @ai-sdk/google            # Vercel AI SDK + Google provider

# Utilities
npm install date-fns                     # Date formatting
npm install clsx tailwind-merge          # Class utilities (may already be from shadcn)
npm install next-themes                  # Dark mode
npm install react-dropzone               # File upload drag & drop

# UI Performance & Animations
npm install framer-motion                # Micro-animations (lazy loaded)

# PWA & Offline Support
npm install @serwist/next serwist        # Service worker for Next.js App Router
npm install idb                          # IndexedDB wrapper (for encrypted cache)

# Security (MANDATORY — see SECURITY.md)
npm install server-only                  # Prevent server code in client bundle
npm install isomorphic-dompurify         # XSS sanitization
npm install rate-limiter-flexible         # Brute force protection

# Error Monitoring
npm install @sentry/nextjs               # Sentry for Next.js (client + server)

# Email Notifications
npm install resend                        # Transactional email API
npm install @react-email/components react-email  # Email templates

# Data Export
npm install archiver                     # ZIP file creation for data export

# Testing (dev dependencies)
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test
npm install -D @axe-core/playwright       # Accessibility testing
```

### 2.3 Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# LLM Provider (choose one)
OPENAI_API_KEY=your_openai_api_key
# OR
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# App Config
NEXT_PUBLIC_APP_NAME=MedicBot
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Error Monitoring (Sentry)
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@medicbot.com
```

Create `.env.example` (same structure with placeholder values for team reference).

### 2.4 Run Supabase Migrations

Execute all SQL migrations in order (see Section 11 for full SQL):

```bash
# If using Supabase CLI locally:
supabase db push

# Or execute via Supabase Dashboard → SQL Editor
```

### 2.5 Files to Create in This Phase

| File | Purpose |
|------|---------|
| `.env.local` | Environment variables |
| `.env.example` | Environment template |
| `src/lib/supabase/client.ts` | Browser-side Supabase client |
| `src/lib/supabase/server.ts` | Server-side Supabase client (cookies) |
| `src/lib/supabase/admin.ts` | Service-role Supabase client (`import 'server-only'`) |
| `src/lib/auth-guard.ts` | **🔒** `requireAuth()`, `requireAdmin()`, `requirePatient()` |
| `src/lib/ownership.ts` | **🔒** IDOR prevention — ownership verification |
| `src/lib/validations.ts` | **🔒** Zod schemas for ALL user inputs |
| `src/lib/sanitize.ts` | **🔒** DOMPurify text + filename sanitization |
| `src/lib/upload-security.ts` | **🔒** File MIME + magic bytes validation |
| `src/lib/rate-limiter.ts` | **🔒** Rate limiting configuration |
| `src/lib/utils.ts` | `cn()` utility (from shadcn) |
| `src/lib/constants.ts` | App-wide constants |
| `src/lib/offline-cache.ts` | **📱** Encrypted IndexedDB read/write + Web Crypto key derivation |
| `src/lib/audit-logger.ts` | **📋** Async audit log helper (non-blocking) |
| `src/lib/email.ts` | **📧** Email sending via Resend API |
| `src/lib/notifications.ts` | **🔔** In-app notification create/read/mark-read |
| `src/lib/account-manager.ts` | **🗑️** Account deletion, recovery, data export logic |
| `src/types/database.types.ts` | Supabase-generated TypeScript types |
| `src/app/globals.css` | Tailwind directives + CSS variables (dark/light themes) |
| `src/app/layout.tsx` | Root layout with font + ThemeProvider + `<LazyMotion>` |
| `src/app/_offline/page.tsx` | **📱** Offline fallback page |
| `src/components/shared/skip-nav.tsx` | **♿** Skip to main content link |
| `src/components/shared/cookie-consent.tsx` | **🍪** Cookie consent banner |
| `next.config.ts` | **🔒** Security headers + `serwist` PWA config + Sentry |
| `sentry.client.config.ts` | **📊** Sentry browser-side config |
| `sentry.server.config.ts` | **📊** Sentry server-side config |
| `sentry.edge.config.ts` | **📊** Sentry edge runtime config |
| `public/manifest.json` | **📱** PWA manifest (app name, icons, theme color) |
| `src/sw.ts` | **📱** Service worker entry point (serwist) |
| `vitest.config.ts` | **🧪** Vitest test configuration |
| `playwright.config.ts` | **🧪** Playwright E2E test configuration |
| `.github/workflows/ci.yml` | **🚀** GitHub Actions CI/CD pipeline |
| `emails/*.tsx` | **📧** React email templates (welcome, report-processed, etc.) |
| `supabase/migrations/*.sql` | All 11 migration files (includes audit_logs, deleted_accounts, notifications) |


### 2.6 Supabase Client Setup

#### `src/lib/supabase/client.ts` — Browser Client

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### `src/lib/supabase/server.ts` — Server Client

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  )
}
```

#### `src/lib/supabase/admin.ts` — Service Role Client

```typescript
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

---

## 3. Phase 2 — Authentication System

### 3.1 Files to Create

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Route protection + role-based redirects |
| `src/app/(auth)/layout.tsx` | Auth pages layout (centered card) |
| `src/app/(auth)/login/page.tsx` | Login form (email + password) |
| `src/app/(auth)/register/page.tsx` | Patient registration form |
| `src/app/api/auth/callback/route.ts` | Supabase auth callback handler |
| `src/hooks/use-auth.ts` | Auth state management hook |
| `scripts/seed-admin.ts` | Admin account creation script |

### 3.2 Middleware Implementation

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Public routes — no auth required
  const publicRoutes = ['/', '/login', '/register']
  if (publicRoutes.includes(pathname)) {
    if (user) {
      // Already logged in — redirect to their dashboard
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const redirectTo = profile?.role === 'admin'
        ? '/admin/dashboard'
        : '/patient/dashboard'
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    return supabaseResponse
  }

  // Protected routes — require auth
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based access control
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/patient/dashboard', request.url))
  }

  if (pathname.startsWith('/patient') && profile?.role !== 'patient') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
}
```

### 3.3 Login Page — Key Logic

```typescript
// Login action (server action or client-side)
async function handleLogin(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // Middleware handles the redirect based on role
  router.push('/')
}
```

### 3.4 Registration Page — Key Logic

```typescript
// Register action
async function handleRegister(formData: RegisterFormData) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName,
        phone: formData.phone,
        gender: formData.gender,
        date_of_birth: formData.dateOfBirth,
        role: 'patient', // Always patient from registration
      },
    },
  })

  if (error) throw error
  // The DB trigger creates the profile row automatically
}
```

### 3.5 Admin Seed Script

```typescript
// scripts/seed-admin.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seedAdmin() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@medicbot.com',
    password: 'SecureAdminPassword123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'System Admin',
      role: 'admin',
    },
  })

  if (error) {
    console.error('Failed to create admin:', error.message)
    process.exit(1)
  }

  console.log('Admin user created:', data.user.id)
}

seedAdmin()
```

### 3.6 Verification Checklist

- [ ] Patient can register with email + password
- [ ] Patient redirected to `/patient/dashboard` after login
- [ ] Admin redirected to `/admin/dashboard` after login
- [ ] Unauthenticated users redirected to `/login`
- [ ] Patients cannot access `/admin/*` routes
- [ ] Admins cannot access `/patient/*` routes
- [ ] Logout clears session and redirects to `/login`

---

## 4. Phase 3 — Admin Panel

### 4.1 Files to Create

| File | Purpose |
|------|---------|
| `src/app/(admin)/layout.tsx` | Admin layout with sidebar |
| `src/app/(admin)/dashboard/page.tsx` | Dashboard with stats |
| `src/app/(admin)/patients/page.tsx` | Patient listing table |
| `src/app/(admin)/patients/[id]/page.tsx` | Patient detail view |
| `src/components/admin/admin-sidebar.tsx` | Sidebar navigation |
| `src/components/admin/stats-cards.tsx` | Dashboard metric cards |
| `src/components/admin/patients-table.tsx` | Patient data table |
| `src/components/shared/empty-state.tsx` | Empty state component |

### 4.2 Admin Dashboard

**Stats to display:**

| Stat | Query |
|------|-------|
| Total Patients | `SELECT COUNT(*) FROM profiles WHERE role = 'patient'` |
| Total Documents | `SELECT COUNT(*) FROM documents` |
| Documents Processing | `SELECT COUNT(*) FROM documents WHERE status = 'processing'` |
| Total Chat Sessions | `SELECT COUNT(*) FROM chat_sessions` |

**Recent Activity:**
- Latest 5 registered patients (name, email, date)
- Latest 5 uploaded documents (filename, patient, status, date)

### 4.3 Patient Listing Table

**Columns:**

| Column | Source | Sortable | Searchable |
|--------|--------|----------|------------|
| Name | `profiles.full_name` | Yes | Yes |
| Email | `profiles.email` | Yes | Yes |
| Phone | `profiles.phone` | No | No |
| Gender | `profiles.gender` | No | Filter |
| Registered | `profiles.created_at` | Yes | Date range |
| Documents | `COUNT(documents)` | Yes | No |

**Features:**
- Server-side pagination (20 per page)
- Search by name or email
- Click row → navigate to patient detail page

### 4.4 Patient Detail Page

**Sections:**

1. **Patient Info Card** — Name, email, phone, gender, DOB, registration date
2. **Uploaded Documents Table** — File name, type, size, upload date, processing status (badge)
3. **Activity Summary** — Total chats, total documents, last active

### 4.5 Empty States

All listing pages must handle the case where no data exists yet:

- **Dashboard:** "No patients registered yet. Patients will appear here once they sign up."
- **Patient List:** "No patients found. The patient list will populate as new users register."
- **Patient Detail → Documents:** "This patient has not uploaded any documents yet."

### 4.6 Verification Checklist

- [ ] Admin dashboard renders with all stat cards (showing 0 initially)
- [ ] Patient table shows empty state when no patients exist
- [ ] Patient table populates when patients register
- [ ] Patient detail page shows patient info + their documents
- [ ] Sidebar navigation works between all admin pages
- [ ] Pages are responsive on tablet+ screens

---

## 5. Phase 4 — Patient Portal (UI)

### 5.1 Files to Create

| File | Purpose |
|------|---------|
| `src/app/(patient)/layout.tsx` | Patient layout with sidebar |
| `src/app/(patient)/dashboard/page.tsx` | Patient home |
| `src/app/(patient)/reports/page.tsx` | Report listing |
| `src/app/(patient)/reports/upload/page.tsx` | Upload page |
| `src/app/(patient)/chat/page.tsx` | Chat sessions list |
| `src/app/(patient)/chat/[sessionId]/page.tsx` | Active chat |
| `src/app/(patient)/profile/page.tsx` | Edit profile |
| `src/components/patient/patient-sidebar.tsx` | Sidebar navigation |
| `src/components/patient/report-card.tsx` | Document card component |
| `src/components/patient/upload-dropzone.tsx` | Drag & drop upload zone |

### 5.2 Patient Dashboard

**Quick Stats:**

| Stat | Description |
|------|-------------|
| Reports Uploaded | Count of documents owned by this patient |
| Reports Processed | Count where status = 'completed' |
| Chat Sessions | Count of chat sessions |
| Last Activity | Most recent chat message or upload timestamp |

**Quick Actions:**
- "Upload Report" button → `/patient/reports/upload`
- "Start Chat" button → `/patient/chat` (creates new session)

### 5.3 Report Listing

Each report displayed as a card with:
- File icon (based on type)
- File name
- File size (formatted: "2.4 MB")
- Upload date (relative: "3 days ago")
- Status badge: `pending` (yellow) | `processing` (blue) | `completed` (green) | `failed` (red)
- Delete button (with confirmation dialog)

### 5.4 Upload Page

- Drag & drop zone (react-dropzone)
- Accepted files: `.pdf` (expandable to images later)
- Max file size: 10 MB
- Upload progress bar
- After upload: redirect to report listing

### 5.5 Chat Sessions List

Each session as a card:
- Auto-generated title (from first message)
- Created date
- Message count
- "Continue" button → opens chat
- Delete button

**Empty state:** "You haven't started any conversations yet. Upload a medical report first, then start a chat to ask questions about it."

### 5.6 Profile Page

Editable fields:
- Full Name
- Phone
- Gender (select: Male/Female/Other)
- Date of Birth (date picker)
- Avatar (future enhancement)

### 5.7 Verification Checklist

- [ ] Patient dashboard shows stats (all zeros initially)
- [ ] Reports page shows empty state initially
- [ ] Upload dropzone accepts PDFs and shows progress
- [ ] Chat sessions page shows empty state
- [ ] Profile page loads and saves patient data
- [ ] Sidebar navigation works between all patient pages

---

## 6. Phase 5 — Document Upload & Processing

### 6.1 Files to Create

| File | Purpose |
|------|---------|
| `src/app/api/documents/upload/route.ts` | Upload endpoint |
| `src/app/api/documents/process/route.ts` | Processing endpoint |
| `src/app/api/documents/[id]/route.ts` | Delete endpoint |
| `src/lib/rag/parser.ts` | PDF text extraction |
| `src/lib/rag/chunker.ts` | Semantic text chunking |
| `src/hooks/use-documents.ts` | Document operations hook |

### 6.2 Upload Flow

```
Client                          Server                          Supabase
  │                               │                               │
  │  POST /api/documents/upload   │                               │
  │  (FormData with file)         │                               │
  │──────────────────────────────>│                               │
  │                               │  Upload to Storage bucket     │
  │                               │──────────────────────────────>│
  │                               │  <── storage path ──────────  │
  │                               │                               │
  │                               │  INSERT into documents table  │
  │                               │  (status: 'pending')          │
  │                               │──────────────────────────────>│
  │                               │  <── document record ───────  │
  │                               │                               │
  │  <── { id, status: pending }──│                               │
  │                               │                               │
  │  POST /api/documents/process  │                               │
  │  { documentId }               │                               │
  │──────────────────────────────>│                               │
  │                               │  UPDATE status → 'processing' │
  │                               │──────────────────────────────>│
  │                               │  Download file from Storage   │
  │                               │──────────────────────────────>│
  │                               │  <── file buffer ───────────  │
  │                               │                               │
  │                               │  Parse PDF → raw text         │
  │                               │  Chunk text → chunks[]        │
  │                               │  Embed chunks → vectors[]     │
  │                               │                               │
  │                               │  INSERT document_chunks       │
  │                               │──────────────────────────────>│
  │                               │  UPDATE status → 'completed'  │
  │                               │──────────────────────────────>│
  │                               │                               │
  │  <── { status: completed }────│                               │
```

### 6.3 PDF Parser Implementation

```typescript
// src/lib/rag/parser.ts
import pdf from 'pdf-parse'

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
  const data = await pdf(buffer)

  return {
    text: data.text,
    pageCount: data.numpages,
    pages: extractPages(data.text, data.numpages),
    metadata: {
      title: data.info?.Title,
      author: data.info?.Author,
      creationDate: data.info?.CreationDate,
    },
  }
}

function extractPages(text: string, pageCount: number) {
  // Split by page markers or distribute evenly
  const pages = text.split(/\f/) // Form feed character
  return pages.map((pageText, index) => ({
    pageNumber: index + 1,
    text: pageText.trim(),
  }))
}
```

### 6.4 Chunker Implementation

```typescript
// src/lib/rag/chunker.ts
export interface TextChunk {
  content: string
  chunkIndex: number
  metadata: {
    pageNumber?: number
    charStart: number
    charEnd: number
    tokenEstimate: number
  }
}

export function chunkText(
  text: string,
  options: {
    maxTokens?: number    // Default: 600
    overlapTokens?: number // Default: 75
    pageNumber?: number
  } = {}
): TextChunk[] {
  const {
    maxTokens = 600,
    overlapTokens = 75,
    pageNumber,
  } = options

  const chunks: TextChunk[] = []

  // Step 1: Split by paragraphs (semantic boundaries)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)

  let currentChunk = ''
  let currentStart = 0
  let chunkIndex = 0

  for (const paragraph of paragraphs) {
    const estimatedTokens = estimateTokens(currentChunk + '\n\n' + paragraph)

    if (estimatedTokens > maxTokens && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        content: currentChunk.trim(),
        chunkIndex: chunkIndex++,
        metadata: {
          pageNumber,
          charStart: currentStart,
          charEnd: currentStart + currentChunk.length,
          tokenEstimate: estimateTokens(currentChunk),
        },
      })

      // Start new chunk with overlap
      const overlapText = getOverlapText(currentChunk, overlapTokens)
      currentStart = currentStart + currentChunk.length - overlapText.length
      currentChunk = overlapText + '\n\n' + paragraph
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      chunkIndex: chunkIndex,
      metadata: {
        pageNumber,
        charStart: currentStart,
        charEnd: currentStart + currentChunk.length,
        tokenEstimate: estimateTokens(currentChunk),
      },
    })
  }

  return chunks
}

function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4)
}

function getOverlapText(text: string, overlapTokens: number): string {
  const chars = overlapTokens * 4
  return text.slice(-chars)
}
```

### 6.5 Verification Checklist

- [ ] PDF uploads to Supabase Storage successfully
- [ ] Document record created with status 'pending'
- [ ] PDF text extraction works correctly
- [ ] Chunking produces reasonable-sized chunks
- [ ] Document status updates to 'completed' after processing
- [ ] Failed processing sets status to 'failed'
- [ ] Document deletion cascades to chunks and storage

---

## 7. Phase 6 — RAG Engine

### 7.1 Files to Create

| File | Purpose |
|------|---------|
| `src/lib/rag/embedder.ts` | Generate embeddings via API |
| `src/lib/rag/retriever.ts` | pgvector similarity search |
| `src/lib/rag/generator.ts` | LLM prompt construction + streaming |

### 7.2 Embedder Implementation

```typescript
// src/lib/rag/embedder.ts
import { openai } from '@ai-sdk/openai'
import { embed, embedMany } from 'ai'

const embeddingModel = openai.embedding('text-embedding-3-small')

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  })
  return embedding
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
  })
  return embeddings
}
```

### 7.3 Retriever Implementation

```typescript
// src/lib/rag/retriever.ts
import { createClient } from '@/lib/supabase/server'

export interface RetrievedChunk {
  id: string
  content: string
  metadata: Record<string, any>
  similarity: number
}

export async function retrieveRelevantChunks(
  queryEmbedding: number[],
  patientId: string,
  topK: number = 5,
  similarityThreshold: number = 0.7
): Promise<RetrievedChunk[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: topK,
    filter_patient_id: patientId,
  })

  if (error) throw error

  return (data || []).filter(
    (chunk: any) => chunk.similarity >= similarityThreshold
  )
}
```

### 7.4 Generator Implementation

```typescript
// src/lib/rag/generator.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import type { RetrievedChunk } from './retriever'

const MEDICAL_SYSTEM_PROMPT = `
You are MedicBot, a helpful medical report assistant. Your role is to answer
patient questions STRICTLY based on the medical report data provided in the
context below.

RULES:
1. Only answer using information from the provided context.
2. If the context does not contain the answer, say "I could not find this
   information in your uploaded reports. Please ensure the relevant report
   has been uploaded and processed."
3. Never make up medical information or provide diagnoses.
4. Always mention which report or section your answer comes from.
5. Use clear, patient-friendly language. Explain medical terms when used.
6. If a value is abnormal, mention the normal range for reference.
7. Be concise but thorough.
`

export function buildPrompt(
  chunks: RetrievedChunk[],
  userQuestion: string
): string {
  const context = chunks
    .map((chunk, i) =>
      `[Source ${i + 1}] (Similarity: ${(chunk.similarity * 100).toFixed(1)}%)\n${chunk.content}`
    )
    .join('\n\n---\n\n')

  return `
CONTEXT FROM PATIENT'S MEDICAL REPORTS:
${context || 'No relevant information found in uploaded reports.'}

PATIENT'S QUESTION:
${userQuestion}
`
}

export async function generateResponse(
  chunks: RetrievedChunk[],
  userQuestion: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = []
) {
  const prompt = buildPrompt(chunks, userQuestion)

  const result = streamText({
    model: openai('gpt-4o'),
    system: MEDICAL_SYSTEM_PROMPT,
    messages: [
      ...chatHistory,
      { role: 'user', content: prompt },
    ],
  })

  return result
}
```

### 7.5 Full RAG Pipeline (Orchestration)

```typescript
// Used in the chat API route
async function ragPipeline(
  userQuestion: string,
  patientId: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[]
) {
  // Step 1: Embed the question
  const queryEmbedding = await embedText(userQuestion)

  // Step 2: Retrieve relevant chunks
  const chunks = await retrieveRelevantChunks(queryEmbedding, patientId)

  // Step 3: Generate response
  const stream = await generateResponse(chunks, userQuestion, chatHistory)

  return { stream, sources: chunks }
}
```

### 7.6 Verification Checklist

- [ ] Embedding API returns valid 1536-dim vectors
- [ ] `match_documents` SQL function returns correct results
- [ ] Retrieval filters by patient_id correctly
- [ ] LLM generates relevant answers from context
- [ ] Streaming works end-to-end
- [ ] System refuses to answer when no context is found

---

## 8. Phase 7 — Chat System

### 8.1 Files to Create

| File | Purpose |
|------|---------|
| `src/app/api/chat/route.ts` | Chat endpoint (streaming) |
| `src/app/api/chat/sessions/[id]/route.ts` | Session CRUD |
| `src/app/(patient)/chat/page.tsx` | Chat sessions list |
| `src/app/(patient)/chat/[sessionId]/page.tsx` | Active chat page |
| `src/components/patient/chat-interface.tsx` | Main chat container |
| `src/components/patient/chat-message.tsx` | Message bubble |
| `src/components/patient/chat-input.tsx` | Input with send button |
| `src/hooks/use-chat.ts` | Chat state management |

### 8.2 Chat API Endpoint

```typescript
// src/app/api/chat/route.ts
import { createClient } from '@/lib/supabase/server'
import { embedText } from '@/lib/rag/embedder'
import { retrieveRelevantChunks } from '@/lib/rag/retriever'
import { generateResponse } from '@/lib/rag/generator'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { message, sessionId } = await request.json()

  // Save user message
  await supabase.from('chat_messages').insert({
    session_id: sessionId,
    patient_id: user.id,
    role: 'user',
    content: message,
  })

  // Load chat history for context
  const { data: history } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(10) // Last 10 messages for context window

  // RAG Pipeline
  const queryEmbedding = await embedText(message)
  const chunks = await retrieveRelevantChunks(queryEmbedding, user.id)
  const result = await generateResponse(
    chunks,
    message,
    (history || []).slice(0, -1) // Exclude the just-saved message
  )

  // Stream the response
  const stream = result.toDataStreamResponse()

  // After stream completes, save assistant message (via onFinish callback)
  // This is handled inside generateResponse using onFinish

  return stream
}
```

### 8.3 Chat UI Component Structure

```
┌─────────────────────────────────────────────┐
│  Chat Interface                             │
│  ┌───────────────────────────────────────┐  │
│  │  Messages Area (scrollable)           │  │
│  │                                       │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │ 🧑 User: "What was my blood    │  │  │
│  │  │    sugar level?"                │  │  │
│  │  └─────────────────────────────────┘  │  │
│  │                                       │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │ 🤖 Bot: "Based on your report  │  │  │
│  │  │    dated June 20, your fasting  │  │  │
│  │  │    blood sugar was 105 mg/dL.   │  │  │
│  │  │    Normal range: 70-100 mg/dL." │  │  │
│  │  │                                 │  │  │
│  │  │  📄 Source: Report_June20.pdf   │  │  │
│  │  │     Page 2, Section: Lab Results│  │  │
│  │  └─────────────────────────────────┘  │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │  [Type your question...        ] [➤]  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 8.4 Message Types

```typescript
// src/types/chat.ts
export interface ChatMessage {
  id: string
  sessionId: string
  patientId: string
  role: 'user' | 'assistant'
  content: string
  sources?: {
    chunkId: string
    documentName: string
    pageNumber?: number
    similarity: number
  }[]
  createdAt: string
}

export interface ChatSession {
  id: string
  patientId: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount?: number
}
```

### 8.5 Verification Checklist

- [ ] Can create a new chat session
- [ ] Messages display correctly (user right, bot left)
- [ ] AI responses stream in real-time
- [ ] Source attribution shows below AI messages
- [ ] Chat history loads when revisiting a session
- [ ] Can delete a chat session
- [ ] Auto-scroll to latest message
- [ ] Empty state when no messages exist
- [ ] Loading/typing indicator while AI generates response

---

## 9. Phase 8 — Audit Trail & Error Monitoring

### 9.1 Audit Log Database Table

See ARCHITECTURE.md Section 15 for the full `audit_logs` table schema.

### 9.2 Audit Logger Utility

| File | Purpose |
|------|---------|
| `src/lib/audit-logger.ts` | `logAction()` — async, non-blocking audit log insert |

```typescript
// Usage in any API route or Server Action:
import { logAction } from '@/lib/audit-logger'

// After executing the main action:
logAction({
  userId: user.id,
  action: 'view_document',
  targetTable: 'documents',
  targetId: documentId,
  details: { fileName: doc.file_name },
  request,  // Next.js request object (for IP + user agent)
})
// NOTE: This is fire-and-forget — does NOT await
```

### 9.3 Admin Audit Log Page

| File | Purpose |
|------|---------|
| `src/app/(admin)/audit-logs/page.tsx` | Filterable audit log viewer |
| `src/app/api/audit/route.ts` | Audit log query endpoint (admin only) |

Features:
- Filter by action type, date range, user
- Paginated (50 per page)
- Search by target ID
- Export as CSV

### 9.4 Sentry Integration

| File | Purpose |
|------|---------|
| `sentry.client.config.ts` | Browser-side error tracking + performance |
| `sentry.server.config.ts` | Server-side error tracking (API routes, RSC) |
| `sentry.edge.config.ts` | Edge runtime error tracking |
| `next.config.ts` | Sentry webpack plugin (source maps) |

```bash
# Initialize Sentry for Next.js
npx @sentry/wizard@latest -i nextjs
```

### 9.5 Files to Create

| File | Purpose |
|------|---------|
| `src/lib/audit-logger.ts` | Async audit log insert (service role) |
| `src/app/(admin)/audit-logs/page.tsx` | Admin audit log viewer |
| `src/app/api/audit/route.ts` | Audit log API (filterable, paginated) |
| `sentry.client.config.ts` | Sentry browser config |
| `sentry.server.config.ts` | Sentry server config |
| `sentry.edge.config.ts` | Sentry edge config |

### 9.6 Verification Checklist

- [ ] Audit log entry created for every login/logout
- [ ] Audit log entry created for document upload/view/delete
- [ ] Audit log entry created for chat queries
- [ ] Admin can view and filter audit logs
- [ ] Audit logs are append-only (no UPDATE/DELETE)
- [ ] Sentry captures server-side errors
- [ ] Sentry captures client-side errors
- [ ] Sentry performance monitoring active

---

## 10. Phase 9 — Notifications & Email

### 10.1 In-App Notifications

| File | Purpose |
|------|---------|
| `src/lib/notifications.ts` | Create/read/mark-read notification helpers |
| `src/components/shared/notification-bell.tsx` | Bell icon with unread badge + dropdown |
| `src/app/(patient)/notifications/page.tsx` | Full notification list page |
| `src/app/api/notifications/route.ts` | List notifications (patient's own) |
| `src/app/api/notifications/[id]/route.ts` | Mark notification as read |
| `src/hooks/use-notifications.ts` | Polling hook (every 30s) for unread count |

### 10.2 Email Templates (React Email)

| File | Template |
|------|----------|
| `emails/welcome.tsx` | "Welcome to MedicBot!" — sent on registration |
| `emails/report-processed.tsx` | "Your report {name} is ready" — sent when processing completes |
| `emails/report-failed.tsx` | "Report {name} could not be processed" — sent on failure |
| `emails/account-deleted.tsx` | "Your account will be deleted in 30 days" |
| `emails/account-recovered.tsx` | "Your account has been restored" |

### 10.3 Email Sending Utility

| File | Purpose |
|------|---------|
| `src/lib/email.ts` | `sendEmail()` — Resend API wrapper |

```typescript
// Usage:
import { sendEmail } from '@/lib/email'

await sendEmail({
  to: patient.email,
  template: 'report-processed',
  data: { reportName: doc.file_name },
})
```

### 10.4 Where Notifications Are Triggered

| Event | Where Triggered | In-App | Email |
|-------|----------------|--------|-------|
| Registration | `(auth)/register` server action | ✅ | ✅ |
| Report processed | `api/documents/process` (end of pipeline) | ✅ | ✅ |
| Report failed | `api/documents/process` (error handler) | ✅ | ✅ |
| Account deletion | `api/account/delete` | ✅ | ✅ |
| Account recovered | `api/account/recover` | ✅ | ✅ |

### 10.5 Verification Checklist

- [ ] Notification bell shows unread count
- [ ] Clicking notification marks it as read
- [ ] Welcome email sent on registration
- [ ] Report processed/failed email sent
- [ ] Email templates render correctly (test with `npx react-email dev`)

---

## 11. Phase 10 — Account Management, Data Export & Legal

### 11.1 Account Deletion

See ARCHITECTURE.md Section 21 for the full deletion/recovery flow diagrams.

| File | Purpose |
|------|---------|
| `src/lib/account-manager.ts` | `deleteAccount()`, `recoverAccount()`, `exportData()` |
| `src/app/(patient)/profile/delete/page.tsx` | Account deletion confirmation page |
| `src/app/api/account/delete/route.ts` | Account deletion API endpoint |

### 11.2 Account Recovery (Admin)

| File | Purpose |
|------|---------|
| `src/app/(admin)/deleted-accounts/page.tsx` | List deleted accounts (within 30-day window) |
| `src/app/(admin)/deleted-accounts/[id]/page.tsx` | View snapshot + "Recover" button |
| `src/app/api/account/recover/route.ts` | Restore account from snapshot |

### 11.3 Auto-Purge Scheduled Job

| File | Purpose |
|------|---------|
| `supabase/functions/purge-deleted-accounts/index.ts` | Daily cron: purge expired accounts |
| `scripts/purge-expired.ts` | Manual purge script (for local testing) |

### 11.4 Data Export

| File | Purpose |
|------|---------|
| `src/app/(patient)/profile/export/page.tsx` | "Export My Data" page with download button |
| `src/app/api/account/export/route.ts` | Generate ZIP (profile + documents + chats) |

```typescript
// ZIP structure:
// medicbot-export-2024-01-15.zip
// ├── profile.json
// ├── documents.json
// ├── chats.json
// └── reports/
//     ├── report-1.pdf
//     ├── report-2.pdf
//     └── ...
```

### 11.5 Legal Pages

| File | Route | Purpose |
|------|-------|---------|
| `src/app/terms/page.tsx` | `/terms` | Terms of Service |
| `src/app/privacy/page.tsx` | `/privacy` | Privacy Policy |
| `src/app/cookies/page.tsx` | `/cookies` | Cookie Policy |
| `src/components/shared/cookie-consent.tsx` | (all pages) | Cookie consent banner |

### 11.6 Registration Consent Update

Update `src/app/(auth)/register/page.tsx` to include:
- ☑ "I agree to the Terms of Service and Privacy Policy" checkbox
- ☑ "I consent to the processing of my medical data" checkbox
- Register button disabled until both checked

### 11.7 Verification Checklist

- [ ] Patient can initiate account deletion
- [ ] "Type DELETE" confirmation required
- [ ] Data snapshoted to `deleted_accounts` table
- [ ] User's data removed from live tables
- [ ] Auth account deleted from Supabase Auth
- [ ] Admin can view deleted accounts list
- [ ] Admin can recover account within 30 days
- [ ] Recovered account is fully functional
- [ ] Data export downloads correct ZIP
- [ ] Terms/Privacy/Cookie pages render
- [ ] Registration requires consent checkboxes
- [ ] Cookie consent banner shows on first visit

---

## 12. Phase 11 — Testing, Accessibility & CI/CD

### 12.1 Testing Setup

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Vitest configuration (path aliases, jsdom) |
| `playwright.config.ts` | Playwright E2E config (baseURL, browsers) |
| `__tests__/setup.ts` | Test setup (mocks, Supabase test client) |

### 12.2 Unit Tests (Vitest)

| Test File | What's Tested |
|-----------|--------------|
| `__tests__/unit/chunker.test.ts` | Text splitting logic (overlap, boundaries) |
| `__tests__/unit/sanitize.test.ts` | XSS sanitization (script tags, events) |
| `__tests__/unit/validations.test.ts` | Zod schema validation (all forms) |
| `__tests__/unit/upload-security.test.ts` | Magic bytes validation (PDF, JPG, PNG vs EXE) |
| `__tests__/unit/audit-logger.test.ts` | Audit log formatting |

### 12.3 Integration Tests (Vitest + Supabase)

| Test File | What's Tested |
|-----------|--------------|
| `__tests__/integration/auth.test.ts` | Register, login, role assignment, redirect |
| `__tests__/integration/rls.test.ts` | Patient A can't see Patient B's data |
| `__tests__/integration/api-routes.test.ts` | API endpoints respond correctly |

### 12.4 E2E Tests (Playwright)

| Test File | Scenarios |
|-----------|----------|
| `__tests__/e2e/patient-flow.spec.ts` | Register → login → upload → chat → logout |
| `__tests__/e2e/admin-flow.spec.ts` | Login → view patients → view details |
| `__tests__/e2e/security.spec.ts` | IDOR check, role escalation, brute force |
| `__tests__/e2e/accessibility.spec.ts` | axe-core scan on all pages |

### 12.5 Accessibility Implementation

| File | A11y Addition |
|------|--------------|
| `src/components/shared/skip-nav.tsx` | "Skip to main content" link |
| `src/app/layout.tsx` | `<SkipNav />` at top of body |
| `src/app/globals.css` | Focus-visible styles, reduced motion query |
| All interactive components | `aria-label`, `role`, `tabIndex` |
| Chat messages container | `role="log"`, `aria-live="polite"` |

### 12.6 GitHub Actions CI/CD

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | Full CI pipeline on push/PR |

Pipeline stages:
1. **Lint & Type Check** → `npm run lint && npm run build`
2. **Unit Tests** → `npm run test`
3. **E2E Tests** → `npx playwright test`
4. **Security Audit** → `npm audit`
5. **Deploy** → Vercel (main branch only)

### 12.7 Test Scripts (package.json)

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:a11y": "playwright test __tests__/e2e/accessibility.spec.ts",
    "test:all": "vitest run && playwright test"
  }
}
```

### 12.8 Verification Checklist

- [ ] `npm run test` — all unit + integration tests pass
- [ ] `npm run test:e2e` — all E2E scenarios pass
- [ ] `npm run test:a11y` — zero axe-core violations
- [ ] GitHub Actions pipeline runs on push/PR
- [ ] All pages keyboard-navigable
- [ ] Screen reader announces chat messages
- [ ] Color contrast passes WCAG 2.1 AA
- [ ] `prefers-reduced-motion` disables animations

---

## 13. Phase 12 — Polish & Hardening

### 13.1 Theme & Dark Mode

| File | Change |
|------|--------|
| `src/app/layout.tsx` | Wrap with `ThemeProvider` from `next-themes` |
| `src/components/shared/theme-toggle.tsx` | Sun/Moon toggle button |
| `src/app/globals.css` | CSS variables for light and dark themes |

### 13.2 Loading States

Every page that fetches data should have:
- **Skeleton loader** while data is loading
- **Error state** if fetch fails
- **Empty state** if no data exists

Files to add/update:
| File | Change |
|------|--------|
| `src/components/shared/loading-spinner.tsx` | Animated spinner |
| `src/app/(admin)/dashboard/loading.tsx` | Admin dashboard skeleton |
| `src/app/(admin)/patients/loading.tsx` | Patient list skeleton |
| `src/app/(patient)/dashboard/loading.tsx` | Patient dashboard skeleton |
| `src/app/(patient)/reports/loading.tsx` | Reports skeleton |
| `src/app/(patient)/chat/loading.tsx` | Chat list skeleton |

### 13.3 Toast Notifications

Use shadcn/ui toast for:
- ✅ "Report uploaded successfully"
- ✅ "Profile updated"
- ✅ "Report processing complete"
- ✅ "Data export ready"
- ✅ "Account deletion scheduled"
- ❌ "Upload failed. Please try again."
- ❌ "Failed to send message"
- ⚠️ "Report is still processing. Please wait."

### 13.4 Form Validation (Zod Schemas)

```typescript
// Example: Registration form validation
import { z } from 'zod'

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().optional(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the Terms of Service' }) }),
  acceptDataProcessing: z.literal(true, { errorMap: () => ({ message: 'You must consent to data processing' }) }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
```

### 13.5 Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| < 768px (mobile) | Sidebar hidden (hamburger menu), single column |
| 768-1024px (tablet) | Sidebar collapsed (icons only), responsive grid |
| > 1024px (desktop) | Full sidebar, multi-column layout |

### 13.6 Error Boundaries

| File | Purpose |
|------|---------|
| `src/app/error.tsx` | Global error page |
| `src/app/not-found.tsx` | 404 page |
| `src/app/(admin)/error.tsx` | Admin error boundary |
| `src/app/(patient)/error.tsx` | Patient error boundary |

### 13.7 Final Verification Checklist

- [ ] Dark/light mode toggles correctly and persists
- [ ] All pages have loading skeletons
- [ ] All forms validate with clear error messages
- [ ] Toast notifications appear for all user actions
- [ ] Responsive layout works on mobile, tablet, desktop
- [ ] Error boundaries catch and display errors gracefully
- [ ] 404 page renders for invalid routes
- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] All audit log entries created correctly
- [ ] All email notifications sent
- [ ] Account deletion/recovery flow works end-to-end
- [ ] Data export ZIP downloads correctly
- [ ] Legal pages accessible from registration + footer
- [ ] Cookie consent banner shows and persists choice
- [ ] Skip navigation link works
- [ ] All tests pass (`npm run test:all`)
- [ ] CI/CD pipeline green on main branch
- [ ] `npm audit` — zero vulnerabilities

---

## 10. Environment Variables

### Required Variables

```env
# ─── Supabase ────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...                       # Public anon key
SUPABASE_SERVICE_ROLE_KEY=eyJ...                            # Private service role key

# ─── AI Provider (Choose ONE) ────────────────────────
# Option A: OpenAI
OPENAI_API_KEY=sk-...

# Option B: Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=AIza...

# ─── App Config ──────────────────────────────────────
NEXT_PUBLIC_APP_NAME=MedicBot
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Security Rules

| Variable | Where Used | Exposure |
|----------|-----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Public (safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Public (safe — RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server ONLY | ⚠️ NEVER expose to client |
| `OPENAI_API_KEY` | Server ONLY | ⚠️ NEVER expose to client |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Server ONLY | ⚠️ NEVER expose to client |

---

## 11. Database Migrations (SQL)

### Migration 001: Enable pgvector

```sql
-- 001_enable_pgvector.sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Migration 002: Create profiles table

```sql
-- 002_create_profiles.sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('admin', 'patient')),
  phone TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth DATE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role, phone, gender, date_of_birth)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'gender',
    (NEW.raw_user_meta_data->>'date_of_birth')::DATE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Migration 003: Create documents table

```sql
-- 003_create_documents.sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'pdf' CHECK (file_type IN ('pdf', 'image', 'text')),
  file_size BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}',
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_documents_patient_id ON documents(patient_id);
CREATE INDEX idx_documents_status ON documents(status);
```

### Migration 004: Create document chunks table

```sql
-- 004_create_chunks.sql
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  chunk_index INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_chunks_patient_id ON document_chunks(patient_id);

-- HNSW index for fast similarity search
CREATE INDEX idx_chunks_embedding ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### Migration 005: Create chat tables

```sql
-- 005_create_chat.sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_patient_id ON chat_sessions(patient_id);
CREATE INDEX idx_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_messages_patient_id ON chat_messages(patient_id);

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Migration 006: Row Level Security

```sql
-- 006_create_rls.sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- === PROFILES ===
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- === DOCUMENTS ===
CREATE POLICY "Patients can view own documents"
  ON documents FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Admins can view all documents"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Patients can insert own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can delete own documents"
  ON documents FOR DELETE
  USING (auth.uid() = patient_id);

-- === DOCUMENT_CHUNKS ===
CREATE POLICY "Patients can view own chunks"
  ON document_chunks FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Admins can view all chunks"
  ON document_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service can insert chunks"
  ON document_chunks FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- === CHAT_SESSIONS ===
CREATE POLICY "Patients can CRUD own sessions"
  ON chat_sessions FOR ALL
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- === CHAT_MESSAGES ===
CREATE POLICY "Patients can CRUD own messages"
  ON chat_messages FOR ALL
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);
```

### Migration 007: Storage policies

```sql
-- 007_create_storage.sql
-- Run via Supabase Dashboard or CLI

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-reports', 'medical-reports', false);

-- Patients can upload to their own folder
CREATE POLICY "Patients upload own reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'medical-reports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Patients can read their own files
CREATE POLICY "Patients read own reports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-reports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Patients can delete their own files
CREATE POLICY "Patients delete own reports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'medical-reports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can read all files
CREATE POLICY "Admins read all reports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-reports'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Migration 008: Vector search function

```sql
-- 008_create_functions.sql
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter_patient_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE
    (filter_patient_id IS NULL OR dc.patient_id = filter_patient_id)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 12. Deployment Checklist

### Pre-Deployment

- [ ] All environment variables set in production
- [ ] Supabase project on a paid plan (for RLS + pgvector)
- [ ] All migrations applied to production database
- [ ] HNSW index created on `document_chunks.embedding`
- [ ] Storage bucket created with correct policies
- [ ] Admin user seeded in production
- [ ] `npm run build` passes with zero errors
- [ ] `npm run lint` passes with zero warnings

### Hosting Options

| Platform | Recommended | Notes |
|---------|------------|-------|
| **Vercel** | ✅ Best for Next.js | Native Next.js support, edge functions, free tier |
| Netlify | Good alternative | Requires adapter for App Router |
| Railway | Good for full-stack | Good DX, easy env management |
| Self-hosted | If required | Use Docker + `next start` |

### Production Environment Variables

Set in your hosting platform's dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_NAME=MedicBot
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

> **Follow this guide phase by phase. Complete each phase's verification checklist before moving to the next. Reference ARCHITECTURE.md for design decisions and IMPLEMENTATION.md (this file) for code details.**
