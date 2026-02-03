'use client'
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
  
  const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('TODOS')

  useEffect(() => {
    fetchData()
  }, [fechaDesde, fechaHasta, empleadoSeleccionado])

  async function fetchData() {
    setLoading(true)
    try {
      // 1. Obtener lista de empleados para el filtro
      const { data: emps } = await supabase.from('empleados').select('id, nombres')
      setEmpleados(emps || [])

      // 2. Consultar asistencia con filtros
      let query = supabase.from('asistencia').select('*')
        .gte('fecha', fechaDesde)
        .lte('fecha', fechaHasta)

      if (empleadoSeleccionado !== 'TODOS') {
        query = query.eq('empleado_id', empleadoSeleccionado)
      }

      const { data: asistencia, error } = await query.order('fecha', { ascending: false })

      if (error) throw error

      // 3. Procesar datos para la tabla
      const procesadas = (asistencia || []).map(reg => {
        // Lógica para capturar la mejor información disponible (vieja o nueva)
        return {
          id: reg.id,
          nombre: reg.nombres || 'Sin nombre',
          fecha: reg.fecha,
          entrada: {
            hora: reg.hora_ingreso || (reg.fecha_hora ? new Date(reg.fecha_hora).toLocaleTimeString() : '--:--'),
            foto: reg.foto_ingreso || reg.foto_url,
            gps: reg.ubicacion_ingreso || reg.geolocalizacion
          },
          salida: reg.hora_salida ? {
            hora: reg.hora_salida,
            foto: reg.foto_salida,
            gps: reg.ubicacion_salida
          } : null
        }
      })

      setFilas(procesadas)
    } catch (err) {
      console.error("Error cargando reporte:", err)
    } finally {
      setLoading(false)
    }
  }

  const exportarExcel = () => {
    const dataExcel = filas.map(f => ({
      Empleado: f.nombre,
      Fecha: f.fecha,
      Entrada: f.entrada.hora,
      Salida: f.salida ? f.salida.hora : 'En curso',
      Ubicacion: f.entrada.gps
    }))
    const ws = XLSX.utils.json_to_sheet(dataExcel)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Asistencia")
    XLSX.writeFile(wb, `Reporte_${fechaDesde}_al_${fechaHasta}.xlsx`)
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.text("REPORTE DE ASISTENCIA - PROACEITES", 14, 15)
    autoTable(doc, {
      startY: 20,
      head: [['Empleado', 'Fecha', 'Entrada', 'Salida']],
      body: filas.map(f => [f.nombre, f.fecha, f.entrada.hora, f.salida ? f.salida.hora : 'En curso']),
    })
    doc.save("Reporte_Asistencia.pdf")
  }

  const abrirMapa = (gps: string) => {
    if (!gps) return alert("No hay coordenadas")
    const limpio = gps.replace('(', '').replace(')', '')
    window.open(`https://www.google.com/maps?q=${limpio}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <AdminNav />
      
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-end gap-4 bg-slate-900 p-6 rounded-[30px] border border-slate-800 shadow-2xl">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Rango de Fechas</label>
            <div className="flex gap-2">
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="bg-slate-800 border-none rounded-xl p-3 text-sm font-bold w-full" />
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="bg-slate-800 border-none rounded-xl p-3 text-sm font-bold w-full" />
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Filtrar Empleado</label>
            <select value={empleadoSeleccionado} onChange={e => setEmpleadoSeleccionado(e.target.value)} className="bg-slate-800 border-none rounded-xl p-3 text-sm font-bold w-full">
              <option value="TODOS">TODOS LOS EMPLEADOS</option>
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombres}</option>)}
            </select>
          </div>

          <div className="flex gap-2">
            <button onClick={exportarExcel} className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl font-black text-[10px] uppercase transition-all">Excel</button>
            <button onClick={exportarPDF} className="bg-rose-600 hover:bg-rose-500 text-white p-3 rounded-xl font-black text-[10px] uppercase transition-all">PDF</button>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[40px] border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="p-6">Empleado / Fecha</th>
                  <th className="p-6">Ingreso</th>
                  <th className="p-6">Salida</th>
                  <th className="p-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filas.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-6">
                      <p className="font-black text-white italic">{r.nombre}</p>
                      <p className="text-[10px] font-bold text-slate-500">{r.fecha}</p>
                    </td>
                    
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        {r.entrada.foto && <img src={r.entrada.foto} className="w-10 h-10 rounded-lg object-cover border border-slate-700" alt="Foto" />}
                        <div>
                          <p className="text-emerald-400 font-black text-sm">{r.entrada.hora}</p>
                          <button onClick={() => abrirMapa(r.entrada.gps)} className="text-[8px] font-bold text-slate-500 hover:text-white uppercase">📍 GPS</button>
                        </div>
                      </div>
                    </td>

                    <td className="p-6">
                      {r.salida ? (
                        <div className="flex items-center gap-3">
                          {r.salida.foto && <img src={r.salida.foto} className="w-10 h-10 rounded-lg object-cover border border-slate-700" alt="Foto" />}
                          <div>
                            <p className="text-rose-400 font-black text-sm">{r.salida.hora}</p>
                            <button onClick={() => abrirMapa(r.salida.gps)} className="text-[8px] font-bold text-slate-500 hover:text-white uppercase">📍 GPS</button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[9px] font-black bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full animate-pulse">EN CURSO</span>
                      )}
                    </td>

                    <td className="p-6 text-center text-slate-500 font-bold text-xs">
                      {r.id.substring(0,5)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}