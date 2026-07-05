# MedicBot — Architecture Document

> A RAG-based medical chatbot that reads patient-uploaded medical reports and answers questions using AI-powered retrieval and generation.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Feature List — Complete](#3-feature-list--complete)
4. [Application Modules](#4-application-modules)
5. [Database Architecture](#5-database-architecture)
6. [Storage Architecture](#6-storage-architecture)
7. [RAG Pipeline Architecture](#7-rag-pipeline-architecture)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [API Architecture](#9-api-architecture)
10. [Frontend Architecture](#10-frontend-architecture)
11. [UI Performance & Smoothness Strategy](#11-ui-performance--smoothness-strategy)
12. [Cookie & Session Management](#12-cookie--session-management)
13. [Offline Access & Local Data Strategy](#13-offline-access--local-data-strategy)
14. [Security Architecture](#14-security-architecture)
15. [Audit Trail & Compliance](#15-audit-trail--compliance)
16. [Error Logging & Monitoring](#16-error-logging--monitoring)
17. [Email & Notification System](#17-email--notification-system)
18. [Testing Strategy](#18-testing-strategy)
19. [CI/CD Pipeline](#19-cicd-pipeline)
20. [Accessibility (WCAG 2.1 AA)](#20-accessibility-wcag-21-aa)
21. [Account Management — Deletion, Recovery & Data Export](#21-account-management--deletion-recovery--data-export)
22. [Legal Pages](#22-legal-pages)
23. [Project Folder Structure](#23-project-folder-structure)

---

## 1. System Overview

MedicBot is a full-stack web application with three core modules:

| Module | Description |
|--------|-------------|
| **Auth System** | Supabase-based login/register with role-based access (admin vs patient) |
| **Admin Panel** | Dashboard for admins to view all registered patients and their uploaded reports |
| **Patient Portal** | Dashboard where patients upload medical reports and chat with an AI bot that answers questions based on their report data |

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 15)                   │
│                                                             │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │ Auth      │   │ Admin Panel  │   │ Patient Portal   │    │
│  │ Module    │   │              │   │                  │    │
│  │           │   │ - Dashboard  │   │ - Dashboard      │    │
│  │ - Login   │   │ - Patients   │   │ - Upload Reports │    │
│  │ - Register│   │   List       │   │ - View Reports   │    │
│  │ - Logout  │   │ - Patient    │   │ - Chat with Bot  │    │
│  │           │   │   Detail     │   │ - Profile        │    │
│  └──────────┘   └──────────────┘   └──────────────────┘    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                  MIDDLEWARE (Route Protection)               │
│         Session validation + Role-based redirects            │
├─────────────────────────────────────────────────────────────┤
│                  BACKEND (Next.js API Routes)                │
│                                                             │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │ Auth API  │   │ Document API │   │ Chat API (RAG)   │    │
│  │           │   │              │   │                  │    │
│  │ - Callback│   │ - Upload     │   │ - Send message   │    │
│  │ - Session │   │ - Process    │   │ - Stream response│    │
│  │           │   │ - List/Delete│   │ - Session CRUD   │    │
│  └──────────┘   └──────────────┘   └──────────────────┘    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                  RAG ENGINE (Server-side)                    │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Parser   │ │ Chunker  │ │ Embedder │ │ Retriever +   │  │
│  │ (PDF →   │ │ (Text →  │ │ (Chunks →│ │ Generator     │  │
│  │  Text)   │ │  Chunks) │ │ Vectors) │ │ (Search+LLM)  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    SUPABASE (Backend-as-a-Service)           │
│                                                             │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │ Auth     │   │ PostgreSQL   │   │ Storage          │    │
│  │          │   │ + pgvector   │   │ (File Buckets)   │    │
│  │ - Users  │   │              │   │                  │    │
│  │ - Sessions│  │ - profiles   │   │ - medical-reports│    │
│  │ - JWT    │   │ - documents  │   │   bucket         │    │
│  │          │   │ - chunks     │   │                  │    │
│  │          │   │ - chat_*     │   │                  │    │
│  └──────────┘   └──────────────┘   └──────────────────┘    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    EXTERNAL SERVICES                         │
│                                                             │
│  ┌─────────────────────┐   ┌─────────────────────────┐     │
│  │ Embedding API       │   │ LLM API                 │     │
│  │ (text → vector)     │   │ (context + query → ans) │     │
│  └─────────────────────┘   └─────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### Core Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 15+ | Full-stack React framework (App Router) |
| Language | TypeScript | 5.x | Type safety across the codebase |
| Runtime | Node.js | 20+ | Server-side execution |

### Backend Services (Supabase)

| Service | Technology | Purpose |
|---------|-----------|---------|
| Authentication | Supabase Auth | Email/password auth, session management, JWT |
| Database | PostgreSQL 15+ | Relational data storage |
| Vector DB | pgvector extension | Vector embeddings storage & similarity search |
| File Storage | Supabase Storage | Medical report file storage (PDFs, images) |
| Security | Row Level Security | Per-row access control at database level |

### AI / RAG

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Embeddings | OpenAI `text-embedding-3-small` OR Gemini | Convert text to 1536-dim vectors |
| LLM | OpenAI GPT-4o OR Google Gemini | Generate answers from retrieved context |
| PDF Parsing | `pdf-parse` library | Extract text content from PDF files |
| Text Chunking | Custom semantic chunker | Split documents into meaningful chunks |

### Frontend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| UI Components | shadcn/ui | Pre-built accessible components |
| Styling | Tailwind CSS v4 | Utility-first CSS framework |
| Icons | Lucide React | Consistent icon set |
| Forms | React Hook Form + Zod | Form handling and validation |
| State | React hooks + Context | Client-side state management |
| Streaming | Vercel AI SDK | LLM response streaming |

---

## 3. Feature List — Complete

### 3.1 Authentication Module

| # | Feature | Description | User |
|---|---------|-------------|------|
| F-AUTH-01 | Patient Registration | New patients register with email, password, full name, phone, gender, DOB | Patient |
| F-AUTH-02 | Patient Login | Patients log in with email + password | Patient |
| F-AUTH-03 | Admin Login | Admins log in with email + password (same login page, role detected) | Admin |
| F-AUTH-04 | Role-Based Redirect | After login, admins go to `/admin/dashboard`, patients to `/patient/dashboard` | Both |
| F-AUTH-05 | Route Protection | Unauthorized users are redirected to login; wrong-role users are redirected to their correct dashboard | Both |
| F-AUTH-06 | Session Persistence | Sessions persist across page refreshes using cookie-based auth | Both |
| F-AUTH-07 | Logout | Users can log out, clearing session and redirecting to login | Both |
| F-AUTH-08 | Password Reset | Patients can request a password reset via email | Patient |
| F-AUTH-09 | Admin Seed Script | CLI script to create the first admin account (no admin registration UI) | System |

### 3.2 Admin Panel

| # | Feature | Description |
|---|---------|-------------|
| F-ADMIN-01 | Admin Dashboard | Overview page with stat cards: total patients, total documents, total chats, recent activity |
| F-ADMIN-02 | Patient Listing | Paginated, searchable table of all registered patients with columns: name, email, phone, registration date, document count |
| F-ADMIN-03 | Patient Search & Filter | Search patients by name or email; filter by registration date range |
| F-ADMIN-04 | Patient Detail View | View individual patient profile: personal info, list of uploaded documents, document status |
| F-ADMIN-05 | View Patient Documents | Admin can see list of documents a patient has uploaded (file name, type, upload date, processing status) |
| F-ADMIN-06 | Admin Sidebar Navigation | Collapsible sidebar with links: Dashboard, Patients, Settings |
| F-ADMIN-07 | Admin Profile | Admin can view/edit their own profile information |
| F-ADMIN-08 | Empty States | All listing pages show meaningful empty states when no data exists |
| F-ADMIN-09 | Responsive Layout | Admin panel works on desktop and tablet screen sizes |
| F-ADMIN-10 | Dark Mode | Toggle between light and dark themes |

### 3.3 Patient Portal

| # | Feature | Description |
|---|---------|-------------|
| F-PAT-01 | Patient Dashboard | Welcome page with quick stats: total reports uploaded, total chats, recent activity |
| F-PAT-02 | Upload Medical Report | Drag-and-drop file upload zone supporting PDF files |
| F-PAT-03 | Upload Progress | Real-time progress indicator during file upload |
| F-PAT-04 | Document Processing Status | After upload, show processing status: pending → processing → completed / failed |
| F-PAT-05 | Document List | View all uploaded documents with status badges, file name, upload date, file size |
| F-PAT-06 | Delete Document | Patient can delete their own uploaded documents (cascades to chunks) |
| F-PAT-07 | Start New Chat | Create a new chat session to ask questions about their medical reports |
| F-PAT-08 | Chat Interface | Full-featured chat UI with message bubbles, timestamps, and typing indicator |
| F-PAT-09 | AI-Powered Answers | Bot answers questions using RAG — retrieves relevant chunks from patient's own documents |
| F-PAT-10 | Streaming Responses | AI responses stream in real-time (token by token) for better UX |
| F-PAT-11 | Source Attribution | Each AI response shows which document/page the information was retrieved from |
| F-PAT-12 | Chat History | View list of past chat sessions; click to resume any session |
| F-PAT-13 | Auto-Generated Chat Titles | Chat sessions get auto-titled based on the first question asked |
| F-PAT-14 | Delete Chat Session | Patient can delete their own chat sessions |
| F-PAT-15 | Patient Profile | View and edit personal information (name, phone, gender, DOB) |
| F-PAT-16 | Patient Sidebar Navigation | Collapsible sidebar with links: Dashboard, Reports, Chat, Profile |
| F-PAT-17 | Empty States | All pages show meaningful empty states when no data exists |
| F-PAT-18 | Responsive Layout | Patient portal works on desktop, tablet, and mobile |
| F-PAT-19 | Dark Mode | Toggle between light and dark themes |

### 3.4 RAG Engine (Backend)

| # | Feature | Description |
|---|---------|-------------|
| F-RAG-01 | PDF Text Extraction | Extract raw text from uploaded PDF medical reports |
| F-RAG-02 | Semantic Text Chunking | Split extracted text into meaningful chunks (500-800 tokens) with overlap |
| F-RAG-03 | Embedding Generation | Convert text chunks into 1536-dimensional vectors using embedding API |
| F-RAG-04 | Vector Storage | Store embeddings in PostgreSQL using pgvector extension |
| F-RAG-05 | HNSW Indexing | Create HNSW index on vector column for fast approximate nearest neighbor search |
| F-RAG-06 | Similarity Search | Query pgvector using cosine distance to find top-K relevant chunks for a user question |
| F-RAG-07 | Context Augmentation | Inject retrieved chunks into LLM system prompt as context |
| F-RAG-08 | Medical System Prompt | Specialized system prompt instructing LLM to act as a medical report assistant |
| F-RAG-09 | Patient-Scoped Retrieval | Similarity search is always filtered to the current patient's documents only |
| F-RAG-10 | Chunk Metadata | Store page number, section, and document reference with each chunk |
| F-RAG-11 | Error Handling | Graceful handling of parsing failures, API errors, and empty results |
| F-RAG-12 | Processing Queue | Documents are processed asynchronously; status updates reflected in UI |

### 3.5 Cross-Cutting Features

| # | Feature | Description |
|---|---------|-------------|
| F-CC-01 | Dark/Light Theme | System-wide theme toggle with preference persistence |
| F-CC-02 | Toast Notifications | Success/error/info toast messages for user actions |
| F-CC-03 | Loading Skeletons | Skeleton loaders for all data-fetching states |
| F-CC-04 | Form Validation | Client + server side validation with clear error messages |
| F-CC-05 | Error Boundaries | Graceful error pages for unexpected failures |
| F-CC-06 | Responsive Design | Mobile-first responsive design across all pages |
| F-CC-07 | SEO Metadata | Proper title, description, and semantic HTML on all pages |
| F-CC-08 | TypeScript Strict Mode | Full type safety with Supabase generated types |

### 3.6 Audit & Compliance

| # | Feature | Description |
|---|---------|-------------|
| F-AUD-01 | Audit Logging | Every data access/modification logged with user ID, action, target, timestamp |
| F-AUD-02 | Login Audit | Track all login attempts (success + failure) with IP and user agent |
| F-AUD-03 | Document Access Log | Log every time a document or chunk is viewed/retrieved |
| F-AUD-04 | Admin Activity Log | All admin actions on patient data are logged |
| F-AUD-05 | Audit Dashboard (Admin) | Admin can view audit logs filtered by user, action, date range |

### 3.7 Notifications

| # | Feature | Description |
|---|---------|-------------|
| F-NOT-01 | Report Processed | Email notification when document processing completes |
| F-NOT-02 | Report Failed | Email notification when document processing fails |
| F-NOT-03 | Welcome Email | Email sent to patient after registration |
| F-NOT-04 | In-App Notifications | Bell icon with unread notification count + dropdown list |
| F-NOT-05 | Password Reset Email | Supabase-handled password reset flow via email |

### 3.8 Account Management

| # | Feature | Description |
|---|---------|-------------|
| F-ACC-01 | Delete Account | Patient can request account deletion from profile settings |
| F-ACC-02 | Soft Delete | Account data moved to `deleted_accounts` table (not permanently erased) |
| F-ACC-03 | Recovery Period | 30-day recovery window before permanent deletion |
| F-ACC-04 | Account Recovery | Patient can contact admin to restore within recovery window |
| F-ACC-05 | Data Export | Patient can download all their data as a ZIP (reports + chat history + profile) |
| F-ACC-06 | Permanent Purge | After 30 days, a scheduled job permanently erases all deleted data |

### 3.9 Legal Pages

| # | Feature | Description |
|---|---------|-------------|
| F-LEG-01 | Terms of Service | Static page with terms; checkbox required at registration |
| F-LEG-02 | Privacy Policy | Static page explaining data collection, storage, and usage |
| F-LEG-03 | Cookie Consent | Banner on first visit explaining cookie usage |
| F-LEG-04 | Data Processing Agreement | For medical data handling compliance |

### 3.10 Accessibility

| # | Feature | Description |
|---|---------|-------------|
| F-A11Y-01 | Keyboard Navigation | All interactive elements reachable via Tab/Enter/Escape |
| F-A11Y-02 | Screen Reader Support | ARIA labels on all controls, live regions for chat messages |
| F-A11Y-03 | Color Contrast | WCAG 2.1 AA minimum 4.5:1 contrast ratio for text |
| F-A11Y-04 | Focus Indicators | Visible focus rings on all focusable elements |
| F-A11Y-05 | Skip Navigation | "Skip to main content" link for keyboard users |
| F-A11Y-06 | Alt Text | All images and icons have descriptive alt text |
| F-A11Y-07 | Reduced Motion | Respect `prefers-reduced-motion` media query |

---

## 4. Application Modules

### Module Dependency Diagram

```
┌─────────────────────────────────────────────────┐
│                  PRESENTATION LAYER              │
│                                                  │
│   ┌───────────┐  ┌──────────┐  ┌────────────┐  │
│   │ Auth Pages│  │ Admin    │  │ Patient    │  │
│   │           │  │ Pages    │  │ Pages      │  │
│   └─────┬─────┘  └────┬─────┘  └──────┬─────┘  │
│         │              │               │         │
├─────────┼──────────────┼───────────────┼─────────┤
│         │      COMPONENT LAYER         │         │
│         │              │               │         │
│   ┌─────┴─────┐  ┌────┴─────┐  ┌──────┴─────┐  │
│   │ Auth      │  │ Admin    │  │ Patient    │  │
│   │ Components│  │ Components│ │ Components │  │
│   └─────┬─────┘  └────┬─────┘  └──────┬─────┘  │
│         │              │               │         │
│         └──────────────┼───────────────┘         │
│                        │                         │
│              ┌─────────┴──────────┐              │
│              │  Shared UI (shadcn)│              │
│              └─────────┬──────────┘              │
│                        │                         │
├────────────────────────┼─────────────────────────┤
│                  SERVICE LAYER                   │
│                        │                         │
│   ┌──────────┐  ┌──────┴──────┐  ┌───────────┐  │
│   │ Auth     │  │ Document   │  │ RAG       │  │
│   │ Service  │  │ Service    │  │ Engine    │  │
│   └────┬─────┘  └──────┬─────┘  └─────┬─────┘  │
│        │               │              │          │
├────────┼───────────────┼──────────────┼──────────┤
│                  DATA LAYER                      │
│        │               │              │          │
│   ┌────┴─────┐  ┌──────┴──────┐  ┌───┴───────┐  │
│   │ Supabase │  │ Supabase   │  │ pgvector  │  │
│   │ Auth     │  │ Storage    │  │ + LLM API │  │
│   └──────────┘  └─────────────┘  └───────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 5. Database Architecture

### Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        auth.users                               │
│                    (Supabase managed)                            │
│  id (uuid PK) | email | encrypted_password | created_at        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 1:1 (trigger on signup)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         profiles                                │
│  id (uuid PK, FK → auth.users.id)                              │
│  full_name (text, NOT NULL)                                     │
│  email (text, NOT NULL)                                         │
│  role (text, NOT NULL, CHECK: 'admin' | 'patient')             │
│  phone (text, NULLABLE)                                         │
│  gender (text, NULLABLE, CHECK: 'male' | 'female' | 'other')  │
│  date_of_birth (date, NULLABLE)                                │
│  avatar_url (text, NULLABLE)                                    │
│  created_at (timestamptz, DEFAULT now())                       │
│  updated_at (timestamptz, DEFAULT now())                       │
└────────┬──────────────────────────┬─────────────────────────────┘
         │ 1:N                      │ 1:N
         ▼                          ▼
┌────────────────────┐    ┌──────────────────────┐
│     documents      │    │   chat_sessions      │
│                    │    │                      │
│  id (uuid PK)     │    │  id (uuid PK)        │
│  patient_id (FK)  │    │  patient_id (FK)     │
│  file_name (text) │    │  title (text)        │
│  file_path (text) │    │  created_at          │
│  file_type (text) │    │  updated_at          │
│  file_size (bigint)│   └──────────┬───────────┘
│  status (text)    │               │ 1:N
│  metadata (jsonb) │               ▼
│  uploaded_at      │    ┌──────────────────────┐
│  processed_at     │    │   chat_messages      │
└────────┬──────────┘    │                      │
         │ 1:N           │  id (uuid PK)        │
         ▼               │  session_id (FK)     │
┌────────────────────┐   │  patient_id (FK)     │
│  document_chunks   │   │  role (text)         │
│                    │   │  content (text)      │
│  id (uuid PK)     │   │  sources (jsonb)     │
│  document_id (FK) │   │  created_at          │
│  patient_id (FK)  │   └──────────────────────┘
│  content (text)   │
│  embedding        │
│    (vector 1536)  │
│  chunk_index (int)│
│  metadata (jsonb) │
│  created_at       │
└────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                       audit_logs                            │
│                                                             │
│  id (uuid PK)                                               │
│  user_id (uuid FK → auth.users, NULLABLE for system)       │
│  action (text NOT NULL)  e.g. 'view', 'create', 'delete'   │
│  target_table (text)     e.g. 'documents', 'chat_messages' │
│  target_id (uuid, NULLABLE)                                │
│  details (jsonb)         Additional context / changes       │
│  ip_address (text, NULLABLE)                               │
│  user_agent (text, NULLABLE)                               │
│  created_at (timestamptz, DEFAULT now())                   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    deleted_accounts                          │
│                                                             │
│  id (uuid PK)                                               │
│  original_user_id (uuid NOT NULL)                          │
│  email (text NOT NULL)                                      │
│  full_name (text)                                           │
│  profile_data (jsonb)    Snapshot of profiles row           │
│  documents_data (jsonb)  Snapshot of documents metadata     │
│  chat_data (jsonb)       Snapshot of chat sessions/messages │
│  storage_paths (jsonb)   List of storage file paths         │
│  deleted_at (timestamptz, DEFAULT now())                    │
│  expires_at (timestamptz) deleted_at + 30 days             │
│  status (text) CHECK: 'pending' | 'recoverable' | 'purged' │
│  recovered_at (timestamptz, NULLABLE)                      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                     notifications                           │
│                                                             │
│  id (uuid PK)                                               │
│  user_id (uuid FK → profiles.id)                           │
│  type (text) CHECK: 'report_processed' | 'report_failed'   │
│             | 'welcome' | 'account_deletion' | 'system'    │
│  title (text NOT NULL)                                      │
│  message (text NOT NULL)                                    │
│  read (boolean DEFAULT false)                              │
│  metadata (jsonb)        e.g. { document_id: '...' }       │
│  created_at (timestamptz, DEFAULT now())                   │
└──────────────────────────────────────────────────────────────┘
```

### Table Details

#### `profiles`
- Created automatically via a Postgres trigger when a user signs up in `auth.users`
- `role` determines access level (`admin` or `patient`)
- Admins are seeded via CLI script; patients register through the UI

#### `documents`
- Each row represents one uploaded medical report file
- `file_path` points to the file in Supabase Storage
- `status` tracks the processing pipeline: `pending` → `processing` → `completed` | `failed`
- `metadata` stores extracted info like page count, report type, date

#### `document_chunks`
- Each document is split into multiple chunks for RAG
- `content` holds the raw text of the chunk
- `embedding` is a 1536-dimensional vector (pgvector type)
- `chunk_index` preserves the original order within the document
- `metadata` includes page number, section heading, and character offset
- An **HNSW index** is created on the `embedding` column for fast similarity search

#### `chat_sessions`
- Groups messages into conversations
- `title` is auto-generated from the first user message

#### `chat_messages`
- Individual messages in a chat session
- `role` is either `user` or `assistant`
- `sources` (jsonb) contains references to the chunk IDs used to generate the response

#### `audit_logs`
- Immutable append-only table — no UPDATE or DELETE allowed
- Tracks every significant action: login, data access, document upload, chat query, admin actions
- `action` values: `login`, `logout`, `login_failed`, `view_document`, `upload_document`, `delete_document`, `chat_query`, `export_data`, `delete_account`, `admin_view_patient`
- `details` jsonb stores context (e.g., which document was viewed, search query used)
- RLS: patients can read only their own logs; admins can read all logs

#### `deleted_accounts`
- When a patient deletes their account, all their data is snapshotted here
- `profile_data`: full copy of their profiles row as JSON
- `documents_data`: array of document metadata (not file contents — those stay in storage for 30 days)
- `chat_data`: array of chat sessions with messages
- `storage_paths`: list of Supabase Storage paths (for cleanup after 30 days)
- `status`: `recoverable` (within 30 days) → `purged` (after permanent deletion)
- Recovery: admin restores from this snapshot back into the live tables
- A scheduled Supabase Edge Function runs daily to purge expired accounts

#### `notifications`
- In-app notification system for patient portal
- `type` determines the icon and routing behavior when clicked
- `read` flag drives the unread badge count
- Email notifications are sent in parallel via Supabase Edge Functions (not stored here)

---

## 6. Storage Architecture

### Supabase Storage Bucket

```
medical-reports/                    ← Bucket name
└── {patient_id}/                   ← Folder per patient
    ├── {uuid}_report1.pdf
    ├── {uuid}_report2.pdf
    └── ...
```

### Storage Policies
- **Upload**: Only authenticated patients can upload to their own folder (`{patient_id}/*`)
- **Read**: Patients can read only their own files; admins can read all files
- **Delete**: Patients can delete only their own files; admins cannot delete

---

## 7. RAG Pipeline Architecture

### Document Ingestion Pipeline

```
PDF Upload
    │
    ▼
┌──────────────────┐
│  1. FILE STORAGE │  Store original PDF in Supabase Storage
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  2. TEXT EXTRACT │  pdf-parse extracts raw text from PDF
│                  │  Preserves page boundaries and structure
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  3. CHUNKING     │  Semantic chunking by paragraphs/sections
│                  │  Target: 500-800 tokens per chunk
│                  │  Overlap: 50-100 tokens between chunks
│                  │  Tables kept as single units
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  4. EMBEDDING    │  Each chunk → Embedding API → 1536-dim vector
│                  │  Batch processing for efficiency
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  5. STORAGE      │  INSERT INTO document_chunks
│                  │  (content, embedding, metadata, patient_id)
└──────────────────┘
```

### Query / Chat Pipeline

```
User Question: "What was my cholesterol level?"
    │
    ▼
┌──────────────────┐
│  1. EMBED QUERY  │  Convert question → 1536-dim vector
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  2. RETRIEVE     │  pgvector cosine similarity search
│                  │  Filter: patient_id = current user
│                  │  Return: Top 5 most similar chunks
│                  │  SQL: embedding <=> query_vector
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  3. AUGMENT      │  Build LLM prompt:
│                  │  - System: "You are a medical report assistant..."
│                  │  - Context: [Top 5 retrieved chunks]
│                  │  - User: "What was my cholesterol level?"
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  4. GENERATE     │  Send to LLM API (GPT-4o / Gemini)
│                  │  Stream response token-by-token
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  5. RESPOND      │  Stream to frontend + save to chat_messages
│                  │  Include source chunk references
└──────────────────┘
```

### Medical System Prompt (Template)

```
You are a helpful medical report assistant. Your role is to answer
patient questions STRICTLY based on the medical report data provided
in the context below.

RULES:
1. Only answer using information from the provided context.
2. If the context does not contain the answer, say "I could not find
   this information in your uploaded reports."
3. Never make up medical information or provide diagnoses.
4. Always cite which report/section your answer comes from.
5. Use clear, patient-friendly language.
6. If a value is abnormal, mention the normal range for reference.

CONTEXT FROM PATIENT REPORTS:
{retrieved_chunks}

PATIENT QUESTION:
{user_question}
```

---

## 8. Authentication & Authorization

### Auth Flow

```
                    ┌──────────────┐
                    │  Landing     │
                    │  Page        │
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │  Login Page  │
                    │  (Unified)   │
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │  Supabase    │
                    │  Auth        │
                    └──────┬───────┘
                           │
                  ┌────────┴────────┐
                  │                 │
           ┌──────┴──────┐  ┌──────┴──────┐
           │ role=admin  │  │ role=patient│
           └──────┬──────┘  └──────┬──────┘
                  │                │
           ┌──────┴──────┐  ┌──────┴──────┐
           │ /admin/     │  │ /patient/   │
           │ dashboard   │  │ dashboard   │
           └─────────────┘  └─────────────┘
```

### Middleware Protection Logic

```
Request → middleware.ts
    │
    ├─ Is public route? (/login, /register, /) → ALLOW
    │
    ├─ Has valid session?
    │   ├─ NO → Redirect to /login
    │   └─ YES → Check role
    │       ├─ Route starts with /admin?
    │       │   ├─ role === 'admin' → ALLOW
    │       │   └─ role !== 'admin' → Redirect to /patient/dashboard
    │       │
    │       └─ Route starts with /patient?
    │           ├─ role === 'patient' → ALLOW
    │           └─ role !== 'patient' → Redirect to /admin/dashboard
    │
    └─ ALLOW (fallback for unprotected routes)
```

---

## 9. API Architecture

### API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/callback` | Handle Supabase auth callback | Public |
| POST | `/api/documents/upload` | Upload a medical report | Patient |
| POST | `/api/documents/process` | Parse, chunk, embed a document | System |
| GET | `/api/documents` | List patient's documents | Patient |
| DELETE | `/api/documents/[id]` | Delete a document + chunks | Patient |
| POST | `/api/chat` | Send message + get RAG response (streamed) | Patient |
| GET | `/api/chat/sessions` | List patient's chat sessions | Patient |
| DELETE | `/api/chat/sessions/[id]` | Delete a chat session | Patient |
| GET | `/api/admin/patients` | List all patients (paginated) | Admin |
| GET | `/api/admin/patients/[id]` | Get patient detail + documents | Admin |
| GET | `/api/admin/stats` | Get dashboard statistics | Admin |

---

## 10. Frontend Architecture

### Page Map

```
/                           → Landing page (public)
/login                      → Login page (public)
/register                   → Patient registration (public)

/admin/dashboard            → Admin overview with stats
/admin/patients             → Patient listing table
/admin/patients/[id]        → Individual patient detail

/patient/dashboard          → Patient welcome + quick stats
/patient/reports            → List of uploaded reports
/patient/reports/upload     → Upload new report
/patient/chat               → Chat session list
/patient/chat/[sessionId]   → Active chat with RAG bot
/patient/profile            → Edit profile information
```

### Layout Hierarchy

```
Root Layout (globals, fonts, theme provider)
│
├── Auth Layout (centered card, gradient background)
│   ├── Login Page
│   └── Register Page
│
├── Admin Layout (sidebar + top bar + main content)
│   ├── Admin Dashboard
│   ├── Patient List
│   └── Patient Detail
│
└── Patient Layout (sidebar + top bar + main content)
    ├── Patient Dashboard
    ├── Reports Page
    ├── Upload Page
    ├── Chat List
    ├── Chat Session
    └── Profile Page
```

---

## 11. UI Performance & Smoothness Strategy

### Core Principles

```
1. Server Components by default → Minimal JavaScript shipped to browser
2. Stream, don't wait          → Instant skeleton, data arrives progressively
3. Animate transforms only     → GPU-accelerated, never triggers layout recalc
4. Lazy load everything heavy  → Code-split animations, components, routes
```

### Performance Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Page transitions | View Transitions API (built into Next.js 15) | GPU-powered route transitions, zero JS overhead |
| Micro-animations | Framer Motion (`LazyMotion` + `m` components) | Hover, enter/exit, sidebar, modal animations |
| Loading states | `loading.tsx` + `<Suspense>` per component | Skeleton screens streamed instantly from server |
| Theme switching | `next-themes` | Instant dark/light toggle with CSS variables |
| Font loading | `next/font` (local or Google) | Zero layout shift, preloaded fonts |
| Images | `next/image` | Lazy load, WebP conversion, responsive sizes |
| Bundle analysis | `@next/bundle-analyzer` | Monitor JS bundle size per route |

### Animation Rules

```
✅ ANIMATE:  transform (x, y, scale, rotate), opacity, filter, clip-path
             → These run on the GPU compositor thread (60fps smooth)

❌ NEVER ANIMATE: width, height, top, left, margin, padding, border
                   → These trigger layout recalculation (jank/stutter)
```

### Skeleton Loading Architecture

Every page that fetches data has a parallel `loading.tsx`:

```
src/app/(patient)/
├── dashboard/
│   ├── page.tsx          ← Real page (fetches data from Supabase)
│   └── loading.tsx       ← Skeleton (rendered INSTANTLY while page loads)
├── reports/
│   ├── page.tsx
│   └── loading.tsx
├── chat/
│   ├── page.tsx
│   └── loading.tsx
│   └── [sessionId]/
│       ├── page.tsx
│       └── loading.tsx
└── profile/
    ├── page.tsx
    └── loading.tsx

src/app/(admin)/
├── dashboard/
│   ├── page.tsx
│   └── loading.tsx
└── patients/
    ├── page.tsx
    └── loading.tsx
    └── [id]/
        ├── page.tsx
        └── loading.tsx
```

### Granular Suspense (Per-Component Streaming)

```
┌─────────────────────────────────────────────────────┐
│  Patient Dashboard                                  │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐  │
│  │ Stats    │ │ Stats    │ │ Stats    │ │ Stats │  │
│  │ Card ✅  │ │ Card ✅  │ │ Card ✅  │ │ Card ✅│  │
│  │ (instant)│ │ (instant)│ │ (instant)│ │       │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────┘  │
│                                                     │
│  ┌─────────────────────┐ ┌────────────────────────┐ │
│  │ Recent Reports      │ │ Recent Chats           │ │
│  │ ░░░░░░░░░░░░░░░░░░  │ │ ░░░░░░░░░░░░░░░░░░░░  │ │
│  │ ░░░░░░░░░░░░░░░░░░  │ │ ░░░░░░░░░░░░░░░░░░░░  │ │
│  │ (loading skeleton)  │ │ (loading skeleton)     │ │
│  │ ← Suspense boundary │ │ ← Suspense boundary   │ │
│  └─────────────────────┘ └────────────────────────┘ │
└─────────────────────────────────────────────────────┘

→ Stats cards load INSTANTLY (server component, no async)
→ Report/Chat lists show skeleton → stream in when DB query completes
→ Each section is independent — one slow query doesn't block others
```

### Dark Mode / Light Mode System

```
                    ┌─────────────────┐
                    │  Theme Provider  │
                    │  (next-themes)   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐
        │  system    │ │  light    │ │  dark     │
        │  (auto)    │ │           │ │           │
        └───────────┘ └───────────┘ └───────────┘

CSS Variables approach (in globals.css):

  :root {                           /* Light mode */
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --primary: 221 83% 53%;
    --muted: 210 40% 96%;
    --border: 214 32% 91%;
    ...
  }

  .dark {                           /* Dark mode */
    --background: 222 47% 11%;
    --foreground: 210 40% 98%;
    --card: 217 33% 17%;
    --primary: 217 91% 60%;
    --muted: 217 33% 17%;
    --border: 217 33% 25%;
    ...
  }

  → Switching theme = changing one CSS class on <html>
  → INSTANT — no re-render, no JS recalculation
  → Preference saved to localStorage (persists across visits)
```

---

## 12. Cookie & Session Management

### ⚠️ What Goes WHERE (Critical Decision)

```
                       COOKIES (4KB limit, sent with EVERY request)
                       ────────────────────────────────────────────
SAFE to store:         ✅ Supabase session tokens (auth JWT)
                       ✅ Theme preference ('dark' | 'light')
                       ✅ Sidebar collapsed state (true/false)
                       ✅ Locale/language preference

NEVER store:           ❌ Patient name, email, phone, DOB
                       ❌ Medical report data or text
                       ❌ Chat message history
                       ❌ Document metadata or chunk content
                       ❌ Any PII (Personally Identifiable Information)
```

### Why NOT Cookies for Patient Data?

| Risk | Explanation |
|------|-------------|
| **Size limit** | Cookies are capped at ~4KB. A single medical report has thousands of characters. |
| **Sent with every request** | Cookie data is attached to EVERY HTTP request — even for images and CSS. This slows down the entire app and exposes data on the wire repeatedly. |
| **Accessible to JavaScript** | Unless `HttpOnly`, cookies are readable by any JS on the page — XSS attack = full data leak. |
| **Shared computer risk** | On a hospital/clinic shared computer, cookies persist after logout unless explicitly cleared. |
| **Violates security protocol** | Storing medical data in cookies contradicts our zero-trust SECURITY.md protocol. |

### Cookie Architecture (What We DO Store)

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER COOKIES                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  sb-access-token     (HttpOnly, Secure, SameSite)   │    │
│  │  → Supabase JWT for authentication                  │    │
│  │  → Managed by @supabase/ssr automatically           │    │
│  │  → Validated server-side with getUser()             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  sb-refresh-token    (HttpOnly, Secure, SameSite)   │    │
│  │  → Refresh token for session renewal                │    │
│  │  → Auto-refreshes expired access tokens             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  theme               (non-HttpOnly, Secure)         │    │
│  │  → 'dark' | 'light' | 'system'                     │    │
│  │  → Read by next-themes for instant theme apply      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  sidebar-collapsed   (non-HttpOnly, Secure)         │    │
│  │  → true | false                                     │    │
│  │  → Remembers sidebar state across sessions          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Total cookie size: ~2KB (well under 4KB limit)            │
└─────────────────────────────────────────────────────────────┘
```

### Session Lifecycle

```
  REGISTER / LOGIN
       │
       ▼
  Supabase Auth → Sets HttpOnly cookies (access + refresh tokens)
       │
       ▼
  middleware.ts → Reads cookies → Validates with getUser()
       │            → Refreshes token if expired (auto)
       │            → Sets role-based redirects
       ▼
  Page loads → Server Component reads session from cookies
       │         → Fetches user-specific data from Supabase
       │         → Streams HTML to browser
       ▼
  Client hydrates → Supabase client reads cookies
       │             → Subscribes to auth state changes
       │             → Auto-refreshes tokens in background
       ▼
  LOGOUT
       │
       ▼
  supabase.auth.signOut() → Clears all auth cookies
       │                     → Clears any localStorage/IndexedDB cache
       ▼
  Redirect to /login
```

### Cookie Security Settings

| Cookie | HttpOnly | Secure | SameSite | Max-Age |
|--------|----------|--------|----------|---------|
| `sb-access-token` | ✅ Yes | ✅ Yes | Lax | 1 hour |
| `sb-refresh-token` | ✅ Yes | ✅ Yes | Lax | 7 days |
| `theme` | ❌ No (JS needs to read) | ✅ Yes | Strict | 1 year |
| `sidebar-collapsed` | ❌ No (JS needs to read) | ✅ Yes | Strict | 1 year |

---

## 13. Offline Access & Local Data Strategy

### Approach: PWA with Encrypted Local Storage

Instead of cookies, we use a **Progressive Web App (PWA)** approach with **encrypted IndexedDB** for offline data access. This gives unlimited storage, encryption at rest, and proper offline support.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      BROWSER                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  SERVICE WORKER (serwist)                           │    │
│  │                                                     │    │
│  │  ┌────────────────┐  ┌────────────────────────┐    │    │
│  │  │ Cache API      │  │ Offline Fallback       │    │    │
│  │  │                │  │                        │    │    │
│  │  │ • App shell    │  │ • /_offline page       │    │    │
│  │  │ • CSS/JS/fonts │  │ • "You're offline"     │    │    │
│  │  │ • Static assets│  │ • Shows cached data    │    │    │
│  │  └────────────────┘  └────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  INDEXEDDB (Encrypted with Web Crypto API)          │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐       │    │
│  │  │ cached_profile                           │       │    │
│  │  │ → Encrypted patient name, basic info     │       │    │
│  │  │ → For offline dashboard display          │       │    │
│  │  └──────────────────────────────────────────┘       │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐       │    │
│  │  │ cached_reports_list                      │       │    │
│  │  │ → Encrypted list of report names/dates   │       │    │
│  │  │ → For offline report browsing            │       │    │
│  │  └──────────────────────────────────────────┘       │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐       │    │
│  │  │ cached_chat_history                      │       │    │
│  │  │ → Encrypted recent chat messages         │       │    │
│  │  │ → For offline chat review                │       │    │
│  │  └──────────────────────────────────────────┘       │    │
│  │                                                     │    │
│  │  🔒 All data encrypted with AES-GCM               │    │
│  │  🔒 Key derived from user session (non-extractable)│    │
│  │  🔒 Cleared on logout                              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  LOCAL STORAGE (Non-sensitive only)                 │    │
│  │                                                     │    │
│  │  • theme preference ('dark' | 'light')             │    │
│  │  • sidebar state (collapsed / expanded)            │    │
│  │  • last visited page (for redirect on return)      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### What's Available Offline vs Online-Only

| Feature | Offline | Online |
|---------|---------|--------|
| View app shell (sidebar, layout) | ✅ | ✅ |
| Dark/light mode toggle | ✅ | ✅ |
| View patient profile (cached) | ✅ | ✅ |
| View report list (cached) | ✅ | ✅ |
| Read past chat messages (cached) | ✅ | ✅ |
| Upload new report | ❌ | ✅ |
| Send new chat message | ❌ (queued) | ✅ |
| Admin panel | ❌ | ✅ |
| Login/Register | ❌ | ✅ |

### Encryption Strategy

```
  Login successful
       │
       ▼
  Derive encryption key from session token
  using Web Crypto API (PBKDF2 → AES-GCM key)
       │
       ▼
  Store key as non-extractable CryptoKey
  (cannot be read by JS, only used for encrypt/decrypt)
       │
       ▼
  On data fetch → Encrypt response → Store in IndexedDB
  On data read  → Read from IndexedDB → Decrypt → Display
       │
       ▼
  On logout → Clear ALL IndexedDB data
             → Delete encryption key
             → Clear Service Worker cache (optional)
```

### Service Worker Caching Strategy

| Resource Type | Strategy | Description |
|--------------|----------|-------------|
| App shell (HTML layout) | Cache First | Instant load, update in background |
| CSS, JS bundles | Cache First | Versioned, immutable files |
| Fonts | Cache First | Rarely change |
| API responses | Network First | Always try fresh data, fallback to cached |
| Images/assets | Stale While Revalidate | Show cached, update in background |
| Auth endpoints | Network Only | Never cache auth requests |

### Offline Fallback Page

When the user is offline AND the requested page isn't cached:

```
┌─────────────────────────────────────────────────┐
│              🔌 You're Offline                  │
│                                                 │
│   It looks like you've lost your internet       │
│   connection. Some features require an          │
│   active connection to work.                    │
│                                                 │
│   Available offline:                            │
│   • View your cached reports list               │
│   • Read past chat conversations                │
│   • View your profile                           │
│                                                 │
│   [Retry Connection]        [View Cached Data]  │
└─────────────────────────────────────────────────┘
```

### PWA Manifest

```json
{
  "name": "MedicBot",
  "short_name": "MedicBot",
  "description": "AI-powered medical report assistant",
  "start_url": "/patient/dashboard",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#3b82f6",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 14. Security Architecture

> **Full security protocol with implementation code is in [SECURITY.md](file:///f:/medic bot/SECURITY.md)**

### Zero-Trust Principle

Every request is assumed hostile. Data is protected by 12 independent defense layers — if any single layer fails, the others still protect patient data.

### 12 Defense Layers

```
Layer 1:  HTTP Security Headers    → CSP, HSTS, X-Frame-Options (next.config.ts)
Layer 2:  Rate Limiting            → Block brute force & abuse (middleware)
Layer 3:  Middleware Route Guard   → Session + role check on every route
Layer 4:  Server-Side Auth         → Re-verify auth in EVERY API route (never trust middleware alone)
Layer 5:  Input Validation         → Zod schemas on ALL user inputs
Layer 6:  XSS Prevention           → DOMPurify + React escaping + CSP
Layer 7:  IDOR Prevention          → Ownership check BEFORE data access
Layer 8:  Row Level Security       → Database enforces per-row access (FORCE RLS on all tables)
Layer 9:  Storage Security         → Private bucket + signed URLs (60s TTL)
Layer 10: File Upload Security     → MIME + magic bytes + size limit + UUID rename
Layer 11: Session Security         → HttpOnly + Secure + SameSite cookies
Layer 12: Data Caching Prevention  → no-store headers on all sensitive routes
```

### Attack Matrix (15 Threat Vectors Covered)

| # | Attack | Severity | Defense |
|---|--------|----------|---------|
| A1 | **IDOR / URL Manipulation** | 🔴 Critical | RLS + ownership check + `notFound()` (not 403) |
| A2 | **Broken Access Control** | 🔴 Critical | Middleware + server re-check + role validation |
| A3 | **XSS (Script Injection)** | 🔴 Critical | CSP headers + DOMPurify + no `dangerouslySetInnerHTML` |
| A4 | **CSRF** | 🟡 High | SameSite cookies + Origin validation |
| A5 | **SQL Injection** | 🔴 Critical | Supabase SDK (parameterized queries) + Zod |
| A6 | **Brute Force Login** | 🟡 High | Rate limiting (5 attempts / 15 min) |
| A7 | **Malicious File Upload** | 🔴 Critical | Magic bytes + MIME check + UUID rename + size limit |
| A8 | **Session Hijacking** | 🟡 High | HttpOnly + Secure + SameSite cookies |
| A9 | **API Key Exposure** | 🔴 Critical | `server-only` package + env separation |
| A10 | **ID Enumeration** | 🟢 Medium | UUIDs (non-sequential) + RLS |
| A11 | **Man-in-the-Middle** | 🔴 Critical | HTTPS everywhere + HSTS |
| A12 | **Clickjacking** | 🟢 Medium | `X-Frame-Options: DENY` + CSP `frame-ancestors` |
| A13 | **Data Cache Leak** | 🟡 High | `Cache-Control: no-store` on all sensitive routes |
| A14 | **Direct Storage Access** | 🔴 Critical | Private bucket + 60-second signed URLs |
| A15 | **Privilege Escalation** | 🔴 Critical | Server-only role assignment + RLS blocks role changes |

### Critical Security Rules

| Rule | Implementation |
|------|---------------|
| Always use `getUser()` | Never `getSession()` — JWT must be validated server-side |
| Auth in every route | Every API route / Server Component calls `requireAuth()` first |
| Return 404 not 403 | `notFound()` for unauthorized resources — don't reveal existence |
| Sanitize all inputs | Zod + DOMPurify before storage/rendering |
| Rename uploaded files | UUID-based paths — never use user-supplied filenames |
| Never cache patient data | `force-dynamic` + `no-store` on all sensitive pages |
| `FORCE ROW LEVEL SECURITY` | RLS applies even to table owner |

### RLS Policy Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| **profiles** | Own row (patient) / All (admin) | Auto (trigger) | Own row only + CANNOT change role | Never |
| **documents** | Own rows (patient) / All (admin) | Own rows only | Own rows only | Own rows only |
| **document_chunks** | Own rows (patient) / All (admin) | Service role only | Never | Cascade from document |
| **chat_sessions** | Own rows only | Own rows only | Own rows only | Own rows only |
| **chat_messages** | Own rows only | Own rows only | Never | Cascade from session |

### Security Packages

| Package | Purpose |
|---------|---------|
| `server-only` | Build error if server code imported in client |
| `isomorphic-dompurify` | Sanitize HTML/XSS in user input |
| `zod` | Schema validation on all inputs |
| `rate-limiter-flexible` | Brute force / abuse prevention |

---

## 15. Audit Trail & Compliance

### What Gets Logged

| Action | Trigger | Details Captured |
|--------|---------|-----------------|
| `login` | Successful login | IP, user agent, timestamp |
| `login_failed` | Failed login attempt | Email attempted, IP, user agent |
| `logout` | User signs out | Session duration |
| `view_document` | Patient/Admin opens a document | document_id |
| `upload_document` | Patient uploads a report | document_id, file_name, file_size |
| `delete_document` | Patient deletes a report | document_id, file_name |
| `chat_query` | Patient sends a chat message | session_id, chunks_retrieved count |
| `export_data` | Patient exports their data | export format, file count |
| `delete_account` | Patient deletes their account | data snapshot size |
| `recover_account` | Admin recovers a deleted account | deleted_account_id |
| `admin_view_patient` | Admin views patient detail | target patient_id |
| `admin_view_logs` | Admin views audit logs | filters applied |

### Audit Log Implementation Pattern

```
  User Action (e.g., view document)
       │
       ▼
  API Route / Server Action
       │
       ├─── 1. Execute the action (fetch document)
       │
       └─── 2. Log the action (async, non-blocking)
                │
                ▼
            INSERT INTO audit_logs (
              user_id, action, target_table,
              target_id, details, ip_address
            )
            → This NEVER blocks the main request
            → Uses service role client (bypasses RLS for write)
```

### Audit Log Security

| Rule | Implementation |
|------|---------------|
| Append-only | No UPDATE or DELETE policies on `audit_logs` table |
| Immutable | Even admins cannot modify or delete audit entries |
| Patient access | Patients can view their own audit logs (RLS filtered) |
| Admin access | Admins can view all audit logs |
| Retention | Logs retained for 2 years minimum |

---

## 16. Error Logging & Monitoring

### Architecture

```
  Browser (Client)                    Server (API Routes)
       │                                    │
       ▼                                    ▼
  ┌──────────┐                      ┌──────────────┐
  │ Sentry   │                      │ Sentry       │
  │ Browser  │                      │ Node SDK     │
  │ SDK      │                      │              │
  │          │                      │ • RAG errors │
  │ • UI err │                      │ • DB errors  │
  │ • Clicks │                      │ • API errors │
  │ • Perf   │                      │ • Upload err │
  └────┬─────┘                      └──────┬───────┘
       │                                   │
       └──────────────┬────────────────────┘
                      ▼
              ┌───────────────┐
              │  Sentry Cloud │
              │               │
              │  • Dashboards │
              │  • Alerts     │
              │  • Traces     │
              │  • Replays    │
              └───────────────┘
```

### What Gets Monitored

| Category | Events | Severity |
|----------|--------|----------|
| RAG Pipeline | Embedding API failure, LLM timeout, empty retrieval | 🔴 Critical |
| File Processing | PDF parse failure, chunk error, storage upload fail | 🔴 Critical |
| Authentication | Login failures spike, session errors | 🟡 Warning |
| Database | Query timeout, connection pool exhaustion | 🔴 Critical |
| Client | JS errors, unhandled rejections, React error boundary | 🟡 Warning |
| Performance | Page load > 3s, API response > 5s, LCP > 2.5s | 🟢 Info |

### Alert Rules

| Alert | Condition | Channel |
|-------|-----------|---------|
| RAG Down | > 3 RAG failures in 5 minutes | Email + Slack |
| High Error Rate | > 10 errors/minute | Email |
| Auth Anomaly | > 20 failed logins from same IP | Email + Slack |
| Storage Full | Supabase storage > 80% capacity | Email |

---

## 17. Email & Notification System

### Architecture

```
  Event occurs (e.g., document processed)
       │
       ├────────────── In-App Notification ──────────────┐
       │                                                 │
       │   INSERT INTO notifications (                   │
       │     user_id, type, title, message               │
       │   )                                              │
       │   → Patient sees bell icon badge                │
       │                                                 │
       ├────────────── Email Notification ───────────────┐
       │                                                 │
       │   Supabase Edge Function OR                     │
       │   Resend API (recommended)                      │
       │   → Sends transactional email                   │
       │                                                 │
       └─────────────────────────────────────────────────┘
```

### Notification Types

| Event | In-App | Email | Template |
|-------|--------|-------|----------|
| Welcome (registration) | ✅ | ✅ | "Welcome to MedicBot!" |
| Report processed | ✅ | ✅ | "Your report {name} is ready" |
| Report failed | ✅ | ✅ | "Report {name} could not be processed" |
| Password reset | ❌ | ✅ | Supabase default |
| Account deletion initiated | ✅ | ✅ | "Your account will be deleted in 30 days" |
| Account recovered | ✅ | ✅ | "Your account has been restored" |

### Email Provider Options

| Provider | Recommendation | Notes |
|---------|---------------|-------|
| **Resend** | ✅ Recommended | Simple API, React email templates, free tier |
| Supabase Edge Functions + SMTP | Alternative | More setup, but no external dependency |
| SendGrid | Enterprise | Overkill for this project |

---

## 18. Testing Strategy

### Testing Pyramid

```
            ┌─────────┐
            │  E2E    │  Playwright (critical user flows)
            │  Tests  │  5-10 tests
            ├─────────┤
            │ Integr. │  API routes + DB (Vitest)
            │ Tests   │  20-30 tests
            ├─────────┤
            │  Unit   │  Utilities, RAG functions (Vitest)
            │  Tests  │  50+ tests
            └─────────┘
```

### What to Test

| Layer | Tool | Tests |
|-------|------|-------|
| **Unit** | Vitest | `chunker.ts` (text splitting), `sanitize.ts` (XSS), `validations.ts` (Zod schemas), `upload-security.ts` (magic bytes) |
| **Integration** | Vitest + Supabase local | API routes (auth, upload, chat), RLS policies, database triggers |
| **E2E** | Playwright | Full user flows: register → login → upload → chat → logout |
| **Accessibility** | axe-core + Playwright | WCAG 2.1 AA compliance checks on all pages |
| **Security** | Manual + scripts | IDOR tests, role escalation, XSS injection, rate limit |

### E2E Test Scenarios (Playwright)

| # | Scenario | Steps |
|---|----------|-------|
| 1 | Patient Registration | Fill form → submit → verify redirect to dashboard |
| 2 | Patient Login/Logout | Login → verify dashboard → logout → verify redirect |
| 3 | Report Upload | Login → upload PDF → verify status → wait for processing |
| 4 | Chat Flow | Login → start chat → send question → verify AI response streams |
| 5 | Admin Patient View | Admin login → view patients list → click patient → verify detail |
| 6 | IDOR Prevention | Login as Patient A → navigate to Patient B's URL → verify 404 |
| 7 | Account Deletion | Login → profile → delete account → verify data moved |
| 8 | Data Export | Login → profile → export data → verify ZIP download |
| 9 | Dark Mode | Toggle theme → verify CSS variables change → refresh → verify persistence |
| 10 | Accessibility | Run axe-core scan on all pages → zero violations |

### Test Commands

```bash
npm run test          # Vitest unit + integration tests
npm run test:e2e      # Playwright E2E tests
npm run test:a11y     # Accessibility audit
npm run test:all      # All tests
```

---

## 19. CI/CD Pipeline

### GitHub Actions Workflow

```
  Push to main / Pull Request
       │
       ▼
  ┌──────────────────────────────┐
  │  1. Lint & Type Check        │
  │     npm run lint             │
  │     npm run build            │ ← Catches TS errors
  └──────────┬───────────────────┘
             │
             ▼
  ┌──────────────────────────────┐
  │  2. Unit & Integration Tests │
  │     npm run test             │
  └──────────┬───────────────────┘
             │
             ▼
  ┌──────────────────────────────┐
  │  3. E2E Tests                │
  │     npm run test:e2e         │ ← Playwright against preview
  └──────────┬───────────────────┘
             │
             ▼
  ┌──────────────────────────────┐
  │  4. Security Audit           │
  │     npm audit                │
  └──────────┬───────────────────┘
             │
             ▼
  ┌──────────────────────────────┐
  │  5. Deploy to Vercel         │ ← Only on main branch
  │     (automatic via Vercel    │
  │      GitHub integration)     │
  └──────────────────────────────┘
```

### Branch Strategy

| Branch | Purpose | Deploys To |
|--------|---------|-----------|
| `main` | Production-ready code | Production (Vercel) |
| `develop` | Integration branch | Preview (Vercel) |
| `feature/*` | Individual features | Preview (Vercel) |

---

## 20. Accessibility (WCAG 2.1 AA)

### Compliance Requirements

| Criterion | Requirement | Implementation |
|-----------|------------|----------------|
| **1.1.1** Text Alternatives | All images have alt text | `alt` prop on `<Image>`, `aria-label` on icon buttons |
| **1.3.1** Info & Relationships | Semantic HTML structure | `<main>`, `<nav>`, `<section>`, `<article>`, heading hierarchy |
| **1.4.3** Contrast (Minimum) | 4.5:1 for normal text, 3:1 for large | CSS variable colors tested with contrast checker |
| **2.1.1** Keyboard | All functionality via keyboard | Tab order, Enter/Space activation, Escape to close |
| **2.4.1** Skip Navigation | Bypass repeated content | "Skip to main content" link at top of every page |
| **2.4.7** Focus Visible | Visible focus indicator | `focus-visible` CSS with 2px ring |
| **3.3.1** Error Identification | Errors described in text | Form validation messages linked via `aria-describedby` |
| **4.1.2** Name, Role, Value | ARIA for custom widgets | Chat messages as `role="log"` with `aria-live="polite"` |

### Chat Accessibility

```
┌─────────────────────────────────────────────────┐
│  Chat Interface                                 │
│  role="main"                                    │
│  aria-label="Chat with MedicBot"                │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  Messages Container                     │    │
│  │  role="log"                             │    │
│  │  aria-live="polite"                     │    │
│  │  aria-label="Chat messages"             │    │
│  │                                         │    │
│  │  New AI messages announced by           │    │
│  │  screen readers automatically           │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  Input                                  │    │
│  │  role="textbox"                         │    │
│  │  aria-label="Type your question"        │    │
│  │  Enter to send, Shift+Enter for newline │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

---

## 21. Account Management — Deletion, Recovery & Data Export

### Account Deletion Flow

```
  Patient clicks "Delete My Account"
       │
       ▼
  Confirmation Dialog:
  "This will delete your account and all data.
   You have 30 days to recover. Type DELETE to confirm."
       │
       ▼
  Patient types "DELETE" and confirms
       │
       ▼
  Server Action:
       │
       ├── 1. Snapshot profile → deleted_accounts.profile_data
       ├── 2. Snapshot documents list → deleted_accounts.documents_data
       ├── 3. Snapshot chat sessions + messages → deleted_accounts.chat_data
       ├── 4. Record storage paths → deleted_accounts.storage_paths
       ├── 5. Set expires_at = NOW() + 30 days
       ├── 6. Set status = 'recoverable'
       │
       ├── 7. DELETE FROM chat_messages WHERE patient_id = user
       ├── 8. DELETE FROM chat_sessions WHERE patient_id = user
       ├── 9. DELETE FROM document_chunks WHERE patient_id = user
       ├── 10. DELETE FROM documents WHERE patient_id = user
       ├── 11. DELETE FROM profiles WHERE id = user
       ├── 12. supabase.auth.admin.deleteUser(user.id)
       │
       ├── 13. Send confirmation email
       ├── 14. Create audit log entry
       └── 15. Sign out and redirect to /login
```

### Account Recovery Flow (Admin-Initiated)

```
  Patient contacts support: "I want my account back"
       │
       ▼
  Admin opens /admin/deleted-accounts
       │
       ▼
  Admin finds the account (search by email)
       │
       ▼
  Checks: status === 'recoverable' AND expires_at > NOW()
       │
       ├── NO  → "Recovery period expired. Data has been purged."
       │
       └── YES → Admin clicks "Recover Account"
                    │
                    ▼
                 1. Create new auth user (same email)
                 2. Restore profile from profile_data
                 3. Restore documents metadata from documents_data
                 4. Restore chat data from chat_data
                 5. Storage files still exist (not deleted yet)
                 6. Set deleted_accounts.status = 'recovered'
                 7. Set deleted_accounts.recovered_at = NOW()
                 8. Send "Account Restored" email to patient
```

### Auto-Purge (Scheduled Job)

```
  Daily cron (Supabase Edge Function or pg_cron)
       │
       ▼
  SELECT * FROM deleted_accounts
  WHERE status = 'recoverable'
    AND expires_at < NOW()
       │
       ▼
  For each expired account:
       │
       ├── Delete files from Supabase Storage (storage_paths)
       ├── Set status = 'purged'
       ├── Nullify profile_data, documents_data, chat_data
       │   (keep email + deletion metadata for compliance)
       └── Log purge action in audit_logs
```

### Data Export Flow

```
  Patient clicks "Export My Data"
       │
       ▼
  POST /api/account/export
       │
       ▼
  Server gathers:
       │
       ├── Profile data → profile.json
       ├── Documents list → documents.json
       ├── All chat sessions + messages → chats.json
       ├── Download all PDFs from Storage → /reports/*.pdf
       │
       ▼
  Package as ZIP → Stream to browser
       │
       ▼
  Log export action in audit_logs
```

---

## 22. Legal Pages

### Pages to Create

| Page | Route | Content |
|------|-------|---------|
| Terms of Service | `/terms` | User agreement, acceptable use, liability |
| Privacy Policy | `/privacy` | Data collection, storage, sharing, retention |
| Cookie Policy | `/cookies` | Cookie types used, purposes, opt-out |

### Registration Consent

```
┌─────────────────────────────────────────────────┐
│  Register                                       │
│                                                 │
│  [Full Name     ]                               │
│  [Email         ]                               │
│  [Password      ]                               │
│                                                 │
│  ☑ I agree to the Terms of Service              │
│    and Privacy Policy                           │
│                                                 │
│  ☑ I consent to the processing of my            │
│    medical data as described in the             │
│    Data Processing Agreement                    │
│                                                 │
│  [ Register ]  ← Disabled until both checked   │
└─────────────────────────────────────────────────┘
```

### Cookie Consent Banner

```
┌─────────────────────────────────────────────────────────────┐
│  🍪 This site uses cookies for authentication and           │
│     preference storage. We do NOT use tracking cookies.     │
│     Read our [Cookie Policy].                               │
│                                                             │
│                           [Accept Essential Only] [Accept]  │
└─────────────────────────────────────────────────────────────┘
```

---

## 23. Project Folder Structure

```
medic-bot/
│
├── .env.local                          # Environment variables (NEVER commit)
├── .env.example                        # Template for env vars
├── .gitignore
├── next.config.ts                      # Next.js config + security headers + serwist
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript configuration
├── tailwind.config.ts                  # Tailwind CSS configuration
├── postcss.config.mjs                  # PostCSS for Tailwind
├── ARCHITECTURE.md                     # This file
├── IMPLEMENTATION.md                   # Implementation guide
├── SECURITY.md                         # 🔒 Security protocol document
│
├── public/
│   ├── manifest.json                   # 📱 PWA manifest
│   ├── icons/
│   │   ├── icon-192.png                # 📱 PWA icon (192x192)
│   │   └── icon-512.png                # 📱 PWA icon (512x512)
│   └── assets/
│       ├── logo.svg                    # App logo
│       └── hero-illustration.svg       # Landing page illustration
│
├── src/
│   ├── sw.ts                          # 📱 Service worker entry (serwist)
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (ThemeProvider + LazyMotion)
│   │   ├── page.tsx                    # Landing page
│   │   ├── globals.css                 # Global styles + dark/light CSS variables
│   │   ├── _offline/
│   │   │   └── page.tsx                # 📱 Offline fallback page
│   │   │
│   │   ├── (auth)/
│   │   │   ├── layout.tsx              # Auth layout (centered card)
│   │   │   ├── login/page.tsx          # Login page
│   │   │   └── register/page.tsx       # Patient registration
│   │   │
│   │   ├── (admin)/
│   │   │   ├── layout.tsx              # Admin layout (sidebar)
│   │   │   ├── dashboard/page.tsx      # Admin dashboard
│   │   │   ├── patients/
│   │   │   │   ├── page.tsx            # Patient list
│   │   │   │   └── [id]/page.tsx       # Patient detail
│   │   │   ├── audit-logs/page.tsx     # 📋 Audit log viewer (filterable)
│   │   │   └── deleted-accounts/
│   │   │       ├── page.tsx            # 🗑️ Deleted accounts list
│   │   │       └── [id]/page.tsx       # 🗑️ Deleted account detail + recover
│   │   │
│   │   ├── (patient)/
│   │   │   ├── layout.tsx              # Patient layout (sidebar)
│   │   │   ├── dashboard/page.tsx      # Patient dashboard
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx            # Report list
│   │   │   │   └── upload/page.tsx     # Upload report
│   │   │   ├── chat/
│   │   │   │   ├── page.tsx            # Chat sessions list
│   │   │   │   └── [sessionId]/page.tsx # Active chat
│   │   │   ├── profile/
│   │   │   │   ├── page.tsx            # Edit profile
│   │   │   │   ├── export/page.tsx     # 📦 Data export page
│   │   │   │   └── delete/page.tsx     # 🗑️ Account deletion page
│   │   │   └── notifications/page.tsx  # 🔔 All notifications
│   │   │
│   │   └── api/
│   │       ├── auth/callback/route.ts
│   │       ├── documents/
│   │       │   ├── upload/route.ts
│   │       │   ├── process/route.ts
│   │       │   └── [id]/route.ts
│   │       ├── chat/
│   │       │   ├── route.ts
│   │       │   └── sessions/
│   │       │       └── [id]/route.ts
│   │       ├── account/
│   │       │   ├── delete/route.ts     # 🗑️ Account deletion endpoint
│   │       │   ├── export/route.ts     # 📦 Data export (ZIP stream)
│   │       │   └── recover/route.ts    # 🔄 Account recovery (admin only)
│   │       ├── notifications/
│   │       │   ├── route.ts            # 🔔 List notifications
│   │       │   └── [id]/route.ts       # 🔔 Mark as read
│   │       ├── audit/
│   │       │   └── route.ts            # 📋 Audit log queries
│   │       └── admin/
│   │           ├── patients/
│   │           │   └── [id]/route.ts
│   │           ├── stats/route.ts
│   │           ├── audit-logs/route.ts  # 📋 Admin audit log API
│   │           └── deleted-accounts/
│   │               └── [id]/route.ts   # 🗑️ Recover account API
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   ├── admin/                      # Admin-specific components
│   │   │   ├── admin-sidebar.tsx
│   │   │   ├── stats-cards.tsx
│   │   │   └── patients-table.tsx
│   │   ├── patient/                    # Patient-specific components
│   │   │   ├── patient-sidebar.tsx
│   │   │   ├── upload-dropzone.tsx
│   │   │   ├── report-card.tsx
│   │   │   ├── chat-interface.tsx
│   │   │   ├── chat-message.tsx
│   │   │   └── chat-input.tsx
│   │   ├── shared/                     # Shared components
│   │   │   ├── logo.tsx
│   │   │   ├── theme-toggle.tsx
│   │   │   ├── loading-spinner.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── notification-bell.tsx   # 🔔 Bell icon + dropdown
│   │   │   ├── cookie-consent.tsx      # 🍪 Cookie consent banner
│   │   │   └── skip-nav.tsx            # ♿ Skip to main content link
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser client
│   │   │   ├── server.ts              # Server client
│   │   │   └── admin.ts               # 🔒 Service role client (import 'server-only')
│   │   ├── rag/
│   │   │   ├── parser.ts              # PDF text extraction
│   │   │   ├── chunker.ts             # Text chunking logic
│   │   │   ├── embedder.ts            # Embedding generation
│   │   │   ├── retriever.ts           # Vector similarity search
│   │   │   └── generator.ts           # LLM prompt + streaming
│   │   ├── auth-guard.ts              # 🔒 requireAuth/requireAdmin/requirePatient
│   │   ├── ownership.ts               # 🔒 IDOR prevention — verify resource ownership
│   │   ├── validations.ts             # 🔒 Zod schemas for all inputs
│   │   ├── sanitize.ts                # 🔒 DOMPurify text + filename sanitization
│   │   ├── upload-security.ts         # 🔒 MIME + magic bytes file validation
│   │   ├── rate-limiter.ts            # 🔒 Brute force protection
│   │   ├── storage-security.ts        # 🔒 Signed URL generation (60s TTL)
│   │   ├── offline-cache.ts           # 📱 Encrypted IndexedDB + Web Crypto API
│   │   ├── audit-logger.ts            # 📋 Async audit log helper
│   │   ├── email.ts                   # 📧 Email sending (Resend API)
│   │   ├── notifications.ts           # 🔔 In-app notification helper
│   │   ├── account-manager.ts         # 🗑️ Account deletion/recovery logic
│   │   ├── utils.ts                   # General utilities
│   │   └── constants.ts               # App constants
│   │
│   ├── hooks/
│   │   ├── use-auth.ts                # Auth state hook
│   │   ├── use-chat.ts                # Chat state hook
│   │   ├── use-documents.ts           # Document operations hook
│   │   ├── use-offline.ts             # 📱 Offline status + cached data hook
│   │   └── use-notifications.ts       # 🔔 Notification polling hook
│   │
│   ├── types/
│   │   ├── database.types.ts          # Supabase generated types
│   │   ├── chat.ts                    # Chat types
│   │   └── documents.ts              # Document types
│   │
│   └── middleware.ts                  # Route protection
│
├── __tests__/                          # 🧪 Test directory
│   ├── unit/
│   │   ├── chunker.test.ts            # Text chunking tests
│   │   ├── sanitize.test.ts           # XSS sanitization tests
│   │   ├── validations.test.ts        # Zod schema tests
│   │   └── upload-security.test.ts    # Magic bytes tests
│   ├── integration/
│   │   ├── auth.test.ts               # Auth flow tests
│   │   ├── rls.test.ts                # Row Level Security tests
│   │   └── api-routes.test.ts         # API endpoint tests
│   └── e2e/
│       ├── patient-flow.spec.ts       # Patient user journey
│       ├── admin-flow.spec.ts         # Admin user journey
│       ├── security.spec.ts           # IDOR + role escalation
│       └── accessibility.spec.ts      # axe-core a11y scan
│
├── .github/
│   └── workflows/
│       └── ci.yml                     # 🚀 GitHub Actions CI/CD pipeline
│
├── supabase/
│   ├── config.toml                    # Supabase local config
│   ├── functions/
│   │   └── purge-deleted-accounts/    # ⏰ Daily cron: purge expired accounts
│   │       └── index.ts
│   └── migrations/
│       ├── 001_enable_pgvector.sql
│       ├── 002_create_profiles.sql
│       ├── 003_create_documents.sql
│       ├── 004_create_chunks.sql
│       ├── 005_create_chat.sql
│       ├── 006_create_audit_logs.sql   # 📋 Audit logs table (append-only)
│       ├── 007_create_deleted_accounts.sql # 🗑️ Soft delete recovery table
│       ├── 008_create_notifications.sql # 🔔 Notifications table
│       ├── 009_create_rls.sql
│       ├── 010_create_storage.sql
│       └── 011_create_functions.sql
│
├── emails/                             # 📧 React email templates
│   ├── welcome.tsx
│   ├── report-processed.tsx
│   ├── report-failed.tsx
│   ├── account-deleted.tsx
│   └── account-recovered.tsx
│
└── scripts/
    ├── seed-admin.ts                  # Create first admin user
    └── purge-expired.ts               # Manual purge script
```

---

> **This document serves as the single source of truth for the MedicBot architecture. All implementation work should reference this document for consistency.**
