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
  const [status, setStatus] = useState('Verificando sesión...')
  
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
  }, [])

  // FUNCIÓN PARA CERRAR SESIÓN
  const handleSignOut = async () => {
    const confirmar = confirm("¿Estás seguro que deseas cerrar sesión?")
    if (!confirmar) return

    await supabase.auth.signOut()
    localStorage.removeItem('asistencia_estado') // Limpiar rastro local
    router.replace('/login')
  }

  async function iniciarSensores() {
    setStatus('Buscando GPS...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords(`${pos.coords.latitude}, ${pos.coords.longitude}`)
        setGpsReady(true)
        setStatus('GPS OK. Iniciando Cámara...')
        activarCamaraFrontal()
      },
      () => setStatus('ERROR: Activa el GPS ⚠️'),
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }

  async function activarCamaraFrontal() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" }, 
        audio: false 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraReady(true)
        setStatus('SISTEMA LISTO ✅')
      }
    } catch (err) {
      setStatus('ERROR: Cámara frontal ⚠️')
    }
  }

  const capturarYEnviar = async (tipo: 'INGRESO' | 'SALIDA') => {
    if (!gpsReady || !cameraReady || loading) return
    setLoading(true)

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas!.width = video!.videoWidth
      canvas!.height = video!.videoHeight
      canvas!.getContext('2d')?.drawImage(video!, 0, 0)
      const blob = await new Promise<Blob | null>(res => canvas!.toBlob(res, 'image/jpeg', 0.6))
      if (!blob) return

      const fileName = `${Date.now()}_${tipo}.jpg`
      await supabase.storage.from('fotos_asistencia').upload(fileName, blob)
      const { data: { publicUrl } } = supabase.storage.from('fotos_asistencia').getPublicUrl(fileName)
      const { data: { session } } = await supabase.auth.getSession()
      
      const hoy = new Date().toISOString().split('T')[0]
      const ahoraISO = new Date().toISOString()

      if (tipo === 'INGRESO') {
        await supabase.from('asistencia').insert([{ 
          empleado_id: session?.user.id,
          fecha: hoy,
          hora_ingreso: ahoraISO,
          foto_ingreso: publicUrl,
          ubicacion_ingreso: coords,
          tipo_registro: 'ingreso',
          foto_url: publicUrl,
          geolocalizacion: coords,
          fecha_hora: ahoraISO
        }])
        localStorage.setItem('asistencia_estado', 'INGRESO_REALIZADO')
        setYaEntro(true)
        alert("✅ Entrada registrada")
        router.push('/admin/asistencia')
      } else {
        await supabase.from('asistencia').update({ 
          hora_salida: ahoraISO,
          foto_salida: publicUrl,
          ubicacion_salida: coords,
          tipo_registro: 'salida'
        }).eq('empleado_id', session?.user.id).eq('fecha', hoy)

        localStorage.removeItem('asistencia_estado')
        setYaEntro(false)
        alert("✅ Salida registrada")
        window.location.reload()
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !gpsReady) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-black uppercase tracking-widest">{status}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center">
      {/* HEADER CON BOTÓN SALIR */}
      <div className="w-full max-w-sm flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black italic tracking-tighter">PROACEITES</h1>
          <span className="text-[8px] text-blue-400 font-bold uppercase tracking-[3px]">{status}</span>
        </div>
        <button 
          onClick={handleSignOut}
          className="bg-slate-800 hover:bg-rose-600 text-white text-[10px] font-black px-4 py-2 rounded-full transition-all border border-slate-700"
        >
          SALIR 🚪
        </button>
      </div>

      <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-[40px] overflow-hidden border-2 border-slate-800 shadow-2xl mb-8">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="w-full max-w-sm space-y-4">
        {!yaEntro ? (
          <button 
            onClick={() => capturarYEnviar('INGRESO')} 
            disabled={!gpsReady} 
            className="w-full bg-emerald-500 p-8 rounded-[30px] font-black text-xl active:scale-95 transition-all shadow-xl shadow-emerald-500/10"
          >
            📸 ENTRADA
          </button>
        ) : (
          <button 
            onClick={() => capturarYEnviar('SALIDA')} 
            disabled={!gpsReady} 
            className="w-full bg-rose-500 p-8 rounded-[30px] font-black text-xl active:scale-95 transition-all shadow-xl shadow-rose-500/10"
          >
            🏁 SALIDA
          </button>
        )}
      </div>

      {yaEntro && (
        <button 
          onClick={() => router.push('/admin/asistencia')} 
          className="mt-8 text-blue-400 font-bold uppercase text-[10px] tracking-widest border-b border-blue-400/20 pb-1"
        >
          Ir a Clientes →
        </button>
      )}
    </div>
  )
}