'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import * as XLSX from 'xlsx'

export default function ReporteAsistencia() {
  const [reportes, setReportes] = useState<any[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])
  const [empleadoSel, setEmpleadoSel] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: emps } = await supabase.from('empleados').select('nombres').order('nombres')
      setEmpleados(emps || [])
      const { data: asist } = await supabase.from('asistencia').select('*').order('fecha_hora', { ascending: true })
      if (asist) procesarDatos(asist)
      setLoading(false)
    }
    fetchData()
  }, [])

  const procesarDatos = (datos: any[]) => {
    const agrupados: any = {}
    datos.forEach(reg => {
      const llave = `${reg.empleado_id}-${reg.fecha}`
      if (!agrupados[llave]) {
        agrupados[llave] = { nombre: reg.nombres || 'Sin Nombre', fecha: reg.fecha, ingreso: null, salida: null, gps: reg.ubicacion }
      }
      if (reg.tipo_registro === 'ingreso') agrupados[llave].ingreso = reg.fecha_hora
      if (reg.tipo_registro === 'salida') agrupados[llave].salida = reg.fecha_hora
    })
    setReportes(Object.values(agrupados).reverse())
  }

  const calcularHoras = (inT: string, outT: string) => {
    if (!inT || !outT) return '---'
    const diff = (new Date(outT).getTime() - new Date(inT).getTime()) / (1000 * 60 * 60)
    return diff.toFixed(2) + ' hrs'
  }

  return (
    <div className="p-4 max-w-6xl mx-auto text-black font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-black uppercase text-blue-900">Reporte Consolidado</h1>
        <button onClick={() => {
          const ws = XLSX.utils.json_to_sheet(reportes); 
          const wb = XLSX.utils.book_new(); 
          XLSX.utils.book_append_sheet(wb, ws, "Asistencia"); 
          XLSX.writeFile(wb, "Reporte.xlsx")
        }} className="bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold">EXCEL</button>
      </div>

      <div className="mb-6">
        <label className="text-[10px] font-black uppercase text-gray-400">Filtrar por Empleado:</label>
        <select 
          className="w-full p-3 rounded-xl bg-white shadow-sm border-none mt-1 text-xs font-bold"
          value={empleadoSel}
          onChange={(e) => setEmpleadoSel(e.target.value)}
        >
          <option value="">TODOS</option>
          {empleados.map((e, i) => <option key={i} value={e.nombres}>{e.nombres}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-[30px] shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Ingreso</th>
              <th className="p-4">Salida</th>
              <th className="p-4">Total</th>
              <th className="p-4">GPS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {reportes.filter(r => !empleadoSel || r.nombre === empleadoSel).map((r, i) => (
              <tr key={i} className="font-bold">
                <td className="p-4">{r.nombre}</td>
                <td className="p-4 text-gray-400">{r.fecha}</td>
                <td className="p-4 text-blue-600">{r.ingreso ? new Date(r.ingreso).toLocaleTimeString() : '--:--'}</td>
                <td className="p-4 text-orange-600">{r.salida ? new Date(r.salida).toLocaleTimeString() : '--:--'}</td>
                <td className="p-4">
                  <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md">
                    {calcularHoras(r.ingreso, r.salida)}
                  </span>
                </td>
                <td className="p-4 text-blue-500">
                  {r.gps ? <a href={r.gps} target="_blank">📍 Ver</a> : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}