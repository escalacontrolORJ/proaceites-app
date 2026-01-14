'use client'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { name: 'Inicio', path: '/admin/dashboard', icon: '🏠' },
    { name: 'Usuarios', path: '/admin/usuarios', icon: '👥' },
    { name: 'Marcar', path: '/admin/asistencia', icon: '⏱️' },
    { name: 'Ventas', path: '/admin/visitas', icon: '📍' },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Barra Superior (Header) */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b h-16 flex items-center justify-between px-6 z-50">
        <h1 className="font-bold text-xl text-blue-600">ProAceites</h1>
        <button onClick={handleLogout} className="text-sm font-medium text-red-500 bg-red-50 px-3 py-1 rounded-full">
          Salir
        </button>
      </header>

      {/* Barra Inferior (Navegación Móvil) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-20 px-4 pb-2 flex items-center justify-around z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {menuItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center justify-center flex-1 gap-1"
            >
              <span className={`text-2xl transition-transform ${isActive ? 'scale-125' : 'opacity-50'}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                {item.name}
              </span>
              {isActive && <div className="w-1 h-1 bg-blue-600 rounded-full mt-0.5"></div>}
            </button>
          )
        })}
      </nav>
    </>
  )
}