'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Revisar si hay usuario activo
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Si no hay sesión, al login
        router.push('/login')
      } else {
        setSession(session)
        setLoading(false)
      }
    }
    checkUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const menu = [
    { n: 'Inicio', p: '/admin/dashboard', i: '🏠' },
    { n: 'Usuarios', p: '/admin/usuarios', i: '👥' },
    { n: 'Marcas', p: '/admin/asistencia', i: '⏱️' },
    { n: 'Reportes', p: '/admin/reportes', i: '📊' }
  ]

  // Mientras revisa la sesión, mostramos pantalla de carga
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="font-bold text-blue-600 animate-pulse">VERIFICANDO SESIÓN...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-blue-600 text-white h-16 flex items-center justify-between px-6 sticky top-0 z-[999] shadow-md">
        <span className="font-bold uppercase tracking-tighter">PROACEITES</span>
        <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase">
          Salir
        </button>
      </header>

      <main className="flex-1 p-4 pb-28">
        <div className="max-w-md mx-auto">{children}</div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-20 flex justify-around items-center z-[999] shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
        {menu.map((item) => {
          const isActive = pathname === item.p
          return (
            <button
              key={item.p}
              onClick={() => router.push(item.p)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <span className="text-2xl">{item.i}</span>
              <span className="text-[9px] font-bold uppercase">{item.n}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}