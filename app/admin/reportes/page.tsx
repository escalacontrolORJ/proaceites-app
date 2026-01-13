'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ReporteAdministrativoPro() {
  const [filas, setFilas] = useState<any[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados para los Filtros
  const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('TODOS')

  useEffect(() => {
    fetchData()
  }, [fechaDesde, fechaHasta, empleadoSeleccionado])

  async function fetchData() {
    setLoading(true)
    
    // 1. Obtener lista de empleados para el Combo
    const { data: emps } = await supabase.from('empleados').select('id, nombres')
    setEmpleados(emps || [])
    const nombresMap = Object.fromEntries(emps?.map(e => [e.id, e.nombres]) || [])

    // 2. Consultar asistencias en el rango de fechas
    let query = supabase
      .from('asistencia')
      .select('*')
      .gte('fecha', fechaDesde)
      .lte('fecha', fechaHasta)
      .order('fecha_hora', { ascending: true })

    // Filtrar por empleado si no es "TODOS"
    if (empleadoSeleccionado !== 'TODOS') {
      query = query.eq('empleado_id', empleadoSeleccionado)
    }

    const { data: asist } = await query

    // 3. Agrupar por Empleado y por Fecha
    const agrupados: Record<string, any> = {}

    asist?.forEach(reg => {
      const fechaReg = reg.fecha
      const empId = reg.empleado_id
      const llave = `${empId}-${fechaReg}` // Agrupamos por persona y día

      if (!agrupados[llave]) {
        agrupados[llave] = {
          nombre: reg.nombres || nombresMap[empId] || 'Sin Nombre',
          fecha: fechaReg,
          entrada: null,
          salida: null
        }
      }
      if (reg.tipo_registro === 'ingreso') agrupados[llave].entrada = reg
      else if (reg.tipo_registro === 'salida') agrupados[llave].salida = reg
    })

    setFilas(Object.values(agrupados))
    setLoading(false)
  }

  const calcularHorasNum = (ent: any, sal: any) => {
    if (!ent || !sal) return 0
    const ms = new Date(sal.fecha_hora).getTime() - new Date(ent.fecha_hora).getTime()
    return Math.max(0, ms / (1000 * 60 * 60))
  }

  const totalHorasRango = filas.reduce((acc, curr) => acc + calcularHorasNum(curr.entrada, curr.salida), 0)

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* ENCABEZADO Y FILTROS */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 mb-8">
          <h1 className="text-2xl font-black text-blue-900 uppercase mb-6 text-center">Filtros de Reporte</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Combo Empleados */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">Seleccionar Empleado</label>
              <select 
                value={empleadoSeleccionado}
                onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold outline-none focus:border-blue-500 transition-all"
              >
                <option value="TODOS">👥 TODOS LOS EMPLEADOS</option>
                {empleados.map(e => (
                  <option key={e.id} value={e.id}>{e.nombres}</option>
                ))}
              </select>
            </div>

            {/* Fecha Desde */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">Desde (Fecha)</label>
              <input 
                type="date" 
                value={fechaDesde} 
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold outline-none focus:border-blue-500 transition-all"
              />
            </div>

            {/* Fecha Hasta */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">Hasta (Fecha)</label>
              <input 
                type="date" 
                value={fechaHasta} 
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* TABLA DE RESULTADOS */}
        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 mb-6">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="p-6">Empleado</th>
                <th className="p-6 text-center">Fecha</th>
                <th className="p-6 text-center">Entrada (Foto/GPS)</th>
                <th className="p-6 text-center">Salida (Foto/GPS)</th>
                <th className="p-6 text-center">Horas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center animate-pulse font-black uppercase text-slate-400">Cargando registros...</td></tr>
              ) : filas.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold uppercase">No se encontraron registros</td></tr>
              ) : filas.map((r, i) => {
                const horas = calcularHorasNum(r.entrada, r.salida)
                return (
                  <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-6">
                      <p className="font-black text-slate-800 uppercase text-xs">{r.nombre}</p>
                    </td>
                    <td className="p-6 text-center font-bold text-slate-400 text-xs">
                      {r.fecha}
                    </td>
                    <td className="p-6 border-x border-slate-50">
                      {r.entrada ? (
                        <div className="flex items-center gap-3 justify-center">
                          <img src={r.entrada.foto_url} className="w-12 h-12 rounded-xl object-cover border shadow-sm" />
                          <div className="text-[10px]">
                            <p className="font-black text-blue-600">{new Date(r.entrada.fecha_hora).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                            <a href={r.entrada.ubicacion} target="_blank" className="text-slate-400 underline font-bold hover:text-blue-500">MAPA</a>
                          </div>
                        </div>
                      ) : <span className="text-slate-200 text-center block text-[10px]">--</span>}
                    </td>
                    <td className="p-6">
                      {r.salida ? (
                        <div className="flex items-center gap-3 justify-center">
                          <img src={r.salida.foto_url} className="w-12 h-12 rounded-xl object-cover border shadow-sm" />
                          <div className="text-[10px]">
                            <p className="font-black text-orange-600">{new Date(r.salida.fecha_hora).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                            <a href={r.salida.ubicacion} target="_blank" className="text-slate-400 underline font-bold hover:text-orange-500">MAPA</a>
                          </div>
                        </div>
                      ) : <span className="text-slate-200 text-center block text-[10px]">FALTA SALIDA</span>}
                    </td>
                    <td className="p-6 text-center">
                      <span className="px-3 py-1 rounded-lg bg-slate-900 text-white font-black text-[10px]">
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
        <div className="flex justify-between items-center bg-blue-900 p-8 rounded-[40px] text-white shadow-xl">
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Periodo Seleccionado</p>
            <p className="font-bold">{fechaDesde} al {fechaHasta}</p>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black uppercase tracking-widest">Total Acumulado:</span>
            <span className="text-4xl font-black">{totalHorasRango.toFixed(2)} <span className="text-xs">HRS</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}