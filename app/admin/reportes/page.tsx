'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function ReportesHibrido() {
  const [registros, setRegistros] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [rol, setRol] = useState<string | null>(null)
  const [nombreUsuario, setNombreUsuario] = useState<string>('')

  useEffect(() => {
    const cargarDatos = async () => {
      // 1. Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 2. Obtener perfil y rol del empleado
      const { data: perfil } = await supabase
        .from('empleados')
        .select('nombres, rol_empresa')
        .eq('id', user.id)
        .single()

      if (perfil) {
        setRol(perfil.rol_empresa)
        setNombreUsuario(perfil.nombres)
        
        // 3. Consultar la vista de reportes
        let query = supabase.from('vista_reportes_jefe').select('*')

        // SEGURIDAD: Si no es Supervisor, filtrar solo por su nombre exacto
        if (perfil.rol_empresa !== 'Supervisor') {
          query = query.eq('nombres', perfil.nombres)
        }

        const { data: dataReporte, error } = await query
        if (error) console.error("Error cargando reportes:", error)
        if (dataReporte) setRegistros(dataReporte)
      }
      setCargando(false)
    }
    cargarDatos()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24 font-sans text-black">
      {/* TÍTULO DINÁMICO SEGÚN ROL */}
      <header className="mb-8 mt-4 px-2">
        <h1 className="text-3xl font-black text-blue-900 tracking-tighter uppercase leading-none">
          {rol === 'Supervisor' ? 'Panel de Control' : 'Mis Registros'}
        </h1>
        <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">
          {rol === 'Supervisor' ? 'Gestión General Proaceites' : `Historial de Asistencia`}
        </p>
      </header>

      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-black text-[10px] text-blue-600 uppercase tracking-widest">Cargando Datos...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {registros.length > 0 ? (
            registros.map((reg) => (
              <div key={reg.registro_id} className="bg-white rounded-[35px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-gray-100 relative">
                
                {/* ETIQUETA DE TIPO (INGRESO/SALIDA) */}
                <div className={`absolute top-0 right-8 px-4 py-1.5 rounded-b-2xl text-[10px] font-black text-white shadow-sm ${reg.tipo_registro === 'ingreso' ? 'bg-green-500' : 'bg-red-500'}`}>
                  {reg.tipo_registro.toUpperCase()}
                </div>

                <div className="flex gap-4">
                  {/* FOTO DE EVIDENCIA */}
                  <div className="relative w-24 h-32 rounded-3xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0 shadow-inner">
                    {reg.foto ? (
                      <img src={reg.foto} className="w-full h-full object-cover" alt="Evidencia" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold">SIN FOTO</div>
                    )}
                  </div>

                  {/* INFORMACIÓN DEL REGISTRO */}
                  <div className="flex flex-col justify-center py-1 flex-1">
                    <h3 className="font-black text-gray-900 uppercase text-lg leading-tight mb-1">
                      {reg.nombres}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-blue-100">
                        {reg.rol_empresa}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-gray-500">
                        <span className="text-xs font-bold">📅 {new Date(reg.fecha_hora).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <span className="text-xs font-bold">⏰ {new Date(reg.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTÓN DE UBICACIÓN */}
                <a 
                  href={reg.ubicacion} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-gray-200"
                >
                  📍 Ver ubicación en mapa
                </a>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-200 px-10">
              <p className="text-gray-400 font-black uppercase text-xs">No hay registros para mostrar</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}