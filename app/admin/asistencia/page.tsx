'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function VisitaClientePage() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [ubicacionOk, setUbicacionOk] = useState(false)
  const [errorGps, setErrorGps] = useState('Iniciando GPS...')
  
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
    const { data } = await supabase.from('clientes').select('*').order('nombre_local')
    if (data) setClientes(data)
  }

  function activarGPS() {
    if (!("geolocation" in navigator)) {
      setErrorGps("Tu celular no soporta GPS o el navegador es muy antiguo.")
      return
    }

    const opciones = {
      enableHighAccuracy: true, // Fuerza el uso de satélites (más preciso)
      timeout: 10000,           // Espera máximo 10 segundos
      maximumAge: 0             // No usar ubicación guardada vieja
    }

    setErrorGps("Solicitando acceso al GPS...")

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude},${pos.coords.longitude}`
        setForm(prev => ({ ...prev, ubicacion: coords }))
        setUbicacionOk(true)
        setErrorGps("GPS Conectado ✅")
      },
      (error) => {
        console.error(error)
        let mensaje = "Error desconocido"
        if (error.code === 1) mensaje = "Permiso denegado. Debes activar el GPS en el navegador."
        if (error.code === 2) mensaje = "Señal de GPS no disponible."
        if (error.code === 3) mensaje = "Tiempo de espera agotado buscando señal."
        
        setErrorGps(`❌ ${mensaje}`)
        setUbicacionOk(false)
      },
      opciones
    )
  }

  // Lógica de foto y guardado igual a la anterior...
  // (Mantén el resto de funciones manejarFoto y guardarVisita)
  
  return (
    <div className="pb-24 max-w-md mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-black text-blue-900 uppercase">Visita a Cliente</h1>
      </header>

      {/* Indicador de GPS con botón de reintento */}
      <div className={`mb-6 p-4 rounded-2xl border-2 flex flex-col items-center gap-2 ${
        ubicacionOk ? 'bg-green-50 border-green-200 text-green-700' : 'bg-orange-50 border-orange-200 text-orange-700'
      }`}>
        <p className="text-[11px] font-black uppercase tracking-tighter text-center">
          {errorGps}
        </p>
        {!ubicacionOk && (
          <button 
            type="button"
            onClick={activarGPS}
            className="bg-orange-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md active:scale-90"
          >
            🔄 Reintentar Conexión GPS
          </button>
        )}
      </div>

      {/* Resto del formulario... */}
    </div>
  )
}