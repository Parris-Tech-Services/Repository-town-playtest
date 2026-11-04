import Database from 'better-sqlite3';

const dbPath = process.env.DB_PATH;

if (!dbPath) {
  throw new Error('DB_PATH is not set. Add it to your environment or .env file.');
}

const db = new Database(dbPath);

export default db;
