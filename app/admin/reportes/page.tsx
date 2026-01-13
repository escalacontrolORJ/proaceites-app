'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ReporteAsistenciaDoble() {
  const [registros, setRegistros] = useState<any[]>([])
  const [dia, setDia] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [dia])

  async function fetchData() {
    setLoading(true)
    const { data } = await supabase.from('asistencia').select('*').eq('fecha', dia).order('fecha_hora', { ascending: true })
    
    const agrupados: Record<string, any> = {}
    data?.forEach(reg => {
      if (!agrupados[reg.empleado_id]) {
        agrupados[reg.empleado_id] = { nombre: reg.nombres, entrada: null, salida: null }
      }
      if (reg.tipo_registro === 'ingreso') agrupados[reg.empleado_id].entrada = reg
      else if (reg.tipo_registro === 'salida') agrupados[reg.empleado_id].salida = reg
    })
    setRegistros(Object.values(agrupados))
    setLoading(false)
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase leading-none">Reporte de Asistencia</h1>
            <p className="text-xs font-bold text-slate-400 uppercase mt-2">Visualización de doble registro (Ingreso/Salida)</p>
          </div>
          <input type="date" value={dia} onChange={(e) => setDia(e.target.value)} className="p-3 rounded-2xl border-2 border-slate-200 font-bold outline-none shadow-sm" />
        </header>

        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="p-6">Colaborador</th>
                <th className="p-6 text-center">Entrada (Foto/GPS)</th>
                <th className="p-6 text-center">Salida (Foto/GPS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={3} className="p-20 text-center animate-pulse font-black uppercase">Cargando registros...</td></tr>
              ) : registros.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="p-6 font-black text-slate-700 uppercase text-xs">{r.nombre}</td>
                  
                  {/* COLUMNA ENTRADA */}
                  <td className="p-6 border-x border-slate-50">
                    {r.entrada ? (
                      <div className="flex items-center gap-4 justify-center">
                        <img src={r.entrada.foto_url} className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-100" />
                        <div className="text-[10px]">
                          <p className="font-black text-blue-600">{new Date(r.entrada.fecha_hora).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                          <a href={r.entrada.ubicacion} target="_blank" className="font-bold underline text-slate-400 hover:text-blue-500">📍 VER GPS</a>
                        </div>
                      </div>
                    ) : <span className="block text-center text-slate-200 font-black text-[10px]">SIN ENTRADA</span>}
                  </td>

                  {/* COLUMNA SALIDA */}
                  <td className="p-6">
                    {r.salida ? (
                      <div className="flex items-center gap-4 justify-center">
                        <img src={r.salida.foto_url} className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-100" />
                        <div className="text-[10px]">
                          <p className="font-black text-orange-600">{new Date(r.salida.fecha_hora).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                          <a href={r.salida.ubicacion} target="_blank" className="font-bold underline text-slate-400 hover:text-orange-500">📍 VER GPS</a>
                        </div>
                      </div>
                    ) : <span className="block text-center text-slate-200 font-black text-[10px]">PENDIENTE</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}