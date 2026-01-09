'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Image from 'next/image'

export default function DashboardAsistencia() {
  const [loading, setLoading] = useState(false)
  const [ubicacion, setUbicacion] = useState<{lat: number, lng: number} | null>(null)
  const [enTrabajo, setEnTrabajo] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [horaIngreso, setHoraIngreso] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user)
    }
    fetchUser()

    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => alert("Por favor, activa el GPS para poder registrar tu asistencia."),
        { enableHighAccuracy: true }
      )
    }
  }, [])

  const manejarRegistro = async (tipo: 'ingreso' | 'salida') => {
    if (!ubicacion) return alert("Esperando señal de GPS... Asegúrate de estar en un lugar abierto.")
    
    // Validación de 9 horas para salida
    if (tipo === 'salida' && horaIngreso) {
      const ahora = new Date()
      const ingreso = new Date(horaIngreso)
      const diffMs = ahora.getTime() - ingreso.getTime()
      const diffHoras = diffMs / (1000 * 60 * 60)

      if (diffHoras < 9) {
        const confirmar = confirm("Aún no completas las 9 horas de labor. ¿Deseas registrar la salida de todos modos?")
        if (!confirmar) return
      }
    }

    setLoading(true)

    const { error } = await supabase.from('asistencia').insert([{
      empleado_id: user?.id,
      empleado_email: user?.email,
      tipo_registro: tipo,
      ubicacion: `Lat: ${ubicacion.lat}, Lng: ${ubicacion.lng}`,
      fecha_hora: new Date().toISOString()
    }])

    if (error) {
      alert("Error al registrar: " + error.message)
    } else {
      setEnTrabajo(tipo === 'ingreso')
      if (tipo === 'ingreso') setHoraIngreso(new Date().toISOString())
      alert(`${tipo.toUpperCase()} registrado con éxito.`)
    }
    setLoading(false)
  }

  return (
    <div className="h-[100dvh] bg-gray-50 flex flex-col items-center justify-between p-6 text-black overflow-hidden font-sans">
      
      {/* SECCIÓN SUPERIOR: Logo y Usuario */}
      <div className="flex flex-col items-center mt-2 w-full">
        <div className="bg-white p-4 rounded-2xl shadow-sm mb-2">
          <Image src="/logo.JPG" alt="Proaceites Logo" width={80} height={80} priority />
        </div>
        <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">Proaceites</h1>
        <div className="bg-blue-100 px-3 py-1 rounded-full mt-1">
          <p className="text-[10px] font-bold text-blue-700 uppercase">{user?.email || 'Cargando usuario...'}</p>
        </div>
      </div>

      {/* SECCIÓN CENTRAL: Estado Visual */}
      <div className="w-full max-w-xs">
        <div className={`p-8 rounded-[40px] shadow-xl text-center border-2 ${enTrabajo ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-xs font-bold text-gray-400 uppercase mb-1 italic">Estado de jornada</p>
          <p className={`text-3xl font-black tracking-tight ${enTrabajo ? 'text-green-600' : 'text-red-600'}`}>
            {enTrabajo ? 'EN LABOR' : 'FUERA DE LABOR'}
          </p>
          {enTrabajo && (
            <p className="text-[10px] mt-2 text-green-700 font-medium">Marcado desde las: {new Date(horaIngreso!).toLocaleTimeString()}</p>
          )}
        </div>
      </div>

      {/* SECCIÓN INFERIOR: Botón de Acción (Mobile Ready) */}
      <div className="w-full max-w-xs mb-6">
        <button 
          onClick={() => manejarRegistro(enTrabajo ? 'salida' : 'ingreso')}
          disabled={loading}
          className={`w-full py-7 rounded-[30px] font-black text-2xl shadow-2xl transition-all transform active:scale-95
            ${enTrabajo 
              ? 'bg-red-600 text-white border-b-[8px] border-red-800' 
              : 'bg-green-600 text-white border-b-[8px] border-green-800'
            } disabled:bg-gray-400 disabled:border-none`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              REGISTRANDO...
            </span>
          ) : (
            enTrabajo ? 'MARCAR SALIDA' : 'MARCAR INGRESO'
          )}
        </button>
        <p className="text-center text-[9px] text-gray-400 mt-6 leading-tight uppercase font-bold tracking-widest">
          Sistema de Control de Asistencia <br/> Proaceites v1.0
        </p>
      </div>
    </div>
  )
}