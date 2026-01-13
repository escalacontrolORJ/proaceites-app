'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import * as XLSX from 'xlsx'

export default function ReporteAdministrativo() {
  const [datosRaw, setDatosRaw] = useState<any[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0])
  const [filtroNombre, setFiltroNombre] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data: emps } = await supabase.from('empleados').select('id, nombres')
    setEmpleados(emps || [])

    const { data: asist, error } = await supabase
      .from('asistencia')
      .select('*')
      .order('fecha_hora', { ascending: false })

    if (error) console.error("Error:", error)

    setDatosRaw(asist || [])
    setLoading(false)
  }

  const procesarReporte = () => {
    const mapa: Record<string, any> = {}

    datosRaw.forEach(reg => {
      const fechaLimpia = reg.fecha || reg.fecha_hora?.split('T')[0]
      const idEmp = reg.empleado_id
      const llave = `${idEmp}-${fechaLimpia}`

      if (!mapa[llave]) {
        const nombreAux = reg.nombres || empleados.find(e => e.id === idEmp)?.nombres || 'Sin Nombre'
        mapa[llave] = {
          nombre: nombreAux,
          fecha: fechaLimpia,
          ingreso: null,
          salida: null,
          gps: reg.ubicacion || reg.geolocalizacion
        }
      }

      if (reg.tipo_registro === 'ingreso') {
        mapa[llave].ingreso = reg.fecha_hora
      } else if (reg.tipo_registro === 'salida') {
        mapa[llave].salida = reg.fecha_hora
      }
    })

    return Object.values(mapa).filter((r: any) => {
      const cumpleFecha = r.fecha >= fechaInicio && r.fecha <= fechaFin
      const cumpleNombre = !filtroNombre || r.nombre === filtroNombre
      return cumpleFecha && cumpleNombre
    })
  }

  const reporteFiltrado = procesarReporte()

  const calcularHoras = (ent: string, sal: string) => {
    if (!ent || !sal) return "Incompleto"
    const d1 = new Date(ent).getTime()
    const d2 = new Date(sal).getTime()
    const hrs = (d2 - d1) / (1000 * 60 * 60)
    return hrs > 0 ? hrs.toFixed(2) + " hrs" : "0.00 hrs"
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-blue-900 uppercase">Reporte General</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Consolidado de Asistencia</p>
          </div>
          <button 
            onClick={() => {
              const ws = XLSX.utils.json_to_sheet(reporteFiltrado)
              const wb = XLSX.utils.book_new()
              XLSX.utils.book_append_sheet(wb, ws, "Asistencia")
              XLSX.writeFile(wb, `Reporte_${fechaInicio}.xlsx`)
            }}
            className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg"
          >
            Descargar Excel
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-black">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Empleado</label>
            <select className="w-full bg-transparent font-bold text-sm outline-none" value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)}>
              <option value="">TODOS</option>
              {empleados.map(e => <option key={e.id} value={e.nombres}>{e.nombres}</option>)}
            </select>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Desde</label>
            <input type="date" className="w-full font-bold text-sm" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Hasta</label>
            <input type="date" className="w-full font-bold text-sm" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
        </div>

        <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase">
              <tr>
                <th className="p-6">Colaborador</th>
                <th className="p-6 text-center">Fecha</th>
                <th className="p-6 text-center">Entrada</th>
                <th className="p-6 text-center">Salida</th>
                <th className="p-6 text-center">Total</th>
                <th className="p-6 text-center">Mapa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-bold text-black">
              {loading ? (
                <tr><td colSpan={6} className="p-20 text-center animate-pulse uppercase">Cargando...</td></tr>
              ) : reporteFiltrado.map((r: any, i) => (
                <tr key={i} className="hover:bg-blue-50/30">
                  <td className="p-6 text-blue-900 uppercase">{r.nombre}</td>
                  <td className="p-6 text-center text-slate-400">{r.fecha}</td>
                  <td className="p-6 text-center text-blue-600">
                    {r.ingreso ? new Date(r.ingreso).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                  </td>
                  <td className="p-6 text-center text-orange-600">
                    {r.salida ? new Date(r.salida).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                  </td>
                  <td className="p-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] ${r.salida ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                      {calcularHoras(r.ingreso, r.salida)}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    {r.gps && <a href={r.gps} target="_blank" className="text-blue-500 font-black">📍 VER</a>}
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