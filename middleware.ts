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

  const VALID_ROLES = ['pemilik', 'apoteker', 'kasir_senior', 'kasir_magang']
  const role = user?.app_metadata?.role as string | undefined

  // User dianggap terotentikasi HANYA jika punya role yang valid
  // User anonim (anonymous sign-in) tidak memiliki role → dianggap belum login
  const isAuthenticated = !!user && !!role && VALID_ROLES.includes(role)

  // Jika sudah login dengan role valid dan mencoba akses /login → redirect ke /
  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Jika ada user tapi TIDAK valid (anon/no role) → paksa sign out + redirect ke /login
  if (user && !isAuthenticated) {
    await supabase.auth.signOut()
    const loginUrl = new URL('/login', request.url)
    const redirectResponse = NextResponse.redirect(loginUrl)
    // Hapus semua cookie sesi agar tidak loop
    response.cookies.getAll().forEach(c => {
      if (c.name.startsWith('sb-')) {
        redirectResponse.cookies.delete(c.name)
      }
    })
    return redirectResponse
  }

  const protectedRoutes = ['/kasir', '/settings', '/laporan', '/admin', '/dashboard', '/obat']
  const isProtectedPath = pathname === '/' || protectedRoutes.some(r => pathname.startsWith(r))

  if (!isAuthenticated && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthenticated) {
    // Role kasir tidak boleh akses dashboard utama (/)
    if (pathname === '/' && !['pemilik', 'apoteker'].includes(role!)) {
      return NextResponse.redirect(new URL('/kasir', request.url))
    }

    const rules: Record<string, string[]> = {
      '/admin': ['pemilik'],
      '/settings': ['pemilik'],
      '/laporan': ['pemilik', 'apoteker'],
      '/obat': ['pemilik', 'apoteker'],
    }
    for (const [route, allowed] of Object.entries(rules)) {
      if (pathname.startsWith(route) && !allowed.includes(role!)) {
        return NextResponse.redirect(
          new URL(['kasir_magang', 'kasir_senior'].includes(role!) ? '/kasir' : '/', request.url)
        )
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
