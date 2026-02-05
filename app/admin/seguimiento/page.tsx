'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import dynamic from 'next/dynamic'

// Solución al error de Prerender/window is not defined
const MapaSinSSR = dynamic(() => import('./MapaComponente'), { 
  ssr: false,
  loading: () => <div className="h-[500px] w-full flex items-center justify-center bg-slate-100 rounded-[35px] font-black uppercase text-[10px]">Cargando Mapa...</div>
})

export default function SeguimientoPage() {
  const [vendedores, setVendedores] = useState<any[]>([])
  const [puntosClientes, setPuntosClientes] = useState<any[]>([])
  const [puntosMapa, setPuntosMapa] = useState<any[]>([])
  
  // Usamos 'filtroEmpleado' para ser consistentes con tu archivo de reportes
  const [vendedorId, setVendedorId] = useState('')
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0])
  
  const [mostrarClientes, setMostrarClientes] = useState(true)
  const [mostrarVisitas, setMostrarVisitas] = useState(true)

  useEffect(() => {
    inicializarDatos()
  }, [])

  async function inicializarDatos() {
    // AJUSTE REALIZADO: Ahora consulta la tabla 'empleados' para el selector
    const { data: emps } = await supabase.from('empleados').select('*').order('nombre')
    if (emps) setVendedores(emps)

    // 2. Cargar Clientes
    const { data: clis } = await supabase.from('clientes').select('*').order('nombre_local')
    if (clis) setPuntosClientes(clis)

    await cargarDatos()
  }

  async function cargarDatos() {
    // Usamos la tabla 'visitas' y los campos que verificamos en el CSV y Reporte
    let query = supabase.from('visitas').select('*')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)

    if (vendedorId !== '' && vendedorId !== 'all') {
      query = query.eq('vendedor_id', vendedorId)
    }

    const { data: visitasData } = await query
    
    if (visitasData) {
      const formateados = visitasData.map((v: any) => {
// ... (resto del código igual hasta cargarDatos)

  async function cargarDatos() {
    let query = supabase.from('visitas').select('*')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)

    if (vendedorId !== '' && vendedorId !== 'all') {
      query = query.eq('vendedor_id', vendedorId)
    }

    const { data: visitasData } = await query
    
    if (visitasData) {
      // Función simple para generar un color basado en el texto
      const generarColor = (texto: string) => {
        const colores = ['blue', 'red', 'orange', 'gold', 'violet', 'black', 'grey'];
        let hash = 0;
        for (let i = 0; i < texto.length; i++) {
          hash = texto.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colores[Math.abs(hash) % colores.length];
      };

      const formateados = visitasData.map((v: any) => {
        const vend = vendedores.find(u => u.id === v.vendedor_id)
        const clie = puntosClientes.find(c => c.id === v.cliente_id)
        const nombreVend = vend?.nombres || 'Vendedor'; // Usamos 'nombres' según tu tabla empleados
        
        return {
          id: v.id,
          geolocalizacion: v.ubicacion_gps,
          fecha_hora: `${v.fecha} ${v.hora}`,
          nombre_vendedor: nombreVend,
          nombre_cliente: clie?.nombre_local || 'Cliente Visitado',
          foto: v.foto_local,
          color: generarColor(nombreVend) // <--- ASIGNAMOS EL COLOR AQUÍ
        }
      })
      setPuntosMapa(formateados)
    }
  }

// ... (resto del código igual)
        // Buscamos nombres en las listas cargadas (como hace tu reporte)
        const vend = vendedores.find(u => u.id === v.vendedor_id)
        const clie = puntosClientes.find(c => c.id === v.cliente_id)
        return {
          id: v.id,
          geolocalizacion: v.ubicacion_gps,
          fecha_hora: `${v.fecha} ${v.hora}`,
          nombre_vendedor: vend?.nombre || 'Empleado',
          nombre_cliente: clie?.nombre_local || 'Cliente Visitado',
          foto: v.foto_local
        }
      })
      setPuntosMapa(formateados)
    }
  }

  const parseCoords = (coordString: string): [number, number] | null => {
    if (!coordString) return null
    const clean = coordString.replace(/[() "]/g, '')
    const parts = clean.split(',')
    if (parts.length < 2) return null
    const lat = parseFloat(parts[0])
    const lng = parseFloat(parts[1])
    return (isNaN(lat) || isNaN(lng)) ? null : [lat, lng]
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto pb-24 px-2">
      <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 mt-2">
        <h1 className="text-xl font-black uppercase italic tracking-tighter mb-4 text-slate-800 text-center">
          Monitor de Seguimiento
        </h1>
        
        <div className="space-y-3 mb-5">
          <div className="bg-slate-50 p-1 px-3 rounded-2xl border border-slate-100">
            <label className="text-[8px] font-black text-slate-400 uppercase">Vendedor</label>
            <select 
              className="w-full bg-transparent text-xs font-bold py-1 outline-none" 
              value={vendedorId} 
              onChange={(e) => setVendedorId(e.target.value)}
            >
              <option value="">TODOS LOS VENDEDORES</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>{v.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="bg-slate-50 p-3 rounded-2xl text-xs font-bold border-none" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            <input type="date" className="bg-slate-50 p-3 rounded-2xl text-xs font-bold border-none" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setMostrarVisitas(!mostrarVisitas)} className={`p-3 rounded-xl font-black text-[9px] uppercase border-2 transition-all ${mostrarVisitas ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white text-slate-400 border-slate-100'}`}>
            Visitas: {mostrarVisitas ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => setMostrarClientes(!mostrarClientes)} className={`p-3 rounded-xl font-black text-[9px] uppercase border-2 transition-all ${mostrarClientes ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white text-slate-400 border-slate-100'}`}>
            Clientes: {mostrarClientes ? 'ON' : 'OFF'}
          </button>
          <button onClick={cargarDatos} className="col-span-2 bg-slate-900 text-white p-4 rounded-2xl font-black text-[10px] uppercase shadow-xl active:scale-95 transition-all mt-1">
            🔄 Actualizar Mapa
          </button>
        </div>
      </div>

      <div className="bg-white p-2 rounded-[40px] shadow-md border border-slate-100 h-[480px] overflow-hidden">
        <MapaSinSSR 
          visitas={mostrarVisitas ? puntosMapa : []} 
          puntosClientes={mostrarClientes ? puntosClientes : []} 
          parseCoords={parseCoords} 
        />
      </div>

      <div className="flex justify-center mt-2">
         <span className="bg-blue-50 text-blue-600 px-6 py-2 rounded-full text-[10px] font-black uppercase border border-blue-100 shadow-sm">
           {puntosMapa.length} Visitas en el periodo
         </span>
      </div>
    </div>
  )
}