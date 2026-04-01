import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const GATE_COOKIE = 'sp_gate'

function isSiteUnlocked(request: NextRequest): boolean {
  const sitePassword = process.env.SITE_PASSWORD
  if (!sitePassword) return true // No password configured — open
  const cookie = request.cookies.get(GATE_COOKIE)
  return cookie?.value === sitePassword
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip gate for the gate page itself and its API
  const isGateRoute = pathname === '/gate' || pathname === '/api/gate'
  if (!isGateRoute && !isSiteUnlocked(request)) {
    const gateUrl = new URL('/gate', request.url)
    gateUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(gateUrl)
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Only run Supabase auth check for protected routes
  if (!pathname.startsWith('/dashboard') && !pathname.startsWith('/admin')) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Gate /admin on ADMIN_EMAIL env var
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  // Protect /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
