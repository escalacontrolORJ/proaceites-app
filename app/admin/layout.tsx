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
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* BARRA SUPERIOR */}
      <div className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-50">
        <span className="font-black text-blue-600">PROACEITES</span>
        <button onClick={handleLogout} className="text-xs bg-red-500 text-white px-3 py-1 rounded-full font-bold">
          SALIR
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="p-4 max-w-md mx-auto">
        {children}
      </div>

      {/* MENÚ INFERIOR (BOTONES DE ADMINISTRACIÓN) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t h-20 flex justify-around items-center z-50 shadow-lg">
        {menu.map((item) => (
          <button 
            key={item.p} 
            onClick={() => router.push(item.p)}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-2xl">{item.i}</span>
            <span className={`text-[10px] font-bold ${pathname === item.p ? 'text-blue-600' : 'text-gray-400'}`}>
              {item.n.toUpperCase()}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}