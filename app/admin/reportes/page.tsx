'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ReporteLimpio() {
  const [filas, setFilas] = useState<any[]>([])
  const [dia, setDia] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [dia])

  async function fetchData() {
    setLoading(true)
    const { data: emps } = await supabase.from('empleados').select('id, nombres')
    const nombresMap = Object.fromEntries(emps?.map(e => [e.id, e.nombres]) || [])

    const { data: asist } = await supabase
      .from('asistencia')
      .select('*')
      .eq('fecha', dia)
      .order('fecha_hora', { ascending: true })

    const agrupados: Record<string, any> = {}

    asist?.forEach(reg => {
      const id = reg.empleado_id
      if (!agrupados[id]) {
        agrupados[id] = {
          nombre: reg.nombres || nombresMap[id] || 'Usuario Sin Nombre',
          entrada: null,
          salida: null
        }
      }
      if (reg.tipo_registro === 'ingreso') agrupados[id].entrada = reg
      else if (reg.tipo_registro === 'salida') agrupados[id].salida = reg
    })

    setFilas(Object.values(agrupados))
    setLoading(false)
  }

  const calcularHorasNum = (ent: any, sal: any) => {
    if (!ent || !sal) return 0
    const ms = new Date(sal.fecha_hora).getTime() - new Date(ent.fecha_hora).getTime()
    return Math.max(0, ms / (1000 * 60 * 60))
  }

  // Sumatoria total de todas las horas del día
  const totalHorasDia = filas.reduce((acc, curr) => acc + calcularHorasNum(curr.entrada, curr.salida), 0)

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-blue-900 uppercase">Reporte de Asistencia</h1>
            <p className="text-xs font-bold text-slate-400">DATOS LIMPIOS Y ACTUALIZADOS</p>
          </div>
          <input 
            type="date" 
            value={dia} 
            onChange={(e) => setDia(e.target.value)} 
            className="p-3 rounded-2xl border-2 border-slate-200 font-black text-blue-600 outline-none shadow-sm"
          />
        </header>

        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 mb-6">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="p-6">Empleado</th>
                <th className="p-6 text-center">Entrada</th>
                <th className="p-6 text-center">Salida</th>
                <th className="p-6 text-center">Total Horas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filas.map((r, i) => {
                const horas = calcularHorasNum(r.entrada, r.salida)
                return (
                  <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-6">
                      <p className="font-black text-slate-800 uppercase text-xs">{r.nombre}</p>
                    </td>
                    <td className="p-6 border-x border-slate-50">
                      {r.entrada ? (
                        <div className="flex items-center gap-3 justify-center">
                          <img src={r.entrada.foto_url} className="w-12 h-12 rounded-xl object-cover" />
                          <div className="text-[10px]">
                            <p className="font-black text-blue-600">{new Date(r.entrada.fecha_hora).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                            <a href={r.entrada.ubicacion} target="_blank" className="text-slate-400 underline font-bold">VER GPS</a>
                          </div>
                        </div>
                      ) : <span className="text-slate-200 text-center block text-[10px]">--</span>}
                    </td>
                    <td className="p-6">
                      {r.salida ? (
                        <div className="flex items-center gap-3 justify-center">
                          <img src={r.salida.foto_url} className="w-12 h-12 rounded-xl object-cover" />
                          <div className="text-[10px]">
                            <p className="font-black text-orange-600">{new Date(r.salida.fecha_hora).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                            <a href={r.salida.ubicacion} target="_blank" className="text-slate-400 underline font-bold">VER GPS</a>
                          </div>
                        </div>
                      ) : <span className="text-slate-200 text-center block text-[10px]">PENDIENTE</span>}
                    </td>
                    <td className="p-6 text-center">
                      <span className="px-4 py-2 rounded-xl bg-slate-100 font-black text-xs text-slate-700">
                        {horas > 0 ? `${horas.toFixed(2)} hrs` : "---"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* RESUMEN FINAL */}
        <div className="flex justify-end">
          <div className="bg-blue-900 p-6 rounded-[30px] text-white shadow-xl flex items-center gap-6">
            <span className="text-[10px] font-black uppercase tracking-widest">Total Horas del Día (Suma):</span>
            <span className="text-3xl font-black">{totalHorasDia.toFixed(2)} <span className="text-xs">HRS</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}