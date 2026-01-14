'use client'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { name: 'Inicio', path: '/admin/dashboard', icon: '🏠' },
    { name: 'Usuarios', path: '/admin/usuarios', icon: '👤' },
    { name: 'Marcas', path: '/admin/asistencia', icon: '⏱️' },
    { name: 'Reportes', path: '/admin/reportes', icon: '📊' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 h-20 px-6 flex items-center justify-between z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
      {menuItems.map((item) => {
        const isActive = pathname === item.path
        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className="flex flex-col items-center gap-1 transition-all active:scale-90"
          >
            <div className={`w-12 h-8 flex items-center justify-center rounded-2xl transition-colors ${isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}>
              <span className="text-xl">{item.icon}</span>
            </div>
            <span className={`text-[10px] font-bold ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
              {item.name}
            </span>
          </button>
        )
      })}
    </nav>
  )
}