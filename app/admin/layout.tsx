'use client'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const menu = [
    { name: 'Inicio', path: '/admin/dashboard', icon: '🏠' },
    { name: 'Usuarios', path: '/admin/usuarios', icon: '👥' },
    { name: 'Marcas', path: '/admin/asistencia', icon: '⏱️' },
    { name: 'Reportes', path: '/admin/reportes', icon: '📊' },
  ]

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* HEADER SUPERIOR - Z-INDEX ALTO */}
      <header className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-[999] shadow-sm">
        <span className="font-black text-blue-600">PROACEITES</span>
        <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold">
          SALIR
        </button>
      </header>

      {/* CONTENIDO (La tarjeta blanca de tu foto) */}
      <main className="flex-1 p-4 pb-32">
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </main>

      {/* NAV INFERIOR - Z-INDEX ALTO PARA QUE NO LO TAPE NADA */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-20 flex justify-around items-center z-[999] shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
        {menu.map((item) => {
          const active = pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 ${active ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-[10px] font-bold uppercase">{item.name}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}