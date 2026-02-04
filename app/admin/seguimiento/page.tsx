'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Corrección para que se vean los iconos de los marcadores en Leaflet
const iconVisita = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const iconCliente = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Vendedor { id: string; nombre: string; }
interface Cliente { id: string; nombre: string; ubicacion_gps: string; }
interface Visita {
  id: string;
  geolocalizacion: string;
  fecha_hora: string;
  clientes: { nombre: string } | null;
  usuarios: { nombre: string } | null;
}

export default function SeguimientoPage() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [puntosClientes, setPuntosClientes] = useState<Cliente[]>([])
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [vendedorId, setVendedorId] = useState('all')
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0])
  const [mostrarClientes, setMostrarClientes] = useState(true)

  useEffect(() => {
    fetchFiltros()
    cargarDatos()
  }, [])

  const fetchFiltros = async () => {
    const { data: v } = await supabase.from('usuarios').select('id, nombre')
    const { data: c } = await supabase.from('clientes').select('id, nombre, ubicacion_gps')
    if (v) setVendedores(v as Vendedor[])
    if (c) setPuntosClientes(c as Cliente[])
  }

  const cargarDatos = async () => {
    let query = supabase.from('asistencia').select(`
      id, geolocalizacion, fecha_hora,
      clientes (nombre),
      usuarios (nombre)
    `)
    .gte('fecha_hora', `${fechaInicio}T00:00:00`)
    .lte('fecha_hora', `${fechaFin}T23:59:59`)

    if (vendedorId !== 'all') {
      query = query.eq('empleado_id', vendedorId)
    }

    const { data } = await query
    if (data) setVisitas(data as unknown as Visita[])
  }

  const parseCoords = (coordString: string): [number, number] | null => {
    if (!coordString) return null
    const parts = coordString.replace(/[()]/g, '').split(',')
    if (parts.length < 2) return null
    return [parseFloat(parts[0]), parseFloat(parts[1])]
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100">
        <h1 className="text-xl font-black uppercase italic mb-4">Seguimiento (Gratis)</h1>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="col-span-2">
            <select className="w-full p-3 bg-slate-50 rounded-2xl text-xs font-bold" value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
              <option value="all">TODOS LOS VENDEDORES</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>
          <input type="date" className="p-3 bg-slate-50 rounded-2xl text-xs font-bold" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          <input type="date" className="p-3 bg-slate-50 rounded-2xl text-xs font-bold" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={cargarDatos} className="flex-[2] bg-blue-600 text-white p-4 rounded-2xl font-black text-[10px] uppercase">Actualizar</button>
          <button onClick={() => setMostrarClientes(!mostrarClientes)} className={`flex-1 p-4 rounded-2xl font-black text-[10px] uppercase border-2 ${mostrarClientes ? 'bg-emerald-500 text-white' : 'bg-white'}`}>
            Clientes
          </button>
        </div>
      </div>

      <div className="bg-white p-2 rounded-[35px] shadow-sm border border-slate-100 overflow-hidden h-[500px] z-0">
        <MapContainer center={[-0.1807, -78.4678]} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '25px' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {visitas.map((visita) => {
            const pos = parseCoords(visita.geolocalizacion)
            return pos && (
              <Marker key={visita.id} position={pos} icon={iconVisita}>
                <Popup>
                  <div className="text-xs">
                    <p className="font-black text-blue-600 uppercase">Visita</p>
                    <p className="font-bold">{visita.clientes?.nombre}</p>
                    <p>{visita.usuarios?.nombre}</p>
                    <p className="text-slate-400">{new Date(visita.fecha_hora).toLocaleString()}</p>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {mostrarClientes && puntosClientes.map((cliente) => {
            const pos = parseCoords(cliente.ubicacion_gps)
            return pos && (
              <Marker key={`cli-${cliente.id}`} position={pos} icon={iconCliente}>
                <Popup>
                  <p className="font-bold">Cliente Base: {cliente.nombre}</p>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}