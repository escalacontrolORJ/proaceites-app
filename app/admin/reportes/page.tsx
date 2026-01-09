'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function ReportesAdmin() {
  const [registros, setRegistros] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarReportes = async () => {
      const { data } = await supabase.from('vista_reportes_jefe').select('*')
      if (data) setRegistros(data)
      setCargando(false)
    }
    cargarReportes()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20 font-sans text-black">
      <header className="mb-8 mt-4">
        <h1 className="text-3xl font-black text-blue-900 tracking-tighter uppercase">Reportes</h1>
        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Control de Asistencia Real</p>
      </header>

      {cargando ? (
        <p className="text-center font-bold animate-pulse text-blue-600">Cargando registros...</p>
      ) : (
        <div className="grid gap-4">
          {registros.map((reg) => (
            <div key={reg.registro_id} className="bg-white rounded-[32px] p-5 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className={`absolute top-0 right-0 px-6 py-1 rounded-bl-2xl text-[10px] font-black text-white ${reg.tipo_registro === 'ingreso' ? 'bg-green-500' : 'bg-red-500'}`}>
                {reg.tipo_registro.toUpperCase()}
              </div>

              <div className="flex items-start gap-4">
                {reg.foto && (
                  <img src={reg.foto} className="w-20 h-24 rounded-2xl object-cover shadow-sm bg-gray-200" alt="Evidencia" />
                )}
                
                <div className="flex-1">
                  <h3 className="font-black text-gray-900 uppercase text-lg leading-tight">{reg.nombres}</h3>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{reg.rol_empresa}</span>
                  
                  <div className="mt-3 space-y-1">
                    <p className="text-[11px] text-gray-500 font-bold">📅 {new Date(reg.fecha_hora).toLocaleDateString()}</p>
                    <p className="text-[11px] text-gray-500 font-bold">⏰ {new Date(reg.fecha_hora).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>

              <a 
                href={reg.ubicacion} 
                target="_blank" 
                className="mt-4 flex items-center justify-center w-full py-3 bg-gray-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest active:bg-blue-600 transition-colors"
              >
                📍 Ver ubicación en mapa
              </a>
            </div>
          ))}
        </div>
      )}

      {registros.length === 0 && !cargando && (
        <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-bold uppercase text-sm">No hay registros hoy</p>
        </div>
      )}
    </div>
  )
}