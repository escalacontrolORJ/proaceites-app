'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'

export default function ReporteVisitas() {
  const [visitas, setVisitas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [filtroMotivo, setFiltroMotivo] = useState('')

  useEffect(() => {
    fetchVisitas()
  }, [fecha, filtroMotivo])

  async function fetchVisitas() {
    setLoading(true)
    try {
      let query = supabase
        .from('visitas')
        .select(`
          id, fecha, hora, motivo, foto_local, ubicacion_gps, valor_transaccion, observaciones,
          empleados ( nombres ),
          clientes ( nombre_comercial )
        `)
        .eq('fecha', fecha)

      if (filtroMotivo) query = query.ilike('motivo', `%${filtroMotivo}%`)

      const { data, error } = await query.order('hora', { ascending: false })
      if (error) throw error
      setVisitas(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <AdminNav />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-slate-900 p-6 rounded-[30px] border border-white/5">
          <h1 className="text-xl font-black italic uppercase tracking-tighter">Gestión de Ventas y Cobros</h1>
          <div className="flex gap-4">
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="bg-slate-800 p-2 rounded-xl text-xs font-bold border-none" />
            <select value={filtroMotivo} onChange={e => setFiltroMotivo(e.target.value)} className="bg-slate-800 p-2 rounded-xl text-xs font-bold border-none">
              <option value="">TODOS LOS MOTIVOS</option>
              <option value="Venta">VENTA</option>
              <option value="Cobro">COBRO</option>
              <option value="Nuevo">CLIENTE NUEVO</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                <th className="p-6">Vendedor / Cliente</th>
                <th className="p-6">Motivo</th>
                <th className="p-6 text-right">Monto</th>
                <th className="p-6">Evidencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {visitas.map((v) => (
                <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-6">
                    <p className="font-black text-white italic">{v.empleados?.nombres || 'S/N'}</p>
                    <p className="text-xs text-emerald-400 font-bold uppercase">{v.clientes?.nombre_comercial || 'Cliente General'}</p>
                  </td>
                  <td className="p-6">
                    <span className="bg-slate-800 px-3 py-1 rounded-full text-[9px] font-black uppercase text-slate-400">{v.motivo}</span>
                    <p className="text-[10px] text-slate-600 mt-1 italic line-clamp-1">{v.observaciones}</p>
                  </td>
                  <td className="p-6 text-right font-black text-xl text-white">
                    ${v.valor_transaccion?.toFixed(2) || '0.00'}
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <img src={v.foto_local} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt="Visita" />
                      <button 
                        onClick={() => window.open(`https://www.google.com/maps?q=${v.ubicacion_gps.replace(/[() ]/g, '')}`, '_blank')}
                        className="text-[9px] font-bold text-slate-500 hover:text-white"
                      >📍 GPS</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}