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
      // 1. Obtener empleados para cruzar nombres (ya que nombres en asistencia viene null)
      const { data: emps } = await supabase.from('empleados').select('id, nombres')
      const nombresMap = (emps || []).reduce((acc: any, cur: any) => ({ ...acc, [cur.id]: cur.nombres }), {})

      // 2. Consultar asistencia filtrando estrictamente por la fecha de hoy
      const { data: asistencia, error } = await supabase
        .from('asistencia')
        .select('*')
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
            nombre: reg.nombres || nombresMap[reg.empleado_id] || 'Usuario',
            fecha: reg.fecha,
            entrada: null,
            salida: null,
            horas: '0.00'
          }
        }

        // --- CORRECCIÓN MANUAL DE HORA (Ecuador -5) ---
        // Usamos fecha_hora que es el campo donde se grabó tu registro de las 16:20
        const dateUTC = new Date(reg.fecha_hora)
        const dateEC = new Date(dateUTC.getTime() - (5 * 60 * 60 * 1000)) // Restamos 5 horas exactas
        
        const horaFormateada = dateEC.getUTCHours().toString().padStart(2, '0') + ':' + 
                               dateEC.getUTCMinutes().toString().padStart(2, '0')

        // Tomamos los campos de foto y gps que SI tienen datos en tus registros nuevos
        const foto = reg.foto || reg.foto_url || reg.foto_ingreso || reg.foto_salida
        const gps = reg.geolocalizacion || reg.ubicacion_ingreso || reg.ubicacion_salida || reg.ubicacion

        if (reg.tipo_registro === 'ingreso') {
          agrupados[key].entrada = { hora: horaFormateada, foto, gps, raw: dateUTC.getTime() }
        } else if (reg.tipo_registro === 'salida') {
          agrupados[key].salida = { hora: horaFormateada, foto, gps, raw: dateUTC.getTime() }
        }

        // Calcular horas trabajadas si existen ambos
        if (agrupados[key].entrada && agrupados[key].salida) {
          const diffMs = agrupados[key].salida.raw - agrupados[key].entrada.raw
          agrupados[key].horas = (diffMs / (1000 * 60 * 60)).toFixed(2)
        }
      })

      setFilas(Object.values(agrupados).reverse())
    } catch (err) {
      console.error("Error en reporte:", err)
    } finally {
      setLoading(false)
    }
  }

  const abrirMapa = (gps: any) => {
    if (!gps) return alert("No hay GPS")
    const coords = gps.toString().replace(/[() ]/g, '')
    window.open(`https://www.google.com/maps?q=${coords}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <AdminNav />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black italic">CONTROL DE ASISTENCIA (ECUADOR)</h1>
          <div className="flex gap-2">
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold" />
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold" />
          </div>
        </div>

        <div className="bg-slate-900 rounded-[30px] border border-slate-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 text-[10px] font-black uppercase text-slate-500 tracking-tighter">
                <th className="p-6">Empleado / Fecha</th>
                <th className="p-6">Ingreso (16:20)</th>
                <th className="p-6">Salida (16:22)</th>
                <th className="p-6 text-center">Horas Totales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filas.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-6">
                    <p className="font-black text-white italic">{r.nombre}</p>
                    <p className="text-[10px] font-bold text-slate-500">{r.fecha}</p>
                  </td>
                  <td className="p-6">
                    {r.entrada ? (
                      <div className="flex items-center gap-3">
                        <img src={r.entrada.foto} className="w-12 h-12 rounded-xl object-cover border border-slate-700" alt="Ingreso" />
                        <div>
                          <p className="text-emerald-400 font-black text-lg">{r.entrada.hora}</p>
                          <button onClick={() => abrirMapa(r.entrada.gps)} className="text-[9px] font-bold text-slate-500 hover:text-white uppercase tracking-widest">📍 Ver GPS</button>
                        </div>
                      </div>
                    ) : <span className="text-slate-700 text-xs italic">Sin ingreso</span>}
                  </td>
                  <td className="p-6">
                    {r.salida ? (
                      <div className="flex items-center gap-3">
                        <img src={r.salida.foto} className="w-12 h-12 rounded-xl object-cover border border-slate-700" alt="Salida" />
                        <div>
                          <p className="text-rose-400 font-black text-lg">{r.salida.hora}</p>
                          <button onClick={() => abrirMapa(r.salida.gps)} className="text-[9px] font-bold text-slate-500 hover:text-white uppercase tracking-widest">📍 Ver GPS</button>
                        </div>
                      </div>
                    ) : <span className="text-amber-500 font-black text-[10px] animate-pulse">EN CURSO</span>}
                  </td>
                  <td className="p-6 text-center">
                    <div className="bg-slate-950 inline-block px-5 py-2 rounded-2xl border border-slate-800">
                      <p className="text-2xl font-black text-white">{r.horas}</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Horas</p>
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