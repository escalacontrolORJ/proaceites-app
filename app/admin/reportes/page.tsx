'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

export default function ReporteAsistencia() {
  const [registros, setRegistros] = useState<any[]>([])
  const [empleadosLista, setEmpleadosLista] = useState<string[]>([])
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
      // Traemos TODOS los registros individuales para no perder los actuales
      const { data, error } = await supabase
        .from('asistencia')
        .select(`*, empleados(nombres)`)
        .order('fecha_hora', { ascending: false })

      if (error) throw error
      setRegistros(data || [])

      // Poblar el COMBO de nombres únicos
      const nombres = data?.map(r => r.empleados?.nombres || r.nombres || 'SIN NOMBRE')
      setEmpleadosLista(Array.from(new Set(nombres)).sort() as string[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Lógica de filtrado
  const filtrados = registros.filter(reg => {
    const nombreReg = (reg.empleados?.nombres || reg.nombres || "").toLowerCase()
    const coincideNom = !filtroNombre || nombreReg === filtroNombre.toLowerCase()
    const fechaReg = reg.fecha_hora ? reg.fecha_hora.split('T')[0] : ''
    const coincideDesde = !fechaDesde || fechaReg >= fechaDesde
    const coincideHasta = !fechaHasta || fechaReg <= fechaHasta
    return coincideNom && coincideDesde && coincideHasta
  })

  // --- BOTÓN EXPORTAR EXCEL ---
  const exportExcel = () => {
    const dataToExport = filtrados.map(r => ({
      Empleado: r.empleados?.nombres || r.nombres,
      Fecha: r.fecha_hora.split('T')[0],
      Hora: new Date(r.fecha_hora).toLocaleTimeString(),
      Tipo: r.tipo_registro.toUpperCase(),
      ID: r.id
    }))
    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Asistencia")
    XLSX.writeFile(wb, "Reporte_Proaceites.xlsx")
  }

  // --- BOTÓN EXPORTAR PDF ---
  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text("Reporte de Asistencia Detallado", 14, 15)
    const tableData = filtrados.map(r => [
      r.empleados?.nombres || r.nombres,
      r.fecha_hora.split('T')[0],
      new Date(r.fecha_hora).toLocaleTimeString(),
      r.tipo_registro.toUpperCase()
    ])
    ;(doc as any).autoTable({
      head: [['Empleado', 'Fecha', 'Hora', 'Tipo']],
      body: tableData,
      startY: 20,
      theme: 'grid'
    })
    doc.save("Reporte_Asistencia.pdf")
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-slate-900">
      <nav className="bg-white p-4 sticky top-0 z-50 shadow-sm border-b">
        <div className="max-w-6xl mx-auto flex gap-4">
          <Link href="/admin/reportes" className="flex-1 bg-blue-900 text-white text-center py-2 rounded-xl text-xs font-black uppercase">📊 Reportes</Link>
          <Link href="/admin/empleados" className="flex-1 bg-gray-100 text-gray-400 text-center py-2 rounded-xl text-xs font-black uppercase">👥 Personal</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-black text-blue-950 uppercase italic tracking-tighter">Auditoría de Asistencia</h1>
          <div className="flex gap-2">
            <button onClick={exportExcel} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md">Excel</button>
            <button onClick={exportPDF} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md">PDF</button>
            <button onClick={fetchData} className="bg-blue-100 text-blue-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Actualizar</button>
          </div>
        </header>

        {/* FILTROS CON COMBO */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm mb-10 grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-200">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Seleccionar Empleado</label>
            <select 
              className="w-full p-3 bg-slate-50 rounded-2xl text-xs font-bold border-none outline-none ring-1 ring-slate-200"
              value={filtroNombre} 
              onChange={(e) => setFiltroNombre(e.target.value)}
            >
              <option value="">TODOS</option>
              {empleadosLista.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <input type="date" className="p-3 bg-slate-50 rounded-2xl text-xs font-bold" value={fechaDesde} onChange={(e)=>setFechaDesde(e.target.value)}/>
          <input type="date" className="p-3 bg-slate-50 rounded-2xl text-xs font-bold" value={fechaHasta} onChange={(e)=>setFechaHasta(e.target.value)}/>
        </div>

        {/* LISTADO DE TARJETAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="col-span-full text-center py-10 font-black text-slate-300 animate-pulse uppercase">Cargando datos...</p>
          ) : filtrados.map((reg) => {
            // Buscamos la foto en todas las columnas posibles
            const foto = reg.foto_url || reg.foto || reg.foto_ingreso || reg.foto_salida;
            const fecha = new Date(reg.fecha_hora);

            return (
              <div key={reg.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all">
                <div className="h-44 bg-slate-200 relative">
                  {foto ? (
                    <img src={foto} className="w-full h-full object-cover" alt="Foto" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-[10px] uppercase">Sin Evidencia</div>
                  )}
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[8px] font-black uppercase text-white ${reg.tipo_registro === 'ingreso' ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                    {reg.tipo_registro}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-sm font-black text-blue-900 uppercase truncate">{reg.empleados?.nombres || reg.nombres}</h3>
                  <div className="mt-4 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{fecha.toLocaleDateString()}</p>
                      <p className="text-2xl font-black text-slate-800 tracking-tighter">{fecha.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}