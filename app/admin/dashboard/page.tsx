'use client'
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)
  const [gpsReady, setGpsReady] = useState(false)
  const [coords, setCoords] = useState('')
  const [yaEntro, setYaEntro] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()

  useEffect(() => {
    const estadoLocal = localStorage.getItem('asistencia_estado')
    if (estadoLocal === 'INGRESO_REALIZADO') setYaEntro(true)
    iniciarSensores()
  }, [])

  async function iniciarSensores() {
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords(`${pos.coords.latitude}, ${pos.coords.longitude}`); setGpsReady(true); },
      () => alert("Activa el GPS"),
      { enableHighAccuracy: true }
    )
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) { console.error(err) }
  }

  const capturarYEnviar = async (tipo: 'INGRESO' | 'SALIDA') => {
    if (!gpsReady || !videoRef.current) return
    setLoading(true)

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas!.width = video.videoWidth
      canvas!.height = video.videoHeight
      canvas!.getContext('2d')?.drawImage(video, 0, 0)
      const blob = await new Promise<Blob | null>(res => canvas!.toBlob(res, 'image/jpeg', 0.7))
      if (!blob) return

      const fileName = `${Date.now()}_${tipo}.jpg`
      await supabase.storage.from('fotos_asistencia').upload(fileName, blob)
      const { data: { publicUrl } } = supabase.storage.from('fotos_asistencia').getPublicUrl(fileName)

      const { data: { session } } = await supabase.auth.getSession()
      const hoy = new Date().toISOString().split('T')[0]

      if (tipo === 'INGRESO') {
        // CREAR REGISTRO NUEVO CON DATOS DE INGRESO
        await supabase.from('asistencia').insert([{ 
          empleado_id: session?.user.id,
          fecha: hoy,
          hora_ingreso: new Date().toLocaleTimeString(),
          foto_ingreso: publicUrl,
          ubicacion_ingreso: coords,
          tipo_registro: 'completo'
        }])
        localStorage.setItem('asistencia_estado', 'INGRESO_REALIZADO')
        setYaEntro(true)
        alert("Ingreso registrado");
        router.push('/admin/asistencia')
      } else {
        // ACTUALIZAR EL REGISTRO DE HOY CON DATOS DE SALIDA
        await supabase.from('asistencia')
          .update({ 
            hora_salida: new Date().toLocaleTimeString(),
            foto_salida: publicUrl,
            ubicacion_salida: coords
          })
          .eq('empleado_id', session?.user.id)
          .eq('fecha', hoy)

        localStorage.removeItem('asistencia_estado')
        setYaEntro(false)
        alert("Salida registrada");
        window.location.reload()
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center">
      <h1 className="text-3xl font-black italic mb-4">PROACEITES</h1>
      
      <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-[30px] overflow-hidden border-2 border-slate-800 mb-6">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black ${gpsReady ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}>
          GPS {gpsReady ? 'LISTO' : 'BUSCANDO'}
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {!yaEntro ? (
          <button onClick={() => capturarYEnviar('INGRESO')} disabled={loading || !gpsReady} className="w-full bg-emerald-500 p-6 rounded-2xl font-black uppercase text-xl disabled:opacity-20">
            {loading ? '...' : '📸 Iniciar Jornada'}
          </button>
        ) : (
          <button onClick={() => capturarYEnviar('SALIDA')} disabled={loading || !gpsReady} className="w-full bg-rose-500 p-6 rounded-2xl font-black uppercase text-xl disabled:opacity-20">
            {loading ? '...' : '🏁 Finalizar Jornada'}
          </button>
        )}
      </div>
    </div>
  )
}