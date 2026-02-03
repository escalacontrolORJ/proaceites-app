'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Menú actualizado con los nuevos reportes solicitados
  const menu = [
    { name: 'Inicio', path: '/admin/dashboard', icon: '🏠' },
    { name: 'Asistencia', path: '/admin/reportes', icon: '📋' },
    { name: 'Gestión', path: '/admin/reportes-visitas', icon: '💼' }, // Acceso a visitas/cobros
    { name: 'Agenda', path: '/admin/proximas-visitas', icon: '⏳' },  // Acceso a planificación
    { name: 'Personal', path: '/admin/usuarios', icon: '👥' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <main className="p-4 pb-32 max-w-lg mx-auto">
        {children}
      </main>

      {/* Barra de Navegación Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-20 flex justify-around items-center z-[9999] px-2 shadow-2xl">
        {menu.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              className="flex flex-col items-center justify-center w-full"
            >
              <span className={`text-xl transition-all ${isActive ? 'scale-125' : 'grayscale opacity-50'}`}>
                {item.icon}
              </span>
              <span className={`text-[9px] font-black uppercase mt-1 tracking-tighter ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                {item.name}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-blue-600 rounded-b-full" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}