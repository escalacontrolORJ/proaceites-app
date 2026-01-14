'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AsistenciaPage() {
  const [marcaciones, setMarcaciones] = useState([])

  useEffect(() => {
    const fetchAsistencia = async () => {
      // Traemos la asistencia y el nombre del empleado haciendo un 'join'
      const { data, error } = await supabase
        .from('asistencia')
        .select(`
          id,
          fecha,
          hora,
          tipo,
          empleados (nombres)
        `)
        .order('fecha', { ascending: false })
      
      if (error) console.error(error)
      else setMarcaciones(data || [])
    }
    fetchAsistencia()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Control de Marcaciones</h1>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 font-semibold text-slate-600">Empleado</th>
              <th className="p-4 font-semibold text-slate-600">Fecha</th>
              <th className="p-4 font-semibold text-slate-600">Hora</th>
              <th className="p-4 font-semibold text-slate-600">Tipo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {marcaciones.map((m: any) => (
              <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-slate-700">{m.empleados?.nombres || 'Sin nombre'}</td>
                <td className="p-4 text-slate-600">{m.fecha}</td>
                <td className="p-4 text-slate-600">{m.hora}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    m.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {m.tipo?.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}