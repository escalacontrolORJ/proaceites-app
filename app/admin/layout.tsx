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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header con botón Salir */}
      <header className="bg-blue-600 text-white h-16 flex items-center justify-between px-6 sticky top-0 z-50 shadow-md">
        <span className="font-bold">PROACEITES ADMIN</span>
        <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded text-xs font-bold uppercase">
          Salir
        </button>
      </header>

      {/* Contenido */}
      <main className="flex-1 p-4 pb-24">
        {children}
      </main>

      {/* BARRA DE NAVEGACIÓN (Los botones que necesitas) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 h-20 flex justify-around items-center z-50">
        <button onClick={() => router.push('/admin/dashboard')} className="flex flex-col items-center">
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-bold">INICIO</span>
        </button>
        <button onClick={() => router.push('/admin/usuarios')} className="flex flex-col items-center">
          <span className="text-xl">👥</span>
          <span className="text-[10px] font-bold">USUARIOS</span>
        </button>
        <button onClick={() => router.push('/admin/asistencia')} className="flex flex-col items-center">
          <span className="text-xl">⏱️</span>
          <span className="text-[10px] font-bold">MARCAS</span>
        </button>
        <button onClick={() => router.push('/admin/reportes')} className="flex flex-col items-center">
          <span className="text-xl">📊</span>
          <span className="text-[10px] font-bold">REPORTES</span>
        </button>
      </nav>
    </div>
  )
}