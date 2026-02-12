const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60_000; // 1 dakika
const MAX_READ = 60;      // GET: 60 istek/dk
const MAX_WRITE = 10;     // POST/PUT/DELETE: 10 istek/dk

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

// Her 5 dakikada temizle
let lastCleanup = Date.now();

export function checkRateLimit(ip: string, method: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  if (now - lastCleanup > 300_000) {
    cleanup();
    lastCleanup = now;
  }

  const isWrite = method !== 'GET';
  const limit = isWrite ? MAX_WRITE : MAX_READ;
  const key = `${ip}:${isWrite ? 'w' : 'r'}`;

  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}
