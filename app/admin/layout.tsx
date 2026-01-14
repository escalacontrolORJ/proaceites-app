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
    { n: 'Inicio', p: '/admin/dashboard', i: '📊' },
    { n: 'Usuarios', p: '/admin/usuarios', i: '👥' },
    { n: 'Marcas', p: '/admin/asistencia', i: '⏱️' },
    { n: 'Reportes', p: '/admin/reportes', i: '📁' }
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-blue-700 text-white h-16 flex items-center justify-between px-6 sticky top-0 z-50 shadow-lg">
        <span className="font-black tracking-tighter">PROACEITES</span>
        <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded-md text-[10px] font-bold">SALIR</button>
      </header>

      <main className="flex-1 p-4 pb-28">
        <div className="max-w-md mx-auto">{children}</div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t h-20 flex justify-around items-center z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        {menu.map((item) => (
          <button 
            key={item.p} 
            onClick={() => router.push(item.p)}
            className={`flex flex-col items-center gap-1 ${pathname === item.p ? 'text-blue-700 font-bold' : 'text-slate-400'}`}
          >
            <span className="text-2xl">{item.i}</span>
            <span className="text-[10px] uppercase">{item.n}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}