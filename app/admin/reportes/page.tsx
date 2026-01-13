'use client'
/**
 * REPORTE ADMINISTRATIVO COMPLETO
 * Incluye: Fotos (miniatura + zoom), Mapa (Links directos), Combo Empleados, Exportar Excel y PDF.
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ReporteAdministrativo() {
  const [filas, setFilas] = useState<any[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados de Filtros
  const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('TODOS')

  useEffect(() => {
    fetchData()
  }, [fechaDesde, fechaHasta, empleadoSeleccionado])

  async function fetchData() {
    setLoading(true)
    try {
      // 1. Obtener lista de empleados para el combo
      const { data: emps } = await supabase.from('empleados').select('id, nombres')
      setEmpleados(emps || [])
      const nombresMap = Object.fromEntries(emps?.map(e => [e.id, e.nombres]) || [])

      // 2. Consultar asistencias
      let query = supabase
        .from('asistencia')
        .select('*')
        .gte('fecha', fechaDesde)
        .lte('fecha', fechaHasta)
        .order('fecha_hora', { ascending: true })

      if (empleadoSeleccionado !== 'TODOS') {
        query = query.eq('empleado_id', empleadoSeleccionado)
      }

      const { data: asist } = await query

      // 3. Agrupar por Empleado y Fecha
      const agrupados: Record<string, any> = {}
      asist?.forEach(reg => {
        const llave = `${reg.empleado_id}-${reg.fecha}`
        if (!agrupados[llave]) {
          agrupados[llave] = {
            nombre: nombresMap[reg.empleado_id] || 'Sin Nombre',
            fecha: reg.fecha,
            entrada: null,
            salida: null
          }
        }
        if (reg.tipo_registro === 'ingreso') agrupados[llave].entrada = reg
        else if (reg.tipo_registro === 'salida') agrupados[llave].salida = reg
      })

      setFilas(Object.values(agrupados))
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }

  // --- EXPORTAR A EXCEL ---
  const exportarExcel = () => {
    const datos = filas.map(r => ({
      Empleado: r.nombre,
      Fecha: r.fecha,
      Entrada: r.entrada ? new Date(r.entrada.fecha_hora).toLocaleTimeString() : '---',
      Salida: r.salida ? new Date(r.salida.fecha_hora).toLocaleTimeString() : '---',
      Horas: r.entrada && r.salida ? ((new Date(r.salida.fecha_hora).getTime() - new Date(r.entrada.fecha_hora).getTime()) / 3600000).toFixed(2) : '0.00'
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Reporte")
    XLSX.writeFile(wb, `Reporte_${fechaDesde}_${fechaHasta}.xlsx`)
  }

  // --- EXPORTAR A PDF ---
  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.text("Reporte de Asistencia", 14, 15)
    const tablaData = filas.map(r => [
      r.nombre,
      r.fecha,
      r.entrada ? new Date(r.entrada.fecha_hora).toLocaleTimeString() : '---',
      r.salida ? new Date(r.salida.fecha_hora).toLocaleTimeString() : '---',
      r.entrada && r.salida ? ((new Date(r.salida.fecha_hora).getTime() - new Date(r.entrada.fecha_hora).getTime()) / 3600000).toFixed(2) + 'h' : '0.00h'
    ])
    autoTable(doc, {
      head: [['Empleado', 'Fecha', 'Entrada', 'Salida', 'Total']],
      body: tablaData,
      startY: 20
    })
    doc.save(`Reporte_${fechaDesde}.pdf`)
  }

  // --- MANEJO DE UBICACIÓN ---
  const abrirMapa = (registro: any) => {
    const url = registro.ubicacion || registro.geolocalizacion
    if (typeof url === 'string' && url.includes('http')) {
      window.open(url, '_blank')
    } else if (url?.x && url?.y) {
      window.open(`https://www.google.com/maps?q=${url.y},${url.x}`, '_blank')
    } else {
      alert("No hay link de ubicación disponible")
    }
  }

  // --- MANEJO DE FOTO (ZOOM) ---
  const abrirFoto = (url: string) => {
    if (!url) return;
    const win = window.open("", "_blank");
    win?.document.write(`
      <html>
        <body style="margin:0; background: #000; display: flex; align-items: center; justify-content: center; height: 100vh;">
          <img src="${url}" style="max-width: 100%; max-height: 100%; border-radius: 8px; box-shadow: 0 0 20px rgba(255,255,255,0.2);">
        </body>
      </html>
    `);
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <AdminNav />
      <div className="max-w-7xl mx-auto p-4 md:p-10">
        
        {/* FILTROS Y CONTROLES */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 mb-8 flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Empleado</label>
            <select 
              value={empleadoSeleccionado} 
              onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
              className="p-3 rounded-2xl bg-slate-100 font-bold outline-none border-none text-slate-700"
            >
              <option value="TODOS">TODOS LOS EMPLEADOS</option>
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombres}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="p-3 rounded-2xl bg-slate-100 font-bold outline-none text-slate-700" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="p-3 rounded-2xl bg-slate-100 font-bold outline-none text-slate-700" />
          </div>

          <div className="flex gap-2">
            <button onClick={exportarExcel} className="bg-green-600 text-white px-4 py-3 rounded-2xl font-black text-[10px] hover:bg-green-700 shadow-lg transition-all">EXCEL</button>
            <button onClick={exportarPDF} className="bg-red-600 text-white px-4 py-3 rounded-2xl font-black text-[10px] hover:bg-red-700 shadow-lg transition-all">PDF</button>
          </div>
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                  <th className="p-6">Empleado</th>
                  <th className="p-6 text-center">Fecha</th>
                  <th className="p-6 text-center">Entrada (GPS/FOTO)</th>
                  <th className="p-6 text-center">Salida (GPS/FOTO)</th>
                  <th className="p-6 text-center">Horas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                {loading ? (
                  <tr><td colSpan={5} className="p-20 text-center animate-pulse text-slate-400 uppercase">Cargando datos del servidor...</td></tr>
                ) : filas.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6 text-xs uppercase text-slate-700">{r.nombre}</td>
                    <td className="p-6 text-center text-xs text-slate-400">{r.fecha}</td>
                    
                    {/* CELDA ENTRADA */}
                    <td className="p-6">
                      {r.entrada ? (
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-[10px] text-blue-600 font-black">{new Date(r.entrada.fecha_hora).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                          <div className="flex gap-2">
                            {/* MINIATURA FOTO */}
                            <button 
                              onClick={() => abrirFoto(r.entrada.foto_url)}
                              className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white shadow-md bg-slate-200 hover:scale-110 transition-transform"
                            >
                              {r.entrada.foto_url && <img src={r.entrada.foto_url} className="w-full h-full object-cover" alt="E" />}
                            </button>
                            {/* BOTÓN MAPA */}
                            <button onClick={() => abrirMapa(r.entrada)} className="bg-blue-600 text-white w-10 h-10 rounded-lg text-lg shadow-md hover:scale-110 transition-transform flex items-center justify-center">📍</button>
                          </div>
                        </div>
                      ) : <div className="text-center text-slate-200 text-[10px]">SIN REGISTRO</div>}
                    </td>

                    {/* CELDA SALIDA */}
                    <td className="p-6">
                      {r.salida ? (
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-[10px] text-orange-600 font-black">{new Date(r.salida.fecha_hora).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                          <div className="flex gap-2">
                            {/* MINIATURA FOTO */}
                            <button 
                              onClick={() => abrirFoto(r.salida.foto_url)}
                              className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white shadow-md bg-slate-200 hover:scale-110 transition-transform"
                            >
                              {r.salida.foto_url && <img src={r.salida.foto_url} className="w-full h-full object-cover" alt="S" />}
                            </button>
                            {/* BOTÓN MAPA */}
                            <button onClick={() => abrirMapa(r.salida)} className="bg-orange-500 text-white w-10 h-10 rounded-lg text-lg shadow-md hover:scale-110 transition-transform flex items-center justify-center">📍</button>
                          </div>
                        </div>
                      ) : <div className="text-center text-slate-200 text-[10px]">SIN REGISTRO</div>}
                    </td>

                    {/* COLUMNA HORAS */}
                    <td className="p-6 text-center">
                      <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black shadow-lg">
                        {r.entrada && r.salida ? ((new Date(r.salida.fecha_hora).getTime() - new Date(r.entrada.fecha_hora).getTime()) / 3600000).toFixed(2) : '0.00'}h
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filas.length === 0 && !loading && (
            <div className="p-20 text-center text-slate-300 uppercase font-black tracking-widest">No hay asistencias registradas</div>
          )}
        </div>
      </div>
    </div>
  )
}