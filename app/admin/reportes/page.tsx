'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function ReportesAsistencia() {
  const [reportes, setReportes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados para Filtros
  const [busqueda, setBusqueda] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  useEffect(() => { fetchReportes() }, [])

  async function fetchReportes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('asistencia')
      .select('*')
      .order('fecha_hora', { ascending: false })

    if (!error) setReportes(data || [])
    setLoading(false)
  }

  // Lógica de Filtrado
  const reportesFiltrados = reportes.filter(reg => {
    const cumpleNombre = reg.nombres?.toLowerCase().includes(busqueda.toLowerCase())
    const cumpleFechaInicio = fechaInicio ? reg.fecha >= fechaInicio : true
    const cumpleFechaFin = fechaFin ? reg.fecha <= fechaFin : true
    return cumpleNombre && cumpleFechaInicio && cumpleFechaFin
  })

  const formatearHora = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  // EXPORTAR A EXCEL
  const exportarExcel = () => {
    const datosExcel = reportesFiltrados.map(r => ({
      Empleado: r.nombres,
      Fecha: r.fecha,
      Evento: r.tipo_registro.toUpperCase(),
      Hora: formatearHora(r.fecha_hora),
      Foto_URL: r.foto_url || 'Sin foto'
    }))
    const ws = XLSX.utils.json_to_sheet(datosExcel)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Asistencia")
    XLSX.writeFile(wb, `Reporte_Asistencia_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // EXPORTAR A PDF
  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.text("Reporte de Asistencia - Proaceites", 14, 15)
    const filas = reportesFiltrados.map(r => [
      r.nombres,
      r.fecha,
      r.tipo_registro.toUpperCase(),
      formatearHora(r.fecha_hora)
    ])
    ;(doc as any).autoTable({
      head: [['Empleado', 'Fecha', 'Evento', 'Hora']],
      body: filas,
      startY: 20
    })
    doc.save(`Reporte_Asistencia_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen text-black font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase text-blue-900 tracking-tighter leading-none">Panel de Reportes</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestión de Asistencia Proaceites</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportarExcel} className="bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-green-100">Excel</button>
            <button onClick={exportarPDF} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-red-100">PDF</button>
          </div>
        </header>

        {/* BARRA DE FILTROS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="relative">
            <input type="text" placeholder="Buscar empleado..." className="w-full p-3 pl-10 rounded-xl border-none shadow-sm text-xs bg-white" onChange={(e) => setBusqueda(e.target.value)} />
            <span className="absolute left-3 top-3 opacity-30">🔍</span>
          </div>
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm">
            <span className="text-[9px] font-black text-gray-400 uppercase pl-2">Desde:</span>
            <input type="date" className="text-xs border-none outline-none w-full" onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm">
            <span className="text-[9px] font-black text-gray-400 uppercase pl-2">Hasta:</span>
            <input type="date" className="text-xs border-none outline-none w-full" onChange={(e) => setFechaFin(e.target.value)} />
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-[30px] overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-[10px] font-black uppercase text-gray-400">Personal</th>
                  <th className="p-4 text-[10px] font-black uppercase text-gray-400">Fecha</th>
                  <th className="p-4 text-[10px] font-black uppercase text-gray-400">Evento</th>
                  <th className="p-4 text-[10px] font-black uppercase text-gray-400 text-center">Hora</th>
                  <th className="p-4 text-[10px] font-black uppercase text-gray-400 text-center">Evidencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={5} className="p-10 text-center text-xs font-black animate-pulse uppercase">Cargando reportes...</td></tr>
                ) : reportesFiltrados.map((reg) => (
                  <tr key={reg.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="p-4 font-bold text-[11px] uppercase">{reg.nombres}</td>
                    <td className="p-4 text-[11px] text-gray-500 font-medium">{reg.fecha}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${reg.tipo_registro === 'ingreso' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {reg.tipo_registro}
                      </span>
                    </td>
                    <td className="p-4 text-center text-[11px] font-bold">{formatearHora(reg.fecha_hora)}</td>
                    <td className="p-4 text-center">
                      {reg.foto_url ? (
                        <a href={reg.foto_url} target="_blank" className="text-xl inline-block hover:scale-110">📸</a>
                      ) : <span className="text-[8px] text-gray-300 font-bold uppercase italic">Sin foto</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}