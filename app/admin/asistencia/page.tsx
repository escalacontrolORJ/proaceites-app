'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function VisitaClientePage() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [ubicacionOk, setUbicacionOk] = useState(false)
  const [errorGps, setErrorGps] = useState('')
  
  const [form, setForm] = useState({
    cliente_id: '',
    motivo: 'Venta',
    recaudo: '',
    observaciones: '',
    ubicacion: '',
    foto_url: ''
  })

  useEffect(() => {
    fetchClientes()
    activarGPS()
  }, [])

  async function fetchClientes() {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre_local', { ascending: true })
    if (data) setClientes(data)
  }

  // OBLIGAR AL GPS
  function activarGPS() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coordenadas = `${pos.coords.latitude},${pos.coords.longitude}`
          setForm(prev => ({ ...prev, ubicacion: coordenadas }))
          setUbicacionOk(true)
          setErrorGps('')
        },
        (error) => {
          console.error(error)
          setErrorGps("Debes activar el GPS para registrar la visita.")
          setUbicacionOk(false)
        },
        { enableHighAccuracy: true }
      )
    } else {
      setErrorGps("Tu navegador no soporta GPS.")
    }
  }

  // MANEJAR LA CÁMARA Y SUBIR AL BUCKET
  async function manejarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
      const filePath = `fotos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('imagenes_visitas')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Obtener URL Pública
      const { data: { publicUrl } } = supabase.storage
        .from('imagenes_visitas')
        .getPublicUrl(filePath)

      setForm(prev => ({ ...prev, foto_url: publicUrl }))
    } catch (err: any) {
      alert('Error al procesar foto: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function guardarVisita(e: React.FormEvent) {
    e.preventDefault()
    
    if (!ubicacionOk) {
      alert("No podemos guardar sin tu ubicación GPS.")
      return activarGPS()
    }

    if (!form.foto_url) {
      alert("Es obligatorio tomar una foto del local.")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('visitas')
        .insert([{
          id: crypto.randomUUID(),
          cliente_id: form.cliente_id,
          motivo: form.motivo,
          recaudo: form.recaudo ? parseFloat(form.recaudo) : 0,
          observaciones: form.observaciones,
          ubicacion: form.ubicacion,
          foto_url: form.foto_url,
          fecha: new Date().toISOString()
        }])

      if (error) throw error

      alert('✅ Visita registrada correctamente.')
      // Limpiar formulario
      setForm({
        cliente_id: '',
        motivo: 'Venta',
        recaudo: '',
        observaciones: '',
        ubicacion: form.ubicacion, // Mantenemos el GPS para el siguiente
        foto_url: ''
      })
      window.location.reload()

    } catch (err: any) {
      alert('Error al guardar visita: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pb-24 max-w-md mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-black text-blue-900 uppercase">Visita a Cliente</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Control GPS y Foto</p>
      </header>

      {/* Estado del GPS */}
      <div className={`mb-6 p-4 rounded-2xl flex items-center justify-between border ${
        ubicacionOk ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{ubicacionOk ? '📍' : '❌'}</span>
          <div>
            <p className={`text-[11px] font-black uppercase ${ubicacionOk ? 'text-green-600' : 'text-red-600'}`}>
              {ubicacionOk ? 'GPS Conectado' : 'GPS Desconectado'}
            </p>
            <p className="text-[9px] text-slate-500 font-bold">{form.ubicacion || 'Buscando satélites...'}</p>
          </div>
        </div>
        {!ubicacionOk && (
          <button onClick={activarGPS} className="text-[10px] bg-red-600 text-white px-3 py-1 rounded-lg font-black uppercase">Reintentar</button>
        )}
      </div>

      <form onSubmit={guardarVisita} className="space-y-4">
        {/* Selector de Cliente */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Seleccionar Cliente</label>
          <select 
            required
            className="w-full p-4 bg-white rounded-2xl border border-slate-200 outline-none focus:ring-2 ring-blue-500 font-bold text-slate-800"
            value={form.cliente_id}
            onChange={e => setForm({...form, cliente_id: e.target.value})}
          >
            <option value="">-- Elige un local --</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre_local}</option>
            ))}
          </select>
        </div>

        {/* Motivo */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Motivo de Visita</label>
          <select 
            className="w-full p-4 bg-white rounded-2xl border border-slate-200 outline-none font-bold text-slate-800"
            value={form.motivo}
            onChange={e => setForm({...form, motivo: e.target.value})}
          >
            <option value="Venta">💰 Venta Realizada</option>
            <option value="Cobro">💵 Recaudo de Dinero</option>
            <option value="Visita">📋 Visita de Rutina</option>
            <option value="Cerrado">🚫 Local Cerrado</option>
          </select>
        </div>

        {/* Cámara */}
        <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
          {form.foto_url ? (
            <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-slate-100">
              <img src={form.foto_url} alt="Captura" className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={() => setForm({...form, foto_url: ''})}
                className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full"
              >✕</button>
            </div>
          ) : (
            <>
              <div className="text-3xl mb-2">📸</div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-4">La foto es obligatoria</p>
              <label className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] cursor-pointer active:scale-95 transition-all">
                Capturar Local
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" // Fuerza cámara trasera
                  className="hidden" 
                  required
                  onChange={manejarFoto}
                />
              </label>
            </>
          )}
        </div>

        {/* Recaudo */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Efectivo Recaudado ($)</label>
          <input 
            type="number" step="0.01"
            placeholder="0.00"
            className="w-full p-4 bg-white rounded-2xl border border-slate-200 outline-none font-bold text-slate-800"
            value={form.recaudo}
            onChange={e => setForm({...form, recaudo: e.target.value})}
          />
        </div>

        {/* Observaciones */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Observaciones</label>
          <textarea 
            className="w-full p-4 bg-white rounded-2xl border border-slate-200 outline-none font-bold text-slate-800 min-h-[80px]"
            placeholder="Detalles de la visita..."
            value={form.observaciones}
            onChange={e => setForm({...form, observaciones: e.target.value})}
          />
        </div>

        <button 
          type="submit"
          disabled={loading || !ubicacionOk}
          className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl shadow-xl uppercase tracking-widest disabled:bg-slate-300 transition-all active:scale-95"
        >
          {loading ? 'Subiendo Información...' : 'Finalizar y Guardar'}
        </button>
      </form>
    </div>
  )
}