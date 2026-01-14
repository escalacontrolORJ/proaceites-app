'use client'
/**
 * REPORTE ADMINISTRATIVO COMPLETO - ACTUALIZADO
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

      const { data: registros, error } = await query.order('fecha_hora', { ascending: true })
      if (error) throw error

      // PROCESAMIENTO HÍBRIDO: Agrupar registros por día y empleado
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

        // Lógica para detectar Entrada o Salida (Soporta ambos formatos de tabla)
        if (reg.tipo_registro === 'ingreso' || reg.hora_ingreso) {
          grupos[key].entrada = {
            hora: reg.hora_ingreso ? new Date(reg.hora_ingreso).toLocaleTimeString() : new Date(reg.fecha_hora).toLocaleTimeString(),
            foto: reg.foto_ingreso || reg.foto_url || reg.foto,
            coords: reg.ubicacion_ingreso || reg.geolocalizacion,
            raw_time: reg.hora_ingreso || reg.fecha_hora
          }
        }
        
        // Si el registro ya trae datos de salida (nuestro nuevo formato de una sola fila)
        if (reg.hora_salida) {
          grupos[key].salida = {
            hora: new Date(reg.hora_salida).toLocaleTimeString(),
            foto: reg.foto_salida,
            coords: reg.ubicacion_salida,
            raw_time: reg.hora_salida
          }
        } else if (reg.tipo_registro === 'salida') {
          // Soporte para registros antiguos de filas separadas
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

  const abrirMapa = (punto: any) => {
    if (!punto || !punto.coords) return
    window.open(`https://www.google.com/maps?q=${punto.coords}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-white">
      <AdminNav />
      
      <main className="p-4 md:p-10 max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-black italic tracking-tighter">REPORTE DE ASISTENCIA</h1>
          <p className="text-blue-400 text-xs font-bold tracking-[3px] uppercase">Panel Administrativo</p>
        </div>

        {/* FILTROS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-800 p-6 rounded-3xl mb-8 border border-slate-700">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black ml-2">DESDE</label>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="bg-slate-900 border-none rounded-xl p-3 text-sm focus:ring-2 ring-blue-500" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black ml-2">HASTA</label>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="bg-slate-900 border-none rounded-xl p-3 text-sm focus:ring-2 ring-blue-500" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black ml-2">EMPLEADO</label>
            <select value={empleadoSeleccionado} onChange={e => setEmpleadoSeleccionado(e.target.value)} className="bg-slate-900 border-none rounded-xl p-3 text-sm">
              <option value="TODOS">TODOS</option>
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombres}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={fetchData} className="w-full bg-blue-600 hover:bg-blue-500 p-3 rounded-xl font-bold transition-all">REFRESCAR</button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-700/50 text-[10px] font-black uppercase tracking-widest">
                  <th className="p-6">Fecha / Empleado</th>
                  <th className="p-6 text-center">Entrada</th>
                  <th className="p-6 text-center">Salida</th>
                  <th className="p-6 text-center">Horas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filas.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-700/30 transition-all">
                    <td className="p-6">
                      <div className="font-black text-lg">{r.fecha}</div>
                      <div className="text-blue-400 font-bold text-xs uppercase">{r.empleado}</div>
                    </td>
                    
                    {/* ENTRADA */}
                    <td className="p-6">
                      {r.entrada ? (
                        <div className="flex flex-col items-center gap-2">
                          <img src={r.entrada.foto} className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500 shadow-lg" alt="E" />
                          <span className="font-black text-emerald-400">{r.entrada.hora}</span>
                          <button onClick={() => abrirMapa(r.entrada)} className="text-[10px] bg-slate-900 px-2 py-1 rounded-md hover:bg-emerald-500 transition-colors">📍 VER GPS</button>
                        </div>
                      ) : <span className="text-slate-600 font-bold">---</span>}
                    </td>

                    {/* SALIDA */}
                    <td className="p-6">
                      {r.salida ? (
                        <div className="flex flex-col items-center gap-2">
                          <img src={r.salida.foto} className="w-16 h-16 rounded-xl object-cover border-2 border-rose-500 shadow-lg" alt="S" />
                          <span className="font-black text-rose-400">{r.salida.hora}</span>
                          <button onClick={() => abrirMapa(r.salida)} className="text-[10px] bg-slate-900 px-2 py-1 rounded-md hover:bg-rose-500 transition-colors">📍 VER GPS</button>
                        </div>
                      ) : <span className="text-orange-500 font-black animate-pulse text-xs">TRABAJANDO...</span>}
                    </td>

                    <td className="p-6 text-center">
                      <span className="bg-blue-600 px-3 py-1 rounded-full text-xs font-black">
                        {r.entrada && r.salida 
                          ? ((new Date(r.salida.raw_time).getTime() - new Date(r.entrada.raw_time).getTime()) / 3600000).toFixed(2) 
                          : '0.00'}h
                      </span>
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