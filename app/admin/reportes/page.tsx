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

      const { data: asistencia, error } = await query.order('fecha', { ascending: false })
      if (error) throw error

      const procesadas = (asistencia || []).map(reg => {
        const nombreFinal = reg.nombres || nombresMap[reg.empleado_id] || 'Usuario'
        
        // Limpiar Hora Ingreso (Quitar el formato T00:22:18 si existe)
        let hIngreso = reg.hora_ingreso || '--:--'
        if (reg.fecha_hora && (hIngreso === '--:--' || hIngreso.includes('T'))) {
            const dateObj = new Date(reg.fecha_hora);
            hIngreso = dateObj.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });
        }

        // Limpiar Hora Salida
        let hSalida = reg.hora_salida || null
        
        // Calcular Horas Trabajadas
        let calculoHoras = '0.00'
        if (hIngreso !== '--:--' && hSalida) {
          const [h1, m1] = hIngreso.split(':')
          const [h2, m2] = hSalida.split(':')
          const totalMinutos = (parseInt(h2) * 60 + parseInt(m2)) - (parseInt(h1) * 60 + parseInt(m1))
          calculoHoras = (totalMinutos / 60).toFixed(2)
        }

        return {
          id: reg.id,
          nombre: nombreFinal,
          fecha: reg.fecha,
          entrada: {
            hora: hIngreso,
            foto: reg.foto_ingreso || reg.foto_url,
            gps: reg.ubicacion_ingreso || reg.geolocalizacion
          },
          salida: hSalida ? {
            hora: hSalida,
            foto: reg.foto_salida,
            gps: reg.ubicacion_salida
          } : null,
          horasTotales: calculoHoras
        }
      })

      setFilas(procesadas)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const abrirMapa = (gps: any) => {
    if (!gps) return alert("Sin coordenadas")
    // Limpia paréntesis y espacios para que Google Maps lo entienda
    const coords = gps.toString().replace(/[() ]/g, '')
    window.open(`https://www.google.com/maps?q=${coords}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <AdminNav />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="mb-8 flex flex-wrap gap-4 bg-slate-900 p-6 rounded-[30px] border border-slate-800">
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="bg-slate-800 border-none rounded-xl p-3 text-sm font-bold" />
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="bg-slate-800 border-none rounded-xl p-3 text-sm font-bold" />
            <select value={empleadoSeleccionado} onChange={e => setEmpleadoSeleccionado(e.target.value)} className="bg-slate-800 border-none rounded-xl p-3 text-sm font-bold">
                <option value="TODOS">TODOS</option>
                {empleados.map(e => <option key={e.id} value={e.id}>{e.nombres}</option>)}
            </select>
        </div>

        <div className="bg-slate-900 rounded-[40px] border border-slate-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/50 text-[10px] font-black uppercase text-slate-500">
                <th className="p-6">Empleado / Fecha</th>
                <th className="p-6">Ingreso</th>
                <th className="p-6">Salida</th>
                <th className="p-6 text-center">Horas Trabajadas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filas.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30">
                  <td className="p-6">
                    <p className="font-black text-white italic">{r.nombre}</p>
                    <p className="text-[10px] font-bold text-slate-500">{r.fecha}</p>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      {r.entrada.foto && <img src={r.entrada.foto} className="w-12 h-12 rounded-xl object-cover border border-slate-700" />}
                      <div>
                        <p className="text-emerald-400 font-black text-sm">{r.entrada.hora}</p>
                        <button onClick={() => abrirMapa(r.entrada.gps)} className="text-[9px] font-black text-slate-500 hover:text-white transition-all">📍 VER UBICACIÓN</button>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    {r.salida ? (
                      <div className="flex items-center gap-3">
                        {r.salida.foto && <img src={r.salida.foto} className="w-12 h-12 rounded-xl object-cover border border-slate-700" />}
                        <div>
                          <p className="text-rose-400 font-black text-sm">{r.salida.hora}</p>
                          <button onClick={() => abrirMapa(r.salida.gps)} className="text-[9px] font-black text-slate-500 hover:text-white transition-all">📍 VER UBICACIÓN</button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[9px] font-black bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20">EN CURSO</span>
                    )}
                  </td>
                  <td className="p-6 text-center">
                    <div className="inline-block bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700">
                        <span className="text-xl font-black text-white">{r.horasTotales}</span>
                        <span className="text-[10px] block font-bold text-slate-500 uppercase">Horas</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}