'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [stats, setStats] = useState({ clientes: 0, visitas: 0 })
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { count: c } = await supabase.from('clientes').select('*', { count: 'exact', head: true })
      const { count: v } = await supabase.from('visitas').select('*', { count: 'exact', head: true })
      setStats({ clientes: c || 0, visitas: v || 0 })
    }
    load()
  }, [])

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-black text-blue-900 uppercase mb-6">Panel de Control</h1>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-600 p-6 rounded-[35px] text-white">
          <p className="text-4xl font-black">{stats.clientes}</p>
          <p className="text-[10px] font-bold uppercase opacity-70">Clientes</p>
        </div>
        <div className="bg-white p-6 rounded-[35px] shadow-sm">
          <p className="text-4xl font-black text-slate-800">{stats.visitas}</p>
          <p className="text-[10px] font-bold uppercase text-slate-400">Visitas Hoy</p>
        </div>
      </div>
      <button onClick={() => router.push('/admin/asistencia')} className="w-full bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 font-black uppercase text-slate-700 flex justify-between items-center">
        <span>📸 Registrar Visita</span>
        <span>→</span>
      </button>
    </div>
  )
}