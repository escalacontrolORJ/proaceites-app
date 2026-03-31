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
      
      // Consultar si ya marcó hoy en la base de datos (más seguro que localStorage)
      const hoyEcuador = new Date().toLocaleDateString("en-CA", { timeZone: "America/Guayaquil" });
      const { data: registros } = await supabase
        .from('asistencia')
        .select('tipo_registro')
        .eq('empleado_id', session.user.id)
        .eq('fecha', hoyEcuador)
        .order('fecha_hora', { ascending: false })
        .limit(1);

      if (registros && registros.length > 0 && registros[0].tipo_registro === 'ingreso') {
        setYaEntro(true)
      }

      setLoading(false)
      iniciarSensores()
    }
    protegerRuta()
  }, [router])

  const handleSignOut = async () => {
    if (!confirm("¿Cerrar sesión?")) return
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const iniciarSensores = async () => {
    setGpsReady(false)
    setStatus('Buscando GPS...')
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords(`(${pos.coords.latitude}, ${pos.coords.longitude})`)
          setGpsReady(true)
          setStatus('GPS Listo')
          iniciarCamara()
        },
        (err) => {
          setStatus('ERROR: Activa el GPS y recarga')
          console.error(err)
        },
        { enableHighAccuracy: true }
      )
    }
  }

  const iniciarCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraReady(true)
      }
    } catch (err) {
      setStatus('ERROR: Activa la cámara')
    }
  }

  const capturarYEnviar = async (tipoOriginal: 'INGRESO' | 'SALIDA') => {
    setLoading(true)
    setStatus(`Guardando ${tipoOriginal}...`)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0)
      const fotoBase64 = canvas.toDataURL('image/jpeg', 0.5)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Sesión expirada")

      // --- LÓGICA DE HORA PARA ECUADOR ---
      const ahora = new Date();
      
      // 1. Obtener la fecha/hora local de Ecuador en formato ISO compatible (YYYY-MM-DDTHH:mm:ss)
      const horaEcuadorSucia = ahora.toLocaleString("sv-SE", { timeZone: "America/Guayaquil" }).replace(' ', 'T');
      
      // 2. Agregar el offset de Ecuador (-05:00) para que Postgres no lo mueva a UTC
      const fechaHoraFinal = `${horaEcuadorSucia}-05:00`;
      
      // 3. Fecha simple para la columna de filtrado
      const fechaSoloEcuador = horaEcuadorSucia.split('T')[0];

      const datos = {
        empleado_id: session.user.id,
        tipo_registro: tipoOriginal.toLowerCase(), 
        fecha: fechaSoloEcuador,
        geolocalizacion: coords,
        foto: fotoBase64,
        fecha_hora: fechaHoraFinal
      }

      const { error: dbError } = await supabase.from('asistencia').insert([datos])

      if (dbError) {
        console.error("Error Supabase:", dbError)
        throw dbError
      }

      setYaEntro(tipoOriginal === 'INGRESO')
      setStatus(`¡${tipoOriginal} EXITOSO!`)
      alert(`${tipoOriginal} registrado correctamente a las ${horaEcuadorSucia.substring(11, 16)}.`)

    } catch (err: any) {
      console.error(err)
      setStatus('Error al registrar')
      alert("Error: " + (err.message || "Fallo de conexión"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-sm flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase">Proaceites</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Control Operativo</p>
        </div>
        <button onClick={handleSignOut} className="bg-slate-900 p-3 rounded-2xl border border-slate-800 text-slate-400 hover:text-white transition-colors">
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
          className={`w-full p-8 rounded-[30px] font-black text-xl transition-all shadow-xl active:scale-95 disabled:opacity-30 ${yaEntro ? 'bg-rose-500 shadow-rose-900/40' : 'bg-emerald-500 shadow-emerald-900/40'}`}
        >
          {loading ? '...' : (yaEntro ? 'REGISTRAR SALIDA' : 'REGISTRAR INGRESO')}
        </button>
        <p className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">{status}</p>
      </div>
    </div>
  )
}