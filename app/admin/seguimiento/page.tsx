'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import dynamic from 'next/dynamic'

const MapaSinSSR = dynamic(() => import('./MapaComponente'), { 
  ssr: false,
  loading: () => <div className="h-[500px] w-full flex items-center justify-center bg-slate-100 rounded-[35px] font-black uppercase text-[10px]">Cargando Mapa...</div>
})

export default function SeguimientoPage() {
  const [vendedores, setVendedores] = useState<any[]>([])
  const [puntosClientes, setPuntosClientes] = useState<any[]>([])
  const [puntosMapa, setPuntosMapa] = useState<any[]>([])
  
  const [vendedorId, setVendedorId] = useState('all')
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0])
  const [mostrarClientes, setMostrarClientes] = useState(true)

  useEffect(() => {
    inicializar()
  }, [])

  const inicializar = async () => {
    // 1. Cargar lista de vendedores desde la tabla 'usuarios'
    const { data: v } = await supabase.from('usuarios').select('id, nombre')
    if (v) setVendedores(v)

    // 2. Cargar ubicaciones base de clientes
    const { data: c } = await supabase.from('clientes').select('id, nombre_local, ubicacion_gps')
    if (c) setPuntosClientes(c)

    // 3. Cargar datos iniciales
    await cargarDatos()
  }

  const cargarDatos = async () => {
    // Consulta basada estrictamente en tu CSV de visitas
    let query = supabase.from('visitas').select(`
      id,
      vendedor_id,
      cliente_id,
      fecha,
      hora,
      foto_local,
      ubicacion_gps,
      observaciones,
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
      console.error("Error:", error)
      return
    }

    if (data) {
      const formateados = data.map((v: any) => {
        // Manejo de joins que pueden venir como objeto o array
        const clienteData = Array.isArray(v.clientes) ? v.clientes[0] : v.clientes
        const usuarioData = Array.isArray(v.usuarios) ? v.usuarios[0] : v.usuarios

        return {
          id: v.id,
          geolocalizacion: v.ubicacion_gps,
          fecha_hora: `${v.fecha} ${v.hora}`,
          nombre_vendedor: usuarioData?.nombre || 'Vendedor Desconocido',
          clientes: { nombre: clienteData?.nombre_local || 'Cliente Sin Nombre' },
          foto: v.foto_local,
          notas: v.observaciones
        }
      })
      setPuntosMapa(formateados)
    }
  }

  const parseCoords = (coordString: string): [number, number] | null => {
    if (!coordString) return null
    // Limpia comillas, paréntesis y espacios
    const clean = coordString.replace(/[() "]/g, '')
    const parts = clean.split(',')
    if (parts.length < 2) return null
    const lat = parseFloat(parts[0])
    const lng = parseFloat(parts[1])
    return (isNaN(lat) || isNaN(lng)) ? null : [lat, lng]
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto pb-24 px-4">
      <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 mt-4">
        <h2 className="text-xl font-black uppercase italic tracking-tighter mb-4 text-blue-900">Seguimiento de Visitas</h2>
        
        <div className="space-y-3 mb-5">
          <div className="bg-slate-50 rounded-2xl p-1 px-3 border border-slate-100">
            <label className="text-[8px] font-bold text-slate-400 uppercase">Seleccionar Vendedor</label>
            <select 
              className="w-full bg-transparent text-xs font-bold py-2 outline-none" 
              value={vendedorId} 
              onChange={(e) => setVendedorId(e.target.value)}
            >
              <option value="all">TODOS LOS VENDEDORES</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 rounded-2xl p-1 px-3 border border-slate-100">
              <label className="text-[8px] font-bold text-slate-400 uppercase">Desde</label>
              <input type="date" className="w-full bg-transparent text-xs font-bold py-1" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div className="bg-slate-50 rounded-2xl p-1 px-3 border border-slate-100">
              <label className="text-[8px] font-bold text-slate-400 uppercase">Hasta</label>
              <input type="date" className="w-full bg-transparent text-xs font-bold py-1" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={cargarDatos} className="flex-[2] bg-blue-600 text-white p-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-200 active:scale-95 transition-all">
            Actualizar Mapa
          </button>
          <button onClick={() => setMostrarClientes(!mostrarClientes)} className={`flex-1 p-4 rounded-2xl font-black text-[10px] uppercase border-2 transition-all ${mostrarClientes ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white text-slate-400'}`}>
            Clientes
          </button>
        </div>
      </div>

      <div className="bg-white p-2 rounded-[40px] shadow-md border border-slate-100 h-[450px] overflow-hidden">
        <MapaSinSSR 
          visitas={puntosMapa} 
          puntosClientes={puntosClientes} 
          mostrarClientes={mostrarClientes} 
          parseCoords={parseCoords} 
        />
      </div>

      <div className="text-center">
        <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
           {puntosMapa.length} Visitas Registradas
        </span>
      </div>
    </div>
  )
}