/* eslint-disable */
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

const migrations = [
  {
    name: '20240101000001_enable_pgvector.sql',
    content: `-- 001_enable_pgvector.sql\nCREATE EXTENSION IF NOT EXISTS vector;`
  },
  {
    name: '20240101000002_create_profiles.sql',
    content: `-- 002_create_profiles.sql
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
  INSERT INTO public.profiles (id, full_name, email, role, phone, gender, date_of_birth)
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
`
  },
  {
    name: '20240101000003_create_documents.sql',
    content: `-- 003_create_documents.sql
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
`
  },
  {
    name: '20240101000004_create_chunks.sql',
    content: `-- 004_create_chunks.sql
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
`
  },
  {
    name: '20240101000005_create_chat.sql',
    content: `-- 005_create_chat.sql
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
`
  },
  {
    name: '20240101000006_create_audit_logs.sql',
    content: `-- 006_create_audit_logs.sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
`
  },
  {
    name: '20240101000007_create_notifications.sql',
    content: `-- 007_create_notifications.sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
`
  },
  {
    name: '20240101000008_create_deleted_accounts.sql',
    content: `-- 008_create_deleted_accounts.sql
CREATE TABLE deleted_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  original_user_id UUID NOT NULL,
  profile_data JSONB,
  documents_data JSONB,
  chat_data JSONB,
  storage_paths JSONB,
  status TEXT NOT NULL DEFAULT 'recoverable' CHECK (status IN ('recoverable', 'recovered', 'purged')),
  expires_at TIMESTAMPTZ NOT NULL,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deleted_accounts_email ON deleted_accounts(email);
CREATE INDEX idx_deleted_accounts_status ON deleted_accounts(status);
CREATE INDEX idx_deleted_accounts_expires_at ON deleted_accounts(expires_at);
`
  },
  {
    name: '20240101000009_create_rls.sql',
    content: `-- 009_create_rls.sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_accounts ENABLE ROW LEVEL SECURITY;

-- === PROFILES ===
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin');
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- === DOCUMENTS ===
CREATE POLICY "Patients can view own documents" ON documents FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Admins can view all documents" ON documents FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Patients can insert own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can update own documents" ON documents FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Patients can delete own documents" ON documents FOR DELETE USING (auth.uid() = patient_id);

-- === DOCUMENT_CHUNKS ===
CREATE POLICY "Patients can view own chunks" ON document_chunks FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Admins can view all chunks" ON document_chunks FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Service can insert chunks" ON document_chunks FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- === CHAT_SESSIONS ===
CREATE POLICY "Patients can CRUD own sessions" ON chat_sessions FOR ALL USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

-- === CHAT_MESSAGES ===
CREATE POLICY "Patients can CRUD own messages" ON chat_messages FOR ALL USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

-- === AUDIT LOGS ===
CREATE POLICY "Admins can view all audit logs" ON audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);
-- Note: Insert is done via service role only to ensure immutability

-- === NOTIFICATIONS ===
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- === DELETED ACCOUNTS ===
CREATE POLICY "Admins can view deleted accounts" ON deleted_accounts FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
`
  },
  {
    name: '20240101000010_create_storage.sql',
    content: `-- 010_create_storage.sql
-- Run via Supabase Dashboard or CLI

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-reports', 'medical-reports', false)
ON CONFLICT (id) DO NOTHING;

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
`
  },
  {
    name: '20240101000011_create_functions.sql',
    content: `-- 011_create_functions.sql
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
`
  }
];

migrations.forEach(m => {
  fs.writeFileSync(path.join(migrationsDir, m.name), m.content);
});

console.log('Created 11 migration files successfully.');
