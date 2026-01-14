'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [stats, setStats] = useState({ clientes: 0, visitas: 0 })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function cargarDatos() {
      const { count: c } = await supabase.from('clientes').select('*', { count: 'exact', head: true })
      const { count: v } = await supabase.from('visitas').select('*', { count: 'exact', head: true })
      setStats({ clientes: c || 0, visitas: v || 0 })
      setLoading(false)
    }
    cargarDatos()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24 font-sans">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-blue-900 uppercase">Panel de Control</h1>
        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Sistema Proaceites v2.0</p>
      </header>

      {/* Botón Principal de Registro */}
      <button 
        onClick={() => router.push('/admin/asistencia')}
        className="w-full bg-blue-600 text-white p-8 rounded-[35px] shadow-2xl shadow-blue-200 flex flex-col items-center justify-center mb-8 active:scale-95 transition-all"
      >
        <span className="text-5xl mb-2">📸</span>
        <span className="text-xl font-black uppercase">Registrar Visita</span>
        <span className="text-[10px] font-bold opacity-70 uppercase mt-1">Ingreso con Foto y GPS</span>
      </button>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[30px] border border-slate-100">
          <p className="text-3xl font-black text-slate-800">{loading ? '...' : stats.clientes}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">Mis Clientes</p>
        </div>
        <div className="bg-white p-6 rounded-[30px] border border-slate-100">
          <p className="text-3xl font-black text-slate-800">{loading ? '...' : stats.visitas}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">Visitas Hoy</p>
        </div>
      </div>

      {/* Botón secundario para Clientes */}
      <button 
        onClick={() => router.push('/admin/clientes')}
        className="w-full mt-4 bg-white p-5 rounded-[25px] border border-slate-100 flex items-center justify-between font-black text-slate-700 uppercase text-xs"
      >
        <span>🤝 Ver Directorio</span>
        <span className="text-slate-300">→</span>
      </button>
    </div>
  )
}