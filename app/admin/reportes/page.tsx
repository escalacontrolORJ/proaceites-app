'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'

export default function ReporteAdministrativo() {
  const [filas, setFilas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchData()
  }, [fechaDesde, fechaHasta])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: emps } = await supabase.from('empleados').select('id, nombres')
      const nombresMap = (emps || []).reduce((acc: any, cur: any) => ({ ...acc, [cur.id]: cur.nombres }), {})

      const { data: asistencia, error } = await supabase
        .from('asistencia')
        .select('id, empleado_id, fecha, fecha_hora, tipo_registro, foto, geolocalizacion')
        .gte('fecha', fechaDesde)
        .lte('fecha', fechaHasta)
        .order('fecha_hora', { ascending: true })

      if (error) throw error

      const agrupados: any = {}

      asistencia?.forEach(reg => {
        const key = `${reg.empleado_id}_${reg.fecha}`
        if (!agrupados[key]) {
          agrupados[key] = {
            id: reg.id,
            nombre: nombresMap[reg.empleado_id] || 'Usuario',
            fecha: reg.fecha,
            entrada: null,
            salida: null,
            horas: '0.00'
          }
        }

        // Ajuste de hora Ecuador (-5h)
        const dUTC = new Date(reg.fecha_hora)
        const dEC = new Date(dUTC.getTime() - (5 * 60 * 60 * 1000))
        const horaStr = dEC.getUTCHours().toString().padStart(2, '0') + ':' + 
                        dEC.getUTCMinutes().toString().padStart(2, '0')

        const dataEvento = { hora: horaStr, foto: reg.foto, gps: reg.geolocalizacion, raw: dUTC.getTime() }

        if (reg.tipo_registro.toUpperCase() === 'INGRESO') {
          agrupados[key].entrada = dataEvento
        } else {
          agrupados[key].salida = dataEvento
        }

        if (agrupados[key].entrada && agrupados[key].salida) {
          const diff = agrupados[key].salida.raw - agrupados[key].entrada.raw
          agrupados[key].horas = (diff / 3600000).toFixed(2)
        }
      })

      setFilas(Object.values(agrupados).reverse())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const abrirMapa = (gps: any) => {
    if (!gps) return alert("Sin coordenadas")
    const coords = gps.toString().replace(/[() ]/g, '')
    window.open(`https://www.google.com/maps?q=${coords}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <AdminNav />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-slate-900 p-6 rounded-[25px] border border-slate-800">
          <h1 className="text-xl font-black italic">ASISTENCIA LIMPIA (PROACEITES)</h1>
          <div className="flex gap-2">
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="bg-slate-800 p-2 rounded-lg text-xs font-bold border-none" />
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="bg-slate-800 p-2 rounded-lg text-xs font-bold border-none" />
          </div>
        </div>

        <div className="bg-slate-900 rounded-[35px] border border-slate-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/40 text-[10px] font-black uppercase text-slate-500">
                <th className="p-6">Empleado</th>
                <th className="p-6">Entrada</th>
                <th className="p-6">Salida</th>
                <th className="p-6 text-center">Horas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filas.map((r: any) => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-6">
                    <p className="font-black text-white">{r.nombre}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">{r.fecha}</p>
                  </td>
                  <td className="p-6">
                    {r.entrada && (
                      <div className="flex items-center gap-3">
                        <img src={r.entrada.foto} className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
                        <div>
                          <p className="text-emerald-400 font-black text-lg">{r.entrada.hora}</p>
                          <button onClick={() => abrirMapa(r.entrada.gps)} className="text-[9px] font-bold text-slate-500 hover:text-white uppercase">📍 GPS</button>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="p-6">
                    {r.salida ? (
                      <div className="flex items-center gap-3">
                        <img src={r.salida.foto} className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
                        <div>
                          <p className="text-rose-400 font-black text-lg">{r.salida.hora}</p>
                          <button onClick={() => abrirMapa(r.salida.gps)} className="text-[9px] font-bold text-slate-500 hover:text-white uppercase">📍 GPS</button>
                        </div>
                      </div>
                    ) : <span className="text-amber-500 font-black text-[10px] animate-pulse">EN TURNO...</span>}
                  </td>
                  <td className="p-6 text-center">
                    <div className="inline-block bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800">
                      <p className="text-2xl font-black text-white tracking-tighter">{r.horas}</p>
                      <p className="text-[8px] font-bold text-slate-600 uppercase">Horas</p>
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