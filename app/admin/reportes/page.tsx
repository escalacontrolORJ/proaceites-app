'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'

export default function ReporteAdministrativo() {
  const [filas, setFilas] = useState<any[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('TODOS')

  useEffect(() => { fetchData() }, [fechaDesde, fechaHasta, empleadoSeleccionado])

  async function fetchData() {
    setLoading(true)
    const { data: emps } = await supabase.from('empleados').select('id, nombres')
    setEmpleados(emps || [])
    const nombresMap = Object.fromEntries(emps?.map(e => [e.id, e.nombres]) || [])

    let query = supabase.from('asistencia').select('*').gte('fecha', fechaDesde).lte('fecha', fechaHasta).order('fecha_hora', { ascending: true })
    if (empleadoSeleccionado !== 'TODOS') query = query.eq('empleado_id', empleadoSeleccionado)
    const { data: asist } = await query

    const agrupados: Record<string, any> = {}
    asist?.forEach(reg => {
      const llave = `${reg.empleado_id}-${reg.fecha}`
      if (!agrupados[llave]) {
        agrupados[llave] = { nombre: nombresMap[reg.empleado_id] || 'Sin Nombre', fecha: reg.fecha, entrada: null, salida: null }
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <AdminNav />
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        <div className="bg-white p-8 rounded-[40px] shadow-sm mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <select value={empleadoSeleccionado} onChange={(e) => setEmpleadoSeleccionado(e.target.value)} className="p-4 rounded-2xl bg-slate-50 font-bold outline-none">
            <option value="TODOS">TODOS LOS EMPLEADOS</option>
            {empleados.map(e => <option key={e.id} value={e.id}>{e.nombres}</option>)}
          </select>
          <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="p-4 rounded-2xl bg-slate-50 font-bold" />
          <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="p-4 rounded-2xl bg-slate-50 font-bold" />
        </div>
        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white uppercase font-black">
              <tr><th className="p-6">Empleado</th><th className="p-6 text-center">Fecha</th><th className="p-6 text-center">Entrada</th><th className="p-6 text-center">Salida</th><th className="p-6 text-center">Total</th></tr>
            </thead>
            <tbody className="divide-y">
              {filas.map((r, i) => (
                <tr key={i}>
                  <td className="p-6 font-black uppercase">{r.nombre}</td>
                  <td className="p-6 text-center">{r.fecha}</td>
                  <td className="p-6 text-center text-blue-600 font-bold">{r.entrada ? new Date(r.entrada.fecha_hora).toLocaleTimeString() : '--'}</td>
                  <td className="p-6 text-center text-orange-600 font-bold">{r.salida ? new Date(r.salida.fecha_hora).toLocaleTimeString() : 'Pendiente'}</td>
                  <td className="p-6 text-center font-black">{calcularHorasNum(r.entrada, r.salida).toFixed(2)} hrs</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}