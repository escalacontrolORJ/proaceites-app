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

  // Definimos los accesos aquí mismo para que no fallen
  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { name: 'Usuarios', path: '/admin/usuarios', icon: '👥' },
    { name: 'Marcaciones', path: '/admin/asistencia', icon: '⏱️' },
    { name: 'Reportes', path: '/admin/reportes', icon: '📁' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* HEADER: BOTÓN SALIR SIEMPRE VISIBLE */}
      <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-50">
        <h1 className="font-bold text-lg text-blue-700">PROACEITES ADMIN</h1>
        <button 
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md active:bg-red-700"
        >
          SALIR
        </button>
      </header>

      {/* CUERPO DE LA APP */}
      <main className="flex-1 p-4 pb-24">
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </main>

      {/* MENÚ DE NAVEGACIÓN: TODOS LOS BOTONES QUE PERDISTE */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-20 flex justify-around items-center z-50 px-2 shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
              pathname === item.path ? 'bg-blue-50 text-blue-600 border-t-4 border-blue-600' : 'text-gray-500'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-[10px] font-bold uppercase mt-1">{item.name}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}