'use client'
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)
  const [gpsReady, setGpsReady] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [coords, setCoords] = useState('')
  const [yaEntro, setYaEntro] = useState(false)
  const [status, setStatus] = useState('Iniciando sensores...')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()

  useEffect(() => {
    // 1. Revisar estado local
    const estadoLocal = localStorage.getItem('asistencia_estado')
    if (estadoLocal === 'INGRESO_REALIZADO') setYaEntro(true)
    
    // 2. Iniciar sensores con un pequeño delay para asegurar que el DOM esté listo
    const timer = setTimeout(() => {
      iniciarSensores()
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  async function iniciarSensores() {
    setStatus('Buscando GPS...')
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords(`${pos.coords.latitude}, ${pos.coords.longitude}`)
          setGpsReady(true)
          setStatus('GPS OK. Iniciando Cámara...')
          activarCamara()
        },
        (err) => {
          setStatus('Error: Activa GPS y Recarga ⚠️')
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }

  async function activarCamara() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" }, 
        audio: false 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraReady(true)
        setStatus('SISTEMA LISTO ✅')
      }
    } catch (err) {
      setStatus('Error Cámara: Revisa Permisos ⚠️')
    }
  }

  const capturarYEnviar = async (tipo: 'INGRESO' | 'SALIDA') => {
    if (!gpsReady || !cameraReady) return
    setLoading(true)
    setStatus('Guardando...')

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video) return
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0)
      
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.6))
      if (!blob) return

      const fileName = `${Date.now()}_${tipo}.jpg`
      const { error: upErr } = await supabase.storage.from('fotos_asistencia').upload(fileName, blob)
      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from('fotos_asistencia').getPublicUrl(fileName)
      const { data: { session } } = await supabase.auth.getSession()
      
      const hoy = new Date().toISOString().split('T')[0]
      const ahoraISO = new Date().toISOString()

      if (tipo === 'INGRESO') {
        // GUARDAMOS EN TODAS LAS COLUMNAS PARA QUE EL REPORTE NO FALLE
        const { error: dbError } = await supabase.from('asistencia').insert([{ 
          empleado_id: session?.user.id,
          fecha: hoy,
          hora_ingreso: ahoraISO,
          foto_ingreso: publicUrl,
          ubicacion_ingreso: coords,
          // Columnas viejas para el reporte actual:
          foto: publicUrl, 
          foto_url: publicUrl,
          geolocalizacion: coords,
          tipo_registro: 'ingreso',
          fecha_hora: ahoraISO
        }])

        if (dbError) throw dbError
        localStorage.setItem('asistencia_estado', 'INGRESO_REALIZADO')
        setYaEntro(true)
        alert("Ingreso OK")
        router.push('/admin/asistencia')
      } else {
        // ACTUALIZAMOS EL REGISTRO DE HOY
        const { error: dbError } = await supabase.from('asistencia')
          .update({ 
            hora_salida: ahoraISO,
            foto_salida: publicUrl,
            ubicacion_salida: coords,
            // Actualizamos columnas viejas también para el reporte
            tipo_registro: 'salida'
          })
          .eq('empleado_id', session?.user.id)
          .eq('fecha', hoy)

        if (dbError) throw dbError
        localStorage.removeItem('asistencia_estado')
        setYaEntro(false)
        alert("Salida OK. Jornada terminada.")
        window.location.href = '/admin/dashboard' // Refresco total para evitar bloqueo de sensores
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 flex flex-col items-center">
      <h1 className="text-3xl font-black italic mb-2 tracking-tighter">PROACEITES</h1>
      <p className="text-[10px] text-blue-400 font-bold mb-4 uppercase">{status}</p>

      <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-[30px] overflow-hidden border-2 border-slate-800 mb-6">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="w-full max-w-sm space-y-4">
        {!yaEntro ? (
          <button 
            onClick={() => capturarYEnviar('INGRESO')}
            disabled={!gpsReady || !cameraReady || loading}
            className="w-full bg-emerald-600 p-8 rounded-[30px] font-black uppercase text-xl disabled:opacity-20 active:scale-95 transition-all shadow-xl shadow-emerald-900/20"
          >
            {loading ? '...' : '📸 Iniciar Jornada'}
          </button>
        ) : (
          <button 
            onClick={() => capturarYEnviar('SALIDA')}
            disabled={!gpsReady || !cameraReady || loading}
            className="w-full bg-rose-600 p-8 rounded-[30px] font-black uppercase text-xl disabled:opacity-20 active:scale-95 transition-all shadow-xl shadow-rose-900/20"
          >
            {loading ? '...' : '🏁 Finalizar Jornada'}
          </button>
        )}
      </div>

      {yaEntro && (
        <button onClick={() => router.push('/admin/asistencia')} className="mt-8 text-blue-400 font-bold uppercase text-[10px] tracking-widest border-b border-blue-400/20">
          Gestionar Clientes →
        </button>
      )}
    </div>
  )
}