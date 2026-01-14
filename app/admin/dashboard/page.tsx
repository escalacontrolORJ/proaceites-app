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
        const { count: cClientes } = await supabase.from('clientes').select('*', { count: 'exact', head: true })
        const { count: cVisitas } = await supabase.from('visitas').select('*', { count: 'exact', head: true })
        
        setStats({
          clientes: cClientes || 0,
          visitas: cVisitas || 0
        })
      } catch (err) {
        console.error("Error cargando estadísticas:", err)
      } finally {
        setLoading(false)
      }
    }
    cargarDashboard()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="pb-24 p-5 max-w-md mx-auto">
      <header className="mb-10 pt-4 text-center">
        <h1 className="text-4xl font-black text-blue-900 uppercase leading-none">Panel de<br/>Control</h1>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[4px] mt-4">Proaceites App v1.0</p>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-blue-600 p-6 rounded-[40px] text-white shadow-xl">
          <h3 className="text-4xl font-black mb-1">{stats.clientes}</h3>
          <p className="text-[10px] font-bold uppercase opacity-70">Clientes</p>
        </div>
        <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm">
          <h3 className="text-4xl font-black text-slate-800 mb-1">{stats.visitas}</h3>
          <p className="text-[10px] font-bold uppercase text-slate-400">Visitas</p>
        </div>
      </div>

      <div className="space-y-4">
        <button onClick={() => router.push('/admin/asistencia')} className="w-full bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm flex items-center justify-between active:scale-95 transition-all">
          <div className="flex items-center gap-5">
            <div className="bg-orange-100 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl">📍</div>
            <p className="font-black text-slate-800 uppercase text-sm">Registrar Visita</p>
          </div>
          <span className="text-slate-300">→</span>
        </button>

        <button onClick={() => router.push('/admin/clientes')} className="w-full bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm flex items-center justify-between active:scale-95 transition-all">
          <div className="flex items-center gap-5">
            <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl">👥</div>
            <p className="font-black text-slate-800 uppercase text-sm">Mis Clientes</p>
          </div>
          <span className="text-slate-300">→</span>
        </button>
      </div>
    </div>
  )
}