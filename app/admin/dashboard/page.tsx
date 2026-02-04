'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ clientes: 0, visitas: 0, asistencia: 0 })
  const router = useRouter()

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      fetchStats()
    }
    checkAdmin()
  }, [router])

  const fetchStats = async () => {
    const { count: cCount } = await supabase.from('clientes').select('*', { count: 'exact', head: true })
    const { count: vCount } = await supabase.from('visitas').select('*', { count: 'exact', head: true })
    const { count: aCount } = await supabase.from('asistencia').select('*', { count: 'exact', head: true })
    
    setStats({
      clientes: cCount || 0,
      visitas: vCount || 0,
      asistencia: aCount || 0
    })
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black uppercase text-xs tracking-widest animate-pulse">
      Cargando Panel...
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <nav className="bg-white p-6 flex justify-between items-center shadow-sm">
        <div>
          <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Administrador</p>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Panel Central</h1>
        </div>
        <button onClick={handleSignOut} className="p-3 bg-slate-100 rounded-2xl">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </nav>

      <main className="p-6 space-y-8 max-w-lg mx-auto">
        
        {/* Resumen Rápido */}
        <section className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-[30px] shadow-sm text-center">
            <p className="text-[20px] font-black">{stats.clientes}</p>
            <p className="text-[8px] font-bold uppercase text-slate-400">Clientes</p>
          </div>
          <div className="bg-white p-4 rounded-[30px] shadow-sm text-center">
            <p className="text-[20px] font-black text-blue-600">{stats.visitas}</p>
            <p className="text-[8px] font-bold uppercase text-slate-400">Visitas</p>
          </div>
          <div className="bg-white p-4 rounded-[30px] shadow-sm text-center">
            <p className="text-[20px] font-black text-emerald-500">{stats.asistencia}</p>
            <p className="text-[8px] font-bold uppercase text-slate-400">Asistencia</p>
          </div>
        </section>

        {/* Menú de Gestión */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Operaciones de Campo</h2>
          <div className="grid grid-cols-2 gap-4">
            
            {/* CORRECCIÓN: Si quieres marcar entrada como trabajador, usas /dashboard. 
                Si quieres ver el reporte de asistencia, usas /admin/asistencia */}
            <Link href="/dashboard" className="bg-emerald-500 text-white p-8 rounded-[40px] shadow-lg flex flex-col items-center gap-3 hover:bg-slate-900 transition-all">
              <span className="text-3xl">🔑</span>
              <span className="font-black uppercase text-[10px] tracking-tighter">Marcar Entrada</span>
            </Link>

            <Link href="/admin/visitas" className="bg-white p-8 rounded-[40px] shadow-sm flex flex-col items-center gap-3 hover:bg-slate-900 hover:text-white transition-all">
              <span className="text-3xl">📍</span>
              <span className="font-black uppercase text-[10px] tracking-tighter text-center">Visitas Clientes</span>
            </Link>

            <Link href="/admin/clientes" className="bg-white p-8 rounded-[40px] shadow-sm flex flex-col items-center gap-3 hover:bg-slate-900 hover:text-white transition-all">
              <span className="text-3xl">👥</span>
              <span className="font-black uppercase text-[10px] tracking-tighter">Clientes</span>
            </Link>

            <Link href="/admin/seguimiento" className="bg-blue-600 text-white p-8 rounded-[40px] shadow-lg flex flex-col items-center gap-3 hover:bg-slate-900 transition-all">
              <span className="text-3xl">🗺️</span>
              <span className="font-black uppercase text-[10px] tracking-tighter">Seguimiento</span>
            </Link>

          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Administración</h2>
          <div className="bg-white rounded-[40px] p-2 space-y-1">
            
            <Link href="/admin/reportes" className="w-full p-5 flex justify-between items-center hover:bg-slate-50 rounded-[35px] transition-all">
              <div className="flex items-center gap-4">
                <span className="bg-slate-100 p-2 rounded-xl text-lg">📊</span>
                <span className="font-black uppercase text-[10px]">Reportes Generales</span>
              </div>
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>

            <button className="w-full p-5 flex justify-between items-center hover:bg-slate-50 rounded-[35px] transition-all">
              <div className="flex items-center gap-4">
                <span className="bg-slate-100 p-2 rounded-xl text-lg">⚙️</span>
                <span className="font-black uppercase text-[10px]">Configuración</span>
              </div>
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </section>

      </main>
    </div>
  )
}