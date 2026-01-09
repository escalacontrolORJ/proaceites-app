'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function ProximasVisitas() {
  const [proximas, setProximas] = useState<any[]>([])
  const hoyStr = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const fetchProximas = async () => {
      const { data } = await supabase
        .from('visitas')
        .select('*, clientes(nombre_comercial, nombre_fiscal, direccion)')
        .not('proxima_visita', 'is', null)
        .order('proxima_visita', { ascending: true })
      
      // Filtrar para mostrar solo la última proxima_visita por cliente
      if (data) setProximas(data)
    }
    fetchProximas()
  }, [])

  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen text-black font-sans">
      <h1 className="text-xl font-black text-blue-900 mb-6 uppercase tracking-tighter pt-6">Agenda de Seguimiento</h1>

      <div className="grid gap-4">
        {proximas.map((v) => {
          const esHoy = v.proxima_visita === hoyStr
          const esPasado = v.proxima_visita < hoyStr

          return (
            <div 
              key={v.id} 
              className={`p-5 rounded-[35px] border-2 shadow-sm transition-all ${
                esHoy ? 'bg-red-50 border-red-200' : esPasado ? 'bg-orange-50 border-orange-100 opacity-70' : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${
                  esHoy ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-100 text-gray-500'
                }`}>
                  {esHoy ? 'VISITAR HOY' : v.proxima_visita}
                </span>
                <span className="text-[10px] font-bold text-gray-400">Vendedor ID: {v.vendedor_id.slice(0,5)}</span>
              </div>

              <h2 className={`font-black uppercase ${esHoy ? 'text-red-900' : 'text-blue-900'}`}>
                {v.clientes?.nombre_comercial || v.clientes?.nombre_fiscal}
              </h2>
              
              <p className="text-xs text-gray-500 mt-1 mb-3">📍 {v.clientes?.direccion || 'Sin dirección'}</p>
              
              <div className="bg-white/50 p-3 rounded-2xl border border-black/5">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Última Observación:</p>
                <p className="text-[11px] italic text-gray-600">"{v.observaciones}"</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}