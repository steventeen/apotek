import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  if (user && pathname === '/login') return NextResponse.redirect(new URL('/', request.url))

  const protectedRoutes = ['/kasir', '/settings', '/laporan', '/admin']
  const isProtectedPath = pathname === '/' || protectedRoutes.some(r => pathname.startsWith(r))

  if (!user && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const role = user.app_metadata?.role as string
    
    if (pathname === '/' && !['pemilik', 'apoteker'].includes(role)) {
      return NextResponse.redirect(new URL('/kasir', request.url))
    }

    const rules: Record<string, string[]> = {
      '/admin': ['pemilik'],
      '/settings': ['pemilik'],
      '/laporan': ['pemilik', 'apoteker'],
    }
    for (const [route, allowed] of Object.entries(rules)) {
      if (pathname.startsWith(route) && !allowed.includes(role)) {
        return NextResponse.redirect(new URL(role === 'kasir_magang' || role === 'kasir_senior' ? '/kasir' : '/', request.url))
      }
    }
  }
  return response
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'] }
