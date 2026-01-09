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
  const [registros, setRegistros] = useState<any[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [filtroNombre, setFiltroNombre] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setLoading(true)
    // Cargar empleados para el combo
    const { data: emps } = await supabase.from('empleados').select('nombres').order('nombres')
    if (emps) setEmpleados(emps)

    // Cargar asistencias
    const { data: asistencias } = await supabase
      .from('asistencia')
      .select('*, empleados(nombres)')
      .order('fecha_hora', { ascending: false })
    
    if (asistencias) setRegistros(asistencias)
    setLoading(false)
  }

  const calcularHoras = (inicio: string, fin: string) => {
    if (!inicio || !fin) return '0.0'
    const diff = (new Date(fin).getTime() - new Date(inicio).getTime()) / (1000 * 60 * 60)
    return diff > 0 ? diff.toFixed(2) : '0.0'
  }

  const filtrados = registros.filter(r => {
    const nombre = (r.empleados?.nombres || r.nombres || "").toLowerCase()
    const coincideNom = filtroNombre === '' || nombre === filtroNombre.toLowerCase()
    const fechaReg = r.fecha_hora ? r.fecha_hora.split('T')[0] : ''
    const coincideDesde = !fechaDesde || fechaReg >= fechaDesde
    const coincideHasta = !fechaHasta || fechaReg <= fechaHasta
    return coincideNom && coincideDesde && coincideHasta
  })

  // --- EXPORTAR A EXCEL ---
  const exportarExcel = () => {
    const data = filtrados.map(r => ({
      Empleado: r.empleados?.nombres || r.nombres,
      Fecha: r.fecha_hora.split('T')[0],
      Tipo: r.tipo_registro.toUpperCase(),
      Hora: new Date(r.fecha_hora).toLocaleTimeString()
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Reporte")
    XLSX.writeFile(wb, "Reporte_Asistencia.xlsx")
  }

  // --- EXPORTAR A PDF ---
  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("REPORTE DE ASISTENCIA PROACEITES", 14, 20)
    doc.setFontSize(10)
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 28)

    const tableData = filtrados.map(r => [
      r.empleados?.nombres || r.nombres,
      r.fecha_hora.split('T')[0],
      r.tipo_registro.toUpperCase(),
      new Date(r.fecha_hora).toLocaleTimeString()
    ])

    ;(doc as any).autoTable({
      head: [['EMPLEADO', 'FECHA', 'TIPO', 'HORA']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] } // Azul oscuro
    })

    doc.save("Reporte_Asistencia.pdf")
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24 text-black">
      <nav className="bg-white border-b sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex gap-2">
          <Link href="/admin/reportes" className="flex-1 text-center py-2 rounded-xl text-[10px] font-black uppercase bg-blue-900 text-white">📊 Reportes</Link>
          <Link href="/admin/empleados" className="flex-1 text-center py-2 rounded-xl text-[10px] font-black uppercase bg-gray-100 text-gray-400">👥 Personal</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 pt-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-blue-900 uppercase italic">Auditoría de Personal</h1>
          <div className="flex gap-2">
            <button onClick={exportarExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase shadow-sm">Excel</button>
            <button onClick={exportarPDF} className="bg-red-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase shadow-sm">PDF</button>
          </div>
        </div>

        {/* FILTROS */}
        <div className="bg-white p-5 rounded-3xl shadow-sm mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 border border-gray-200">
          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Empleado</label>
            <select className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold border-none" value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)}>
              <option value="">TODOS</option>
              {empleados.map((e, i) => <option key={i} value={e.nombres.toLowerCase()}>{e.nombres}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Desde</label>
            <input type="date" className="w-full p-3 bg-gray-50 rounded-xl text-xs" value={fechaDesde} onChange={(e)=>setFechaDesde(e.target.value)}/>
          </div>
          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Hasta</label>
            <input type="date" className="w-full p-3 bg-gray-50 rounded-xl text-xs" value={fechaHasta} onChange={(e)=>setFechaHasta(e.target.value)}/>
          </div>
        </div>

        {/* REGISTROS */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 font-bold text-gray-400 animate-pulse">CARGANDO REGISTROS...</div>
          ) : filtrados.map((reg) => (
            <div key={reg.id} className="bg-white p-5 rounded-[2rem] shadow-sm flex flex-col md:flex-row items-center gap-6 border border-gray-100">
              {/* MINIATURA DE FOTO */}
              <div className="w-24 h-24 bg-gray-200 rounded-3xl overflow-hidden border flex-shrink-0">
                {reg.foto_url || reg.foto ? (
                  <img src={reg.foto_url || reg.foto} className="w-full h-full object-cover" alt="Marcación" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[8px] font-black opacity-20 uppercase">No Foto</div>
                )}
              </div>

              {/* DATOS PRINCIPALES */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                  <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase ${reg.tipo_registro === 'ingreso' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {reg.tipo_registro}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">{reg.fecha_hora.split('T')[0]}</span>
                </div>
                <h3 className="text-xl font-black text-blue-900 uppercase tracking-tighter">
                  {new Date(reg.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </h3>
                <p className="text-sm font-black text-gray-600 uppercase mt-1">{reg.empleados?.nombres || reg.nombres}</p>
              </div>

              {/* BOTÓN UBICACIÓN */}
              <div className="w-full md:w-auto">
                {reg.geolocalizacion ? (
                  <a 
                    href={`https://www.google.com/maps?q=${reg.geolocalizacion.y},${reg.geolocalizacion.x}`} 
                    target="_blank" 
                    className="flex flex-col items-center justify-center w-full md:w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <span className="text-xl">📍</span>
                    <span className="text-[7px] font-black uppercase mt-1 tracking-tighter">Ver Mapa</span>
                  </a>
                ) : (
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl border border-dashed flex flex-col items-center justify-center opacity-30">
                    <span className="text-[7px] font-black uppercase">Sin GPS</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}