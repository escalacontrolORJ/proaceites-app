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
      // 1. Obtener nombres reales de la tabla empleados
      const { data: emps } = await supabase.from('empleados').select('id, nombres')
      const nombresMap = (emps || []).reduce((acc: any, cur: any) => ({ ...acc, [cur.id]: cur.nombres }), {})

      // 2. Consultar asistencia
      const { data: asistencia, error } = await supabase
        .from('asistencia')
        .select('*')
        .gte('fecha', fechaDesde)
        .lte('fecha', fechaHasta)
        .order('fecha_hora', { ascending: true })

      if (error) throw error

      const agrupados: any = {}

      asistencia?.forEach(reg => {
        const dia = reg.fecha
        const key = `${reg.empleado_id}_${dia}`

        if (!agrupados[key]) {
          agrupados[key] = {
            id: reg.id,
            nombre: reg.nombres || nombresMap[reg.empleado_id] || 'Usuario',
            fecha: dia,
            entrada: null,
            salida: null,
            horas: '0.00'
          }
        }

        // CORRECCIÓN DE HORA: Forzamos zona horaria de Ecuador
        const horaLocal = new Date(reg.fecha_hora).toLocaleTimeString('es-EC', { 
          timeZone: 'America/Guayaquil',
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        })
        
        const foto = reg.foto_ingreso || reg.foto_url || reg.foto
        const gps = reg.ubicacion_ingreso || reg.geolocalizacion || reg.ubicacion

        if (reg.tipo_registro === 'ingreso') {
          agrupados[key].entrada = { hora: horaLocal, foto, gps, raw: reg.fecha_hora }
        } else if (reg.tipo_registro === 'salida') {
          agrupados[key].salida = { hora: horaLocal, foto, gps, raw: reg.fecha_hora }
        }

        if (agrupados[key].entrada && agrupados[key].salida) {
          const inicio = new Date(agrupados[key].entrada.raw).getTime()
          const fin = new Date(agrupados[key].salida.raw).getTime()
          agrupados[key].horas = ((fin - inicio) / 3600000).toFixed(2)
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
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <AdminNav />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl font-black italic uppercase">Reporte Asistencia</h1>
          <div className="flex gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="bg-transparent text-xs font-bold outline-none" />
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="bg-transparent text-xs font-bold outline-none" />
          </div>
        </div>

        <div className="bg-slate-900 rounded-[30px] border border-slate-800 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800 text-[10px] font-black uppercase text-slate-500">
                <th className="p-6">Empleado</th>
                <th className="p-6">Entrada</th>
                <th className="p-6">Salida</th>
                <th className="p-6 text-center">Total Horas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filas.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-800/50 transition-all">
                  <td className="p-6">
                    <p className="font-black text-white">{r.nombre}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">{r.fecha}</p>
                  </td>
                  <td className="p-6">
                    {r.entrada ? (
                      <div className="flex items-center gap-3">
                        <img src={r.entrada.foto} className="w-12 h-12 rounded-lg object-cover border border-slate-700" alt="Foto" />
                        <div>
                          <p className="text-emerald-400 font-black">{r.entrada.hora}</p>
                          <button onClick={() => abrirMapa(r.entrada.gps)} className="text-[8px] font-bold text-slate-500">📍 MAPA</button>
                        </div>
                      </div>
                    ) : <span className="text-slate-700 text-[10px] font-bold italic">--:--</span>}
                  </td>
                  <td className="p-6">
                    {r.salida ? (
                      <div className="flex items-center gap-3">
                        <img src={r.salida.foto} className="w-12 h-12 rounded-lg object-cover border border-slate-700" alt="Foto" />
                        <div>
                          <p className="text-rose-400 font-black">{r.salida.hora}</p>
                          <button onClick={() => abrirMapa(r.salida.gps)} className="text-[8px] font-bold text-slate-500">📍 MAPA</button>
                        </div>
                      </div>
                    ) : <span className="text-amber-500 text-[9px] font-black animate-pulse">TRABAJANDO...</span>}
                  </td>
                  <td className="p-6 text-center">
                    <div className="inline-block bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                      <p className="text-xl font-black text-white">{r.horas}</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase">Horas</p>
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