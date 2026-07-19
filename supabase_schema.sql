-- Create table for link sessions
CREATE TABLE link_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hwid TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes')
);

-- Create table for active keys
CREATE TABLE free_keys (
    key_string TEXT PRIMARY KEY,
    hwid TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    status TEXT DEFAULT 'active'
);
