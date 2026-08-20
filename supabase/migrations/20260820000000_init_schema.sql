-- ============================================================================
-- SASURIE TASK MONITORING & MENTOR-MENTEE SYSTEM — INITIAL MIGRATION
-- Project: lwzhbxtgdyancsavcbgc
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Skill Bank Students Table
CREATE TABLE IF NOT EXISTS skill_bank_students (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Dedicated Mentor-Mentee Mappings Table
CREATE TABLE IF NOT EXISTS mentor_mappings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Staff / Faculty Table
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Classes Table
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Observations Table
CREATE TABLE IF NOT EXISTS observations (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Faculty KPI Records Table
CREATE TABLE IF NOT EXISTS faculty_kpis (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Enable Row Level Security (RLS)
ALTER TABLE skill_bank_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_kpis ENABLE ROW LEVEL SECURITY;

-- 11. Create Access Policies (Anon Key Read/Write)
CREATE POLICY "Public Read/Write skill_bank_students" ON skill_bank_students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write mentor_mappings" ON mentor_mappings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write staff" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write classes" ON classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write observations" ON observations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write faculty_kpis" ON faculty_kpis FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skill_bank_students_data ON skill_bank_students USING gin (data);
CREATE INDEX IF NOT EXISTS idx_mentor_mappings_data ON mentor_mappings USING gin (data);
