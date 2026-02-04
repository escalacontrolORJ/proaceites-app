'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'

// 1. Definimos las "Interfaces" para que TypeScript sepa qué datos manejamos
interface Vendedor {
  id: string;
  nombre: string;
}

interface Cliente {
  id: string;
  nombre: string;
  ubicacion_gps: string;
}

interface Visita {
  id: string;
  geolocalizacion: string;
  fecha_hora: string;
  clientes: { nombre: string } | null;
  usuarios: { nombre: string } | null;
}

const containerStyle = { width: '100%', height: 'calc(100vh - 320px)', borderRadius: '24px' }
const center = { lat: -0.1807, lng: -78.4678 } 

export default function SeguimientoPage() {
  // 2. Especificamos los tipos en los useState para evitar el error de compilación
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [puntosClientes, setPuntosClientes] = useState<Cliente[]>([])
  const [visitas, setVisitas] = useState<Visita[]>([])
  
  const [vendedorId, setVendedorId] = useState('all')
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0])
  const [mostrarClientes, setMostrarClientes] = useState(true)
  const [selectedMarker, setSelectedMarker] = useState<Visita | null>(null)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "TU_API_KEY_AQUI" // Asegúrate de poner tu clave real
  })

  useEffect(() => {
    fetchFiltros()
    cargarDatos()
  }, [])

  const fetchFiltros = async () => {
    const { data: v } = await supabase.from('usuarios').select('id, nombre')
    const { data: c } = await supabase.from('clientes').select('id, nombre, ubicacion_gps')
    
    // Aquí es donde daba el error; ahora TypeScript sabe que 'v' es un array de Vendedores
    if (v) setVendedores(v as Vendedor[])
    if (c) setPuntosClientes(c as Cliente[])
  }

  const cargarDatos = async () => {
    let query = supabase.from('visitas').select(`
      id, geolocalizacion, fecha_hora,
      clientes (nombre),
      usuarios (nombre)
    `)
    .gte('fecha_hora', `${fechaInicio}T00:00:00`)
    .lte('fecha_hora', `${fechaFin}T23:59:59`)

    if (vendedorId !== 'all') {
      query = query.eq('empleado_id', vendedorId) // Ajustado a 'empleado_id' según tu DB
    }

    const { data } = await query
    if (data) setVisitas(data as unknown as Visita[])
  }

  const parseCoords = (coordString: string) => {
    if (!coordString) return null
    const parts = coordString.replace(/[()]/g, '').split(',')
    if (parts.length < 2) return null
    return { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) }
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100">
        <h1 className="text-xl font-black uppercase italic tracking-tighter mb-4 text-slate-900">Seguimiento Real</h1>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Seleccionar Vendedor</label>
            <select 
              className="w-full p-3 bg-slate-50 rounded-2xl text-xs font-bold border-none focus:ring-2 focus:ring-blue-500"
              value={vendedorId}
              onChange={(e) => setVendedorId(e.target.value)}
            >
              <option value="all">TODOS LOS VENDEDORES</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>
          
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Desde</label>
            <input type="date" className="w-full p-3 bg-slate-50 rounded-2xl text-xs font-bold border-none" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Hasta</label>
            <input type="date" className="w-full p-3 bg-slate-50 rounded-2xl text-xs font-bold border-none" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={cargarDatos} className="flex-[2] bg-blue-600 text-white p-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-200">Actualizar Mapa</button>
          <button 
            onClick={() => setMostrarClientes(!mostrarClientes)} 
            className={`flex-1 p-4 rounded-2xl font-black text-[10px] uppercase border-2 transition-all ${mostrarClientes ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
          >
            {mostrarClientes ? 'Clientes: ON' : 'Clientes: OFF'}
          </button>
        </div>
      </div>

      <div className="bg-white p-2 rounded-[35px] shadow-sm border border-slate-100 overflow-hidden relative">
        {isLoaded ? (
          <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13} options={{ styles: mapStyles }}>
            
            {/* Marcadores de VISITAS (Azules) */}
            {visitas.map((visita) => {
              const pos = parseCoords(visita.geolocalizacion)
              return pos && (
                <Marker 
                  key={visita.id} 
                  position={pos} 
                  label={{ text: "📍", fontSize: "20px" }}
                  onClick={() => setSelectedMarker(visita)}
                />
              )
            })}

            {/* Marcadores de CLIENTES BASE (Verdes) */}
            {mostrarClientes && puntosClientes.map((cliente) => {
              const pos = parseCoords(cliente.ubicacion_gps)
              return pos && (
                <Marker 
                  key={`cli-${cliente.id}`} 
                  position={pos} 
                  icon={{
                    url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                  }}
                  opacity={0.5}
                />
              )
            })}

            {selectedMarker && (
              <InfoWindow 
                position={parseCoords(selectedMarker.geolocalizacion)!} 
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2 min-w-[120px]">
                  <p className="font-black text-[9px] uppercase text-blue-600 mb-1">Visita Confirmada</p>
                  <p className="font-bold text-xs text-slate-800">{selectedMarker.clientes?.nombre || 'Cliente s/n'}</p>
                  <p className="text-[9px] font-bold text-slate-500 mt-1">{selectedMarker.usuarios?.nombre}</p>
                  <p className="text-[8px] text-slate-400 italic">{new Date(selectedMarker.fecha_hora).toLocaleString()}</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : <div className="h-[400px] flex items-center justify-center font-black uppercase text-[10px] tracking-widest animate-pulse">Cargando Mapa...</div>}
      </div>
    </div>
  )
}

// Estilo visual del mapa (más limpio)
const mapStyles = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] }
]