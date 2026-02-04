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
      }).catch(() => navigator.mediaDevices.getUserMedia({ video: true }))
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) { console.error("Error Cámara", err) }
  }

  function detenerCamara() {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
    }
  }

  const abrirEditar = (cliente: any) => {
    setEditandoId(cliente.id)
    setClienteForm({
      nombre_local: cliente.nombre_local || '',
      nombre_fiscal: cliente.nombre_fiscal || '',
      propietario: cliente.propietario || '',
      direccion: cliente.direccion || '',
      ubicacion_gps: cliente.ubicacion_gps || '',
      foto_local: cliente.foto_local || ''
    })
    setMostrarModal(true)
  }

  async function guardarCliente(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)

    try {
      let urlFoto = clienteForm.foto_local

      // Solo tomamos foto nueva si la cámara está activa y detectamos movimiento (opcional)
      const canvas = canvasRef.current
      const video = videoRef.current
      if (canvas && video && video.readyState === 4) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d')?.drawImage(video, 0, 0)
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.7))
        if (blob) {
          const fileName = `local_${Date.now()}.jpg`
          await supabase.storage.from('fotos_asistencia').upload(`fotos_locales/${fileName}`, blob)
          const { data: { publicUrl } } = supabase.storage.from('fotos_asistencia').getPublicUrl(`fotos_locales/${fileName}`)
          urlFoto = publicUrl
        }
      }

      const datosFinales = {
        ...clienteForm,
        foto_local: urlFoto,
        fecha_creacion: new Date().toISOString().split('T')[0]
      }

      if (editandoId) {
        const { error } = await supabase.from('clientes').update(datosFinales).eq('id', editandoId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('clientes').insert([datosFinales])
        if (error) throw error
      }

      setMostrarModal(false)
      setEditandoId(null)
      fetchClientes()
      alert(editandoId ? "Actualizado" : "Guardado")
    } catch (err) {
      alert("Error al procesar")
    } finally { setGuardando(false) }
  }

  async function eliminarCliente(id: string) {
    if (!confirm("¿Seguro que deseas eliminar este cliente?")) return
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) alert("Error")
    else fetchClientes()
  }

  const clientesFiltrados = clientes.filter(c => 
    c.nombre_local?.toLowerCase().includes(filtro.toLowerCase()) || 
    c.nombre_fiscal?.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />
      <main className="p-4 max-w-4xl mx-auto pb-24">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter text-slate-800">Clientes</h1>
          <button onClick={() => { setEditandoId(null); setClienteForm({nombre_local:'', nombre_fiscal:'', propietario:'', direccion:'', ubicacion_gps:'', foto_local:''}); setMostrarModal(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg">
            + Nuevo
          </button>
        </div>

        <input type="text" placeholder="Buscar por nombre..." className="w-full p-4 rounded-2xl border-none shadow-sm mb-6 font-bold" value={filtro} onChange={(e) => setFiltro(e.target.value)} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientesFiltrados.map((c) => (
            <div key={c.id} className="bg-white p-4 rounded-[30px] shadow-sm border border-slate-100 flex items-center gap-4">
              <img src={c.foto_local || 'https://via.placeholder.com/100'} className="w-16 h-16 rounded-2xl object-cover bg-slate-100" />
              <div className="flex-1">
                <h3 className="font-black text-slate-800 uppercase text-xs">{c.nombre_local || c.nombre_fiscal}</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase">{c.propietario}</p>
                <div className="flex gap-3 mt-2">
                  <button onClick={() => abrirEditar(c)} className="text-[9px] font-black text-blue-600 uppercase">Editar</button>
                  <button onClick={() => eliminarCliente(c.id)} className="text-[9px] font-black text-rose-500 uppercase">Borrar</button>
                  {c.ubicacion_gps && <button onClick={() => window.open(`https://www.google.com/maps?q=${c.ubicacion_gps}`, '_blank')} className="text-[9px] font-black text-emerald-600 uppercase">Mapa</button>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {mostrarModal && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[40px] p-6 max-h-[95vh] overflow-y-auto">
              <h2 className="text-xl font-black uppercase italic mb-4 text-center">{editandoId ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              
              <div className="relative aspect-video bg-black rounded-3xl overflow-hidden mb-4 border-2 border-slate-100">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${gpsReady ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white animate-pulse'}`}>
                    {gpsReady ? '📍 GPS OK' : '🛰️ Buscando...'}
                  </span>
                </div>
              </div>

              <form onSubmit={guardarCliente} className="space-y-3">
                <input placeholder="Nombre Comercial" required className="w-full p-4 bg-slate-100 rounded-2xl border-none font-bold text-sm" value={clienteForm.nombre_local} onChange={e => setClienteForm({...clienteForm, nombre_local: e.target.value})} />
                <input placeholder="Nombre Fiscal / RUC" className="w-full p-4 bg-slate-100 rounded-2xl border-none font-bold text-sm" value={clienteForm.nombre_fiscal} onChange={e => setClienteForm({...clienteForm, nombre_fiscal: e.target.value})} />
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