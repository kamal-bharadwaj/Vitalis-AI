-- 009_create_rls.sql
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
