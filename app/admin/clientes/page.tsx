'use client'
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [gpsReady, setGpsReady] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [clienteForm, setClienteForm] = useState({
    nombre_local: '',
    nombre_fiscal: '',
    propietario: '',
    direccion: '',
    ciudad: '', // CAMBIO: Nuevo campo ciudad
    ubicacion_gps: '',
    foto_local: ''
  })

  useEffect(() => {
    fetchClientes()
  }, [])

  useEffect(() => {
    if (mostrarModal) {
      iniciarCamaraYGps()
    } else {
      detenerCamara()
    }
  }, [mostrarModal])

  async function fetchClientes() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre_local', { ascending: true })
      if (error) throw error
      setClientes(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function iniciarCamaraYGps() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setClienteForm(prev => ({...prev, ubicacion_gps: `${pos.coords.latitude}, ${pos.coords.longitude}`}))
        setGpsReady(true)
      },
      (err) => console.error("Error GPS", err),
      { enableHighAccuracy: true }
    )

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { exact: "environment" } } 
      }).catch(() => {
        return navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      })
      
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) {
      console.error("Error Cámara", err)
    }
  }

  function detenerCamara() {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }

  async function guardarCliente(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    try {
      let fotoUrl = clienteForm.foto_local

      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current
        const canvas = canvasRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d')?.drawImage(video, 0, 0)
        
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.7))
        if (blob) {
          const fileName = `cliente_${Date.now()}.jpg`
          const { error: uploadError } = await supabase.storage
            .from('fotos_asistencia')
            .upload(fileName, blob)
          
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('fotos_asistencia')
              .getPublicUrl(fileName)
            fotoUrl = publicUrl
          }
        }
      }

      const datos = { ...clienteForm, foto_local: fotoUrl }

      if (editandoId) {
        await supabase.from('clientes').update(datos).eq('id', editandoId)
      } else {
        await supabase.from('clientes').insert([datos])
      }

      setMostrarModal(false)
      fetchClientes()
      setClienteForm({ nombre_local: '', nombre_fiscal: '', propietario: '', direccion: '', ciudad: '', ubicacion_gps: '', foto_local: '' })
      setEditandoId(null)
    } catch (err) {
      console.error(err)
    } finally {
      setGuardando(false)
    }
  }

  const eliminarCliente = async (id: string) => {
    if (!confirm('¿Eliminar este cliente?')) return
    await supabase.from('clientes').delete().eq('id', id)
    fetchClientes()
  }

  const clientesFiltrados = clientes.filter(c => 
    c.nombre_local?.toLowerCase().includes(filtro.toLowerCase()) ||
    c.nombre_fiscal?.toLowerCase().includes(filtro.toLowerCase()) ||
    c.ciudad?.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <AdminNav />
      
      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Panel de Control</p>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Clientes</h1>
          </div>
          <button 
            onClick={() => { setEditandoId(null); setMostrarModal(true); }}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all"
          >
            + Nuevo Cliente
          </button>
        </div>

        <div className="relative">
          <input 
            type="text"
            placeholder="Buscar por nombre, RUC o ciudad..."
            className="w-full p-5 bg-white rounded-[25px] shadow-sm border-none outline-none font-bold text-sm"
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-20 animate-pulse font-black uppercase text-xs text-slate-400">Cargando base de datos...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientesFiltrados.map(c => (
              <div key={c.id} className="bg-white p-5 rounded-[35px] shadow-sm flex items-center justify-between border border-transparent hover:border-blue-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-50">
                    {c.foto_local ? (
                      <img src={c.foto_local} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">📍</div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black uppercase text-sm leading-tight">{c.nombre_local || 'Sin Nombre'}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {c.ciudad ? `${c.ciudad} | ` : ''}{c.nombre_fiscal || 'Sin RUC'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditandoId(c.id); setClienteForm(c); setMostrarModal(true); }} className="p-3 bg-slate-50 rounded-xl hover:bg-blue-50 text-blue-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => eliminarCliente(c.id)} className="p-3 bg-slate-50 rounded-xl hover:bg-red-50 text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {mostrarModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[45px] shadow-2xl overflow-hidden p-8 space-y-6">
              <header>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">{editandoId ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{gpsReady ? '🛰️ Ubicación Obtenida' : '📡 Buscando satélites...'}</p>
              </header>

              <div className="relative aspect-video bg-black rounded-[30px] overflow-hidden border-4 border-slate-50 shadow-inner">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute top-3 right-3">
                  <div className={`w-3 h-3 rounded-full ${gpsReady ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-red-500 animate-pulse'}`}></div>
                </div>
              </div>

              <form onSubmit={guardarCliente} className="space-y-3">
                <input placeholder="Nombre Comercial" required className="w-full p-4 bg-slate-100 rounded-2xl border-none font-bold text-sm" value={clienteForm.nombre_local} onChange={e => setClienteForm({...clienteForm, nombre_local: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-2">
                   <input placeholder="Nombre Fiscal / RUC" className="w-full p-4 bg-slate-100 rounded-2xl border-none font-bold text-sm" value={clienteForm.nombre_fiscal} onChange={e => setClienteForm({...clienteForm, nombre_fiscal: e.target.value})} />
                   <input placeholder="Ciudad" required className="w-full p-4 bg-slate-100 rounded-2xl border-none font-bold text-sm" value={clienteForm.ciudad} onChange={e => setClienteForm({...clienteForm, ciudad: e.target.value})} />
                </div>

                <input placeholder="Propietario" required className="w-full p-4 bg-slate-100 rounded-2xl border-none font-bold text-sm" value={clienteForm.propietario} onChange={e => setClienteForm({...clienteForm, propietario: e.target.value})} />
                <textarea placeholder="Dirección" required className="w-full p-4 bg-slate-100 rounded-2xl border-none font-bold text-sm h-20" value={clienteForm.direccion} onChange={e => setClienteForm({...clienteForm, direccion: e.target.value})} />
                
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 p-4 font-black uppercase text-xs text-slate-400">Cancelar</button>
                  <button type="submit" disabled={guardando} className="flex-[2] p-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-sm shadow-lg disabled:bg-slate-300">
                    {guardando ? 'Procesando...' : 'Confirmar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}