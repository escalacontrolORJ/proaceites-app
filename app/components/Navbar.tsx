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

  // Definición de ítems del menú con sus respectivos iconos y permisos
  const menuItems = [
    { 
      name: 'Asistencia', 
      path: '/dashboard', 
      icon: '⏱️', 
      roles: ['Supervisor', 'Operario', 'Vendedor', 'Varios'] 
    },
    { 
      name: 'Ventas', 
      path: '/visitas/registrar', 
      icon: '📍', 
      roles: ['Vendedor', 'Supervisor'] 
    },
    { 
      name: 'Agenda', 
      path: '/admin/proximas-visitas', 
      icon: '📅', 
      roles: ['Vendedor', 'Supervisor'] 
    },
    { 
      name: 'Reportes', 
      path: '/admin/reportes', 
      icon: '📊', 
      roles: ['Supervisor'] 
    },
    { 
      name: 'Clientes', 
      path: '/admin/clientes', 
      icon: '🏢', 
      roles: ['Supervisor'] 
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-3 flex justify-around items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] text-black">
      {menuItems.map((item) => {
        // Filtro de seguridad por rol: solo muestra el botón si el rol del usuario está permitido
        if (rol && !item.roles.includes(rol)) return null
        
        const isActive = pathname === item.path
        
        return (
          <Link key={item.path} href={item.path} className="flex flex-col items-center flex-1 transition-all active:scale-90">
            <span className={`text-xl transition-all ${isActive ? 'scale-110 opacity-100' : 'opacity-30'}`}>
              {item.icon}
            </span>
            <span className={`text-[9px] font-black uppercase mt-1 tracking-tighter truncate ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
              {item.name}
            </span>
            {isActive && (
              <div className="w-1 h-1 bg-blue-600 rounded-full mt-0.5" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}