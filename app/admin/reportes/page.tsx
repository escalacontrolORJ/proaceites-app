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
    cargarDatosIniciales()
  }, [])

  async function cargarDatosIniciales() {
    setLoading(true)
    try {
      // 1. Cargar empleados para el filtro
      const { data: dataEmp } = await supabase
        .from('empleados')
        .select('nombres')
        .order('nombres', { ascending: true })
      if (dataEmp) setEmpleados(dataEmp)

      // 2. Cargar asistencias (Sin filtros de Supabase para forzar que traiga TODO)
      const { data: dataAsis, error } = await supabase
        .from('asistencia')
        .select('*')
      
      if (error) throw error

      console.log("Datos brutos recibidos:", dataAsis) // Ver en consola del navegador
      setRegistros(dataAsis || [])
    } catch (error: any) {
      alert("Error de conexión: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const limpiarFiltros = () => {
    setFiltroNombre('')
    setFechaDesde('')
    setFechaHasta('')
  }

  // LÓGICA DE FILTRADO ULTRA-FLEXIBLE
  const registrosFiltrados = registros.filter(r => {
    // 1. Filtro de Nombre (ignora espacios y mayúsculas)
    const nombreRegistro = (r.nombres || "").toString().trim().toLowerCase()
    const nombreBuscado = filtroNombre.trim().toLowerCase()
    const coincideNombre = filtroNombre === '' || nombreRegistro === nombreBuscado

    // 2. Filtro de Fechas
    // Si r.fecha viene como "2024-05-20T..." cortamos solo la fecha
    const fechaReg = r.fecha ? r.fecha.substring(0, 10) : ""
    const coincideDesde = fechaDesde ? fechaReg >= fechaDesde : true
    const coincideHasta = fechaHasta ? fechaReg <= fechaHasta : true

    return coincideNombre && coincideDesde && coincideHasta
  })

  const calcularHoras = (entrada: string, salida: string) => {
    if (!entrada || !salida) return '0.0'
    try {
      const [h1, m1] = entrada.split(':').map(Number)
      const [h2, m2] = salida.split(':').map(Number)
      const totalMinutos = (h2 * 60 + m2) - (h1 * 60 + m1)
      return (totalMinutos / 60).toFixed(1)
    } catch (e) { return '0.0' }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-black font-sans">
      
      {/* NAVEGACIÓN */}
      <nav className="bg-white border-b sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Link href="/admin/reportes" className={`flex-1 text-center py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${pathname.includes('reportes') ? 'bg-blue-900 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
            📊 Reportes
          </Link>
          <Link href="/admin/empleados" className={`flex-1 text-center py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${pathname.includes('empleados') ? 'bg-blue-900 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
            👥 Personal
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4 pt-6">
        
        <header className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-blue-900 uppercase leading-none">Reportes</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Control de Asistencia GPS</p>
          </div>
          <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
            Total: {registrosFiltrados.length} Registros
          </div>
        </header>

        {/* FILTROS */}
        <div className="bg-white p-5 rounded-[30px] shadow-sm border mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 ml-2 block">Empleado</label>
            <select 
              className="w-full p-3 bg-gray-50 rounded-xl border-none text-xs font-bold outline-none"
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
            >
              <option value="">TODOS</option>
              {empleados.map((e, i) => <option key={i} value={e.nombres}>{e.nombres}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 ml-2 block">Desde</label>
            <input type="date" className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none" value={fechaDesde} onChange={(e)=>setFechaDesde(e.target.value)}/>
          </div>
          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 ml-2 block">Hasta</label>
            <input type="date" className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none" value={fechaHasta} onChange={(e)=>setFechaHasta(e.target.value)}/>
          </div>
        </div>

        {/* CONTENIDO */}
        {loading ? (
          <div className="text-center py-20 font-black text-gray-300 uppercase animate-pulse">Cargando datos de Supabase...</div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-black uppercase text-[10px] mb-4 italic">No se encontraron registros</p>
            <button 
                onClick={limpiarFiltros}
                className="px-8 py-4 bg-blue-900 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl"
            >
              Resetear y Ver todo el historial
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {registrosFiltrados.map((reg) => (
              <div key={reg.id} className="bg-white rounded-[35px] p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-900 text-white rounded-xl flex items-center justify-center font-black text-xs uppercase shadow-md">
                      {reg.nombres?.substring(0,2)}
                    </div>
                    <div>
                      <h3 className="font-black text-blue-900 uppercase text-xs leading-none">{reg.nombres}</h3>
                      <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">{reg.fecha}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 px-3 py-1 rounded-full text-right">
                    <span className="text-xs font-black text-blue-700">{calcularHoras(reg.hora_entrada, reg.hora_salida)}h</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-blue-400 uppercase text-center">Entrada {reg.hora_entrada}</p>
                    <img src={reg.entrada_foto} className="w-full h-40 object-cover rounded-[25px] border shadow-sm" alt="E" />
                    <a href={`https://www.google.com/maps?q=${reg.entrada_gps}`} target="_blank" rel="noreferrer" className="block text-center text-[8px] font-black text-blue-600 uppercase underline">Ver GPS Entrada</a>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-orange-400 uppercase text-center">Salida {reg.hora_salida || '--:--'}</p>
                    {reg.salida_foto ? (
                      <>
                        <img src={reg.salida_foto} className="w-full h-40 object-cover rounded-[25px] border shadow-sm" alt="S" />
                        <a href={`https://www.google.com/maps?q=${reg.salida_gps}`} target="_blank" rel="noreferrer" className="block text-center text-[8px] font-black text-orange-600 uppercase underline">Ver GPS Salida</a>
                      </>
                    ) : (
                      <div className="w-full h-40 bg-gray-50 rounded-[25px] border-2 border-dashed border-gray-100 flex items-center justify-center text-[8px] font-black text-gray-300 uppercase italic">Pendiente</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}