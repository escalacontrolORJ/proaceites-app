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
    { name: 'Reportes', path: '/admin/reportes', icon: '📊' }, // REPORTE RECUPERADO
    { name: 'Personal', path: '/admin/usuarios', icon: '👥' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <main className="p-4 pb-32 max-w-lg mx-auto">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-20 flex justify-around items-center z-[9999] px-2 shadow-2xl">
        {menu.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link key={item.path} href={item.path} className="flex flex-col items-center justify-center w-full">
              <span className={`text-xl transition-all ${isActive ? 'scale-125' : 'grayscale'}`}>{item.icon}</span>
              <span className={`text-[9px] font-black uppercase mt-1 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}