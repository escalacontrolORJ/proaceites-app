'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function CrearCliente() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [ubicacion, setUbicacion] = useState<string>('')
  const [form, setForm] = useState({ 
    nombre_fiscal: '', 
    nombre_comercial: '', 
    ruc: '', 
    direccion: '', 
    observaciones: '' 
  })
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    iniciarCamara()
    obtenerUbicacion()
  }, [])

  const iniciarCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      })
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) {
      console.error("Error al acceder a la cámara:", err)
    }
  }

  const obtenerUbicacion = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUbicacion(`https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`)
      })
    }
  }

  const guardarCliente = async (e: any) => {
    e.preventDefault()
    setLoading(true)

    // Capturar foto del canvas
    const context = canvasRef.current?.getContext('2d')
    if (canvasRef.current && videoRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      context?.drawImage(videoRef.current, 0, 0)
    }
    const fotoBase64 = canvasRef.current?.toDataURL('image/jpeg', 0.5)

    const { error } = await supabase.from('clientes').insert([{
      ...form,
      foto_local: fotoBase64,
      ubicacion_gps: ubicacion,
      fecha_creacion: new Date().toISOString().split('T')[0]
    }])

    if (error) {
      alert("Error al guardar: " + error.message)
    } else {
      alert("✅ Cliente y fachada registrados con éxito")
      router.push('/admin/reportes')
    }
    setLoading(false)
  }

  return (
    <div className="p-6 pb-24 bg-white min-h-screen text-black font-sans">
      <h1 className="text-xl font-black mb-6 uppercase text-blue-900 tracking-tighter">Alta de Nuevo Cliente</h1>
      
      {/* Previsualización de Cámara */}
      <div className="w-full h-48 bg-black rounded-[30px] overflow-hidden mb-6 border-4 border-gray-100 shadow-lg relative">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute bottom-2 right-4 bg-blue-600 text-[8px] text-white px-2 py-1 rounded-full font-bold uppercase">
          Fachada en vivo
        </div>
      </div>

      <form onSubmit={guardarCliente} className="space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <input 
            placeholder="RUC / Cédula" 
            className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
            onChange={e => setForm({...form, ruc: e.target.value})} 
            required 
          />
          <input 
            placeholder="Nombre Fiscal" 
            className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
            onChange={e => setForm({...form, nombre_fiscal: e.target.value})} 
            required 
          />
          <input 
            placeholder="Nombre Comercial" 
            className="w-full p-4 bg-gray-50 rounded-2xl border-none" 
            onChange={e => setForm({...form, nombre_comercial: e.target.value})} 
          />
          <input 
            placeholder="Dirección Manual" 
            className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm" 
            onChange={e => setForm({...form, direccion: e.target.value})} 
          />
          <textarea 
            placeholder="Observaciones del cliente..." 
            className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm h-24" 
            onChange={e => setForm({...form, observaciones: e.target.value})} 
          />
        </div>

        <div className="p-4 bg-blue-50 rounded-2xl mb-4">
          <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Ubicación GPS Detectada</p>
          <p className="text-[10px] font-mono text-blue-800 truncate">{ubicacion || 'Obteniendo GPS...'}</p>
        </div>

        <button 
          type="submit" 
          disabled={loading || !ubicacion}
          className="w-full py-5 bg-blue-700 text-white rounded-[25px] font-black shadow-xl uppercase active:scale-95 transition-all disabled:bg-gray-300"
        >
          {loading ? 'Guardando...' : 'Registrar Cliente'}
        </button>
      </form>
    </div>
  )
}