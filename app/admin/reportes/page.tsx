'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

export default function ReporteAsistencia() {
  const pathname = usePathname()
  const [registrosAgrupados, setRegistrosAgrupados] = useState<any[]>([])
  const [empleadosLista, setEmpleadosLista] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filtroNombre, setFiltroNombre] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      // 1. Obtener lista de empleados para el COMBO
      const { data: emps } = await supabase.from('empleados').select('nombres').order('nombres')
      setEmpleadosLista(emps || [])

      // 2. Obtener asistencias con JOIN
      const { data: asistencias, error } = await supabase
        .from('asistencia')
        .select('*, empleados(nombres)')
        .order('fecha_hora', { ascending: true })

      if (error) throw error

      // 3. Lógica para AGRUPAR ingreso y salida por día y empleado
      const grupos: any = {}
      
      asistencias?.forEach(reg => {
        const nombre = reg.empleados?.nombres || reg.nombres || 'Desconocido'
        const fecha = reg.fecha_hora.split('T')[0]
        const llave = `${nombre}-${fecha}`

        if (!grupos[llave]) {
          grupos[llave] = { nombre, fecha, ingreso: null, salida: null }
        }

        if (reg.tipo_registro === 'ingreso') {
          grupos[llave].ingreso = reg
        } else if (reg.tipo_registro === 'salida') {
          grupos[llave].salida = reg
        }
      })

      setRegistrosAgrupados(Object.values(grupos).reverse())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Calcular horas trabajadas
  const calcularTotalHoras = (ing: any, sal: any) => {
    if (!ing || !sal) return '0.0'
    const inicio = new Date(ing.fecha_hora).getTime()
    const fin = new Date(sal.fecha_hora).getTime()
    const diffMs = fin - inicio
    return diffMs > 0 ? (diffMs / (1000 * 60 * 60)).toFixed(2) : '0.0'
  }

  // Filtrado
  const filtrados = registrosAgrupados.filter(r => {
    const coincideNom = filtroNombre === '' || r.nombre === filtroNombre
    const coincideDesde = fechaDesde === '' || r.fecha >= fechaDesde
    const coincideHasta = fechaHasta === '' || r.fecha <= fechaHasta
    return coincideNom && coincideDesde && coincideHasta
  })

  // Exportar a Excel
  const exportExcel = () => {
    const data = filtrados.map(r => ({
      Empleado: r.nombre,
      Fecha: r.fecha,
      Ingreso: r.ingreso ? new Date(r.ingreso.fecha_hora).toLocaleTimeString() : 'N/A',
      Salida: r.salida ? new Date(r.salida.fecha_hora).toLocaleTimeString() : 'N/A',
      'Total Horas': calcularTotalHoras(r.ingreso, r.salida)
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Reporte")
    XLSX.writeFile(wb, `Reporte_Proaceites_${new Date().toLocaleDateString()}.xlsx`)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900 font-sans">
      <nav className="bg-white border-b sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex gap-2">
          <Link href="/admin/reportes" className="flex-1 text-center py-2.5 rounded-xl text-[10px] font-black uppercase bg-blue-900 text-white shadow-lg">📊 Reportes</Link>
          <Link href="/admin/empleados" className="flex-1 text-center py-2.5 rounded-xl text-[10px] font-black uppercase bg-gray-100 text-gray-400">👥 Personal</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 pt-8">
        <header className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-black text-blue-950 uppercase italic tracking-tighter">Reporte Consolidado</h1>
          <div className="flex gap-2">
            <button onClick={exportExcel} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Excel</button>
            <button onClick={fetchData} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Actualizar</button>
          </div>
        </header>

        {/* FILTROS CON COMBO */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Seleccionar Empleado</label>
            <select 
              className="w-full p-3 bg-slate-50 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-blue-100"
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
            >
              <option value="">TODOS</option>
              {empleadosLista.map((e, i) => <option key={i} value={e.nombres}>{e.nombres}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Desde</label>
            <input type="date" className="w-full p-3 bg-slate-50 rounded-2xl text-xs outline-none" value={fechaDesde} onChange={(e)=>setFechaDesde(e.target.value)}/>
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Hasta</label>
            <input type="date" className="w-full p-3 bg-slate-50 rounded-2xl text-xs outline-none" value={fechaHasta} onChange={(e)=>setFechaHasta(e.target.value)}/>
          </div>
        </div>

        {/* LISTADO AGRUPADO */}
        <div className="space-y-6">
          {loading ? (
            <p className="text-center py-20 font-black text-slate-300 uppercase animate-pulse">Procesando datos...</p>
          ) : filtrados.map((r, i) => (
            <div key={i} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center border-b pb-4 mb-4">
                <div>
                  <h2 className="text-lg font-black text-blue-900 uppercase">{r.nombre}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.fecha}</p>
                </div>
                <div className="bg-blue-900 text-white px-5 py-2 rounded-2xl text-center">
                  <p className="text-xl font-black leading-none">{calcularTotalHoras(r.ingreso, r.salida)}</p>
                  <p className="text-[7px] font-bold uppercase">Horas Totales</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Ingreso */}
                <div className="bg-emerald-50/50 p-4 rounded-3xl flex items-center gap-4">
                  <div className="w-20 h-20 bg-white rounded-2xl overflow-hidden shadow-sm border flex-shrink-0">
                    {r.ingreso?.foto_url ? <img src={r.ingreso.foto_url} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-[8px] font-bold opacity-30">SIN FOTO</div>}
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-emerald-600 uppercase">Entrada</p>
                    <p className="text-xl font-black">{r.ingreso ? new Date(r.ingreso.fecha_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</p>
                  </div>
                </div>

                {/* Salida */}
                <div className="bg-orange-50/50 p-4 rounded-3xl flex items-center gap-4">
                  <div className="w-20 h-20 bg-white rounded-2xl overflow-hidden shadow-sm border flex-shrink-0">
                    {r.salida?.foto_url ? <img src={r.salida.foto_url} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-[8px] font-bold opacity-30">SIN FOTO</div>}
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-orange-600 uppercase">Salida</p>
                    <p className="text-xl font-black">{r.salida ? new Date(r.salida.fecha_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}