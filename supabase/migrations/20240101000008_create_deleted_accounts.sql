-- 008_create_deleted_accounts.sql
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
