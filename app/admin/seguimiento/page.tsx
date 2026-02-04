'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'

// Configuración del mapa
const containerStyle = { width: '100%', height: 'calc(100vh - 250px)', borderRadius: '20px' }
const center = { lat: -0.1807, lng: -78.4678 } // Ajusta a tu ciudad por defecto

export default function SeguimientoPage() {
  const [vendedores, setVendedores] = useState([])
  const [clientes, setClientes] = useState([])
  const [visitas, setVisitas] = useState([])
  const [puntosClientes, setPuntosClientes] = useState([])
  
  // Filtros
  const [vendedorId, setVendedorId] = useState('all')
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0])
  const [mostrarClientes, setMostrarClientes] = useState(true)

  const [selectedMarker, setSelectedMarker] = useState(null)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "TU_API_KEY_DE_GOOGLE_MAPS_AQUI"
  })

  useEffect(() => {
    fetchFiltros()
    cargarDatos()
  }, [])

  const fetchFiltros = async () => {
    const { data: v } = await supabase.from('usuarios').select('id, nombre')
    const { data: c } = await supabase.from('clientes').select('id, nombre, ubicacion_gps')
    if (v) setVendedores(v)
    if (c) setPuntosClientes(c)
  }

  const cargarDatos = async () => {
    let query = supabase.from('visitas').select(`
      *,
      clientes (nombre),
      usuarios (nombre)
    `)
    .gte('fecha_hora', `${fechaInicio}T00:00:00`)
    .lte('fecha_hora', `${fechaFin}T23:59:59`)

    if (vendedorId !== 'all') {
      query = query.eq('vendedor_id', vendedorId)
    }

    const { data, error } = await query
    if (data) setVisitas(data)
  }

  // Función para extraer lat/lng de strings tipo "(lat, lng)"
  const parseCoords = (coordString) => {
    if (!coordString) return null
    const parts = coordString.replace(/[()]/g, '').split(',')
    return { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-xl font-black uppercase italic mb-4">Mapa de Seguimiento</h1>
        
        {/* FILTROS */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="col-span-2">
            <label className="text-[10px] font-bold uppercase text-slate-400 ml-2">Vendedor</label>
            <select 
              className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold"
              value={vendedorId}
              onChange={(e) => setVendedorId(e.target.value)}
            >
              <option value="all">Todos los vendedores</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>
          
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 ml-2">Desde</label>
            <input type="date" className="w-full p-3 bg-slate-50 rounded-xl text-xs" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 ml-2">Hasta</label>
            <input type="date" className="w-full p-3 bg-slate-50 rounded-xl text-xs" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={cargarDatos} className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-black text-[10px] uppercase">Filtrar Visitas</button>
          <button 
            onClick={() => setMostrarClientes(!mostrarClientes)} 
            className={`flex-1 p-3 rounded-xl font-black text-[10px] uppercase border ${mostrarClientes ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400'}`}
          >
            {mostrarClientes ? 'Ver Clientes: ON' : 'Ver Clientes: OFF'}
          </button>
        </div>
      </div>

      {/* MAPA */}
      <div className="bg-white p-2 rounded-[30px] shadow-inner border border-slate-100 overflow-hidden">
        {isLoaded ? (
          <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
            
            {/* Marcadores de Visitas Realizadas (Rojo/Azul) */}
            {visitas.map((visita) => {
              const pos = parseCoords(visita.geolocalizacion)
              return pos && (
                <Marker 
                  key={visita.id} 
                  position={pos} 
                  icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                  onClick={() => setSelectedMarker(visita)}
                />
              )
            })}

            {/* Marcadores de Ubicación Base de Clientes (Verde) */}
            {mostrarClientes && puntosClientes.map((cliente) => {
              const pos = parseCoords(cliente.ubicacion_gps)
              return pos && (
                <Marker 
                  key={`cli-${cliente.id}`} 
                  position={pos} 
                  icon="http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                  opacity={0.6}
                />
              )
            })}

            {selectedMarker && (
              <InfoWindow 
                position={parseCoords(selectedMarker.geolocalizacion)} 
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2 text-slate-800">
                  <p className="font-black text-[10px] uppercase text-blue-600">{selectedMarker.usuarios?.nombre}</p>
                  <p className="font-bold text-xs">{selectedMarker.clientes?.nombre}</p>
                  <p className="text-[9px] text-slate-400">{new Date(selectedMarker.fecha_hora).toLocaleString()}</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : <div className="h-[400px] flex items-center justify-center font-black uppercase text-xs">Cargando Mapa...</div>}
      </div>

      {/* Leyenda rápida */}
      <div className="flex justify-center gap-4 text-[9px] font-black uppercase text-slate-400">
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Visita</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Cliente Base</div>
      </div>
    </div>
  )
}