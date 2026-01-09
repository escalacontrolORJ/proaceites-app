'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  // Definimos los links del menú
  const menuItems = [
    { name: 'Asistencia', path: '/dashboard', icon: '⏱️' },
    { name: 'Personal', path: '/admin/empleados', icon: '👥' },
    { name: 'Reportes', path: '/admin/reportes', icon: '📊' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      {menuItems.map((item) => (
        <Link key={item.path} href={item.path} className="flex flex-col items-center">
          <span className="text-2xl">{item.icon}</span>
          <span className={`text-[10px] font-black uppercase mt-1 ${pathname === item.path ? 'text-blue-600' : 'text-gray-400'}`}>
            {item.name}
          </span>
          {pathname === item.path && <div className="w-1 h-1 bg-blue-600 rounded-full mt-1"></div>}
        </Link>
      ))}
    </nav>
  )
}