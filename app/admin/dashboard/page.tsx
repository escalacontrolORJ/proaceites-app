'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ clientes: 0, visitas: 0 })
  const router = useRouter()

  useEffect(() => {
    async function validarYEntrar() {
      // 1. Verificación manual de sesión (reemplaza al middleware)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        window.location.href = '/login'
        return
      }

      // 2. Carga de datos si hay sesión
      try {
        const { count: cClientes } = await supabase.from('clientes').select('*', { count: 'exact', head: true })
        const { count: cVisitas } = await supabase.from('visitas').select('*', { count: 'exact', head: true })
        setStats({ clientes: cClientes || 0, visitas: cVisitas || 0 })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    validarYEntrar()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="pb-24">
      {/* Tu diseño de Panel de Control que ya se ve bien en la foto */}
      <header className="mb-8">
        <h1 className="text-3xl font-black text-blue-900 uppercase">Panel de Control</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proaceites App v1.0</p>
      </header>
      
      {/* ... resto del código del dashboard ... */}
    </div>
  )
}