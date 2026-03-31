'use client'
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [gpsReady, setGpsReady] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [coords, setCoords] = useState('')
  const [yaEntro, setYaEntro] = useState(false)
  const [status, setStatus] = useState('Iniciando...')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()

  useEffect(() => {
    const protegerRuta = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      const estadoLocal = localStorage.getItem('asistencia_estado')
      if (estadoLocal === 'INGRESO_REALIZADO') setYaEntro(true)
      setLoading(false)
      iniciarSensores()
    }
    protegerRuta()
  }, [router])

  const handleSignOut = async () => {
    if (!confirm("¿Cerrar sesión?")) return
    await supabase.auth.signOut()
    localStorage.removeItem('asistencia_estado')
    router.replace('/login')
  }

  const iniciarSensores = async () => {
    setGpsReady(false)
    setStatus('Obteniendo GPS...')
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords(`(${pos.coords.latitude}, ${pos.coords.longitude})`)
          setGpsReady(true)
          setStatus('GPS Listo')
          iniciarCamara()
        },
        (err) => {
          setStatus('Error GPS: Activa la ubicación')
          console.error(err)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }

  const iniciarCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraReady(true)
      }
    } catch (err) {
      setStatus('Error de Cámara')
      console.error(err)
    }
  }

  // FUNCIÓN CORREGIDA: Genera la hora de Ecuador con offset -05:00 explícito
  const obtenerFechaHoraEcuador = () => {
    const ahora = new Date();
    
    // 1. Obtenemos la fecha y hora en formato YYYY-MM-DD HH:mm:ss
    const fechaHoraSucia = ahora.toLocaleString("sv-SE", { timeZone: "America/Guayaquil" });
    
    // 2. Formateamos para que Supabase no lo confunda con UTC (agregamos T y -05:00)
    // Resultado final: "2026-03-31T12:15:00-05:00"
    const fechaHoraEcuador = `${fechaHoraSucia.replace(' ', 'T')}-05:00`;
    
    // 3. Fecha para el campo de búsqueda rápida
    const fechaSolo = ahora.toLocaleDateString("en-CA", { timeZone: "America/Guayaquil" });
    
    return { fechaHora: fechaHoraEcuador, fechaSolo };
  }

  const capturarYEnviar = async (tipo: 'INGRESO' | 'SALIDA') => {
    setLoading(true)
    setStatus(`Registrando ${tipo}...`)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("No hay sesión activa")

      let fotoUrl = null
      if (canvasRef.current && videoRef.current) {
        const context = canvasRef.current.getContext('2d')
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context?.drawImage(videoRef.current, 0, 0)
        
        const blob = await new Promise<Blob | null>(res => canvasRef.current?.toBlob(res, 'image/jpeg', 0.7))
        if (blob) {
          const fileName = `${session.user.id}/${Date.now()}.jpg`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('fotos_asistencia')
            .upload(fileName, blob)
          
          if (uploadError) throw uploadError
          const { data: publicUrl } = supabase.storage.from('fotos_asistencia').getPublicUrl(fileName)
          fotoUrl = publicUrl.publicUrl
        }
      }

      // OBTENEMOS TIEMPO CON OFFSET -05:00
      const { fechaHora, fechaSolo } = obtenerFechaHoraEcuador();

      const { error: dbError } = await supabase.from('asistencia').insert([{
        empleado_id: session.user.id,
        tipo_registro: tipo.toLowerCase(),
        fecha_hora: fechaHora, 
        fecha: fechaSolo,
        geolocalizacion: coords,
        foto: fotoUrl
      }])

      if (dbError) throw dbError

      if (tipo === 'INGRESO') {
        localStorage.setItem('asistencia_estado', 'INGRESO_REALIZADO')
        setYaEntro(true)
      } else {
        localStorage.removeItem('asistencia_estado')
        setYaEntro(false)
      }

      alert(`${tipo} registrado con éxito`)
      setStatus('Listo')
      
    } catch (err: any) {
      alert(`Error: ${err.message}`)
      setStatus('Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  if (loading && status === 'Iniciando...') {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-black italic uppercase">Cargando Sistema...</div>
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6 pb-24">
      <div className="w-full flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">
          PRO<span className="text-blue-600">ACEITES</span>
        </h1>
        <button onClick={handleSignOut} className="p-2 bg-slate-100 rounded-full text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>

      <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-[40px] overflow-hidden border-2 border-slate-800 shadow-2xl mb-8">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        
        {!gpsReady && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-8 text-center">
            <p className="text-xs font-bold text-amber-400 uppercase mb-4">{status}</p>
          </div>
        )}
      </div>

      <div className="w-full max-w-sm space-y-4">
        <button 
          onClick={() => capturarYEnviar(yaEntro ? 'SALIDA' : 'INGRESO')} 
          disabled={!gpsReady || loading} 
          className={`w-full p-8 rounded-[30px] font-black text-xl uppercase tracking-widest shadow-2xl active:scale-95 transition-all ${
            yaEntro 
            ? 'bg-rose-600 text-white shadow-rose-200' 
            : 'bg-blue-600 text-white shadow-blue-200'
          } disabled:opacity-50 disabled:grayscale`}
        >
          {loading ? 'Procesando...' : (yaEntro ? 'Marcar Salida' : 'Marcar Ingreso')}
        </button>

        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-pulse ${gpsReady ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            {gpsReady ? `Ubicación Capturada: ${coords}` : status}
          </p>
        </div>
      </div>
    </div>
  )
}