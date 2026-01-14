'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [stats, setStats] = useState({ clientes: 0, visitas: 0 })

  useEffect(() => {
    async function cargarDatosRapido() {
      try {
        setLoading(true)
        // Intentamos una consulta simple a clientes para ver si hay conexión
        const { count: cClientes, error: errC } = await supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
        
        const { count: cVisitas, error: errV } = await supabase
          .from('visitas')
          .select('*', { count: 'exact', head: true })

        if (errC) throw errC

        setStats({
          clientes: cClientes || 0,
          visitas: cVisitas || 0
        })
      } catch (err: any) {
        console.error("Error conexión:", err)
        setErrorMsg(err.message)
      } finally {
        setLoading(false)
      }
    }
    cargarDatosRapido()
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-black uppercase text-[10px] tracking-[4px]">Sincronizando...</p>
    </div>
  )

  return (
    <div className="pb-24 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-4xl font-black text-blue-900 uppercase leading-[0.8]">Panel de<br/><span className="text-blue-500">Control</span></h1>
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[4px] mt-4 italic">Proaceites App v1.0</p>
      </header>

      {errorMsg && (
        <div className="bg-red-50 border-2 border-red-100 p-4 rounded-3xl mb-6">
          <p className="text-red-600 text-[10px] font-black uppercase">⚠️ Error de conexión: {errorMsg}</p>
          <p className="text-red-400 text-[9px] mt-1 font-bold italic">Verifica las credenciales de Supabase en Vercel.</p>
        </div>
      )}

      {/* Tarjetas Principales */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-600 p-6 rounded-[40px] shadow-2xl shadow-blue-200 text-white relative overflow-hidden">
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

      {/* Menú de Botones Gigantes */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Acciones de Campo</h2>
        
        <button 
          onClick={() => window.location.href = '/admin/asistencia'}
          className="w-full bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all"
        >
          <div className="flex items-center gap-5">
            <div className="bg-orange-100 w-16 h-16 rounded-[25px] flex items-center justify-center text-3xl">📍</div>
            <div className="text-left">
              <p className="font-black text-slate-800 uppercase text-base">Registrar Visita</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Foto + GPS + Cobro</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => window.location.href = '/admin/clientes'}
          className="w-full bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all"
        >
          <div className="flex items-center gap-5">
            <div className="bg-blue-50 w-16 h-16 rounded-[25px] flex items-center justify-center text-3xl">👥</div>
            <div className="text-left">
              <p className="font-black text-slate-800 uppercase text-base">Mis Clientes</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Base de datos de locales</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}