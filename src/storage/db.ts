import * as SQLite from 'expo-sqlite';

export interface Transcript {
  id: number;
  title: string;
  text: string;
  audioUri: string | null;
  createdAt: number; // epoch ms
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('transcriber.db').then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS transcripts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          text TEXT NOT NULL,
          audioUri TEXT,
          createdAt INTEGER NOT NULL
        );
      `);
      return db;
    });
  }
  return dbPromise;
}

export async function saveTranscript(
  title: string,
  text: string,
  audioUri: string | null
): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO transcripts (title, text, audioUri, createdAt) VALUES (?, ?, ?, ?)',
    title,
    text,
    audioUri,
    Date.now()
  );
  return result.lastInsertRowId as number;
}

export async function updateTranscriptText(id: number, text: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE transcripts SET text = ? WHERE id = ?', text, id);
}

export async function deleteTranscript(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM transcripts WHERE id = ?', id);
}

export async function listTranscripts(): Promise<Transcript[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Transcript>(
    'SELECT * FROM transcripts ORDER BY createdAt DESC'
  );
  return rows;
}

export async function getTranscript(id: number): Promise<Transcript | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Transcript>(
    'SELECT * FROM transcripts WHERE id = ?',
    id
  );
  return row ?? null;
}
