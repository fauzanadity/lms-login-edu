import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT add logic between createServerClient and getUser()
  // This refreshes the session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Admin path (hidden, non-obvious path)
  const ADMIN_PATH = '/geheime-verwaltung'
  const isAdminRoute = pathname.startsWith(ADMIN_PATH)
  const isAdminLogin = pathname === `${ADMIN_PATH}/login`

  // Student protected routes
  const studentProtectedPrefixes = ['/dashboard', '/materials', '/exercises', '/tryouts', '/notifications', '/profile']
  const isStudentRoute = studentProtectedPrefixes.some((prefix) => pathname.startsWith(prefix))

  // Auth pages
  const isAuthPage = pathname === '/login' || pathname === '/register'

  // If not logged in and trying to access protected student route → redirect to login
  if (!user && isStudentRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // If not logged in and trying to access admin route (not admin login) → redirect to admin login
  if (!user && isAdminRoute && !isAdminLogin) {
    const url = request.nextUrl.clone()
    url.pathname = `${ADMIN_PATH}/login`
    return NextResponse.redirect(url)
  }

  // If logged in and on auth page → redirect to dashboard
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
