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
  const [status, setStatus] = useState('Verificando acceso...')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()

  useEffect(() => {
    const validarAcceso = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }

      // Revisar si ya marcó entrada hoy
      const estadoLocal = localStorage.getItem('asistencia_estado')
      if (estadoLocal === 'INGRESO_REALIZADO') setYaEntro(true)
      
      setLoading(false)
      iniciarSensores()
    }
    validarAcceso()
  }, [])

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
        video: { facingMode: "user" }, // CAMBIO AQUÍ: "user" activa la cámara frontal
        audio: false 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraReady(true)
        setStatus('SISTEMA LISTO ✅')
      }
    } catch (err) {
      setStatus('ERROR: Permiso de Cámara frontal ⚠️')
    }
  }

  const capturarYEnviar = async (tipo: 'INGRESO' | 'SALIDA') => {
    if (!gpsReady || !cameraReady) return
    setLoading(true)
    setStatus('Guardando...')

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
        // Guardamos en todas las columnas para asegurar que el reporte lo vea
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
        alert("✅ Ingreso registrado con éxito")
        router.push('/admin/asistencia')
      } else {
        // Actualizamos la misma fila para la salida
        await supabase.from('asistencia').update({ 
          hora_salida: ahoraISO,
          foto_salida: publicUrl,
          ubicacion_salida: coords,
          tipo_registro: 'salida'
        }).eq('empleado_id', session?.user.id).eq('fecha', hoy)

        localStorage.removeItem('asistencia_estado')
        setYaEntro(false)
        alert("✅ Salida registrada con éxito")
        window.location.href = '/admin/dashboard'
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
      <p className="text-[10px] font-black tracking-widest uppercase animate-pulse">{status}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center">
      <h1 className="text-3xl font-black italic mb-2 tracking-tighter">PROACEITES</h1>
      <p className="text-[9px] text-blue-400 font-bold mb-6 tracking-[4px] uppercase">{status}</p>

      <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-[40px] overflow-hidden border-2 border-slate-800 shadow-2xl mb-8">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="w-full max-w-sm space-y-4">
        {!yaEntro ? (
          <button 
            onClick={() => capturarYEnviar('INGRESO')} 
            disabled={!gpsReady || !cameraReady} 
            className="w-full bg-emerald-500 p-8 rounded-[30px] font-black text-xl active:scale-95 transition-all shadow-xl shadow-emerald-500/10 disabled:opacity-30"
          >
            📸 MARCAR ENTRADA
          </button>
        ) : (
          <button 
            onClick={() => capturarYEnviar('SALIDA')} 
            disabled={!gpsReady || !cameraReady} 
            className="w-full bg-rose-500 p-8 rounded-[30px] font-black text-xl active:scale-95 transition-all shadow-xl shadow-rose-500/10 disabled:opacity-30"
          >
            🏁 MARCAR SALIDA
          </button>
        )}
      </div>
    </div>
  )
}