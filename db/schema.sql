-- GIDO ComplyPilot database schema (PostgreSQL / Neon)
-- Safe to run repeatedly: every object uses IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS organisations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  industry            TEXT,
  employee_count      INTEGER CHECK (employee_count IS NULL OR employee_count >= 0),
  emirate_or_country  TEXT,
  plan                TEXT NOT NULL DEFAULT 'Starter' CHECK (plan IN ('Starter', 'Business', 'Enterprise')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  email            TEXT NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,
  full_name        TEXT NOT NULL,
  role             TEXT NOT NULL DEFAULT 'Viewer' CHECK (role IN ('Admin', 'Compliance Officer', 'Viewer')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organisation_id);

CREATE TABLE IF NOT EXISTS frameworks (
  id           SERIAL PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE CHECK (code IN ('ISO45001', 'ISO27001', 'UAE_PDPL', 'OSHAD', 'GDPR', 'BEST_PRACTICE')),
  name         TEXT NOT NULL,
  description  TEXT
);

CREATE TABLE IF NOT EXISTS policy_templates (
  id            SERIAL PRIMARY KEY,
  policy_type   TEXT NOT NULL CHECK (policy_type IN (
                  'Health & Safety', 'Fire Safety', 'Data Protection', 'Information Security',
                  'Anti-Bribery', 'Incident Reporting', 'Emergency Evacuation', 'Code of Conduct')),
  framework_id  INTEGER NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
  sections      JSONB NOT NULL,   -- [{ "title": "...", "body": "... {{company_name}} ..." }]
  UNIQUE (policy_type, framework_id)
);
CREATE INDEX IF NOT EXISTS idx_templates_framework ON policy_templates(framework_id);

CREATE TABLE IF NOT EXISTS policies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id   UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  template_id       INTEGER REFERENCES policy_templates(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  policy_type       TEXT NOT NULL,
  framework_id      INTEGER REFERENCES frameworks(id) ON DELETE SET NULL,
  status            TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Under Review', 'Expired')),
  owner_user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  current_version   INTEGER NOT NULL DEFAULT 1,
  effective_date    DATE,
  next_review_date  DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_policies_org ON policies(organisation_id);
CREATE INDEX IF NOT EXISTS idx_policies_org_status ON policies(organisation_id, status);
CREATE INDEX IF NOT EXISTS idx_policies_review ON policies(organisation_id, next_review_date);

CREATE TABLE IF NOT EXISTS policy_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id       UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL,
  content         JSONB NOT NULL,   -- [{ "number": 1, "title": "...", "content": "..." }]
  change_note     TEXT,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (policy_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_versions_policy ON policy_versions(policy_id);

CREATE TABLE IF NOT EXISTS risks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id   UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  likelihood        SMALLINT NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
  impact            SMALLINT NOT NULL CHECK (impact BETWEEN 1 AND 5),
  owner_user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  linked_policy_id  UUID REFERENCES policies(id) ON DELETE SET NULL,
  status            TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Mitigated', 'Closed')),
  due_date          DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_risks_org ON risks(organisation_id);
CREATE INDEX IF NOT EXISTS idx_risks_policy ON risks(linked_policy_id);

CREATE TABLE IF NOT EXISTS employees (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  full_name        TEXT NOT NULL,
  email            TEXT,
  department       TEXT,
  UNIQUE (organisation_id, email)
);
CREATE INDEX IF NOT EXISTS idx_employees_org ON employees(organisation_id);

CREATE TABLE IF NOT EXISTS acknowledgements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id         UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Signed')),
  signed_at         TIMESTAMPTZ,
  last_reminder_at  TIMESTAMPTZ,
  UNIQUE (policy_id, employee_id)
);
CREATE INDEX IF NOT EXISTS idx_acks_employee ON acknowledgements(employee_id);

CREATE TABLE IF NOT EXISTS activity_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  action           TEXT NOT NULL,
  entity_type      TEXT,
  entity_id        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_org_time ON activity_log(organisation_id, created_at DESC);
