'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import * as XLSX from 'xlsx'

export default function ReportesAsistencia() {
  const [reportes, setReportes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  // Por defecto filtramos por el día de hoy para que no veas la tabla vacía
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0])

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

  const reportesFiltrados = reportes.filter(reg => {
    const cumpleNombre = (reg.nombres || '').toLowerCase().includes(busqueda.toLowerCase())
    const cumpleFechaInicio = fechaInicio ? reg.fecha >= fechaInicio : true
    const cumpleFechaFin = fechaFin ? reg.fecha <= fechaFin : true
    return cumpleNombre && cumpleFechaInicio && cumpleFechaFin
  })

  const formatearHora = (iso: string) => {
    if(!iso) return '---'
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(reportesFiltrados.map(r => ({
      Empleado: r.nombres, 
      Fecha: r.fecha, 
      Evento: r.tipo_registro?.toUpperCase(), 
      Hora: formatearHora(r.fecha_hora),
      Ubicacion: r.ubicacion || 'No registrada'
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Asistencia")
    XLSX.writeFile(wb, `Asistencia_${fechaInicio}.xlsx`)
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen text-black font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase text-blue-900 tracking-tighter">Reporte de Asistencia</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Registros de la tabla asistencia</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportarExcel} className="bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">Descargar Excel</button>
            <button onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">Imprimir PDF</button>
          </div>
        </header>

        {/* FILTROS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <input type="text" placeholder="🔍 Buscar por nombre..." className="p-3 rounded-xl border-none shadow-sm text-xs" onChange={(e) => setBusqueda(e.target.value)} />
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm">
            <span className="text-[9px] font-black text-gray-400 uppercase">Desde:</span>
            <input type="date" value={fechaInicio} className="text-xs border-none outline-none w-full" onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm">
            <span className="text-[9px] font-black text-gray-400 uppercase">Hasta:</span>
            <input type="date" value={fechaFin} className="text-xs border-none outline-none w-full" onChange={(e) => setFechaFin(e.target.value)} />
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-[30px] overflow-hidden border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400">
                <th className="p-4">Personal</th>
                <th className="p-4 text-center">Fecha</th>
                <th className="p-4 text-center">Evento</th>
                <th className="p-4 text-center">Hora</th>
                <th className="p-4 text-center">Ubicación</th>
                <th className="p-4 text-center">Foto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="p-10 text-center text-xs font-bold animate-pulse">CARGANDO...</td></tr>
              ) : reportesFiltrados.map((reg) => (
                <tr key={reg.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="p-4 font-bold text-[11px] uppercase">{reg.nombres || 'Sin nombre'}</td>
                  <td className="p-4 text-center text-[11px] text-gray-500">{reg.fecha}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${reg.tipo_registro === 'ingreso' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                      {reg.tipo_registro}
                    </span>
                  </td>
                  <td className="p-4 text-center text-[11px] font-mono">{formatearHora(reg.fecha_hora)}</td>
                  <td className="p-4 text-center text-[9px] text-gray-400 truncate max-w-[150px]">{reg.ubicacion || '---'}</td>
                  <td className="p-4 text-center">
                    {reg.foto_url ? (
                      <a href={reg.foto_url} target="_blank" className="text-xl">📸</a>
                    ) : <span className="text-[8px] text-gray-300">SIN FOTO</span>}
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