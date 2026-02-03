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
      // 1. Obtener empleados para cruzar nombres si vienen vacíos
      const { data: emps } = await supabase.from('empleados').select('id, nombres')
      setEmpleados(emps || [])
      const nombresMap = (emps || []).reduce((acc: any, cur: any) => ({ ...acc, [cur.id]: cur.nombres }), {})

      // 2. Consultar asistencia
      let query = supabase.from('asistencia').select('*')
        .gte('fecha', fechaDesde)
        .lte('fecha', fechaHasta)

      if (empleadoSeleccionado !== 'TODOS') {
        query = query.eq('empleado_id', empleadoSeleccionado)
      }

      const { data: asistencia, error } = await query.order('fecha', { ascending: false })
      if (error) throw error

      // 3. Procesar datos para que no salga el formato T00:22:18
      const procesadas = (asistencia || []).map(reg => {
        const nombreFinal = reg.nombres || nombresMap[reg.empleado_id] || 'Usuario Desconocido'
        
        // Formatear Hora de Ingreso
        let horaIngreso = reg.hora_ingreso || '--:--'
        if (reg.fecha_hora && horaIngreso === '--:--') {
          horaIngreso = new Date(reg.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        // Formatear Hora de Salida
        const horaSalida = reg.hora_salida || null
        
        // Calcular Horas Trabajadas
        let horasTotales = '0.00'
        if (horaIngreso !== '--:--' && horaSalida) {
          try {
            // Convertimos HH:MM:SS a objetos Date para restar
            const [h1, m1] = horaIngreso.split(':')
            const [h2, m2] = horaSalida.split(':')
            const d1 = new Date(2000, 0, 1, parseInt(h1), parseInt(m1))
            const d2 = new Date(2000, 0, 1, parseInt(h2), parseInt(m2))
            const diff = (d2.getTime() - d1.getTime()) / 3600000
            horasTotales = diff > 0 ? diff.toFixed(2) : '0.00'
          } catch (e) { horasTotales = '0.00' }
        }

        return {
          id: reg.id,
          nombre: nombreFinal,
          fecha: reg.fecha || new Date(reg.fecha_hora).toLocaleDateString(),
          entrada: {
            hora: horaIngreso,
            foto: reg.foto_ingreso || reg.foto_url,
            gps: reg.ubicacion_ingreso || reg.geolocalizacion
          },
          salida: horaSalida ? {
            hora: horaSalida,
            foto: reg.foto_salida,
            gps: reg.ubicacion_salida
          } : null,
          horasTotales
        }
      })

      setFilas(procesadas)
    } catch (err) {
      console.error("Error cargando reporte:", err)
    } finally {
      setLoading(false)
    }
  }

  const abrirMapa = (gps: any) => {
    if (!gps) return alert("No hay coordenadas")
    const coords = gps.toString().replace(/[()]/g, '')
    window.open(`https://www.google.com/maps?q=${coords}`, '_blank')
  }

  // ... (Funciones exportarExcel y exportarPDF se mantienen igual que tu original)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <AdminNav />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Filtros */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 p-6 rounded-[30px] border border-slate-800">
          <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="bg-slate-800 border-none rounded-xl p-3 text-sm font-bold" />
          <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="bg-slate-800 border-none rounded-xl p-3 text-sm font-bold" />
          <select value={empleadoSeleccionado} onChange={e => setEmpleadoSeleccionado(e.target.value)} className="bg-slate-800 border-none rounded-xl p-3 text-sm font-bold">
            <option value="TODOS">TODOS LOS EMPLEADOS</option>
            {empleados.map(e => <option key={e.id} value={e.id}>{e.nombres}</option>)}
          </select>
        </div>

        {/* Tabla */}
        <div className="bg-slate-900 rounded-[40px] border border-slate-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/50 text-[10px] font-black uppercase text-slate-500">
                <th className="p-6">Empleado / Fecha</th>
                <th className="p-6">Ingreso</th>
                <th className="p-6">Salida</th>
                <th className="p-6 text-center">Horas</th>
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
                      {r.entrada.foto && <img src={r.entrada.foto} className="w-10 h-10 rounded-lg object-cover" />}
                      <div>
                        <p className="text-emerald-400 font-black text-sm">{r.entrada.hora}</p>
                        <button onClick={() => abrirMapa(r.entrada.gps)} className="text-[8px] font-bold text-slate-500">📍 MAPA</button>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    {r.salida ? (
                      <div className="flex items-center gap-3">
                        {r.salida.foto && <img src={r.salida.foto} className="w-10 h-10 rounded-lg object-cover" />}
                        <div>
                          <p className="text-rose-400 font-black text-sm">{r.salida.hora}</p>
                          <button onClick={() => abrirMapa(r.salida.gps)} className="text-[8px] font-bold text-slate-500">📍 MAPA</button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[9px] font-black bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full">EN CURSO</span>
                    )}
                  </td>
                  <td className="p-6 text-center">
                    <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
                      <span className="text-lg font-black text-white">{r.horasTotales}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filas.length === 0 && !loading && (
            <div className="p-20 text-center text-slate-500 font-bold">No hay registros en este rango.</div>
          )}
        </div>
      </main>
    </div>
  )
}