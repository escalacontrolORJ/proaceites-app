'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import dynamic from 'next/dynamic'

const MapaSinSSR = dynamic(() => import('./MapaComponente'), { 
  ssr: false,
  loading: () => <div className="h-[500px] w-full flex items-center justify-center bg-slate-100 rounded-[35px] font-black uppercase text-[10px] animate-pulse">Cargando Mapa...</div>
})

interface Vendedor { id: string; nombre: string; }
interface ClienteBase { id: string; nombre_local: string; ubicacion_gps: string; }

export default function SeguimientoPage() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [puntosClientes, setPuntosClientes] = useState<ClienteBase[]>([])
  const [puntosMapa, setPuntosMapa] = useState<any[]>([])
  
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
    const { data: c } = await supabase.from('clientes').select('id, nombre_local, ubicacion_gps')
    if (v) setVendedores(v as Vendedor[])
    if (c) setPuntosClientes(c as ClienteBase[])
  }

  const cargarDatos = async () => {
    // Consulta optimizada para evitar el error de TypeScript en el deploy
    let query = supabase.from('visitas').select(`
      id, 
      ubicacion_gps, 
      fecha,
      hora,
      foto_local,
      vendedor_id,
      usuarios:vendedor_id ( nombre ),
      clientes:cliente_id ( nombre_local )
    `)
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)

    if (vendedorId !== 'all') {
      query = query.eq('vendedor_id', vendedorId)
    }

    const { data, error } = await query
    
    if (error) {
      console.error("Error en Visitas:", error)
      return
    }

    if (data) {
      const formateados = data.map((v: any) => {
        // Manejamos si Supabase devuelve el join como objeto o array
        const clienteInfo = Array.isArray(v.clientes) ? v.clientes[0] : v.clientes;
        const usuarioInfo = Array.isArray(v.usuarios) ? v.usuarios[0] : v.usuarios;

        return {
          id: v.id,
          geolocalizacion: v.ubicacion_gps,
          fecha_hora: `${v.fecha} ${v.hora}`,
          usuarios: usuarioInfo,
          clientes: { 
            nombre: clienteInfo?.nombre_local || 'Cliente Sin Nombre' 
          },
          foto: v.foto_local
        }
      })
      setPuntosMapa(formateados)
    }
  }

  const parseCoords = (coordString: string): [number, number] | null => {
    if (!coordString) return null;
    const clean = coordString.replace(/[() ]/g, '');
    const parts = clean.split(',');
    if (parts.length < 2) return null;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) return null;
    return [lat, lng];
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto pb-24">
      <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter mb-4 text-blue-900">Seguimiento</h1>
        
        <div className="space-y-3 mb-5">
          <select 
            className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none" 
            value={vendedorId} 
            onChange={(e) => setVendedorId(e.target.value)}
          >
            <option value="all">TODOS LOS VENDEDORES</option>
            {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={cargarDatos} className="flex-[2] bg-blue-600 text-white p-5 rounded-[25px] font-black text-[10px] uppercase shadow-lg shadow-blue-200">
            🔄 Actualizar
          </button>
          <button onClick={() => setMostrarClientes(!mostrarClientes)} className={`flex-1 p-5 rounded-[25px] font-black text-[10px] uppercase border-2 ${mostrarClientes ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-400'}`}>
            Clientes
          </button>
        </div>
      </div>

      <div className="bg-white p-2 rounded-[40px] shadow-md border border-slate-100 h-[500px] overflow-hidden">
        <MapaSinSSR 
          visitas={puntosMapa} 
          puntosClientes={puntosClientes} 
          mostrarClientes={mostrarClientes} 
          parseCoords={parseCoords} 
        />
      </div>
    </div>
  )
}