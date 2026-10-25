import type BetterSqlite3 from 'better-sqlite3';

type Database = BetterSqlite3.Database;

function ensureColumn(db: Database, tableName: string, columnName: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

export function runMigrations(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      era TEXT NOT NULL,
      tier INTEGER NOT NULL DEFAULT 1,
      cluster_id TEXT NOT NULL DEFAULT '',
      description_base TEXT NOT NULL,
      exits TEXT NOT NULL DEFAULT '[]',
      is_accessible INTEGER NOT NULL DEFAULT 1,
      travel_time_minutes INTEGER NOT NULL DEFAULT 5,
      canon_source TEXT
    );

    CREATE TABLE IF NOT EXISTS npcs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location_id TEXT NOT NULL,
      era TEXT NOT NULL,
      temperament TEXT NOT NULL DEFAULT '',
      speech_style TEXT NOT NULL DEFAULT '',
      conditions TEXT
    );

    CREATE TABLE IF NOT EXISTS player_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      character_id TEXT NOT NULL,
      era TEXT NOT NULL,
      location_id TEXT NOT NULL,
      money_drabs INTEGER NOT NULL DEFAULT 0,
      inventory TEXT NOT NULL DEFAULT '[]',
      reputation TEXT NOT NULL DEFAULT '{}',
      time_of_day TEXT NOT NULL DEFAULT 'morning',
      day_number INTEGER NOT NULL DEFAULT 1,
      term_number INTEGER NOT NULL DEFAULT 1,
      injuries TEXT NOT NULL DEFAULT '[]',
      hunger INTEGER NOT NULL DEFAULT 0,
      fatigue INTEGER NOT NULL DEFAULT 0,
      academic_rank TEXT NOT NULL DEFAULT 'E_lir',
      tuition_state TEXT NOT NULL DEFAULT '{"amount_drabs":30,"due_on_day":14,"paid":false,"overdue":false}',
      world_state_flags TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS world_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      flags TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS pending_reputation_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      npc_id TEXT NOT NULL,
      axis TEXT NOT NULL,
      delta INTEGER NOT NULL,
      apply_on_day INTEGER NOT NULL
    );
  `);

  ensureColumn(
    db,
    'player_state',
    'tuition_state',
    `TEXT NOT NULL DEFAULT '{"amount_drabs":30,"due_on_day":14,"paid":false,"overdue":false}'`
  );
}
