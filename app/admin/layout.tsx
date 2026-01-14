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
    { n: 'Inicio', p: '/admin/dashboard', i: '🏠' },
    { n: 'Usuarios', p: '/admin/usuarios', i: '👤' },
    { n: 'Marcas', p: '/admin/asistencia', i: '⏱️' },
    { n: 'Reportes', p: '/admin/reportes', i: '📊' }
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* HEADER SUPERIOR */}
      <header className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-50">
        <span className="font-bold text-blue-600">PROACEITES</span>
        <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-bold">
          SALIR
        </button>
      </header>

      {/* CONTENIDO */}
      <main className="flex-1 p-4 pb-28">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-4 min-h-[300px]">
          {children}
        </div>
      </main>

      {/* BOTONES DE ADMINISTRACIÓN (Inferiores para celular) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t h-20 flex justify-around items-center z-50 shadow-2xl">
        {menu.map((item) => (
          <button 
            key={item.p} 
            onClick={() => router.push(item.p)}
            className={`flex flex-col items-center gap-1 transition-all ${pathname === item.p ? 'text-blue-600 scale-110' : 'text-gray-400'}`}
          >
            <span className="text-2xl">{item.icon || item.i}</span>
            <span className="text-[10px] font-bold">{item.n}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}