'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ clientes: 0, visitas: 0 })
  const router = useRouter()

  useEffect(() => {
    async function cargarDatos() {
      try {
        // Consultamos datos reales de Supabase
        const { count: cClientes } = await supabase.from('clientes').select('*', { count: 'exact', head: true })
        const { count: cVisitas } = await supabase.from('visitas').select('*', { count: 'exact', head: true })
        
        setStats({
          clientes: cClientes || 0,
          visitas: cVisitas || 0
        })
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    cargarDatos()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 pb-24 p-6">
      {/* CABECERA NUEVA */}
      <header className="mb-8 pt-4">
        <h1 className="text-4xl font-black text-blue-900 uppercase leading-[0.8]">Panel de<br/><span className="text-blue-500">Control</span></h1>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[4px] mt-4">Proaceites App v1.2</p>
      </header>

      {/* TARJETAS CON DATOS REALES */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-600 p-6 rounded-[40px] shadow-xl text-white">
          <h3 className="text-4xl font-black">{stats.clientes}</h3>
          <p className="text-[10px] font-bold uppercase opacity-70">Clientes</p>
        </div>
        <div className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-100">
          <h3 className="text-4xl font-black text-slate-800">{stats.visitas}</h3>
          <p className="text-[10px] font-bold uppercase text-slate-400">Visitas Hoy</p>
        </div>
      </div>

      {/* BOTONES DE ACCIÓN (ESTOS SÍ FUNCIONAN) */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Menú de Campo</h2>
        
        <button 
          onClick={() => router.push('/admin/asistencia')}
          className="w-full bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm flex items-center gap-5 active:scale-95 transition-all"
        >
          <div className="bg-orange-100 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl">📍</div>
          <div className="text-left">
            <p className="font-black text-slate-800 uppercase text-sm">Registrar Visita</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">GPS + FOTO</p>
          </div>
        </button>

        <button 
          onClick={() => router.push('/admin/clientes')}
          className="w-full bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm flex items-center gap-5 active:scale-95 transition-all"
        >
          <div className="bg-blue-100 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl">👥</div>
          <div className="text-left">
            <p className="font-black text-slate-800 uppercase text-sm">Mis Clientes</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Ver / Editar</p>
          </div>
        </button>
      </div>

      {/* BARRA DE NAVEGACIÓN INFERIOR (OPCIONAL) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 flex justify-around items-center">
        <button onClick={() => router.push('/admin/dashboard')} className="text-blue-600 font-bold text-[10px] uppercase">Inicio</button>
        <button onClick={() => router.push('/admin/asistencia')} className="text-slate-400 font-bold text-[10px] uppercase">Visitas</button>
        <button onClick={() => router.push('/admin/clientes')} className="text-slate-400 font-bold text-[10px] uppercase">Clientes</button>
      </nav>
    </div>
  )
}