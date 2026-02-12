import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS rows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  tr_consulate TEXT NOT NULL DEFAULT 'Diğer',
  de_city TEXT NOT NULL DEFAULT '',
  visa_type TEXT NOT NULL DEFAULT 'Diğer',
  application_date TEXT NOT NULL DEFAULT '',
  assignment_date TEXT NOT NULL DEFAULT '',
  appointment_date TEXT NOT NULL DEFAULT '',
  missing_docs TEXT NOT NULL DEFAULT '',
  decision_email_date TEXT NOT NULL DEFAULT '',
  sms_date TEXT NOT NULL DEFAULT '',
  course_start TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

const CREATE_BANNED_IPS = `
CREATE TABLE IF NOT EXISTS banned_ips (
  ip TEXT PRIMARY KEY,
  banned_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

const CREATE_INDEX_CONSULATE = `CREATE INDEX IF NOT EXISTS idx_rows_consulate ON rows(tr_consulate);`;
const CREATE_INDEX_APPOINTMENT = `CREATE INDEX IF NOT EXISTS idx_rows_appointment ON rows(appointment_date);`;

async function seed() {
  console.log('Tablolar oluşturuluyor...');
  await db.execute(CREATE_TABLE);
  await db.execute(CREATE_BANNED_IPS);
  await db.execute(CREATE_INDEX_CONSULATE);
  await db.execute(CREATE_INDEX_APPOINTMENT);
  console.log('Tablolar ve index\'ler oluşturuldu.');

  const count = await db.execute('SELECT COUNT(*) as cnt FROM rows');
  const existing = Number(count.rows[0].cnt);
  console.log(`Tabloda ${existing} satır mevcut.`);
}

seed().catch((err) => {
  console.error('Seed hatası:', err);
  process.exit(1);
});
