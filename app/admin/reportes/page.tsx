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
    // Consultamos la tabla 'asistencia' con los nombres reales de tu imagen
    const { data, error } = await supabase
      .from('asistencia')
      .select('*')
      .order('fecha_hora', { ascending: false })
    
    if (error) {
      console.error("Error cargando datos:", error.message)
    } else {
      setRegistros(data || [])
    }
    setLoading(false)
  }

  // Función para procesar la fecha y hora de la columna 'fecha_hora'
  const formatearInfo = (isoString: string) => {
    if (!isoString) return { fecha: '-', hora: '-' }
    const d = new Date(isoString)
    return {
      fecha: d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hora: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-black font-sans">
      {/* NAVEGACIÓN SUPERIOR */}
      <nav className="bg-white border-b sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Link href="/admin/reportes" className={`flex-1 text-center py-2 rounded-xl text-[10px] font-black uppercase transition-all ${pathname.includes('reportes') ? 'bg-blue-900 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
            📊 Reportes
          </Link>
          <Link href="/admin/empleados" className={`flex-1 text-center py-2 rounded-xl text-[10px] font-black uppercase transition-all ${pathname.includes('empleados') ? 'bg-blue-900 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
            👥 Personal
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4 pt-6">
        <header className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tighter leading-none">Auditoría</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">Registros en tiempo real</p>
          </div>
          <button 
            onClick={fetchData}
            className="bg-blue-50 text-blue-600 p-2 rounded-lg text-[10px] font-black uppercase"
          >
            Actualizar
          </button>
        </header>

        {loading ? (
          <div className="text-center py-20 animate-pulse text-gray-300 font-black uppercase text-xs tracking-widest">
            Sincronizando con base de datos...
          </div>
        ) : registros.length === 0 ? (
          <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase">No hay marcaciones registradas</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {registros.map((reg) => {
              const { fecha, hora } = formatearInfo(reg.fecha_hora)
              const esIngreso = reg.tipo_registro?.toLowerCase() === 'ingreso'
              
              return (
                <div key={reg.id} className="bg-white p-5 rounded-[30px] shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
                  
                  {/* FOTO MINIATURA */}
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden border flex-shrink-0 shadow-inner">
                    {reg.foto_url ? (
                      <img src={reg.foto_url} className="w-full h-full object-cover" alt="Marcación" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center flex-col opacity-20">
                        <span className="text-xl">📷</span>
                        <span className="text-[7px] font-black">SIN FOTO</span>
                      </div>
                    )}
                  </div>

                  {/* INFO PRINCIPAL */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${esIngreso ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {reg.tipo_registro || 'Registro'}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase italic">{fecha}</span>
                    </div>
                    
                    <h3 className="text-xl font-black text-blue-900 leading-none mb-1">
                      {hora}
                    </h3>
                    
                    {/* ID O NOMBRE (Si lograste guardar el nombre del empleado) */}
                    <p className="text-[9px] font-bold text-gray-400 truncate">
                      REF: {reg.id.substring(0, 13)}...
                    </p>
                  </div>

                  {/* UBICACIÓN GPS */}
                  <div className="text-right">
                    {reg.geolocalizacion ? (
                      <a 
                        href={`https://www.google.com/maps?q=${reg.geolocalizacion}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex flex-col items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <span className="text-lg">📍</span>
                        <span className="text-[6px] font-black uppercase">GPS</span>
                      </a>
                    ) : (
                      <div className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-2xl opacity-30">
                        <span className="text-[8px] font-black text-gray-400">---</span>
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