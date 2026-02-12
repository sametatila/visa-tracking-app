import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { isIPBannedSync } from '@/lib/ipBan';

function getIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function proxy(request: NextRequest) {
  const ip = getIP(request);
  const pathname = request.nextUrl.pathname;
  const isAPI = pathname.startsWith('/api/');

  // Ban kontrolü (in-memory cache — DB'ye erişmez)
  if (ip !== 'unknown' && isIPBannedSync(ip)) {
    if (pathname === '/banned') {
      return NextResponse.next();
    }
    if (isAPI) {
      return NextResponse.json(
        { error: 'Erişim kısıtlandı.' },
        { status: 403 }
      );
    }
    return NextResponse.rewrite(new URL('/banned', request.url));
  }

  // Rate limiting — sadece API istekleri
  if (isAPI) {
    const { allowed, retryAfter } = checkRateLimit(ip, request.method);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Çok fazla istek. Lütfen bekleyin.' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
