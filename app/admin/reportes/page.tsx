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
  const [listaNombres, setListaNombres] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  // ESTADOS PARA FILTROS
  const [filtroNombre, setFiltroNombre] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => {
    fetchAsistencias()
  }, [])

  async function fetchAsistencias() {
    setLoading(true)
    const { data, error } = await supabase
      .from('asistencia')
      .select('*')
      .order('fecha', { ascending: false })
      .order('hora_entrada', { ascending: false })
    
    if (error) {
      console.error("Error cargando datos:", error.message)
    } else {
      setRegistros(data || [])
      // Extraer nombres únicos para el Combo Box de filtrado
      const nombresUnicos = Array.from(new Set((data || []).map(r => r.nombres))).filter(Boolean) as string[]
      setListaNombres(nombresUnicos.sort())
    }
    setLoading(false)
  }

  // CÁLCULO DE HORAS
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

  // LÓGICA DE FILTRADO
  const registrosFiltrados = registros.filter(r => {
    const coincideNombre = filtroNombre === '' || r.nombres === filtroNombre
    const coincideDesde = fechaDesde ? r.fecha >= fechaDesde : true
    const coincideHasta = fechaHasta ? r.fecha <= fechaHasta : true
    return coincideNombre && coincideDesde && coincideHasta
  })

  // EXPORTAR EXCEL
  const exportExcel = () => {
    const dataExcel = registrosFiltrados.map(r => ({
      Empleado: r.nombres, Fecha: r.fecha, Entrada: r.hora_entrada, Salida: r.hora_salida || 'Pendiente', Horas: calcularHoras(r.hora_entrada, r.hora_salida)
    }))
    const ws = XLSX.utils.json_to_sheet(dataExcel)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Reporte")
    XLSX.writeFile(wb, `Reporte_Proaceites_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  // EXPORTAR PDF
  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("PROACEITES - REPORTE DE ASISTENCIA", 14, 20)
    const tableData = registrosFiltrados.map(r => [
      r.nombres, r.fecha, r.hora_entrada, r.hora_salida || '--', calcularHoras(r.hora_entrada, r.hora_salida)
    ])
    // @ts-ignore
    doc.autoTable({ head: [['Empleado', 'Fecha', 'Entrada', 'Salida', 'Hrs']], body: tableData, startY: 30, theme: 'grid' })
    doc.save("Reporte_Asistencia.pdf")
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-black font-sans">
      
      {/* NAVEGACIÓN PRINCIPAL (Para no perder la opción de Empleados) */}
      <nav className="bg-white border-b sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Link href="/admin/reportes" className={`flex-1 text-center py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${pathname === '/admin/reportes' ? 'bg-blue-900 text-white shadow-lg shadow-blue-100' : 'bg-gray-100 text-gray-400'}`}>
            📊 Reportes
          </Link>
          <Link href="/admin/empleados" className={`flex-1 text-center py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${pathname === '/admin/empleados' ? 'bg-blue-900 text-white shadow-lg shadow-blue-100' : 'bg-gray-100 text-gray-400'}`}>
            👥 Personal
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4 pt-6">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tighter leading-none">Auditoría GPS</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Registros de Entrada y Salida</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={exportPDF} className="flex-1 md:flex-none px-5 py-3 bg-white border border-red-100 text-red-600 rounded-2xl text-[10px] font-black uppercase">PDF</button>
            <button onClick={exportExcel} className="flex-1 md:flex-none px-5 py-3 bg-blue-900 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg">Excel</button>
          </div>
        </header>

        {/* PANEL DE FILTROS */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Empleado</label>
            <select 
              className="w-full p-3 bg-gray-50 rounded-xl border-none text-sm outline-none font-bold"
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
            >
              <option value="">TODOS LOS EMPLEADOS</option>
              {listaNombres.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Desde</label>
            <input type="date" className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none" value={fechaDesde} onChange={(e)=>setFechaDesde(e.target.value)}/>
          </div>
          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Hasta</label>
            <input type="date" className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none" value={fechaHasta} onChange={(e)=>setFechaHasta(e.target.value)}/>
          </div>
        </div>

        {/* RESULTADOS */}
        {loading ? (
          <div className="text-center py-20 font-black text-gray-200 uppercase animate-pulse">Sincronizando registros...</div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase italic">No se encontraron marcaciones</p>
            <button onClick={()=>{setFiltroNombre(''); setFechaDesde(''); setFechaHasta('')}} className="mt-4 text-blue-600 font-black text-[10px] uppercase underline">Ver todo el historial</button>
          </div>
        ) : (
          <div className="grid gap-6">
            {registrosFiltrados.map((reg) => (
              <div key={reg.id} className="bg-white rounded-[40px] p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-700 font-black text-xs uppercase">
                      {reg.nombres?.substring(0,2)}
                    </div>
                    <div>
                      <h3 className="font-black text-blue-900 uppercase text-xs leading-none">{reg.nombres}</h3>
                      <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase italic">{reg.fecha}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-lg font-black text-blue-600 leading-none">{calcularHoras(reg.hora_entrada, reg.hora_salida)}</span>
                    <span className="text-[7px] font-black text-gray-300 uppercase tracking-widest">Horas Trabajadas</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* ENTRADA */}
                  <div className="space-y-2 text-center">
                    <span className="text-[8px] font-black text-blue-400 uppercase">Entrada {reg.hora_entrada}</span>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${reg.entrada_gps}`} target="_blank" rel="noreferrer" className="block relative group rounded-[25px] overflow-hidden border">
                      <img src={reg.entrada_foto} className="w-full h-40 object-cover" alt="E" />
                      <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <span className="text-white font-black text-[9px] uppercase">📍 GPS ENTRADA</span>
                      </div>
                    </a>
                  </div>

                  {/* SALIDA */}
                  <div className="space-y-2 text-center">
                    <span className="text-[8px] font-black text-orange-400 uppercase">Salida {reg.hora_salida || '--:--'}</span>
                    {reg.salida_foto ? (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${reg.salida_gps}`} target="_blank" rel="noreferrer" className="block relative group rounded-[25px] overflow-hidden border">
                        <img src={reg.salida_foto} className="w-full h-40 object-cover" alt="S" />
                        <div className="absolute inset-0 bg-orange-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <span className="text-white font-black text-[9px] uppercase">📍 GPS SALIDA</span>
                        </div>
                      </a>
                    ) : (
                      <div className="w-full h-40 bg-gray-50 rounded-[25px] border-2 border-dashed border-gray-100 flex items-center justify-center text-[8px] font-black text-gray-300 uppercase">Sin Registro</div>
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