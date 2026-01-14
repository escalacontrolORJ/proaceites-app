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
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login') // Redirigir al login si no hay sesión
      } else {
        const estadoLocal = localStorage.getItem('asistencia_estado')
        if (estadoLocal === 'INGRESO_REALIZADO') setYaEntro(true)
        setLoading(false)
        iniciarSensores()
      }
    }
    verificarSesion()
  }, [])

  async function iniciarSensores() {
    setStatus('Buscando señal GPS...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords(`${pos.coords.latitude}, ${pos.coords.longitude}`)
        setGpsReady(true)
        setStatus('GPS OK. Iniciando Cámara...')
        activarCamara()
      },
      () => setStatus('ERROR: Activa el GPS ⚠️'),
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }

  async function activarCamara() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraReady(true)
        setStatus('SISTEMA LISTO ✅')
      }
    } catch (err) {
      setStatus('ERROR: Permisos de cámara ⚠️')
    }
  }

  const capturarYEnviar = async (tipo: 'INGRESO' | 'SALIDA') => {
    if (!gpsReady || !cameraReady) return
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
        // IMPORTANTE: Llenamos columnas viejas y nuevas para que el reporte no falle
        await supabase.from('asistencia').insert([{ 
          empleado_id: session?.user.id,
          fecha: hoy,
          hora_ingreso: ahoraISO,
          foto_ingreso: publicUrl,
          ubicacion_ingreso: coords,
          tipo_registro: 'ingreso',
          foto_url: publicUrl, // Para reportes viejos
          geolocalizacion: coords, // Para reportes viejos
          fecha_hora: ahoraISO
        }])
        localStorage.setItem('asistencia_estado', 'INGRESO_REALIZADO')
        setYaEntro(true)
        alert("Ingreso registrado");
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
        alert("Salida registrada")
        window.location.href = '/admin/dashboard'
      }
    } catch (err: any) { alert(err.message) } finally { setLoading(false) }
  }

  if (loading && !gpsReady) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-xs font-black uppercase tracking-widest">{status}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center">
      <h1 className="text-2xl font-black italic mb-2 tracking-tighter">PROACEITES</h1>
      <p className="text-[9px] text-blue-400 font-bold mb-6 tracking-[4px] uppercase">{status}</p>

      <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-[40px] overflow-hidden border-2 border-slate-800 shadow-2xl mb-8">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="w-full max-w-sm space-y-4">
        {!yaEntro ? (
          <button onClick={() => capturarYEnviar('INGRESO')} disabled={!gpsReady} className="w-full bg-emerald-500 p-8 rounded-[30px] font-black text-xl active:scale-95 transition-all shadow-xl shadow-emerald-500/10">📸 ENTRADA</button>
        ) : (
          <button onClick={() => capturarYEnviar('SALIDA')} disabled={!gpsReady} className="w-full bg-rose-500 p-8 rounded-[30px] font-black text-xl active:scale-95 transition-all shadow-xl shadow-rose-500/10">🏁 SALIDA</button>
        )}
      </div>
    </div>
  )
}