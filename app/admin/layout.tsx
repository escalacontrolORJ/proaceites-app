'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const menu = [
    { name: 'Inicio', path: '/admin/dashboard', icon: '🏠' },
    { name: 'Visitas', path: '/admin/asistencia', icon: '📍' },
    { name: 'Clientes', path: '/admin/clientes', icon: '🏪' },
    { name: 'Personal', path: '/admin/usuarios', icon: '👥' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Contenido de la página */}
      <main className="p-4 pb-28 max-w-lg mx-auto">
        {children}
      </main>

      {/* Menú Inferior Estilo App */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 h-20 flex justify-around items-center z-[5000] px-2 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        {menu.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex flex-col items-center justify-center w-full h-full transition-all ${
                isActive ? 'text-blue-600 scale-110' : 'text-slate-400'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className={`text-[10px] font-black uppercase tracking-tighter ${
                isActive ? 'opacity-100' : 'opacity-60'
              }`}>
                {item.name}
              </span>
              {isActive && (
                <div className="absolute bottom-2 w-1 h-1 bg-blue-600 rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}