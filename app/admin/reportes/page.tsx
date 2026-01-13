'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import * as XLSX from 'xlsx'

export default function ReporteConsolidado() {
  const [reportesRaw, setReportesRaw] = useState<any[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('')
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchDatos()
  }, [])

  async function fetchDatos() {
    setLoading(true)
    // 1. Traer empleados para el Combo
    const { data: emps } = await supabase.from('empleados').select('nombres').order('nombres')
    setEmpleados(emps || [])

    // 2. Traer todos los registros de asistencia
    const { data: asist } = await supabase
      .from('asistencia')
      .select('*')
      .order('fecha_hora', { ascending: true })
    
    setReportesRaw(asist || [])
    setLoading(false)
  }

  // LÓGICA PARA CONSOLIDAR INGRESO Y SALIDA EN UNA SOLA FILA
  const procesarDatos = () => {
    const agrupados: Record<string, any> = {}

    reportesRaw.forEach(reg => {
      // Creamos una llave única por empleado y por día
      const llave = `${reg.empleado_id}-${reg.fecha}`
      
      if (!agrupados[llave]) {
        agrupados[llave] = {
          id: reg.id,
          nombre: reg.nombres || 'Sin Nombre',
          fecha: reg.fecha,
          ingreso: null,
          salida: null,
          foto_in: null,
          foto_out: null,
          gps: reg.ubicacion,
          horas: 0
        }
      }

      if (reg.tipo_registro === 'ingreso') {
        agrupados[llave].ingreso = reg.fecha_hora
        agrupados[llave].foto_in = reg.foto_url
      } else if (reg.tipo_registro === 'salida') {
        agrupados[llave].salida = reg.fecha_hora
        agrupados[llave].foto_out = reg.foto_url
      }

      // Calcular horas si ya tiene ambos
      if (agrupados[llave].ingreso && agrupados[llave].salida) {
        const inTime = new Date(agrupados[llave].ingreso).getTime()
        const outTime = new Date(agrupados[llave].salida).getTime()
        agrupados[llave].horas = ((outTime - inTime) / (1000 * 60 * 60)).toFixed(2)
      }
    })

    // Convertir objeto a Array y aplicar filtros de la interfaz
    return Object.values(agrupados).filter((item: any) => {
      const cumpleNombre = empleadoSeleccionado === '' || item.nombre === empleadoSeleccionado
      const cumpleFecha = item.fecha >= fechaInicio && item.fecha <= fechaFin
      return cumpleNombre && cumpleFecha
    }).reverse() // Lo más nuevo arriba
  }

  const datosFinales = procesarDatos()

  const formatearHora = (iso: string | null) => {
    if (!iso) return '--:--'
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen text-black font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-black uppercase text-blue-900 tracking-tighter">Reporte Consolidado</h1>
          <button 
            onClick={() => {
              const ws = XLSX.utils.json_to_sheet(datosFinales)
              const wb = XLSX.utils.book_new()
              XLSX.utils.book_append_sheet(wb, ws, "Reporte")
              XLSX.writeFile(wb, "Asistencia_Proaceites.xlsx")
            }}
            className="bg-green-600 text-white px-6 py-2 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-green-100"
          >
            Exportar Excel
          </button>
        </header>

        {/* FILTROS CON COMBO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-gray-400 uppercase ml-2">Seleccionar Empleado</span>
            <select 
              className="p-3 rounded-xl border-none shadow-sm text-xs bg-white font-bold"
              value={empleadoSeleccionado}
              onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
            >
              <option value="">TODOS LOS EMPLEADOS</option>
              {empleados.map((e, i) => (
                <option key={i} value={e.nombres}>{e.nombres}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-gray-400 uppercase ml-2">Desde</span>
            <input type="date" value={fechaInicio} className="p-3 rounded-xl border-none shadow-sm text-xs font-bold" onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-gray-400 uppercase ml-2">Hasta</span>
            <input type="date" value={fechaFin} className="p-3 rounded-xl border-none shadow-sm text-xs font-bold" onChange={(e) => setFechaFin(e.target.value)} />
          </div>
        </div>

        {/* TABLA CONSOLIDADA */}
        <div className="bg-white shadow-xl rounded-[30px] overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400">
                <th className="p-4">Nombre</th>
                <th className="p-4 text-center">Fecha</th>
                <th className="p-4 text-center">Ingreso</th>
                <th className="p-4 text-center">Salida</th>
                <th className="p-4 text-center">Total Horas</th>
                <th className="p-4 text-center">Fotos (In/Out)</th>
                <th className="p-4 text-center">Ubicación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="p-10 text-center font-black animate-pulse">CARGANDO REGISTROS...</td></tr>
              ) : datosFinales.map((item: any, i) => (
                <tr key={i} className="hover:bg-blue-50/20 font-bold text-[11px] uppercase transition-colors">
                  <td className="p-4 text-blue-900">{item.nombre}</td>
                  <td className="p-4 text-center text-gray-500 font-medium">{item.fecha}</td>
                  <td className="p-4 text-center text-blue-600">{formatearHora(item.ingreso)}</td>
                  <td className="p-4 text-center text-orange-600">{formatearHora(item.salida)}</td>
                  <td className="p-4 text-center">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px]">
                      {item.horas} hrs
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      {item.foto_in ? <a href={item.foto_in} target="_blank" className="opacity-80 hover:opacity-100">📸<span className="text-[7px]">IN</span></a> : '--'}
                      {item.foto_out ? <a href={item.foto_out} target="_blank" className="opacity-80 hover:opacity-100">📸<span className="text-[7px]">OUT</span></a> : '--'}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {item.gps && item.gps.startsWith('http') ? (
                      <a href={item.gps} target="_blank" className="text-blue-500 underline text-[9px]">Mapa 📍</a>
                    ) : 'No GPS'}
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