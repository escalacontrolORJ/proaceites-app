'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import * as XLSX from 'xlsx'

export default function ReporteAsistencia() {
  const [reportesFinales, setReportesFinales] = useState<any[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Estados de Filtros
  const [empleadoSel, setEmpleadoSel] = useState('')
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchTodo()
  }, [])

  async function fetchTodo() {
    setLoading(true)
    // 1. Obtener lista de empleados para el Combo y para rescatar nombres vacíos
    const { data: emps } = await supabase.from('empleados').select('id, nombres').order('nombres')
    setEmpleados(emps || [])

    // 2. Obtener registros de asistencia
    const { data: asist } = await supabase
      .from('asistencia')
      .select('*')
      .order('fecha_hora', { ascending: true })

    if (asist && emps) {
      procesarRegistros(asist, emps)
    }
    setLoading(false)
  }

  const procesarRegistros = (asist: any[], emps: any[]) => {
    const agrupados: any = {}

    asist.forEach(reg => {
      const llave = `${reg.empleado_id}-${reg.fecha}`
      
      // Si el nombre viene vacío en asistencia, lo buscamos en la tabla empleados
      const nombreEmpleado = reg.nombres || emps.find(e => e.id === reg.empleado_id)?.nombres || 'Desconocido'

      if (!agrupados[llave]) {
        agrupados[llave] = {
          nombre: nombreEmpleado,
          fecha: reg.fecha,
          ingreso: null,
          salida: null,
          gps: reg.ubicacion,
          foto: reg.foto_url || reg.foto_ingreso
        }
      }

      if (reg.tipo_registro === 'ingreso' || (!reg.tipo_registro && !agrupados[llave].ingreso)) {
        agrupados[llave].ingreso = reg.fecha_hora
      } else if (reg.tipo_registro === 'salida' || (!reg.tipo_registro && agrupados[llave].ingreso)) {
        agrupados[llave].salida = reg.fecha_hora
      }
    })

    setReportesFinales(Object.values(agrupados).reverse())
  }

  const calcularHoras = (inicio: string, fin: string) => {
    if (!inicio || !fin) return '---'
    const diff = (new Date(fin).getTime() - new Date(inicio).getTime()) / (1000 * 60 * 60)
    return diff > 0 ? diff.toFixed(2) + ' hrs' : '0.00 hrs'
  }

  const filtrados = reportesFinales.filter(r => {
    const cumpleNombre = !empleadoSel || r.nombre === empleadoSel
    const cumpleFecha = r.fecha >= fechaInicio && r.fecha <= fechaFin
    return cumpleNombre && cumpleFecha
  })

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-black font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black uppercase text-blue-900 tracking-tighter">Reporte Administrativo</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Proaceites - Control de Horas</p>
          </div>
          <button 
            onClick={() => {
              const ws = XLSX.utils.json_to_sheet(filtrados)
              const wb = XLSX.utils.book_new()
              XLSX.utils.book_append_sheet(wb, ws, "Reporte")
              XLSX.writeFile(wb, `Reporte_${fechaInicio}_al_${fechaFin}.xlsx`)
            }}
            className="bg-green-600 text-white px-6 py-2 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-green-100"
          >
            Exportar Excel
          </button>
        </header>

        {/* BARRA DE FILTROS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-gray-400 uppercase ml-2">Empleado</span>
            <select 
              className="p-4 rounded-2xl bg-white shadow-sm border-none text-xs font-bold"
              value={empleadoSel}
              onChange={(e) => setEmpleadoSel(e.target.value)}
            >
              <option value="">TODOS EL PERSONAL</option>
              {empleados.map((e, i) => <option key={i} value={e.nombres}>{e.nombres}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-gray-400 uppercase ml-2">Fecha Inicio</span>
            <input type="date" value={fechaInicio} className="p-4 rounded-2xl bg-white shadow-sm border-none text-xs font-bold" onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-gray-400 uppercase ml-2">Fecha Fin</span>
            <input type="date" value={fechaFin} className="p-4 rounded-2xl bg-white shadow-sm border-none text-xs font-bold" onChange={(e) => setFechaFin(e.target.value)} />
          </div>
        </div>

        {/* TABLA DE RESULTADOS */}
        <div className="bg-white rounded-[35px] shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400">
                <th className="p-5">Nombre Empleado</th>
                <th className="p-5 text-center">Fecha</th>
                <th className="p-5 text-center">Ingreso</th>
                <th className="p-5 text-center">Salida</th>
                <th className="p-5 text-center">Sumatoria</th>
                <th className="p-5 text-center">Ubicación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="p-20 text-center font-black text-xs animate-pulse">CARGANDO REGISTROS...</td></tr>
              ) : filtrados.map((r, i) => (
                <tr key={i} className="hover:bg-blue-50/20 font-bold text-[11px] uppercase transition-colors">
                  <td className="p-5 text-blue-900">{r.nombre}</td>
                  <td className="p-5 text-center text-gray-400">{r.fecha}</td>
                  <td className="p-5 text-center text-blue-600 font-black">{r.ingreso ? new Date(r.ingreso).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</td>
                  <td className="p-5 text-center text-orange-600 font-black">{r.salida ? new Date(r.salida).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</td>
                  <td className="p-5 text-center">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px]">
                      {calcularHoras(r.ingreso, r.salida)}
                    </span>
                  </td>
                  <td className="p-5 text-center">
                    {r.gps ? <a href={r.gps} target="_blank" className="text-blue-500 underline text-[9px]">Mapa 📍</a> : '---'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrados.length === 0 && !loading && (
            <div className="p-20 text-center text-gray-300 font-black uppercase text-[10px] italic">No hay registros para este filtro</div>
          )}
        </div>
      </div>
    </div>
  )
}