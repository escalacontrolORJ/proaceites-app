import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Usamos las variables directamente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Revisamos la sesión a través de las cookies
  const authCookie = req.cookies.get('sb-access-token') || req.cookies.get('supabase-auth-token')

  // Si intenta entrar a /admin y NO hay rastro de sesión, al login
  if (!authCookie && req.nextUrl.pathname.startsWith('/admin')) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*'],
}