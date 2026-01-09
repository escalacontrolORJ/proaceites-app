'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient' 

export default function Navbar() {
  const pathname = usePathname()
  const [rol, setRol] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function obtenerRol() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('empleados')
            .select('rol_empresa')
            .eq('id', user.id)
            .single()
          if (data) setRol(data.rol_empresa)
        }
      } catch (e) {
        console.error("Error en Navbar:", e)
      } finally {
        setLoading(false)
      }
    }
    obtenerRol()
  }, [pathname])

  // Oculta el menú en la pantalla de login o mientras carga
  if (pathname === '/' || loading) return null

  const menuItems = [
    { name: 'Asistencia', path: '/dashboard', icon: '⏱️', roles: ['Supervisor', 'Operario', 'Vendedor', 'Varios'] },
    { name: 'Personal', path: '/admin/empleados', icon: '👥', roles: ['Supervisor'] },
    { name: 'Reportes', path: '/admin/reportes', icon: '📊', roles: ['Supervisor', 'Operario', 'Vendedor', 'Varios'] },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] text-black">
      {menuItems.map((item) => {
        // Filtro de seguridad por rol
        if (rol && !item.roles.includes(rol)) return null
        
        const isActive = pathname === item.path
        
        return (
          <Link key={item.path} href={item.path} className="flex flex-col items-center">
            <span className={`text-2xl ${isActive ? 'opacity-100' : 'opacity-40'}`}>
              {item.icon}
            </span>
            <span className={`text-[10px] font-black uppercase mt-1 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
              {item.name}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}