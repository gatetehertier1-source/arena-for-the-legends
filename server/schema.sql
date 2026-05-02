-- ============================================================
-- League for Legends Arena — Supabase SQL Schema
-- Run this entire file once in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension (already on by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username    TEXT NOT NULL UNIQUE,
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  avatar      TEXT DEFAULT '',
  bio         TEXT DEFAULT '',
  favorite_game TEXT DEFAULT '' CHECK (favorite_game IN ('eFootball', 'CODM', '')),
  wins        INTEGER NOT NULL DEFAULT 0,
  losses      INTEGER NOT NULL DEFAULT 0,
  points      INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tournaments ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournaments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  game            TEXT NOT NULL CHECK (game IN ('eFootball', 'CODM')),
  type            TEXT NOT NULL CHECK (type IN ('single-elimination', 'double-elimination', 'round-robin')),
  status          TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'open', 'live', 'completed')),
  max_players     INTEGER NOT NULL DEFAULT 16,
  entry_fee       INTEGER NOT NULL DEFAULT 0,
  prize_pool      INTEGER NOT NULL DEFAULT 0,
  start_date      TIMESTAMPTZ,
  description     TEXT DEFAULT '',
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tournament Registrations (join table) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- ── Matches ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round           INTEGER NOT NULL,
  match_number    INTEGER NOT NULL,
  player1_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  player2_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  score1          INTEGER DEFAULT NULL,
  score2          INTEGER DEFAULT NULL,
  winner_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  submitted_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Auto-update updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tournaments_updated_at
  BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER matches_updated_at
  BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_registrations_tournament ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON tournament_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(tournament_id, round);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);

-- ── Row Level Security (optional but recommended) ─────────────────────────────
-- Since we use our own JWT + service role key, RLS is optional.
-- You can enable it later when you add Supabase Auth.
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ── Done ──────────────────────────────────────────────────────────────────────
-- You can verify tables were created with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- ── Helper function for atomic stat increments ────────────────────────────────
-- Called from the matches route when approving a result
CREATE OR REPLACE FUNCTION increment_user_stats(
  p_user_id UUID,
  p_wins    INTEGER,
  p_losses  INTEGER,
  p_points  INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE users SET
    wins    = wins + p_wins,
    losses  = losses + p_losses,
    points  = points + p_points
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ── Run this in SQL Editor to add the function too ────────────────────────────
