'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import dynamic from 'next/dynamic'

// Cargamos el mapa sin SSR para evitar el error de "window is not defined"
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
    inicializarDatos()
  }, [])

  const inicializarDatos = async () => {
    // 1. Cargar Vendedores (Tal cual lo hace tu reporte)
    const { data: emps } = await supabase.from('usuarios').select('*').order('nombre')
    if (emps) setVendedores(emps)

    // 2. Cargar Clientes (Para los puntos verdes)
    const { data: clis } = await supabase.from('clientes').select('*').order('nombre_local')
    if (clis) setPuntosClientes(clis)

    // 3. Cargar las visitas iniciales
    await cargarDatos()
  }

  const cargarDatos = async () => {
    // Usamos la lógica de tu archivo de Reportes: Tabla 'visitas'
    let query = supabase.from('visitas').select('*')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha', { ascending: false })

    if (vendedorId !== 'all') {
      query = query.eq('vendedor_id', vendedorId)
    }

    const { data: visitasData, error } = await query
    
    if (error) {
      console.error("Error cargando visitas:", error)
      return
    }

    if (visitasData) {
      // Mapeamos los datos para el componente de mapa
      const formateados = visitasData.map((v: any) => {
        // Buscamos el nombre del vendedor en nuestra lista local
        const vend = vendedores.find(u => u.id === v.vendedor_id)
        // Buscamos el nombre del cliente en nuestra lista local
        const clie = puntosClientes.find(c => c.id === v.cliente_id)

        return {
          id: v.id,
          geolocalizacion: v.ubicacion_gps,
          fecha_hora: `${v.fecha} ${v.hora}`,
          nombre_vendedor: vend?.nombre || 'Vendedor',
          clientes: { nombre: clie?.nombre_local || 'Cliente' },
          foto: v.foto_local,
          observaciones: v.observaciones
        }
      })
      setPuntosMapa(formateados)
    }
  }

  // Limpiador de coordenadas ultra-seguro
  const parseCoords = (coordString: string): [number, number] | null => {
    if (!coordString) return null
    try {
      const clean = coordString.replace(/[() "]/g, '')
      const parts = clean.split(',')
      if (parts.length < 2) return null
      const lat = parseFloat(parts[0])
      const lng = parseFloat(parts[1])
      if (isNaN(lat) || isNaN(lng)) return null
      return [lat, lng]
    } catch { return null }
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto pb-24 px-2">
      <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 mt-2">
        <h1 className="text-xl font-black uppercase italic tracking-tighter mb-4 text-slate-800">
          📍 Seguimiento Visual
        </h1>
        
        <div className="space-y-3 mb-5">
          <div className="bg-slate-50 p-1 rounded-2xl border border-slate-100">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-3 block">Filtrar por Vendedor</label>
            <select 
              className="w-full p-2 bg-transparent text-xs font-bold outline-none" 
              value={vendedorId} 
              onChange={(e) => setVendedorId(e.target.value)}
            >
              <option value="all">TODOS LOS EMPLEADOS</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 p-1 rounded-2xl border border-slate-100">
              <label className="text-[8px] font-black uppercase text-slate-400 ml-3 block">Desde</label>
              <input type="date" className="w-full p-2 bg-transparent text-xs font-bold outline-none" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div className="bg-slate-50 p-1 rounded-2xl border border-slate-100">
              <label className="text-[8px] font-black uppercase text-slate-400 ml-3 block">Hasta</label>
              <input type="date" className="w-full p-2 bg-transparent text-xs font-bold outline-none" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={cargarDatos} 
            className="flex-[2] bg-blue-600 text-white p-4 rounded-[20px] font-black text-[10px] uppercase shadow-lg shadow-blue-100 active:scale-95 transition-all"
          >
            🔄 Actualizar Mapa
          </button>
          <button 
            onClick={() => setMostrarClientes(!mostrarClientes)} 
            className={`flex-1 p-4 rounded-[20px] font-black text-[10px] uppercase border-2 transition-all ${mostrarClientes ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white text-slate-400 border-slate-100'}`}
          >
            {mostrarClientes ? 'Clientes ON' : 'Clientes OFF'}
          </button>
        </div>
      </div>

      <div className="bg-white p-2 rounded-[40px] shadow-md border border-slate-100 h-[480px] overflow-hidden relative">
        <MapaSinSSR 
          visitas={puntosMapa} 
          puntosClientes={puntosClientes} 
          mostrarClientes={mostrarClientes} 
          parseCoords={parseCoords} 
        />
      </div>

      <div className="flex justify-center">
         <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[9px] font-black uppercase border border-blue-100">
           {puntosMapa.length} Visitas en el mapa
         </span>
      </div>
    </div>
  )
}