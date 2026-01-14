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
    <div className="space-y-6">
      <h1 className="text-xl font-black text-slate-800">MARCACIONES HOY</h1>
      <div className="space-y-3">
        {marcas.map(m => (
          <div key={m.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center shadow-sm">
            <div>
              <p className="font-bold text-slate-800 text-sm">{m.empleados?.nombres || 'Empleado'}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                {m.fecha} — {m.hora}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
              m.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {m.tipo}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}