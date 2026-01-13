'use client'
/**
 * REPORTE ADMINISTRATIVO DE ASISTENCIA - VERSIÓN RECTIFICADA (SQL POINT)
 * Este componente asume que la columna 'geolocalizacion' es de tipo POINT en PostgreSQL.
 */
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
      // Consultamos uniendo con la tabla empleados para traer el nombre directamente
      const { data: asist, error } = await supabase
        .from('asistencia')
        .select(`
          *,
          empleados (
            nombres
          )
        `)
        .gte('fecha', fechaDesde)
        .lte('fecha', fechaHasta)
        .order('fecha_hora', { ascending: true })

      if (error) throw error

      // Agrupamos los registros por empleado y fecha para mostrar Entrada y Salida en una sola fila
      const agrupados: Record<string, any> = {}
      
      asist?.forEach(reg => {
        const llave = `${reg.empleado_id}-${reg.fecha}`
        if (!agrupados[llave]) {
          agrupados[llave] = {
            nombre: reg.empleados?.nombres || 'Sin Nombre',
            fecha: reg.fecha,
            entrada: null,
            salida: null
          }
        }
        if (reg.tipo_registro === 'ingreso') {
          agrupados[llave].entrada = reg
        } else if (reg.tipo_registro === 'salida') {
          agrupados[llave].salida = reg
        }
      })

      setFilas(Object.values(agrupados))
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }

  // Función para abrir Google Maps usando el objeto Point {x, y}
  const verMapa = (geo: any) => {
    if (!geo) return
    // En PostgreSQL Point: x = Longitud, y = Latitud
    // Google Maps requiere: Latitud, Longitud
    const lat = geo.y
    const lon = geo.x
    
    if (lat !== undefined && lon !== undefined) {
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
      window.open(url, '_blank')
    }
  }

  // Función para abrir la foto en una ventana emergente
  const verFoto = (url: string) => {
    if (!url) return
    const win = window.open("", "_blank")
    win?.document.write(`
      <html>
        <body style="margin:0; display:flex; align-items:center; justify-content:center; background:#000;">
          <img src="${url}" style="max-width:100%; max-height:100vh; border-radius:10px; shadow: 0 0 20px rgba(0,0,0,0.5);">
        </body>
      </html>
    `)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <AdminNav />
      
      <div className="max-w-7xl mx-auto p-4 md:p-10">
        
        {/* ENCABEZADO Y FILTROS */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">REPORTE ASISTENCIA</h1>
            <p className="text-slate-500 font-bold text-sm">Control de ubicaciones y horarios</p>
          </div>

          <div className="bg-white p-2 rounded-3xl shadow-xl flex items-center gap-2 border border-slate-100">
            <div className="flex flex-col px-4">
              <label className="text-[10px] font-black text-slate-400 uppercase">Desde</label>
              <input 
                type="date" 
                value={fechaDesde} 
                onChange={(e) => setFechaDesde(e.target.value)} 
                className="font-bold outline-none text-slate-700" 
              />
            </div>
            <div className="h-8 w-[2px] bg-slate-100"></div>
            <div className="flex flex-col px-4">
              <label className="text-[10px] font-black text-slate-400 uppercase">Hasta</label>
              <input 
                type="date" 
                value={fechaHasta} 
                onChange={(e) => setFechaHasta(e.target.value)} 
                className="font-bold outline-none text-slate-700" 
              />
            </div>
          </div>
        </div>

        {/* TABLA DE RESULTADOS */}
        <div className="bg-white rounded-[45px] shadow-2xl overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                  <th className="p-8">Colaborador</th>
                  <th className="p-8 text-center">Fecha</th>
                  <th className="p-8 text-center">Entrada (GPS)</th>
                  <th className="p-8 text-center">Salida (GPS)</th>
                  <th className="p-8 text-center">Horas Laboradas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="p-20 text-center text-slate-400 animate-pulse font-bold">Cargando registros...</td></tr>
                ) : filas.length === 0 ? (
                  <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-black uppercase">No se encontraron registros</td></tr>
                ) : (
                  filas.map((r, i) => (
                    <tr key={i} className="hover:bg-blue-50/30 transition-all group">
                      <td className="p-8 font-black text-slate-700 uppercase text-xs tracking-tight">
                        {r.nombre}
                      </td>
                      <td className="p-8 text-center text-slate-400 font-bold text-xs">
                        {r.fecha}
                      </td>
                      
                      {/* COLUMNA ENTRADA */}
                      <td className="p-8">
                        {r.entrada ? (
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                              {new Date(r.entrada.fecha_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            <div className="flex gap-2">
                              {r.entrada.foto_url && (
                                <button onClick={() => verFoto(r.entrada.foto_url)} className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm hover:scale-110 transition-transform">
                                  <img src={r.entrada.foto_url} className="w-full h-full object-cover" />
                                </button>
                              )}
                              <button 
                                onClick={() => verMapa(r.entrada.geolocalizacion)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md transition-all ${r.entrada.geolocalizacion ? 'bg-white text-blue-600 border border-slate-100 hover:bg-blue-600 hover:text-white' : 'bg-slate-50 text-slate-200'}`}
                                disabled={!r.entrada.geolocalizacion}
                              >
                                📍
                              </button>
                            </div>
                          </div>
                        ) : <span className="block text-center text-slate-200 text-xs">---</span>}
                      </td>

                      {/* COLUMNA SALIDA */}
                      <td className="p-8">
                        {r.salida ? (
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-[11px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                              {new Date(r.salida.fecha_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            <div className="flex gap-2">
                              {r.salida.foto_url && (
                                <button onClick={() => verFoto(r.salida.foto_url)} className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm hover:scale-110 transition-transform">
                                  <img src={r.salida.foto_url} className="w-full h-full object-cover" />
                                </button>
                              )}
                              <button 
                                onClick={() => verMapa(r.salida.geolocalizacion)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md transition-all ${r.salida.geolocalizacion ? 'bg-white text-orange-600 border border-slate-100 hover:bg-orange-600 hover:text-white' : 'bg-slate-50 text-slate-200'}`}
                                disabled={!r.salida.geolocalizacion}
                              >
                                📍
                              </button>
                            </div>
                          </div>
                        ) : <span className="block text-center text-slate-200 text-xs">---</span>}
                      </td>

                      {/* CÁLCULO DE HORAS */}
                      <td className="p-8 text-center">
                        <span className="px-5 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black shadow-lg">
                          { (r.entrada && r.salida) 
                            ? ( (new Date(r.salida.fecha_hora).getTime() - new Date(r.entrada.fecha_hora).getTime()) / (1000 * 60 * 60) ).toFixed(2) 
                            : "0.00" 
                          } H
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}