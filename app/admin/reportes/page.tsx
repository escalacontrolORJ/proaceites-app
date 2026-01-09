'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ReporteAsistencia() {
  const pathname = usePathname()
  const [registros, setRegistros] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Estados para Filtros
  const [filtroNombre, setFiltroNombre] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    // Hacemos un JOIN con la tabla empleados para obtener el nombre real
    const { data, error } = await supabase
      .from('asistencia')
      .select(`
        *,
        empleados (
          nombres
        )
      `)
      .order('fecha_hora', { ascending: false })
    
    if (error) {
      console.error("Error cargando datos:", error.message)
    } else {
      setRegistros(data || [])
    }
    setLoading(false)
  }

  // Lógica de Filtrado en tiempo real
  const registrosFiltrados = registros.filter(reg => {
    // Busca el nombre en la tabla asistencia o en la relación con empleados
    const nombreEmpleado = (reg.empleados?.nombres || reg.nombres || "").toLowerCase()
    const coincideNombre = nombreEmpleado.includes(filtroNombre.toLowerCase())
    
    const fechaReg = reg.fecha_hora ? reg.fecha_hora.split('T')[0] : ''
    const coincideDesde = fechaDesde === '' || fechaReg >= fechaDesde
    const coincideHasta = fechaHasta === '' || fechaReg <= fechaHasta

    return coincideNombre && coincideDesde && coincideHasta
  })

  const formatearFechaHora = (iso: string) => {
    if (!iso) return { fecha: '-', hora: '-' }
    const d = new Date(iso)
    return {
      fecha: d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hora: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900 font-sans">
      {/* NAVEGACIÓN SUPERIOR */}
      <nav className="bg-white border-b sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex gap-2">
          <Link href="/admin/reportes" className={`flex-1 text-center py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${pathname.includes('reportes') ? 'bg-blue-900 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
            📊 Reportes
          </Link>
          <Link href="/admin/empleados" className="flex-1 text-center py-2.5 rounded-xl text-[10px] font-black uppercase bg-gray-100 text-gray-400">
            👥 Personal
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 pt-8">
        <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-blue-950 uppercase tracking-tighter italic">Auditoría Proaceites</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronizado con Supabase</p>
          </div>
          <button onClick={fetchData} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-md active:scale-95 transition-all">
            Refrescar Base de Datos
          </button>
        </header>

        {/* PANEL DE FILTROS */}
        <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Filtrar por Nombre</label>
            <input 
              type="text" 
              placeholder="Escribe el nombre del empleado..."
              className="w-full p-3 bg-slate-50 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-blue-100"
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Desde</label>
            <input type="date" className="w-full p-3 bg-slate-50 rounded-2xl text-xs outline-none" value={fechaDesde} onChange={(e)=>setFechaDesde(e.target.value)}/>
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Hasta</label>
            <input type="date" className="w-full p-3 bg-slate-50 rounded-2xl text-xs outline-none" value={fechaHasta} onChange={(e)=>setFechaHasta(e.target.value)}/>
          </div>
        </div>

        {/* RESULTADOS */}
        {loading ? (
          <div className="text-center py-20 font-black text-slate-300 uppercase animate-pulse tracking-widest">Obteniendo registros...</div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase">Sin registros para mostrar</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {registrosFiltrados.map((reg) => {
              const { fecha, hora } = formatearFechaHora(reg.fecha_hora)
              const esIngreso = reg.tipo_registro?.toLowerCase() === 'ingreso'
              const nombreVisible = reg.empleados?.nombres || reg.nombres || "Sin Nombre"
              
              // Extraer GPS del tipo point (x, y) de Supabase
              const gpsLink = reg.geolocalizacion 
                ? `https://www.google.com/maps?q=${reg.geolocalizacion.y},${reg.geolocalizacion.x}`
                : null

              return (
                <div key={reg.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6">
                  
                  {/* FOTO (Usa foto_url según tu esquema) */}
                  <div className="w-24 h-24 bg-slate-100 rounded-[1.8rem] overflow-hidden border-2 border-white shadow-inner flex-shrink-0">
                    {reg.foto_url ? (
                      <img src={reg.foto_url} className="w-full h-full object-cover" alt="Marcación" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-20 text-xl grayscale">📷</div>
                    )}
                  </div>

                  {/* DATOS */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-1">
                      <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase ${esIngreso ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                        {reg.tipo_registro || 'Registro'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{fecha}</span>
                    </div>
                    <h2 className="text-4xl font-black text-blue-900 leading-none tracking-tighter">{hora}</h2>
                    <p className="text-sm font-black text-blue-600 uppercase mt-1">{nombreVisible}</p>
                    <p className="text-[7px] font-mono text-slate-300 mt-2 uppercase truncate max-w-[150px] mx-auto md:mx-0">UUID: {reg.id}</p>
                  </div>

                  {/* GPS ACCIÓN */}
                  <div className="w-full md:w-auto">
                    {gpsLink ? (
                      <a 
                        href={gpsLink}
                        target="_blank" 
                        rel="noreferrer"
                        className="flex flex-col items-center justify-center w-full md:w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all group"
                      >
                        <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">📍</span>
                        <span className="text-[7px] font-black uppercase">Ver GPS</span>
                      </a>
                    ) : (
                      <div className="w-full md:w-20 h-20 bg-slate-50 flex items-center justify-center rounded-3xl border border-dashed border-slate-200 opacity-40">
                        <span className="text-[7px] font-black text-slate-400 uppercase italic">Sin GPS</span>
                      </div>
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}