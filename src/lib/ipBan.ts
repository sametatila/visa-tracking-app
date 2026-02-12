import db from './db';

// --- In-memory silme sayacı (server restart'ta sıfırlanır) ---

interface DeleteRecord {
  deletes: number[];
  warned: boolean;
  warnedAt: number;
}

const deleteMap = new Map<string, DeleteRecord>();

const WINDOW_MS = 5 * 60 * 1000; // 5 dakika
const WARN_THRESHOLD = 2; // 5dk'da 2 silme → uyarı
const BAN_AFTER_WARN = 1; // Uyarıdan sonraki 5dk'da 1 silme daha → ban

// --- In-memory ban cache (DB'den lazy-load) ---

let bannedIPsCache: Set<string> | null = null;

async function loadBanCache(): Promise<Set<string>> {
  if (bannedIPsCache) return bannedIPsCache;
  try {
    const result = await db.execute('SELECT ip FROM banned_ips');
    bannedIPsCache = new Set(result.rows.map((r) => r.ip as string));
  } catch {
    bannedIPsCache = new Set();
  }
  return bannedIPsCache;
}

export async function isIPBanned(ip: string): Promise<boolean> {
  const cache = await loadBanCache();
  if (cache.has(ip)) return true;

  // Cache'de yoksa DB'yi kontrol et (lazy refresh)
  try {
    const result = await db.execute({
      sql: 'SELECT 1 FROM banned_ips WHERE ip = ?',
      args: [ip],
    });
    if (result.rows.length > 0) {
      cache.add(ip);
      return true;
    }
  } catch {
    // DB hatası → güvenli tarafta kal, banlı değil say
  }

  return false;
}

export async function banIP(ip: string): Promise<void> {
  try {
    await db.execute({
      sql: `INSERT OR IGNORE INTO banned_ips (ip) VALUES (?)`,
      args: [ip],
    });
    const cache = await loadBanCache();
    cache.add(ip);
  } catch (err) {
    console.error('banIP error:', err instanceof Error ? err.message : 'Unknown');
  }
}

export async function recordDeleteAndCheck(ip: string): Promise<'ok' | 'warn' | 'ban'> {
  const now = Date.now();

  // Zaten banlı mı?
  if (await isIPBanned(ip)) return 'ban';

  let record = deleteMap.get(ip);
  if (!record) {
    record = { deletes: [], warned: false, warnedAt: 0 };
    deleteMap.set(ip, record);
  }

  // Pencere dışındaki silmeleri temizle
  record.deletes = record.deletes.filter((t) => now - t < WINDOW_MS);

  // Yeni silmeyi kaydet
  record.deletes.push(now);

  // Uyarı almış ve uyarıdan sonraki pencerede ek silme
  if (record.warned && now - record.warnedAt < WINDOW_MS) {
    const deletesAfterWarn = record.deletes.filter((t) => t > record!.warnedAt);
    if (deletesAfterWarn.length >= BAN_AFTER_WARN) {
      await banIP(ip);
      deleteMap.delete(ip);
      return 'ban';
    }
  }

  // İlk uyarı eşiği
  if (!record.warned && record.deletes.length >= WARN_THRESHOLD) {
    record.warned = true;
    record.warnedAt = now;
    return 'warn';
  }

  return 'ok';
}

// Edge Runtime uyumlu basit ban kontrolü (middleware için)
// Sadece in-memory cache kullanır, DB'ye erişmez
export function isIPBannedSync(ip: string): boolean {
  return bannedIPsCache?.has(ip) ?? false;
}
