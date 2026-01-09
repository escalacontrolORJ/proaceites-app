'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ReporteAsistencia() {
  const pathname = usePathname()
  const [registros, setRegistros] = useState<any[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // ESTADOS PARA FILTROS
  const [filtroNombre, setFiltroNombre] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => {
    cargarDatosIniciales()
  }, [])

  async function cargarDatosIniciales() {
    setLoading(true)
    
    // 1. Cargar lista de empleados para el selector
    const { data: dataEmp } = await supabase
      .from('empleados')
      .select('nombres')
      .order('nombres', { ascending: true })
    
    if (dataEmp) setEmpleados(dataEmp)

    // 2. Cargar todas las asistencias registradas
    const { data: dataAsis, error } = await supabase
      .from('asistencia')
      .select('*')
      .order('fecha', { ascending: false })
      .order('hora_entrada', { ascending: false })
    
    if (error) {
      console.error("Error cargando asistencias:", error.message)
    } else {
      setRegistros(dataAsis || [])
    }
    
    setLoading(false)
  }

  // Función para limpiar filtros y ver todo
  const verTodo = () => {
    setFiltroNombre('')
    setFechaDesde('')
    setFechaHasta('')
    cargarDatosIniciales()
  }

  const calcularHoras = (entrada: string, salida: string) => {
    if (!entrada || !salida) return '0.0'
    try {
      const [h1, m1] = entrada.split(':').map(Number)
      const [h2, m2] = salida.split(':').map(Number)
      const totalMinutos = (h2 * 60 + m2) - (h1 * 60 + m1)
      const horas = totalMinutos / 60
      return horas > 0 ? horas.toFixed(1) : '0.0'
    } catch (e) { return '0.0' }
  }

  // LÓGICA DE FILTRADO CON LIMPIEZA DE TEXTO (TRIM)
  const registrosFiltrados = registros.filter(r => {
    // Normalizamos los nombres eliminando espacios accidentales al inicio/final
    const nombreEnRegistro = (r.nombres || "").trim().toLowerCase()
    const nombreEnFiltro = (filtroNombre || "").trim().toLowerCase()

    const coincideNombre = filtroNombre === '' || nombreEnRegistro === nombreEnFiltro
    const coincideDesde = fechaDesde ? r.fecha >= fechaDesde : true
    const coincideHasta = fechaHasta ? r.fecha <= fechaHasta : true
    
    return coincideNombre && coincideDesde && coincideHasta
  })

  // EXPORTACIÓN A EXCEL
  const exportExcel = () => {
    const dataExcel = registrosFiltrados.map(r => ({
      Empleado: r.nombres,
      Fecha: r.fecha,
      Entrada: r.hora_entrada,
      Salida: r.hora_salida || 'Pendiente',
      Horas: calcularHoras(r.hora_entrada, r.hora_salida),
      GPS_E: r.entrada_gps,
      GPS_S: r.salida_gps
    }))
    const ws = XLSX.utils.json_to_sheet(dataExcel)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Reporte")
    XLSX.writeFile(wb, `Reporte_Proaceites_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  // EXPORTACIÓN A PDF
  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text("PROACEITES - REPORTE DE ASISTENCIA", 14, 20)
    const tableData = registrosFiltrados.map(r => [
      r.nombres, r.fecha, r.hora_entrada, r.hora_salida || '--', calcularHoras(r.hora_entrada, r.hora_salida)
    ])
    // @ts-ignore
    doc.autoTable({ head: [['Empleado', 'Fecha', 'Entrada', 'Salida', 'Hrs']], body: tableData, startY: 30 })
    doc.save("Reporte_Asistencia.pdf")
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24 text-black font-sans">
      
      {/* NAVEGACIÓN SUPERIOR FIXED */}
      <nav className="bg-white border-b sticky top-0 z-50 px-4 py-3 shadow-md">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Link href="/admin/reportes" className={`flex-1 text-center py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${pathname === '/admin/reportes' ? 'bg-blue-900 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-400'}`}>
            📊 Reportes
          </Link>
          <Link href="/admin/empleados" className={`flex-1 text-center py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${pathname === '/admin/empleados' ? 'bg-blue-900 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-400'}`}>
            👥 Personal
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4 pt-6">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tighter leading-none">Auditoría GPS</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Gestión Administrativa</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={exportPDF} className="flex-1 md:flex-none px-6 py-3 bg-white border border-red-100 text-red-600 rounded-2xl text-[10px] font-black uppercase shadow-sm">PDF</button>
            <button onClick={exportExcel} className="flex-1 md:flex-none px-6 py-3 bg-blue-900 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg">Excel</button>
          </div>
        </header>

        {/* FILTROS */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Seleccionar Empleado</label>
            <select 
              className="w-full p-3 bg-gray-50 rounded-xl border-none text-sm font-bold outline-none ring-1 ring-gray-100"
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
            >
              <option value="">MOSTRAR TODOS</option>
              {empleados.map((emp, idx) => (
                <option key={idx} value={emp.nombres}>{emp.nombres}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Desde</label>
            <input type="date" className="w-full p-3 bg-gray-50 rounded-xl text-sm border-none outline-none ring-1 ring-gray-100" value={fechaDesde} onChange={(e)=>setFechaDesde(e.target.value)}/>
          </div>
          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Hasta</label>
            <input type="date" className="w-full p-3 bg-gray-50 rounded-xl text-sm border-none outline-none ring-1 ring-gray-100" value={fechaHasta} onChange={(e)=>setFechaHasta(e.target.value)}/>
          </div>
        </div>

        {/* RESULTADOS */}
        {loading ? (
          <div className="text-center py-20 font-black text-gray-300 uppercase animate-pulse">Sincronizando...</div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-4">No hay marcaciones para esta búsqueda</p>
            <button 
              onClick={verTodo}
              className="px-6 py-3 bg-blue-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-100"
            >
              Ver Todo el Historial
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {registrosFiltrados.map((reg) => (
              <div key={reg.id} className="bg-white rounded-[40px] p-6 shadow-sm border border-gray-50">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-900 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-lg">
                      {reg.nombres?.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-blue-900 uppercase text-[13px] leading-none">{reg.nombres}</h3>
                      <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase italic tracking-tighter">{reg.fecha}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xl font-black text-blue-700 leading-none">{calcularHoras(reg.hora_entrada, reg.hora_salida)}</span>
                    <span className="text-[7px] font-black text-gray-300 uppercase">Horas</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* ENTRADA */}
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-blue-500 uppercase px-2 flex justify-between">
                      <span>ENTRADA</span>
                      <span>{reg.hora_entrada}</span>
                    </p>
                    <a href={`https://www.google.com/maps?q=${reg.entrada_gps}`} target="_blank" rel="noreferrer" className="block relative rounded-[30px] overflow-hidden border shadow-inner">
                      <img src={reg.entrada_foto} className="w-full h-44 object-cover" alt="E" />
                    </a>
                  </div>

                  {/* SALIDA */}
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-orange-500 uppercase px-2 flex justify-between">
                      <span>SALIDA</span>
                      <span>{reg.hora_salida || '--:--'}</span>
                    </p>
                    {reg.salida_foto ? (
                      <a href={`https://www.google.com/maps?q=${reg.salida_gps}`} target="_blank" rel="noreferrer" className="block relative rounded-[30px] overflow-hidden border shadow-inner">
                        <img src={reg.salida_foto} className="w-full h-44 object-cover" alt="S" />
                      </a>
                    ) : (
                      <div className="w-full h-44 bg-gray-50 rounded-[30px] border-2 border-dashed border-gray-100 flex items-center justify-center text-[8px] font-black text-gray-300 uppercase italic">Pendiente</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}