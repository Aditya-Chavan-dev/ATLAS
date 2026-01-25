-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  firebase_uid VARCHAR(128) UNIQUE,
  role VARCHAR(20) CHECK (role IN ('Owner', 'MD', 'HR', 'Employee')),
  is_active BOOLEAN DEFAULT false NOT NULL,
  is_root_owner BOOLEAN DEFAULT false NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'active', 'suspended')) DEFAULT 'pending',
  role_version INTEGER DEFAULT 0 NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  pending_expires_at TIMESTAMP,

  -- STRICT CONSTRAINTS
  CONSTRAINT ck_root_owner_validity CHECK (
      is_root_owner = false OR (role = 'Owner' AND is_active = true)
  ),
  CONSTRAINT ck_active_user_role CHECK (
      is_active = false OR role IS NOT NULL
  )
);

-- AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_path VARCHAR(500),
  result VARCHAR(20) CHECK (result IN ('granted', 'denied')) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

-- INDEXES
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid) WHERE firebase_uid IS NOT NULL;
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_pending_expires ON users(pending_expires_at) WHERE status = 'pending';
CREATE INDEX idx_users_role_version ON users(role_version);
CREATE UNIQUE INDEX idx_users_root_owner ON users(is_root_owner) WHERE is_root_owner = true;

CREATE INDEX idx_audit_logs_email ON audit_logs(user_email);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_result ON audit_logs(result);

-- TRIGGER FUNCTIONS

-- Update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Increment role_version
CREATE OR REPLACE FUNCTION increment_role_version()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.role IS DISTINCT FROM NEW.role) OR
     (OLD.is_active IS DISTINCT FROM NEW.is_active) OR
     (OLD.status IS DISTINCT FROM NEW.status) THEN
       NEW.role_version = OLD.role_version + 1;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_increment_role_version
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION increment_role_version();

-- Prevent Root Owner Modification
CREATE OR REPLACE FUNCTION prevent_root_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_root_owner = true AND NEW.is_root_owner = false THEN
    RAISE EXCEPTION 'Cannot remove root owner status';
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_prevent_root_change
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION prevent_root_change();

-- Audit Log Immutability
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable';
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_audit_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_modification();
