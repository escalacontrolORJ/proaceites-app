'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ReportesAsistencia() {
  const [datosAgrupados, setDatosAgrupados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetchReportes()
  }, [])

  async function fetchReportes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('asistencia')
      .select('*')
      .order('fecha_hora', { ascending: true })

    if (error) {
      console.error("Error:", error.message)
    } else {
      procesarRegistros(data || [])
    }
    setLoading(false)
  }

  const procesarRegistros = (registros: any[]) => {
    const agrupados: Record<string, any> = {}

    registros.forEach(reg => {
      // Llave por empleado y fecha para unir In/Out
      const llave = `${reg.empleado_id}-${reg.fecha}`
      
      if (!agrupados[llave]) {
        agrupados[llave] = {
          nombres: reg.nombres || '---',
          fecha: reg.fecha,
          ingreso: null,
          salida: null,
          foto_ingreso: null,
          foto_salida: null,
          horasTotales: 0
        }
      }

      if (reg.tipo_registro === 'ingreso') {
        agrupados[llave].ingreso = reg.fecha_hora
        agrupados[llave].foto_ingreso = reg.foto_url
      } else if (reg.tipo_registro === 'salida') {
        agrupados[llave].salida = reg.fecha_hora
        agrupados[llave].foto_salida = reg.foto_url
      }

      if (agrupados[llave].ingreso && agrupados[llave].salida) {
        const inicio = new Date(agrupados[llave].ingreso).getTime()
        const fin = new Date(agrupados[llave].salida).getTime()
        const diffMs = fin - inicio
        if (diffMs > 0) {
          agrupados[llave].horasTotales = (diffMs / (1000 * 60 * 60)).toFixed(2)
        }
      }
    })

    const resultado = Object.values(agrupados).sort((a: any, b: any) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    )
    setDatosAgrupados(resultado)
  }

  const filtrados = datosAgrupados.filter(item => 
    item.nombres.toLowerCase().includes(busqueda.toLowerCase())
  )

  const formatearHora = (isoString: string | null) => {
    if (!isoString) return '--:--'
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen text-black font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-black uppercase text-blue-900 tracking-tighter">Reporte de Asistencia</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Evidencia Fotográfica y Horas Trabajadas</p>
        </header>

        <div className="mb-6 relative">
          <input 
            type="text" 
            placeholder="Buscar empleado..." 
            className="w-full p-4 pl-12 rounded-2xl border-none shadow-sm text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <span className="absolute left-4 top-4 opacity-30 text-lg">🔍</span>
        </div>

        <div className="bg-white shadow-sm rounded-[30px] overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-[10px] font-black uppercase text-gray-400">Personal</th>
                  <th className="p-4 text-[10px] font-black uppercase text-gray-400">Fecha</th>
                  <th className="p-4 text-[10px] font-black uppercase text-gray-400">Ingreso</th>
                  <th className="p-4 text-[10px] font-black uppercase text-gray-400">Salida</th>
                  <th className="p-4 text-[10px] font-black uppercase text-gray-400 text-center">Total Horas</th>
                  <th className="p-4 text-[10px] font-black uppercase text-gray-400 text-center">Evidencia (Foto)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map((item, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                    <td className="p-4 font-bold text-[11px] uppercase">{item.nombres}</td>
                    <td className="p-4 text-[11px] text-gray-500">{item.fecha}</td>
                    <td className="p-4 text-[11px] font-bold text-blue-600">{formatearHora(item.ingreso)}</td>
                    <td className="p-4 text-[11px] font-bold text-orange-600">{formatearHora(item.salida)}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black ${item.horasTotales > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {item.horasTotales} hrs
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-3">
                        {item.foto_ingreso && (
                          <a href={item.foto_ingreso} target="_blank" className="flex flex-col items-center gap-1 group">
                            <span className="text-xl">📸</span>
                            <span className="text-[7px] font-black text-blue-600 bg-blue-50 px-1 rounded uppercase">Entrada</span>
                          </a>
                        )}
                        {item.foto_salida && (
                          <a href={item.foto_salida} target="_blank" className="flex flex-col items-center gap-1 group">
                            <span className="text-xl">📸</span>
                            <span className="text-[7px] font-black text-orange-600 bg-orange-50 px-1 rounded uppercase">Salida</span>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}