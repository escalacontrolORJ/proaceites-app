'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'

export default function ProximasVisitas() {
  const [agenda, setAgenda] = useState<any[]>([])
  const [desde, setDesde] = useState(new Date().toISOString().split('T')[0])
  const [hasta, setHasta] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

  useEffect(() => {
    fetchAgenda()
  }, [desde, hasta])

  async function fetchAgenda() {
    try {
      const { data, error } = await supabase
        .from('visitas')
        .select(`
          proxima_visita, motivo, observaciones,
          empleados ( nombres ),
          clientes ( nombre_comercial )
        `)
        .gte('proxima_visita', desde)
        .lte('proxima_visita', hasta)
        .order('proxima_visita', { ascending: true })

      if (error) throw error
      setAgenda(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AdminNav />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-black italic mb-8 uppercase tracking-tighter text-amber-500">Agenda de Planificación</h1>
        
        <div className="flex gap-4 mb-8 bg-slate-900 p-6 rounded-[30px] border border-white/5 shadow-xl">
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Desde</p>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="w-full bg-slate-800 p-3 rounded-2xl border-none font-bold text-sm" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Hasta</p>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="w-full bg-slate-800 p-3 rounded-2xl border-none font-bold text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agenda.map((item, idx) => (
            <div key={idx} className="bg-slate-900 p-6 rounded-[35px] border border-white/5 relative group hover:border-amber-500/50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-amber-500 text-black text-[10px] font-black px-4 py-1 rounded-full">
                  {item.proxima_visita}
                </span>
                <span className="text-[9px] font-black text-slate-600 uppercase italic">Ref: {item.motivo}</span>
              </div>
              <h3 className="text-xl font-black text-white italic leading-tight mb-1">{item.clientes?.nombre_comercial || 'Cliente Pendiente'}</h3>
              <p className="text-[10px] font-bold text-emerald-400 uppercase mb-4 tracking-widest">{item.empleados?.nombres}</p>
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                <p className="text-xs text-slate-400 italic">"{item.observaciones || 'Sin notas adicionales'}"</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}