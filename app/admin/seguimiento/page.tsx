'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import dynamic from 'next/dynamic'

// ESTO ES LO MÁS IMPORTANTE: Carga el mapa solo en el cliente
const MapaSinSSR = dynamic(() => import('./MapaComponente'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-[25px] font-black uppercase text-[10px] tracking-widest animate-pulse">Cargando Mapa...</div>
})

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
      {/* SECCIÓN DE FILTROS (Igual que antes) */}
      <div className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100">
        <h1 className="text-xl font-black uppercase italic mb-4">Seguimiento</h1>
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
          <button onClick={() => setMostrarClientes(!mostrarClientes)} className={`flex-1 p-4 rounded-2xl font-black text-[10px] uppercase border-2 ${mostrarClientes ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-slate-100 text-slate-400'}`}>
            Clientes
          </button>
        </div>
      </div>

      {/* CONTENEDOR DEL MAPA DINÁMICO */}
      <div className="bg-white p-2 rounded-[35px] shadow-sm border border-slate-100 overflow-hidden h-[500px] z-0">
        <MapaSinSSR 
          visitas={visitas} 
          puntosClientes={puntosClientes} 
          mostrarClientes={mostrarClientes} 
          parseCoords={parseCoords} 
        />
      </div>
    </div>
  )
}