'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../../../lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'

export default function EditarCliente() {
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [form, setForm] = useState<any>({ 
    nombre_fiscal: '', nombre_comercial: '', ruc: '', direccion: '', observaciones: '' 
  })
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nuevaFoto, setNuevaFoto] = useState<string | null>(null)

  useEffect(() => {
    fetchCliente()
  }, [id])

  async function fetchCliente() {
    const { data } = await supabase.from('clientes').select('*').eq('id', id).single()
    if (data) {
      setForm(data)
      setLoading(false)
    }
  }

  const iniciarCamara = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    if (videoRef.current) videoRef.current.srcObject = stream
  }

  const actualizarCliente = async (e: any) => {
    e.preventDefault()
    setUpdating(true)

    let fotoFinal = form.foto_local
    if (videoRef.current && videoRef.current.srcObject) {
      const context = canvasRef.current?.getContext('2d')
      canvasRef.current!.width = videoRef.current.videoWidth
      canvasRef.current!.height = videoRef.current.videoHeight
      context?.drawImage(videoRef.current, 0, 0)
      fotoFinal = canvasRef.current?.toDataURL('image/jpeg', 0.5)
    }

    const { error } = await supabase.from('clientes').update({
      ...form,
      foto_local: fotoFinal
    }).eq('id', id)

    if (error) alert(error.message)
    else {
      alert("✅ Cliente actualizado")
      router.back()
    }
    setUpdating(false)
  }

  if (loading) return <div className="p-10 text-center font-black">CARGANDO...</div>

  return (
    <div className="p-6 pb-24 bg-white min-h-screen text-black font-sans">
      <h1 className="text-xl font-black mb-6 uppercase text-blue-900">Editar Cliente</h1>
      
      <form onSubmit={actualizarCliente} className="space-y-4">
        {/* Vista previa / Cámara */}
        <div className="w-full h-44 bg-gray-100 rounded-3xl overflow-hidden mb-2 relative border-2 border-dashed border-gray-300">
          {!nuevaFoto && !videoRef.current?.srcObject ? (
             <img src={form.foto_local} className="w-full h-full object-cover" />
          ) : (
             <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          )}
          <canvas ref={canvasRef} className="hidden" />
          <button 
            type="button"
            onClick={iniciarCamara}
            className="absolute bottom-2 right-2 bg-black/50 text-white text-[9px] p-2 rounded-xl font-bold backdrop-blur-md"
          >
            🔄 CAMBIAR FOTO
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Datos Principales</label>
          <input placeholder="RUC" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" value={form.ruc} onChange={e => setForm({...form, ruc: e.target.value})} />
          <input placeholder="Nombre Fiscal" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" value={form.nombre_fiscal} onChange={e => setForm({...form, nombre_fiscal: e.target.value})} />
          <input placeholder="Dirección" className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} />
          <textarea placeholder="Observaciones" className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm h-24" value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} />
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={updating} className="flex-1 py-4 bg-blue-700 text-white rounded-2xl font-black shadow-lg uppercase">
            {updating ? 'Guardando...' : 'Actualizar'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase">
            X
          </button>
        </div>
      </form>
    </div>
  )
}