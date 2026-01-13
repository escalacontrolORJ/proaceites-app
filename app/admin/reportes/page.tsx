'use client'
// VERSION 2.0 - LIMPIEZA
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'

export default function ReporteAdministrativo() {
  const [filas, setFilas] = useState<any[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros de Reporte
  const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('TODOS')

  useEffect(() => {
    fetchData()
  }, [fechaDesde, fechaHasta, empleadoSeleccionado])

  async function fetchData() {
    setLoading(true)
    try {
      // 1. Obtener lista de empleados
      const { data: emps } = await supabase.from('empleados').select('id, nombres')
      setEmpleados(emps || [])
      const nombresMap = Object.fromEntries(emps?.map(e => [e.id, e.nombres]) || [])

      // 2. Consultar asistencias incluyendo fotos y coordenadas
      let query = supabase
        .from('asistencia')
        .select('*')
        .gte('fecha', fechaDesde)
        .lte('fecha', fechaHasta)
        .order('fecha_hora', { ascending: true })

      if (empleadoSeleccionado !== 'TODOS') {
        query = query.eq('empleado_id', empleadoSeleccionado)
      }

      const { data: asist } = await query

      // 3. Agrupar entrada y salida
      const agrupados: Record<string, any> = {}
      asist?.forEach(reg => {
        const llave = `${reg.empleado_id}-${reg.fecha}`
        if (!agrupados[llave]) {
          agrupados[llave] = {
            nombre: nombresMap[reg.empleado_id] || 'Sin Nombre',
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

  const calcularHorasNum = (entrada: any, salida: any) => {
    if (!entrada || !salida) return 0
    const ms = new Date(salida.fecha_hora).getTime() - new Date(entrada.fecha_hora).getTime()
    return Math.max(0, ms / (1000 * 60 * 60))
  }

  const totalHorasRango = filas.reduce((acc, curr) => acc + calcularHorasNum(curr.entrada, curr.salida), 0)

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <AdminNav />
      <div className="max-w-7xl mx-auto p-6 md:p-10">

        {/* PANEL DE FILTROS */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Colaborador</label>
            <select 
              value={empleadoSeleccionado} 
              onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 font-bold outline-none transition-all"
            >
              <option value="TODOS">👥 TODOS LOS EMPLEADOS</option>
              {empleados.map(e => (
                <option key={e.id} value={e.id}>{e.nombres}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 font-bold" />
          </div>
        </div>

        {/* TABLA DE RESULTADOS */}
        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden mb-8 border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="p-6">Empleado</th>
                <th className="p-6 text-center">Fecha</th>
                <th className="p-6 text-center">Entrada (Foto/GPS)</th>
                <th className="p-6 text-center">Salida</th>
                <th className="p-6 text-center">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center animate-pulse font-black text-slate-400">CARGANDO...</td></tr>
              ) : filas.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold">SIN REGISTROS</td></tr>
              ) : (
                filas.map((r, i) => (
                  <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-6 font-black text-xs uppercase">{r.nombre}</td>
                    <td className="p-6 text-center text-[10px] font-bold text-slate-400">{r.fecha}</td>
                    
                    {/* ENTRADA CON FOTO Y GPS */}
                    <td className="p-6">
                      <div className="flex flex-col items-center gap-2">
                        {r.entrada ? (
                          <>
                            <span className="text-blue-600 font-bold text-sm">
                              {new Date(r.entrada.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="flex gap-2">
                              {r.entrada.foto_url && (
                                <a href={r.entrada.foto_url} target="_blank" className="hover:scale-110 transition-transform">
                                  <img src={r.entrada.foto_url} className="w-8 h-8 rounded-lg object-cover border shadow-sm" alt="Foto" />
                                </a>
                              )}
                              {r.entrada.latitud && (
                                <a 
                                  href={`https://www.google.com/maps?q=${r.entrada.latitud},${r.entrada.longitud}`} 
                                  target="_blank" 
                                  className="bg-slate-100 p-1.5 rounded-lg text-lg"
                                  title="Ver Ubicación"
                                >
                                  📍
                                </a>
                              )}
                            </div>
                          </>
                        ) : '--'}
                      </div>
                    </td>

                    <td className="p-6 text-center text-orange-600 font-bold">
                      {r.salida ? new Date(r.salida.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'PENDIENTE'}
                    </td>
                    
                    <td className="p-6 text-center">
                      <span className="px-3 py-1 rounded-lg bg-slate-900 text-white font-black text-[10px]">
                        {calcularHorasNum(r.entrada, r.salida).toFixed(2)} hrs
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* RESUMEN */}
        <div className="bg-blue-600 p-8 rounded-[40px] text-white shadow-xl flex justify-between items-center">
          <div><p className="text-[10px] font-black uppercase tracking-widest opacity-70">Resumen del Periodo</p></div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase opacity-70 mb-1">Total Acumulado</p>
            <p className="text-4xl font-black">{totalHorasRango.toFixed(2)} <span className="text-xs">HRS</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}