'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function ReporteVisitasDia() {
  const [visitas, setVisitas] = useState<any[]>([])
  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const fetchVisitas = async () => {
      const { data } = await supabase
        .from('visitas')
        .select('*, clientes(nombre_comercial, nombre_fiscal)')
        .eq('fecha', hoy)
        .order('hora', { ascending: false })
      if (data) setVisitas(data)
    }
    fetchVisitas()
  }, [])

  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen font-sans text-black">
      <h1 className="text-xl font-black text-blue-900 mb-6 uppercase tracking-tighter pt-6">Visitas de Hoy ({hoy})</h1>
      
      <div className="space-y-4">
        {visitas.map((v) => (
          <div key={v.id} className="bg-white p-4 rounded-[30px] shadow-sm border border-gray-100 flex gap-4">
            <img src={v.foto_local} className="w-20 h-24 object-cover rounded-2xl border" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black px-2 py-1 bg-blue-50 text-blue-600 rounded-lg uppercase">{v.motivo}</span>
                <span className="text-[10px] font-mono text-gray-400">{v.hora.slice(0,5)}</span>
              </div>
              <h3 className="font-bold text-sm mt-1 uppercase">{v.clientes?.nombre_comercial || v.clientes?.nombre_fiscal}</h3>
              <p className="text-blue-700 font-black text-lg mt-1">${v.valor_transaccion}</p>
              <a href={v.ubicacion_gps} target="_blank" className="text-[10px] font-bold text-blue-400 underline">VER UBICACIÓN GPS</a>
            </div>
          </div>
        ))}
        {visitas.length === 0 && <p className="text-center text-gray-400 py-10">No hay visitas registradas hoy.</p>}
      </div>
    </div>
  )
}