'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ListaEmpleados() {
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [estadosAsistencia, setEstadosAsistencia] = useState<Record<string, any>>({})

  useEffect(() => { fetchEmpleados() }, [])

  async function fetchEmpleados() {
    const { data } = await supabase.from('empleados').select('*').order('nombres')
    if (data) {
      setEmpleados(data)
      fetchEstadosAsistencia(data)
    }
  }

  async function fetchEstadosAsistencia(lista: any[]) {
    const hoy = new Date().toISOString().split('T')[0]
    for (const emp of lista) {
      const { data } = await supabase
        .from('asistencia')
        .select('*')
        .eq('empleado_id', emp.id)
        .eq('fecha', hoy)
        .order('fecha_hora', { ascending: false })
        .limit(1).maybeSingle()
      setEstadosAsistencia(prev => ({ ...prev, [emp.id]: data }))
    }
  }

  const registrarAsistencia = async (empleado: any, tipo: 'ingreso' | 'salida') => {
    setLoading(true)
    const ahora = new Date()
    
    // Obtenemos GPS
    let geo = "Ubicación no disponible"
    try {
      const p: any = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej))
      geo = `https://www.google.com/maps?q=${p.coords.latitude},${p.coords.longitude}`
    } catch (e) {}

    // INSERTANDO CON TODOS LOS CAMPOS QUE FALTABAN
    const { error } = await supabase.from('asistencia').insert([{
      empleado_id: empleado.id,
      nombres: empleado.nombres, // <--- ESTO ASEGURA QUE NO SALGA VACÍO
      tipo_registro: tipo,      // <--- ESTO ES LO QUE NO SE ESTABA GUARDANDO
      fecha_hora: ahora.toISOString(),
      fecha: ahora.toISOString().split('T')[0],
      ubicacion: geo
    }])

    if (!error) {
      alert("Registro guardado con éxito")
      fetchEmpleados()
    }
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-gray-50 min-h-screen text-black">
      <h1 className="text-xl font-black uppercase text-blue-900 mb-6">Marcado de Personal</h1>
      <div className="grid gap-4">
        {empleados.map(emp => {
          const ultimo = estadosAsistencia[emp.id]
          const esSalida = ultimo?.tipo_registro === 'ingreso'
          return (
            <div key={emp.id} className="bg-white p-5 rounded-[25px] shadow-sm border border-gray-100 flex justify-between items-center">
              <span className="font-bold text-xs uppercase">{emp.nombres}</span>
              <button 
                onClick={() => registrarAsistencia(emp, esSalida ? 'salida' : 'ingreso')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase text-white ${esSalida ? 'bg-orange-500' : 'bg-blue-600'}`}
              >
                {esSalida ? 'Marcar Salida' : 'Marcar Ingreso'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}