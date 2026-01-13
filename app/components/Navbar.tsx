'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AdminNav() {
  const pathname = usePathname()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const links = [
    { name: '📊 Reportes', href: '/admin/reportes' },
    { name: '👥 Usuarios', href: '/admin/usuarios' },
  ]

  return (
    <nav className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center shadow-2xl">
      <div className="flex items-center gap-8">
        <span className="text-blue-400 font-black tracking-tighter text-xl mr-4">PROACEITES</span>
        <div className="flex gap-6">
          {links.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                pathname === link.href ? 'text-white border-b-2 border-blue-500 pb-1' : 'text-slate-400 hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>
      <button 
        onClick={handleLogout}
        className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all"
      >
        Salir
      </button>
    </nav>
  )
}