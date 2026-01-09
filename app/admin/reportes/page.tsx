'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ReporteAsistencia() {
  const pathname = usePathname()
  const [registros, setRegistros] = useState<any[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [filtroNombre, setFiltroNombre] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setLoading(true)
    // Cargar empleados para el combo de filtro
    const { data: dataEmp } = await supabase.from('empleados').select('nombres')
    if (dataEmp) setEmpleados(dataEmp)

    // Cargar asistencias
    const { data: dataAsis } = await supabase
        .from('asistencia')
        .select('*')
        .order('fecha', { ascending: false })
        .order('hora_entrada', { ascending: false })
    
    if (dataAsis) setRegistros(dataAsis)
    setLoading(false)
  }

  // Función para calcular horas exactas
  const calcularHoras = (hEntrada: string, hSalida: string) => {
    if (!hEntrada || !hSalida) return '0.0'
    try {
      const [h1, m1] = hEntrada.split(':').map(Number)
      const [h2, m2] = hSalida.split(':').map(Number)
      const inicio = h1 * 60 + m1
      const fin = h2 * 60 + m2
      const diferencia = fin - inicio
      return diferencia > 0 ? (diferencia / 60).toFixed(1) : '0.0'
    } catch (e) { return '0.0' }
  }

  const registrosFiltrados = registros.filter(r => {
    const nombreReg = (r.nombres || "").trim().toLowerCase()
    const nombreFil = filtroNombre.trim().toLowerCase()
    const coincideNombre = filtroNombre === '' || nombreReg === nombreFil
    const fechaReg = r.fecha || ""
    const coincideDesde = fechaDesde ? fechaReg >= fechaDesde : true
    const coincideHasta = fechaHasta ? fechaReg <= fechaHasta : true
    return coincideNombre && coincideDesde && coincideHasta
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-black font-sans">
      {/* NAVEGACIÓN */}
      <nav className="bg-white border-b sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Link href="/admin/reportes" className={`flex-1 text-center py-2 rounded-xl text-[10px] font-black uppercase ${pathname.includes('reportes') ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-400'}`}>📊 Reportes</Link>
          <Link href="/admin/empleados" className={`flex-1 text-center py-2 rounded-xl text-[10px] font-black uppercase ${pathname.includes('empleados') ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-400'}`}>👥 Personal</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 pt-6">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-black text-blue-900 uppercase italic">Reporte Detallado</h1>
          <button onClick={() => window.location.reload()} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-lg">ACTUALIZAR</button>
        </header>

        {/* FILTROS */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Empleado</label>
            <select className="w-full p-2 bg-gray-50 rounded-lg text-xs font-bold outline-none" value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)}>
              <option value="">TODOS LOS EMPLEADOS</option>
              {empleados.map((e, i) => <option key={i} value={e.nombres}>{e.nombres}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Desde</label>
            <input type="date" className="w-full p-2 bg-gray-50 rounded-lg text-xs outline-none" value={fechaDesde} onChange={(e)=>setFechaDesde(e.target.value)}/>
          </div>
          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Hasta</label>
            <input type="date" className="w-full p-2 bg-gray-50 rounded-lg text-xs outline-none" value={fechaHasta} onChange={(e)=>setFechaHasta(e.target.value)}/>
          </div>
        </div>

        {/* LISTADO DE AUDITORIA */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-center py-10 text-xs font-bold text-gray-400 animate-pulse uppercase">Cargando registros...</p>
          ) : registrosFiltrados.map((reg) => (
            <div key={reg.id} className="bg-white rounded-[30px] p-5 shadow-sm border border-gray-100 overflow-hidden">
              {/* Info Superior */}
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-50">
                <div>
                  <h2 className="font-black text-blue-900 uppercase text-sm">{reg.nombres}</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase italic">Fecha de Labor: {reg.fecha}</p>
                </div>
                <div className="bg-blue-900 text-white px-4 py-2 rounded-2xl text-center">
                  <p className="text-[14px] font-black leading-none">{calcularHoras(reg.hora_entrada, reg.hora_salida)}</p>
                  <p className="text-[7px] font-bold uppercase">Horas Totales</p>
                </div>
              </div>

              {/* Grid de Marcaciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* BLOQUE INGRESO */}
                <div className="flex gap-4 items-center bg-blue-50/30 p-3 rounded-[25px]">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                    {reg.entrada_foto ? (
                      <img src={reg.entrada_foto} className="w-full h-full object-cover" alt="Ingreso" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[8px] text-gray-300">SIN FOTO</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-blue-600 uppercase mb-1">Entrada Registrada</p>
                    <p className="text-lg font-black text-gray-800 leading-none">{reg.hora_entrada}</p>
                    <p className="text-[9px] text-gray-500 font-bold mb-2">{reg.fecha}</p>
                    <a 
                      href={`https://www.google.com/maps?q=${reg.entrada_gps}`} 
                      target="_blank" 
                      className="inline-block bg-white border border-blue-100 text-blue-600 text-[8px] font-black px-3 py-1.5 rounded-full uppercase shadow-sm hover:bg-blue-600 hover:text-white transition-all"
                    >
                      📍 Ver Ubicación Ingreso
                    </a>
                  </div>
                </div>

                {/* BLOQUE SALIDA */}
                <div className="flex gap-4 items-center bg-orange-50/30 p-3 rounded-[25px]">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                    {reg.salida_foto ? (
                      <img src={reg.salida_foto} className="w-full h-full object-cover" alt="Salida" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[8px] text-gray-300 italic">PENDIENTE</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-orange-600 uppercase mb-1">Salida Registrada</p>
                    <p className="text-lg font-black text-gray-800 leading-none">{reg.hora_salida || '--:--'}</p>
                    <p className="text-[9px] text-gray-500 font-bold mb-2">{reg.hora_salida ? reg.fecha : 'Esperando marcación'}</p>
                    {reg.salida_gps ? (
                      <a 
                        href={`https://www.google.com/maps?q=${reg.salida_gps}`} 
                        target="_blank" 
                        className="inline-block bg-white border border-orange-100 text-orange-600 text-[8px] font-black px-3 py-1.5 rounded-full uppercase shadow-sm hover:bg-orange-600 hover:text-white transition-all"
                      >
                        📍 Ver Ubicación Salida
                      </a>
                    ) : (
                      <span className="text-[8px] font-black text-gray-300 uppercase">Sin GPS de salida</span>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))}
          
          {registrosFiltrados.length === 0 && !loading && (
            <div className="bg-white p-10 rounded-[30px] text-center border-2 border-dashed border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase">No hay registros con estos filtros</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}