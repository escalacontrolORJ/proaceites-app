'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ clientes: 0, visitas: 0 })

  useEffect(() => {
    async function loadInitialData() {
      try {
        // Intentamos cargar conteos básicos para verificar conexión
        const { count: countClientes } = await supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })

        const { count: countVisitas } = await supabase
          .from('visitas')
          .select('*', { count: 'exact', head: true })

        setStats({
          clientes: countClientes || 0,
          visitas: countVisitas || 0
        })
      } catch (error) {
        console.error("Error cargando dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Iniciando Panel...</p>
      </div>
    )
  }

  return (
    <div className="pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-blue-900 uppercase leading-none">Panel de<br/>Control</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[3px] mt-2">Proaceites App v1.0</p>
      </header>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-600 p-6 rounded-[35px] text-white shadow-xl shadow-blue-200">
          <span className="text-2xl mb-2 block">🏪</span>
          <h3 className="text-3xl font-black">{stats.clientes}</h3>
          <p className="text-[9px] font-bold uppercase opacity-80">Clientes Totales</p>
        </div>
        <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm">
          <span className="text-2xl mb-2 block">📍</span>
          <h3 className="text-3xl font-black text-slate-800">{stats.visitas}</h3>
          <p className="text-[9px] font-bold uppercase text-slate-400">Visitas Hoy</p>
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div className="space-y-3">
        <h2 className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Acciones Rápidas</h2>
        
        <button 
          onClick={() => window.location.href = '/admin/asistencia'}
          className="w-full bg-white p-5 rounded-[25px] border border-slate-100 flex items-center justify-between group active:scale-95 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-xl">📸</div>
            <div className="text-left">
              <p className="font-black text-slate-800 uppercase text-sm">Registrar Visita</p>
              <p className="text-[10px] text-slate-400 font-bold">Foto + GPS + Recaudo</p>
            </div>
          </div>
          <span className="text-slate-300 group-hover:text-blue-600">→</span>
        </button>

        <button 
          onClick={() => window.location.href = '/admin/clientes'}
          className="w-full bg-white p-5 rounded-[25px] border border-slate-100 flex items-center justify-between group active:scale-95 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-xl">🤝</div>
            <div className="text-left">
              <p className="font-black text-slate-800 uppercase text-sm">Nuevo Cliente</p>
              <p className="text-[10px] text-slate-400 font-bold">Dar de alta local</p>
            </div>
          </div>
          <span className="text-slate-300 group-hover:text-blue-600">→</span>
        </button>
      </div>
    </div>
  )
}