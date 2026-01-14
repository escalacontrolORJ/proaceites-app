'use client'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Usuarios', path: '/admin/usuarios' },
    { name: 'Marcaciones', path: '/admin/asistencia' },
    { name: 'Ventas / Visitas', path: '/admin/visitas' },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // window.location.href asegura que regreses al login de forma limpia
    window.location.href = '/login'
  }

  return (
    <nav className="flex flex-col h-screen w-64 bg-slate-900 text-white fixed left-0 top-0 border-r border-slate-800">
      <div className="p-6">
        <h2 className="text-xl font-bold text-blue-400">ProAceites</h2>
        <p className="text-xs text-slate-500">Panel Administrativo</p>
      </div>

      <div className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              pathname === item.path 
              ? 'bg-blue-600 text-white' 
              : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 font-bold transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    </nav>
  )
}