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
  const [reporteFinal, setReporteFinal] = useState<any[]>([])
  const [empleadosUnicos, setEmpleadosUnicos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Estados de Filtros
  const [filtroNombre, setFiltroNombre] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      // 1. Consultar asistencias con el JOIN a empleados según tu esquema
      const { data: asistencias, error } = await supabase
        .from('asistencia')
        .select(`
          *,
          empleados ( nombres )
        `)
        .order('fecha_hora', { ascending: true })

      if (error) throw error

      // 2. Agrupar por empleado y fecha para unir Ingreso + Salida
      const grupos: any = {}
      const nombresSet = new Set<string>()

      asistencias?.forEach(reg => {
        const nombre = reg.empleados?.nombres || reg.nombres || 'SIN NOMBRE'
        const fecha = reg.fecha_hora ? reg.fecha_hora.split('T')[0] : 'Sin Fecha'
        const llave = `${nombre}-${fecha}`
        
        nombresSet.add(nombre)

        if (!grupos[llave]) {
          grupos[llave] = { 
            nombre, 
            fecha, 
            ingreso: null, 
            salida: null 
          }
        }

        if (reg.tipo_registro === 'ingreso') {
          grupos[llave].ingreso = reg
        } else if (reg.tipo_registro === 'salida') {
          grupos[llave].salida = reg
        }
      })

      setReporteFinal(Object.values(grupos).reverse())
      setEmpleadosUnicos(Array.from(nombresSet).sort())
    } catch (err) {
      console.error("Error cargando datos:", err)
    } finally {
      setLoading(false)
    }
  }

  // Cálculo de horas trabajadas
  const calcularHoras = (ing: any, sal: any) => {
    if (!ing || !sal) return "0.00"
    const inicio = new Date(ing.fecha_hora).getTime()
    const fin = new Date(sal.fecha_hora).getTime()
    const diffMs = fin - inicio
    return diffMs > 0 ? (diffMs / (1000 * 60 * 60)).toFixed(2) : "0.00"
  }

  // Lógica de filtrado en pantalla
  const filtrados = reporteFinal.filter(r => {
    const coincideNom = !filtroNombre || r.nombre === filtroNombre
    const coincideDesde = !fechaDesde || r.fecha >= fechaDesde
    const coincideHasta = !fechaHasta || r.fecha <= fechaHasta
    return coincideNom && coincideDesde && coincideHasta
  })

  // Exportar a EXCEL
  const exportExcel = () => {
    const data = filtrados.map(r => ({
      Empleado: r.nombre,
      Fecha: r.fecha,
      Entrada: r.ingreso ? new Date(r.ingreso.fecha_hora).toLocaleTimeString() : '---',
      Salida: r.salida ? new Date(r.salida.fecha_hora).toLocaleTimeString() : '---',
      Total_Horas: calcularHoras(r.ingreso, r.salida)
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Reporte Asistencia")
    XLSX.writeFile(wb, "Reporte_Asistencia.xlsx")
  }

  // Exportar a PDF
  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("REPORTE DE ASISTENCIA - PROACEITES", 14, 15)
    doc.setFontSize(10)
    doc.text(`Fecha de reporte: ${new Date().toLocaleDateString()}`, 14, 22)

    const rows = filtrados.map(r => [
      r.nombre,
      r.fecha,
      r.ingreso ? new Date(r.ingreso.fecha_hora).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-',
      r.salida ? new Date(r.salida.fecha_hora).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-',
      calcularHoras(r.ingreso, r.salida)
    ])

    ;(doc as any).autoTable({
      head: [['Empleado', 'Fecha', 'Entrada', 'Salida', 'Horas']],
      body: rows,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138] }
    })
    doc.save("Reporte_Asistencia.pdf")
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-20 font-sans text-slate-900">
      {/* NAVEGACIÓN */}
      <nav className="bg-white p-4 sticky top-0 z-50 shadow-md border-b">
        <div className="max-w-6xl mx-auto flex gap-3">
          <Link href="/admin/reportes" className="flex-1 bg-blue-900 text-white text-center py-2.5 rounded-xl text-[10px] font-black uppercase">📊 Reportes</Link>
          <Link href="/admin/empleados" className="flex-1 bg-slate-100 text-slate-400 text-center py-2.5 rounded-xl text-[10px] font-black uppercase">👥 Personal</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-black text-blue-900 uppercase italic tracking-tighter">Asistencia Consolidada</h1>
          <div className="flex gap-2">
            <button onClick={exportExcel} className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">Excel</button>
            <button onClick={exportPDF} className="bg-red-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">PDF</button>
            <button onClick={fetchData} className="bg-white text-blue-900 border-2 border-blue-900 px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-md">Actualizar</button>
          </div>
        </header>

        {/* FILTROS */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-200">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Empleado</label>
            <select 
              className="w-full p-3 bg-slate-50 rounded-2xl text-xs font-bold border-none outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500"
              value={filtroNombre} 
              onChange={(e) => setFiltroNombre(e.target.value)}
            >
              <option value="">TODOS</option>
              {empleadosUnicos.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Desde</label>
              <input type="date" className="w-full p-3 bg-slate-50 rounded-2xl text-xs font-bold ring-1 ring-slate-200" value={fechaDesde} onChange={(e)=>setFechaDesde(e.target.value)}/>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Hasta</label>
              <input type="date" className="w-full p-3 bg-slate-50 rounded-2xl text-xs font-bold ring-1 ring-slate-200" value={fechaHasta} onChange={(e)=>setFechaHasta(e.target.value)}/>
            </div>
          </div>
        </div>

        {/* LISTADO */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-20 text-slate-300 font-black uppercase animate-pulse">Sincronizando registros...</div>
          ) : filtrados.map((item, idx) => (
            <div key={idx} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-6 items-center">
              
              {/* Resumen de Jornada */}
              <div className="lg:w-1/4 w-full text-center lg:text-left lg:border-r lg:pr-6 border-slate-100">
                <h2 className="text-xl font-black text-blue-900 leading-none mb-1">{item.nombre}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-tighter">{item.fecha}</p>
                <div className="inline-block bg-blue-50 text-blue-700 px-5 py-2 rounded-2xl border border-blue-100">
                   <p className="text-2xl font-black leading-none">{calcularHoras(item.ingreso, item.salida)}</p>
                   <p className="text-[7px] font-bold uppercase tracking-widest">Horas Trabajadas</p>
                </div>
              </div>

              {/* Entrada */}
              <div className={`flex-1 flex items-center gap-4 p-4 rounded-[2rem] border ${item.ingreso ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 opacity-40 italic border-slate-100'}`}>
                <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden shadow-inner flex-shrink-0 border border-slate-100">
                  {item.ingreso?.foto_url || item.ingreso?.foto ? (
                    <img src={item.ingreso.foto_url || item.ingreso.foto} className="w-full h-full object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-[7px] font-black text-slate-300 uppercase">Sin Foto</div>}
                </div>
                <div>
                  <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Entrada</p>
                  <p className="text-xl font-black">{item.ingreso ? new Date(item.ingreso.fecha_hora).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}</p>
                </div>
              </div>

              {/* Salida */}
              <div className={`flex-1 flex items-center gap-4 p-4 rounded-[2rem] border ${item.salida ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 opacity-40 italic border-slate-100'}`}>
                <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden shadow-inner flex-shrink-0 border border-slate-100">
                  {item.salida?.foto_url || item.salida?.foto ? (
                    <img src={item.salida.foto_url || item.salida.foto} className="w-full h-full object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-[7px] font-black text-slate-300 uppercase">Sin Foto</div>}
                </div>
                <div>
                  <p className="text-[8px] font-black text-orange-600 uppercase mb-1">Salida</p>
                  <p className="text-xl font-black">{item.salida ? new Date(item.salida.fecha_hora).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}</p>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  )
}