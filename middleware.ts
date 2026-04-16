import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const VALID_ROLES = ['pemilik', 'apoteker', 'kasir_senior', 'kasir_magang']

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
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const role = user?.app_metadata?.role as string | undefined

  // User dianggap terotentikasi HANYA jika memiliki role yang valid di sistem ini.
  // User anonim dari Supabase Anonymous Auth tidak memiliki role → dianggap belum login.
  const isAuthenticated = !!user && !!role && VALID_ROLES.includes(role)

  // ── HALAMAN LOGIN ──────────────────────────────────────────────────────────
  if (pathname === '/login') {
    // Jika sudah login valid → redirect ke dashboard
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    // Jika user anonim/tidak valid di halaman login:
    // Hapus cookie sesi secara manual (JANGAN redirect—ini akan menyebabkan loop!)
    if (user && !isAuthenticated) {
      const res = NextResponse.next({ request })
      request.cookies.getAll().forEach(cookie => {
        if (cookie.name.startsWith('sb-')) {
          res.cookies.delete(cookie.name)
        }
      })
      return res
    }
    // Tidak ada user sama sekali → tampilkan halaman login
    return response
  }

  // ── PROTECTED ROUTES ───────────────────────────────────────────────────────
  const protectedRoutes = ['/kasir', '/settings', '/laporan', '/admin', '/dashboard', '/obat']
  const isProtectedPath = pathname === '/' || protectedRoutes.some(r => pathname.startsWith(r))

  if (isProtectedPath) {
    if (!isAuthenticated) {
      // Hapus cookie sesi anonim + redirect ke /login
      const loginUrl = new URL('/login', request.url)
      const redirectRes = NextResponse.redirect(loginUrl)
      request.cookies.getAll().forEach(cookie => {
        if (cookie.name.startsWith('sb-')) {
          redirectRes.cookies.delete(cookie.name)
        }
      })
      return redirectRes
    }

    // User terautentikasi: terapkan RBAC
    if (pathname === '/' && !['pemilik', 'apoteker'].includes(role!)) {
      return NextResponse.redirect(new URL('/kasir', request.url))
    }

    const rbacRules: Record<string, string[]> = {
      '/admin': ['pemilik'],
      '/settings': ['pemilik'],
      '/laporan': ['pemilik', 'apoteker'],
      '/obat': ['pemilik', 'apoteker'],
    }
    for (const [route, allowed] of Object.entries(rbacRules)) {
      if (pathname.startsWith(route) && !allowed.includes(role!)) {
        const fallback = ['kasir_magang', 'kasir_senior'].includes(role!) ? '/kasir' : '/'
        return NextResponse.redirect(new URL(fallback, request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
