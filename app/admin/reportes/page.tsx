'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ReportesAsistencia() {
  const [datosAgrupados, setDatosAgrupados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReportes()
  }, [])

  async function fetchReportes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('asistencia')
      .select('*')
      .order('fecha_hora', { ascending: true }) // Ordenamos por tiempo para procesar

    if (error) {
      console.error("Error:", error.message)
    } else {
      procesarRegistros(data || [])
    }
    setLoading(false)
  }

  // LÓGICA PARA UNIR INGRESO Y SALIDA EN UNA SOLA FILA
  const procesarRegistros = (registros: any[]) => {
    const agrupados: Record<string, any> = {}

    registros.forEach(reg => {
      // Creamos una llave única por empleado y día
      const llave = `${reg.empleado_id}-${reg.fecha}`
      
      if (!agrupados[llave]) {
        agrupados[llave] = {
          nombres: reg.nombres,
          fecha: reg.fecha,
          ingreso: null,
          salida: null,
          foto_ingreso: null,
          foto_salida: null,
          horasTotales: '---'
        }
      }

      if (reg.tipo_registro === 'ingreso') {
        agrupados[llave].ingreso = reg.fecha_hora
        agrupados[llave].foto_ingreso = reg.foto_url
      } else if (reg.tipo_registro === 'salida') {
        agrupados[llave].salida = reg.fecha_hora
        agrupados[llave].foto_salida = reg.foto_url
      }

      // Si tenemos ambos, calculamos las horas
      if (agrupados[llave].ingreso && agrupados[llave].salida) {
        const inicio = new Date(agrupados[llave].ingreso).getTime()
        const fin = new Date(agrupados[llave].salida).getTime()
        const diffHrs = (fin - inicio) / (1000 * 60 * 60)
        agrupados[llave].horasTotales = diffHrs.toFixed(2) + " hrs"
      }
    })

    // Convertir el objeto de nuevo a un array y ordenar por fecha descendente
    const resultado = Object.values(agrupados).sort((a: any, b: any) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    )
    setDatosAgrupados(resultado)
  }

  const formatearHora = (isoString: string | null) => {
    if (!isoString) return '--:--'
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen text-black font-sans">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-black uppercase mb-6 text-blue-900 tracking-tighter">
          Reporte Consolidado
        </h1>

        <div className="bg-white shadow-sm rounded-[30px] overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-[10px] font-black uppercase text-gray-400">Personal</th>
                <th className="p-4 text-[10px] font-black uppercase text-gray-400">Fecha</th>
                <th className="p-4 text-[10px] font-black uppercase text-gray-400">Ingreso</th>
                <th className="p-4 text-[10px] font-black uppercase text-gray-400">Salida</th>
                <th className="p-4 text-[10px] font-black uppercase text-gray-400 text-center">Total</th>
                <th className="p-4 text-[10px] font-black uppercase text-gray-400 text-center">Fotos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {datosAgrupados.map((item, idx) => (
                <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-[11px] uppercase leading-none">{item.nombres}</p>
                  </td>
                  <td className="p-4 text-[11px] text-gray-500 font-medium">{item.fecha}</td>
                  <td className="p-4 text-[11px] font-bold text-blue-600">
                    {formatearHora(item.ingreso)}
                  </td>
                  <td className="p-4 text-[11px] font-bold text-orange-600">
                    {formatearHora(item.salida)}
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-black">
                      {item.horasTotales}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    {item.foto_ingreso && (
                      <a href={item.foto_ingreso} target="_blank" className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-xs shadow-sm hover:scale-110 transition-transform">📸</a>
                    )}
                    {item.foto_salida && (
                      <a href={item.foto_salida} target="_blank" className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-xs shadow-sm hover:scale-110 transition-transform">📸</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {datosAgrupados.length === 0 && !loading && (
            <div className="p-10 text-center text-gray-300 font-bold uppercase text-xs tracking-widest">
              No hay registros hoy
            </div>
          )}
        </div>
      </div>
    </div>
  )
}