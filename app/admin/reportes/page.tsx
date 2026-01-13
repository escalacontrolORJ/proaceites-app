'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import * as XLSX from 'xlsx'

export default function ReportesAsistencia() {
  const [reportes, setReportes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  
  // Rango de fechas: Hoy por defecto
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchReportes()
  }, [])

  async function fetchReportes() {
    setLoading(true)
    // Consultamos la tabla asistencia
    const { data, error } = await supabase
      .from('asistencia')
      .select('*')
      .order('fecha_hora', { ascending: false })

    if (error) {
      console.error("Error:", error.message)
    } else {
      setReportes(data || [])
    }
    setLoading(false)
  }

  // Filtrado en tiempo real
  const filtrados = reportes.filter(reg => {
    const nombre = reg.nombres || 'SIN NOMBRE'
    const cumpleNombre = nombre.toLowerCase().includes(busqueda.toLowerCase())
    const cumpleFechaInicio = fechaInicio ? reg.fecha >= fechaInicio : true
    const cumpleFechaFin = fechaFin ? reg.fecha <= fechaFin : true
    return cumpleNombre && cumpleFechaInicio && cumpleFechaFin
  })

  const formatearHora = (iso: string) => {
    if (!iso) return '--:--'
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtrados.map(r => ({
      Empleado: r.nombres || 'Sin Nombre',
      Fecha: r.fecha,
      Tipo: r.tipo_registro?.toUpperCase(),
      Hora: formatearHora(r.fecha_hora),
      Ubicacion: r.ubicacion || 'No registrada'
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Asistencia")
    XLSX.writeFile(wb, `Reporte_Proaceites_${fechaInicio}.xlsx`)
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen text-black font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase text-blue-900 tracking-tighter">Panel de Asistencia</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Registros de Marcaciones Reales</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportarExcel} className="bg-green-600 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-green-700 transition-all">Excel</button>
            <button onClick={() => window.print()} className="bg-gray-800 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-black transition-all">Imprimir PDF</button>
          </div>
        </header>

        {/* FILTROS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="relative">
            <input 
              type="text" 
              placeholder="🔍 Buscar por nombre..." 
              className="w-full p-4 rounded-2xl border-none shadow-sm text-xs bg-white outline-none focus:ring-2 focus:ring-blue-500" 
              onChange={(e) => setBusqueda(e.target.value)} 
            />
          </div>
          <div className="flex items-center gap-2 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
            <span className="text-[9px] font-black text-gray-400 uppercase">Desde</span>
            <input type="date" value={fechaInicio} className="text-xs border-none outline-none w-full font-bold" onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
            <span className="text-[9px] font-black text-gray-400 uppercase">Hasta</span>
            <input type="date" value={fechaFin} className="text-xs border-none outline-none w-full font-bold" onChange={(e) => setFechaFin(e.target.value)} />
          </div>
        </div>

        {/* TABLA */}
        <div className="bg-white shadow-xl rounded-[35px] overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400">
                  <th className="p-5">Personal</th>
                  <th className="p-5 text-center">Fecha</th>
                  <th className="p-5 text-center">Evento</th>
                  <th className="p-5 text-center">Hora</th>
                  <th className="p-5 text-center">Mapa</th>
                  <th className="p-5 text-center">Foto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={6} className="p-16 text-center text-xs font-black text-blue-600 animate-pulse">CARGANDO REGISTROS...</td></tr>
                ) : filtrados.map((reg) => (
                  <tr key={reg.id} className="hover:bg-blue-50/10 transition-colors">
                    <td className="p-5 font-black text-[11px] uppercase text-gray-800">
                      {reg.nombres || 'SIN NOMBRE'}
                    </td>
                    <td className="p-5 text-center text-[10px] text-gray-500 font-bold">{reg.fecha}</td>
                    <td className="p-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                        reg.tipo_registro === 'ingreso' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {reg.tipo_registro}
                      </span>
                    </td>
                    <td className="p-5 text-center text-[11px] font-black text-gray-700">{formatearHora(reg.fecha_hora)}</td>
                    <td className="p-5 text-center">
                      {reg.ubicacion ? (
                        <a href={reg.ubicacion} target="_blank" className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-[9px] font-black hover:bg-blue-600 hover:text-white transition-all uppercase">
                          📍 Ver Mapa
                        </a>
                      ) : <span className="text-[8px] text-gray-300">S/N</span>}
                    </td>
                    <td className="p-5 text-center">
                      {reg.foto_url ? (
                        <a href={reg.foto_url} target="_blank" className="text-xl inline-block hover:scale-125 transition-transform">📸</a>
                      ) : <span className="text-[8px] text-gray-300">SIN FOTO</span>}
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