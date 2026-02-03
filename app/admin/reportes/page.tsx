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
      // 1. Obtener nombres de empleados (porque en asistencia llegan null)
      const { data: emps } = await supabase.from('empleados').select('id, nombres')
      const nombresMap = (emps || []).reduce((acc: any, cur: any) => ({ ...acc, [cur.id]: cur.nombres }), {})

      // 2. Consultar la tabla asistencia
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
            nombre: nombresMap[reg.empleado_id] || 'Usuario',
            fecha: reg.fecha,
            entrada: null,
            salida: null,
            horas: '0.00'
          }
        }

        // --- CORRECCIÓN DE HORA PARA ECUADOR (-5h) ---
        const dateUTC = new Date(reg.fecha_hora)
        const dateEC = new Date(dateUTC.getTime() - (5 * 60 * 60 * 1000))
        const horaFormateada = dateEC.getUTCHours().toString().padStart(2, '0') + ':' + 
                               dateEC.getUTCMinutes().toString().padStart(2, '0')

        // CAMPOS EXACTOS DEL DASHBOARD: 'foto' y 'geolocalizacion'
        const fotoData = reg.foto 
        const gpsData = reg.geolocalizacion

        if (reg.tipo_registro === 'ingreso') {
          agrupados[key].entrada = { hora: horaFormateada, foto: fotoData, gps: gpsData, raw: dateUTC.getTime() }
        } else if (reg.tipo_registro === 'salida') {
          agrupados[key].salida = { hora: horaFormateada, foto: fotoData, gps: gpsData, raw: dateUTC.getTime() }
        }

        if (agrupados[key].entrada && agrupados[key].salida) {
          const diffMs = agrupados[key].salida.raw - agrupados[key].entrada.raw
          agrupados[key].horas = (diffMs / 3600000).toFixed(2)
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
    if (!gps) return alert("Sin GPS")
    const coords = gps.toString().replace(/[() ]/g, '')
    window.open(`https://www.google.com/maps?q=${coords}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <AdminNav />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-black italic mb-6">REPORTE OPERATIVO PROACEITES</h1>
        
        <div className="bg-slate-900 rounded-[30px] border border-slate-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/50 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                <th className="p-6">Colaborador</th>
                <th className="p-6 text-emerald-500">Ingreso</th>
                <th className="p-6 text-rose-500">Salida</th>
                <th className="p-6 text-center">Horas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filas.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-800/30">
                  <td className="p-6">
                    <p className="font-black text-white">{r.nombre}</p>
                    <p className="text-[10px] text-slate-500">{r.fecha}</p>
                  </td>
                  <td className="p-6">
                    {r.entrada ? (
                      <div className="flex items-center gap-3">
                        <img src={r.entrada.foto} className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
                        <div>
                          <p className="text-emerald-400 font-black text-lg">{r.entrada.hora}</p>
                          <button onClick={() => abrirMapa(r.entrada.gps)} className="text-[9px] text-slate-500 font-bold underline">MAPA</button>
                        </div>
                      </div>
                    ) : <span className="text-slate-700 italic">--:--</span>}
                  </td>
                  <td className="p-6">
                    {r.salida ? (
                      <div className="flex items-center gap-3">
                        <img src={r.salida.foto} className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
                        <div>
                          <p className="text-rose-400 font-black text-lg">{r.salida.hora}</p>
                          <button onClick={() => abrirMapa(r.salida.gps)} className="text-[9px] text-slate-500 font-bold underline">MAPA</button>
                        </div>
                      </div>
                    ) : <span className="text-amber-500 font-black text-xs animate-pulse">LABORANDO...</span>}
                  </td>
                  <td className="p-6 text-center">
                    <span className="text-2xl font-black text-white">{r.horas}</span>
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