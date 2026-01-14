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
      const { data: emps } = await supabase.from('empleados').select('id, nombres')
      setEmpleados(emps || [])
      const nombresMap = (emps || []).reduce((acc: any, cur: any) => ({ ...acc, [cur.id]: cur.nombres }), {})

      let query = supabase.from('asistencia').select('*')
        .gte('fecha', fechaDesde)
        .lte('fecha', fechaHasta)
      
      if (empleadoSeleccionado !== 'TODOS') {
        query = query.eq('empleado_id', empleadoSeleccionado)
      }

      const { data: registros, error } = await query.order('fecha', { ascending: false })
      if (error) throw error

      const grupos: any = {}

      registros?.forEach(reg => {
        const key = `${reg.empleado_id}_${reg.fecha}`
        if (!grupos[key]) {
          grupos[key] = {
            empleado: nombresMap[reg.empleado_id] || 'Desconocido',
            fecha: reg.fecha,
            entrada: null,
            salida: null
          }
        }

        if (reg.tipo_registro === 'ingreso' || reg.hora_ingreso) {
          grupos[key].entrada = {
            hora: reg.hora_ingreso ? new Date(reg.hora_ingreso).toLocaleTimeString() : new Date(reg.fecha_hora).toLocaleTimeString(),
            foto: reg.foto_ingreso || reg.foto_url || reg.foto,
            coords: reg.ubicacion_ingreso || reg.geolocalizacion,
            raw_time: reg.hora_ingreso || reg.fecha_hora
          }
        }
        
        if (reg.hora_salida) {
          grupos[key].salida = {
            hora: new Date(reg.hora_salida).toLocaleTimeString(),
            foto: reg.foto_salida,
            coords: reg.ubicacion_salida,
            raw_time: reg.hora_salida
          }
        } else if (reg.tipo_registro === 'salida') {
          grupos[key].salida = {
            hora: new Date(reg.fecha_hora).toLocaleTimeString(),
            foto: reg.foto_url || reg.foto,
            coords: reg.geolocalizacion,
            raw_time: reg.fecha_hora
          }
        }
      });

      setFilas(Object.values(grupos))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // --- FUNCIONES DE EXPORTACIÓN ---
  const exportarExcel = () => {
    const dataParaExcel = filas.map(r => ({
      Fecha: r.fecha,
      Empleado: r.empleado,
      Hora_Entrada: r.entrada?.hora || 'N/A',
      Ubicacion_Entrada: r.entrada?.coords || 'N/A',
      Hora_Salida: r.salida?.hora || 'N/A',
      Ubicacion_Salida: r.salida?.coords || 'N/A'
    }))
    const ws = XLSX.utils.json_to_sheet(dataParaExcel)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Asistencia")
    XLSX.writeFile(wb, `Reporte_Asistencia_${fechaDesde}.xlsx`)
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.text(`Reporte de Asistencia (${fechaDesde} a ${fechaHasta})`, 14, 15)
    autoTable(doc, {
      startY: 20,
      head: [['Fecha', 'Empleado', 'Entrada', 'Salida']],
      body: filas.map(r => [r.fecha, r.empleado, r.entrada?.hora || '--', r.salida?.hora || '--']),
    })
    doc.save(`Reporte_Asistencia.pdf`)
  }

  const abrirMapa = (punto: any) => {
    if (!punto || !punto.coords) return
    window.open(`https://www.google.com/maps?q=${punto.coords}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-white">
      <AdminNav />
      
      <main className="p-4 md:p-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase">Reportes</h1>
            <p className="text-blue-400 text-xs font-bold tracking-[3px] uppercase">Proaceites S.A.</p>
          </div>
          
          <div className="flex gap-2">
            <button onClick={exportarExcel} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2">
              📊 EXCEL
            </button>
            <button onClick={exportarPDF} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-lg shadow-rose-900/20 flex items-center gap-2">
              📕 PDF
            </button>
          </div>
        </div>

        {/* FILTROS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-800 p-6 rounded-3xl mb-8 border border-slate-700">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black ml-2 uppercase text-slate-400">Desde</label>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="bg-slate-900 border-none rounded-xl p-3 text-sm focus:ring-2 ring-blue-500 text-white" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black ml-2 uppercase text-slate-400">Hasta</label>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="bg-slate-900 border-none rounded-xl p-3 text-sm focus:ring-2 ring-blue-500 text-white" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black ml-2 uppercase text-slate-400">Empleado</label>
            <select value={empleadoSeleccionado} onChange={e => setEmpleadoSeleccionado(e.target.value)} className="bg-slate-900 border-none rounded-xl p-3 text-sm text-white">
              <option value="TODOS">TODOS LOS EMPLEADOS</option>
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombres}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={fetchData} className="w-full bg-blue-600 hover:bg-blue-500 p-3 rounded-xl font-bold transition-all uppercase text-xs tracking-widest">Refrescar</button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-700/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="p-6">Fecha / Empleado</th>
                  <th className="p-6 text-center">Entrada</th>
                  <th className="p-6 text-center">Salida</th>
                  <th className="p-6 text-center">Jornada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filas.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-700/30 transition-all">
                    <td className="p-6">
                      <div className="font-black text-lg">{r.fecha}</div>
                      <div className="text-blue-400 font-bold text-xs uppercase italic">{r.empleado}</div>
                    </td>
                    
                    <td className="p-6">
                      {r.entrada ? (
                        <div className="flex flex-col items-center gap-2">
                          <img src={r.entrada.foto} className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500 shadow-lg" />
                          <span className="font-black text-emerald-400 text-sm">{r.entrada.hora}</span>
                          <button onClick={() => abrirMapa(r.entrada)} className="text-[9px] bg-slate-900 px-3 py-1 rounded-full font-bold hover:bg-emerald-500 transition-all border border-emerald-500/30">📍 MAPA</button>
                        </div>
                      ) : <span className="text-slate-600 font-bold text-xs uppercase">Sin Registro</span>}
                    </td>

                    <td className="p-6">
                      {r.salida ? (
                        <div className="flex flex-col items-center gap-2">
                          <img src={r.salida.foto} className="w-16 h-16 rounded-xl object-cover border-2 border-rose-500 shadow-lg" />
                          <span className="font-black text-rose-400 text-sm">{r.salida.hora}</span>
                          <button onClick={() => abrirMapa(r.salida)} className="text-[9px] bg-slate-900 px-3 py-1 rounded-full font-bold hover:bg-rose-500 transition-all border border-rose-500/30">📍 MAPA</button>
                        </div>
                      ) : <span className="text-orange-500 font-black animate-pulse text-[10px] uppercase border border-orange-500/30 px-2 py-1 rounded-md">En curso...</span>}
                    </td>

                    <td className="p-6 text-center">
                      <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-700">
                        <span className="text-xl font-black text-white">
                          {r.entrada && r.salida 
                            ? ((new Date(r.salida.raw_time).getTime() - new Date(r.entrada.raw_time).getTime()) / 3600000).toFixed(2) 
                            : '0.00'}
                        </span>
                        <span className="text-[10px] block font-bold text-slate-500 uppercase tracking-tighter">Horas Totales</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filas.length === 0 && !loading && (
            <div className="p-20 text-center text-slate-500 font-black uppercase tracking-[5px]">No hay registros encontrados</div>
          )}
        </div>
      </main>
    </div>
  )
}