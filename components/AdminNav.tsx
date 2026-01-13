'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminNav() {
  const pathname = usePathname()

  const linkStyle = (path: string) => `
    px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all
    ${pathname === path 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
      : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}
  `

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-xl">P</span>
          </div>
          <span className="font-black tracking-tighter text-xl">PROACEITES</span>
        </div>

        <div className="flex gap-4">
          <Link href="/admin/reportes" className={linkStyle('/admin/reportes')}>
            📊 Reportes
          </Link>
          
          <Link href="/admin/usuarios" className={linkStyle('/admin/usuarios')}>
            👥 Usuarios
          </Link>
        </div>

        <Link href="/login" className="text-[10px] font-black text-red-400 uppercase tracking-widest">
          Salir
        </Link>

      </div>
    </nav>
  )
}