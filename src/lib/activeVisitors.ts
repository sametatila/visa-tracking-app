// In-memory aktif ziyaretçi sayacı
// Her API isteğinde IP kaydedilir, 60sn sessiz kalan düşer
// Serverless cold start'ta sıfırlanır — kabul edilebilir

const EXPIRY_MS = 60_000; // 60 saniye

const visitors = new Map<string, number>(); // ip → son görülme timestamp

export function recordVisitor(ip: string): void {
  visitors.set(ip, Date.now());
}

export function getActiveCount(): number {
  const now = Date.now();
  let count = 0;
  for (const [ip, lastSeen] of visitors) {
    if (now - lastSeen > EXPIRY_MS) {
      visitors.delete(ip);
    } else {
      count++;
    }
  }
  return count;
}
