'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ clientes: 0, visitas: 0 })
  const router = useRouter()

  useEffect(() => {
    async function cargarDashboard() {
      try {
        // 1. Intentamos obtener la sesión pero no bloqueamos el renderizado
        const { data: { session } } = await supabase.auth.getSession()
        
        // Solo si estamos 100% seguros de que NO hay sesión, mandamos al login
        if (!session) {
          console.log("No se detectó sesión activa");
          // Si prefieres que el dashboard sea público por ahora para evitar fallos, comenta la línea de abajo
          // window.location.href = '/login' 
        }

        // 2. Carga de estadísticas
        const { count: cClientes, error: errC } = await supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
        
        const { count: cVisitas, error: errV } = await supabase
          .from('visitas')
          .select('*', { count: 'exact', head: true })

        if (!errC && !errV) {
          setStats({
            clientes: cClientes || 0,
            visitas: cVisitas || 0
          })
        }
      } catch (err) {
        console.error("Error en dashboard:", err)
      } finally {
        setLoading(false)
      }
    }

    cargarDashboard()
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Sincronizando...</p>
    </div>
  )

  return (
    <div className="pb-24 p-5 max-w-md mx-auto animate-in fade-in duration-500">
      <header className="mb-10 pt-4">
        <h1 className="text-4xl font-black text-blue-900 uppercase leading-[0.8]">Panel de<br/><span className="text-blue-500">Control</span></h1>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[4px] mt-4 italic">Proaceites App v1.0</p>
      </header>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-blue-600 p-6 rounded-[40px] text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-4xl font-black mb-1">{stats.clientes}</h3>
            <p className="text-[10px] font-bold uppercase opacity-70">Clientes</p>
          </div>
          <span className="absolute -right-2 -bottom-2 text-6xl opacity-10">🏪</span>
        </div>
        
        <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-4xl font-black text-slate-800 mb-1">{stats.visitas}</h3>
            <p className="text-[10px] font-bold uppercase text-slate-400">Visitas</p>
          </div>
          <span className="absolute -right-2 -bottom-2 text-6xl opacity-10">📍</span>
        </div>
      </div>

      {/* Menú de Acciones */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Operaciones de hoy</h2>
        
        <button 
          onClick={() => router.push('/admin/asistencia')}
          className="w-full bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all"
        >
          <div className="flex items-center gap-5">
            <div className="bg-orange-100 w-16 h-16 rounded-[25px] flex items-center justify-center text-3xl">📍</div>
            <div className="text-left">
              <p className="font-black text-slate-800 uppercase text-base tracking-tight">Registrar Visita</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Foto + GPS + Cobro</p>
            </div>
          </div>
          <span className="text-slate-300 group-hover:text-blue-600 transition-colors">→</span>
        </button>

        <button 
          onClick={() => router.push('/admin/clientes')}
          className="w-full bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all"
        >
          <div className="flex items-center gap-5">
            <div className="bg-blue-50 w-16 h-16 rounded-[25px] flex items-center justify-center text-3xl">👥</div>
            <div className="text-left">
              <p className="font-black text-slate-800 uppercase text-base tracking-tight">Mis Clientes</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Gestión de locales</p>
            </div>
          </div>
          <span className="text-slate-300 group-hover:text-blue-600 transition-colors">→</span>
        </button>
      </div>

      {/* Botón Cerrar Sesión (Opcional pero útil) */}
      <div className="mt-12 text-center">
        <button 
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = '/login';
          }}
          className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-red-400 transition-colors"
        >
          ✕ Cerrar Sesión segura
        </button>
      </div>
    </div>
  )
}