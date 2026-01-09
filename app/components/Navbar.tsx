'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Navbar() {
  const pathname = usePathname()
  const [rol, setRol] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 1. No mostrar el Navbar en la pantalla de Login (página principal '/')
  if (pathname === '/') return null;

  useEffect(() => {
    const obtenerRol = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data, error } = await supabase
            .from('empleados')
            .select('rol_empresa')
            .eq('id', user.id)
            .single()
          
          if (data) setRol(data.rol_empresa)
        }
      } catch (err) {
        console.error("Error obteniendo rol:", err)
      } finally {
        setLoading(false)
      }
    }
    obtenerRol()
  }, [pathname]) // Se actualiza si cambia la ruta

  // 2. Definición de permisos por Rol
  const menuItems = [
    { 
      name: 'Asistencia', 
      path: '/dashboard', 
      icon: '⏱️', 
      roles: ['Supervisor', 'Operario', 'Vendedor', 'Varios'] 
    },
    { 
      name: 'Personal', 
      path: '/admin/empleados', 
      icon: '👥', 
      roles: ['Supervisor'] 
    },
    { 
      name: 'Reportes', 
      path: '/admin/reportes', 
      icon: '📊', 
      roles: ['Supervisor', 'Operario', 'Vendedor', 'Varios'] 
    },
  ]

  // Mientras carga el rol, mostramos una barra vacía para evitar saltos visuales
  if (loading) return <div className="fixed bottom-0 w-full h-16 bg-white border-t border-gray-100" />;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      {menuItems.map((item) => {
        // Lógica de visualización:
        // Si el rol del usuario actual NO está en la lista de permitidos del ítem, no se renderiza
        if (rol && !item.roles.includes(rol)) return null

        const isActive = pathname === item.path

        return (
          <Link key={item.path} href={item.path} className="flex flex-col items-center transition-all active:scale-90">
            <span className={`text-2xl transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}>
              {item.icon}
            </span>
            <span className={`text-[10px] font-black uppercase mt-1 tracking-tighter ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
              {item.name}
            </span>
            {isActive && (
              <div className="w-1 h-1 bg-blue-600 rounded-full mt-1 animate-pulse" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}