'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AsistenciaPage() {
  const [marcas, setMarcas] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('asistencia').select('*, empleados(nombres)').order('fecha', {ascending: false})
      setMarcas(data || [])
    }
    load()
  }, [])

  return (
    <div className="pb-10">
      <header className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Actividad</h1>
        <p className="text-sm text-gray-500">Registros de asistencia hoy</p>
      </header>

      <div className="grid gap-4">
        {marcas.map((m) => (
          <div key={m.id} className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${m.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
              {m.tipo === 'entrada' ? '📍' : '🚗'}
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 text-base">{m.empleados?.nombres || 'Empleado'}</h3>
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                <span>{m.hora}</span>
                <span>•</span>
                <span className="uppercase tracking-wider">{m.fecha}</span>
              </div>
            </div>

            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${m.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
              {m.tipo}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}