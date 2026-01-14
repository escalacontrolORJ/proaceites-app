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

  const menuItems = [
    { name: 'Inicio', path: '/admin/dashboard', icon: '🏠' },
    { name: 'Usuarios', path: '/admin/usuarios', icon: '👥' },
    { name: 'Marcas', path: '/admin/asistencia', icon: '⏱️' },
    { name: 'Reportes', path: '/admin/reportes', icon: '📊' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* HEADER SUPERIOR */}
      <header className="bg-blue-600 text-white h-16 flex items-center justify-between px-6 sticky top-0 z-50 shadow-md">
        <span className="font-bold tracking-tight">PROACEITES ADMIN</span>
        <button 
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors"
        >
          Salir
        </button>
      </header>

      {/* CONTENIDO DE LAS PÁGINAS (Aquí es donde ves el ingreso/salida) */}
      <main className="flex-1 p-4 pb-32 overflow-y-auto">
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </main>

      {/* BARRA DE NAVEGACIÓN INFERIOR (Los botones que te faltan) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-20 flex justify-around items-center z-50 px-2 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
              pathname === item.path ? 'text-blue-600 border-t-2 border-blue-600 bg-blue-50' : 'text-gray-400'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}