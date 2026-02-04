'use client'
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'

export default function ClientesPage() {
  const [loading, setLoading] = useState(false)
  const [gpsReady, setGpsReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre_local: '',
    nombre_fiscal: '',
    propietario: '',
    direccion: '',
    ubicacion_gps: '',
    foto_local: ''
  })

  useEffect(() => {
    iniciarCamaraYGps()
  }, [])

  async function iniciarCamaraYGps() {
    // 1. Iniciar GPS
    navigator.geolocation.watchPosition(
      (pos) => {
        setNuevoCliente(prev => ({...prev, ubicacion_gps: `${pos.coords.latitude}, ${pos.coords.longitude}`}))
        setGpsReady(true)
      },
      (err) => console.error("Error GPS", err),
      { enableHighAccuracy: true }
    )

    // 2. Iniciar Cámara Trasera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { exact: "environment" } } 
      }).catch(() => navigator.mediaDevices.getUserMedia({ video: true }))
      
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) { console.error("Error Cámara", err) }
  }

  async function crearCliente(e: React.FormEvent) {
    e.preventDefault()
    if (!gpsReady) return alert("Esperando señal GPS...")
    setLoading(true)

    try {
      // Capturar foto del canvas
      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video) return
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0)
      
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.7))
      if (!blob) return

      const fileName = `local_${Date.now()}.jpg`
      const { data: uploadData } = await supabase.storage
        .from('fotos_asistencia')
        .upload(`fotos_locales/${fileName}`, blob)

      const { data: { publicUrl } } = supabase.storage
        .from('fotos_asistencia')
        .getPublicUrl(`fotos_locales/${fileName}`)

      // Guardar en DB con foto y GPS
      const { error } = await supabase.from('clientes').insert([{
        ...nuevoCliente,
        foto_local: publicUrl,
        fecha_creacion: new Date().toISOString().split('T')[0]
      }])

      if (error) throw error
      alert("Cliente creado con éxito")
      window.location.reload()
    } catch (err) {
      alert("Error al guardar")
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />
      <main className="p-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-black italic uppercase mb-6">Nuevo Cliente Georreferenciado</h1>
        
        {/* Preview de Cámara */}
        <div className="relative aspect-video bg-black rounded-3xl overflow-hidden mb-4 border-4 border-white shadow-xl">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-4 left-4">
             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${gpsReady ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white animate-pulse'}`}>
               {gpsReady ? '📍 GPS Activo' : '🛰️ Buscando Satélites...'}
             </span>
          </div>
        </div>

        <form onSubmit={crearCliente} className="space-y-4">
          <input placeholder="Nombre del Local" required className="w-full p-4 rounded-2xl border-none shadow-sm font-bold" value={nuevoCliente.nombre_local} onChange={e => setNuevoCliente({...nuevoCliente, nombre_local: e.target.value})} />
          <input placeholder="RUC / Nombre Fiscal" className="w-full p-4 rounded-2xl border-none shadow-sm font-bold" value={nuevoCliente.nombre_fiscal} onChange={e => setNuevoCliente({...nuevoCliente, nombre_fiscal: e.target.value})} />
          <input placeholder="Propietario" required className="w-full p-4 rounded-2xl border-none shadow-sm font-bold" value={nuevoCliente.propietario} onChange={e => setNuevoCliente({...nuevoCliente, propietario: e.target.value})} />
          <textarea placeholder="Dirección Exacta" required className="w-full p-4 rounded-2xl border-none shadow-sm font-bold" value={nuevoCliente.direccion} onChange={e => setNuevoCliente({...nuevoCliente, direccion: e.target.value})} />
          
          <button 
            type="submit" 
            disabled={loading || !gpsReady}
            className="w-full p-6 bg-blue-600 text-white rounded-[30px] font-black uppercase text-lg shadow-xl disabled:bg-slate-300"
          >
            {loading ? 'Guardando...' : 'Registrar Cliente y Ubicación'}
          </button>
        </form>
      </main>
    </div>
  )
}