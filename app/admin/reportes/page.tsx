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
      // 1. Obtener empleados para el cruce de nombres
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

      // 3. Agrupación por empleado y día para fusionar Ingreso/Salida
      const agrupados: any = {}

      asistencia?.forEach(reg => {
        const dia = reg.fecha
        const key = `${reg.empleado_id}_${dia}`

        if (!agrupados[key]) {
          agrupados[key] = {
            id: reg.id,
            nombre: reg.nombres || nombresMap[reg.empleado_id] || 'Usuario Sin Nombre',
            fecha: dia,
            entrada: null,
            salida: null,
            horas: '0.00'
          }
        }

        // Formatear hora local desde el timestamp fecha_hora
        const horaLegible = new Date(reg.fecha_hora).toLocaleTimeString('es-EC', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        })
        
        // Tomar la foto y ubicación de cualquier campo disponible según tu esquema
        const foto = reg.foto_ingreso || reg.foto_url || reg.foto
        const gps = reg.ubicacion_ingreso || reg.geolocalizacion || reg.ubicacion

        if (reg.tipo_registro === 'ingreso') {
          agrupados[key].entrada = { hora: horaLegible, foto, gps, raw: reg.fecha_hora }
        } else if (reg.tipo_registro === 'salida') {
          agrupados[key].salida = { hora: horaLegible, foto, gps, raw: reg.fecha_hora }
        }

        // Cálculo de horas trabajadas
        if (agrupados[key].entrada && agrupados[key].salida) {
          const inicio = new Date(agrupados[key].entrada.raw).getTime()
          const fin = new Date(agrupados[key].salida.raw).getTime()
          const diffMs = fin - inicio
          agrupados[key].horas = (diffMs / 3600000).toFixed(2)
        }
      })

      setFilas(Object.values(agrupados).reverse())
    } catch (err) {
      console.error("Error cargando reporte:", err)
    } finally {
      setLoading(false)
    }
  }

  const abrirMapa = (gps: any) => {
    if (!gps) return alert("Sin coordenadas GPS registradas")
    // Limpieza profunda de coordenadas tipo point o string
    const coords = gps.toString().replace(/[() ]/g, '')
    window.open(`https://www.google.com/maps?q=${coords}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <AdminNav />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Reporte Consolidado</h1>
          <div className="flex gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800">
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="bg-transparent border-none text-xs font-bold outline-none p-1" />
            <span className="text-slate-600 text-xs self-center">|</span>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="bg-transparent border-none text-xs font-bold outline-none p-1" />
          </div>
        </div>

        <div className="bg-slate-900 rounded-[30px] border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/50 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  <th className="p-6">Empleado / Fecha</th>
                  <th className="p-6">Ingreso</th>
                  <th className="p-6">Salida</th>
                  <th className="p-6 text-center">Horas Totales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filas.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-all">
                    <td className="p-6">
                      <p className="font-black text-white italic">{r.nombre}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{r.fecha}</p>
                    </td>
                    <td className="p-6">
                      {r.entrada ? (
                        <div className="flex items-center gap-3">
                          <img src={r.entrada.foto} className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-lg" alt="Entrada" />
                          <div>
                            <p className="text-emerald-400 font-black text-sm">{r.entrada.hora}</p>
                            <button onClick={() => abrirMapa(r.entrada.gps)} className="text-[8px] font-black text-slate-500 hover:text-white uppercase tracking-tighter">📍 Ubicación</button>
                          </div>
                        </div>
                      ) : <span className="text-slate-700 text-[10px] font-bold italic">No registrado</span>}
                    </td>
                    <td className="p-6">
                      {r.salida ? (
                        <div className="flex items-center gap-3">
                          <img src={r.salida.foto} className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-lg" alt="Salida" />
                          <div>
                            <p className="text-rose-400 font-black text-sm">{r.salida.hora}</p>
                            <button onClick={() => abrirMapa(r.salida.gps)} className="text-[8px] font-black text-slate-500 hover:text-white uppercase tracking-tighter">📍 Ubicación</button>
                          </div>
                        </div>
                      ) : <span className="text-amber-500 text-[9px] font-black animate-pulse bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">TRABAJANDO...</span>}
                    </td>
                    <td className="p-6 text-center">
                      <div className="inline-block bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 shadow-inner">
                        <p className="text-xl font-black text-white tracking-tighter">{r.horas}</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase">Horas Totales</p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filas.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-slate-500 font-bold italic">No hay registros para este período</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}