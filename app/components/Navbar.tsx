'use client'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { name: 'Usuarios', path: '/admin/usuarios', icon: '👥' },
    { name: 'Marcaciones', path: '/admin/asistencia', icon: '⏱️' },
    { name: 'Ventas / Visitas', path: '/admin/visitas', icon: '📍' },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <nav className="flex flex-col h-screen w-72 bg-[#0f172a] text-slate-300 fixed left-0 top-0 border-r border-slate-800 shadow-2xl">
      {/* Header del Menu */}
      <div className="p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">P</div>
          <h2 className="text-xl font-bold text-white tracking-tight">ProAceites</h2>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Administración v2.0</p>
      </div>

      {/* Enlaces del Menu */}
      <div className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                : 'hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <span className={`text-xl ${isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`}>
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.name}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></div>}
            </button>
          )
        })}
      </div>

      {/* Botón Salir Estilizado */}
      <div className="p-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 border border-transparent hover:border-red-500/20"
        >
          <span className="text-xl">🚪</span>
          <span className="font-semibold text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  )
}