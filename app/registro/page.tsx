'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function MarcarAsistencia() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [modo, setModo] = useState<'ingreso' | 'salida'>('ingreso')
  const [ultimoRegistro, setUltimoRegistro] = useState<any>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    obtenerUsuarioYEstado()
  }, [])

  async function obtenerUsuarioYEstado() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
    await verificarUltimoRegistro(user.id)
    setLoading(false)
  }

  async function verificarUltimoRegistro(userId: string) {
    // Consultamos el registro más reciente de este empleado
    const { data, error } = await supabase
      .from('asistencia')
      .select('*')
      .eq('empleado_id', userId)
      .order('fecha_hora', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) {
      setUltimoRegistro(data)
      const fechaUltimo = data.fecha_hora.split('T')[0]
      const hoy = new Date().toISOString().split('T')[0]

      // Lógica: Si el último fue ingreso y fue HOY, forzar marcar SALIDA
      if (data.tipo_registro === 'ingreso' && fechaUltimo === hoy) {
        setModo('salida')
      } else {
        // Si el ingreso fue ayer o el último fue salida, permitir nuevo INGRESO
        setModo('ingreso')
      }
    }
  }

  const handleMarcacion = async () => {
    setEnviando(true)
    try {
      // Aquí integras tu lógica de captura de foto y GPS
      const payload = {
        empleado_id: user.id,
        tipo_registro: modo,
        fecha_hora: new Date().toISOString(),
        // foto_url: (URL de la foto subida),
        // geolocalizacion: (coordenadas obtenidas)
      }

      const { error } = await supabase.from('asistencia').insert([payload])

      if (error) throw error

      alert(`¡${modo.toUpperCase()} registrado con éxito!`)
      // Actualizamos el estado para que el botón cambie según la nueva realidad
      await verificarUltimoRegistro(user.id)
      
    } catch (err: any) {
      alert("Error al registrar: " + err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 font-black text-blue-800 animate-pulse">
      SINCRONIZANDO ESTADO...
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-8 border-4 border-white text-center">
        
        <div className="mb-6">
          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            modo === 'ingreso' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
          }`}>
            {modo === 'ingreso' ? 'Turno Cerrado' : 'Turno en Curso'}
          </span>
          <h1 className="text-4xl font-black text-slate-900 italic uppercase mt-4">
            {modo === 'ingreso' ? 'Entrada' : 'Salida'}
          </h1>
          {modo === 'salida' && (
            <p className="text-[10px] font-bold text-slate-400 mt-2">
              INGRESÓ A LAS: {new Date(ultimoRegistro.fecha_hora).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* CONTENEDOR DE CÁMARA (Simulado) */}
        <div className="bg-slate-200 aspect-square rounded-[2.5rem] mb-8 flex items-center justify-center border-2 border-dashed border-slate-300">
           <span className="text-4xl">📸</span>
        </div>

        <button
          onClick={handleMarcacion}
          disabled={enviando}
          className={`w-full py-6 rounded-3xl text-white font-black uppercase tracking-tighter text-lg shadow-xl active:scale-95 transition-all ${
            modo === 'ingreso' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600'
          }`}
        >
          {enviando ? 'PROCESANDO...' : `CONFIRMAR ${modo}`}
        </button>

        <p className="text-[8px] text-slate-300 font-bold uppercase mt-8 tracking-[0.2em]">
          PROACEITES AUDITORÍA GPS
        </p>
      </div>
    </div>
  )
}