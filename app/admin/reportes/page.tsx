'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ReporteAsistencia() {
  const pathname = usePathname()
  const [registros, setRegistros] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data, error } = await supabase
      .from('asistencia')
      .select('*')
      .order('fecha_hora', { ascending: false })
    
    if (error) console.error("Error:", error.message)
    else setRegistros(data || [])
    setLoading(false)
  }

  const formatearFecha = (iso: string) => {
    if (!iso) return { f: '-', h: '-' }
    const d = new Date(iso)
    return {
      f: d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      h: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900 font-sans">
      {/* NAVEGACIÓN */}
      <nav className="bg-white border-b sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex gap-4">
          <Link href="/admin/reportes" className={`flex-1 text-center py-2.5 rounded-xl text-xs font-black uppercase transition-all ${pathname.includes('reportes') ? 'bg-blue-900 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
            📊 Reportes
          </Link>
          <Link href="/admin/empleados" className="flex-1 text-center py-2.5 rounded-xl text-xs font-black uppercase bg-slate-100 text-slate-400">
            👥 Personal
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 pt-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-blue-950 uppercase tracking-tighter">Auditoría</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Panel de Control de Asistencias</p>
          </div>
          <button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase shadow-lg transition-all">
            Actualizar Datos
          </button>
        </header>

        {loading ? (
          <div className="text-center py-20 animate-pulse font-black text-slate-300 uppercase tracking-widest">Cargando Registros...</div>
        ) : (
          <div className="space-y-4">
            {registros.map((reg) => {
              const { f, h } = formatearFecha(reg.fecha_hora)
              const esIngreso = reg.tipo_registro === 'ingreso'

              return (
                <div key={reg.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6">
                  
                  {/* FOTO */}
                  <div className="w-32 h-32 bg-slate-50 rounded-3xl overflow-hidden border-2 border-slate-100 flex-shrink-0 shadow-inner relative group">
                    {reg.foto_url ? (
                      <img src={reg.foto_url} className="w-full h-full object-cover" alt="Marcación" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center opacity-20 group-hover:opacity-40 transition-all">
                        <span className="text-3xl">📷</span>
                        <span className="text-[10px] font-black mt-1">SIN FOTO</span>
                      </div>
                    )}
                  </div>

                  {/* INFO PRINCIPAL */}
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${esIngreso ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                        {reg.tipo_registro || 'DESCONOCIDO'}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{f}</span>
                    </div>
                    
                    <h2 className="text-4xl font-black text-blue-950 tracking-tighter mb-1">{h}</h2>
                    
                    <div className="flex flex-wrap gap-2 items-center">
                       <p className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md">ID: {reg.id}</p>
                       {/* Aquí debería ir el nombre si existiera en la tabla */}
                       <span className="text-[10px] font-black text-blue-600 uppercase">● Empleado No Identificado</span>
                    </div>
                  </div>

                  {/* GPS Y ACCIONES */}
                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    {reg.geolocalizacion ? (
                      <a 
                        href={`https://www.google.com/maps?q=${reg.geolocalizacion.x},${reg.geolocalizacion.y}`}
                        target="_blank"
                        className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-blue-100 transition-all"
                      >
                        📍 Ver Ubicación GPS
                      </a>
                    ) : (
                      <div className="bg-slate-50 text-slate-300 px-6 py-3 rounded-2xl font-black text-[10px] uppercase text-center border border-dashed">
                        Sin Coordenadas
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