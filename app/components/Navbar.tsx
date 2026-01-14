'use client'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { name: 'Inicio', path: '/admin/dashboard', icon: '🏠' },
    { name: 'Usuarios', path: '/admin/usuarios', icon: '👥' },
    { name: 'Marcas', path: '/admin/asistencia', icon: '⏱️' },
    { name: 'Ventas', path: '/admin/visitas', icon: '📍' },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Header Superior fijo */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b h-14 flex items-center justify-between px-4 z-50">
        <span className="font-black text-blue-600 tracking-tight">PROACEITES</span>
        <button onClick={handleLogout} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full">
          SALIR
        </button>
      </header>

      {/* Menú Inferior Estilo App */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex items-center justify-around z-50 pb-safe">
        {menuItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center justify-center w-full h-full"
            >
              <span className={`text-xl ${isActive ? 'scale-110' : 'grayscale opacity-50'}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] mt-1 font-bold ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                {item.name}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}