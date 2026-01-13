'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ListaEmpleados() {
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [estadosAsistencia, setEstadosAsistencia] = useState<Record<string, any>>({})

  useEffect(() => { fetchEmpleados() }, [])

  async function fetchEmpleados() {
    const { data } = await supabase.from('empleados').select('*').order('nombres', { ascending: true })
    if (data) {
      setEmpleados(data)
      fetchEstadosAsistencia(data)
    }
  }

  async function fetchEstadosAsistencia(lista: any[]) {
    const hoy = new Date().toISOString().split('T')[0]
    const estados: Record<string, any> = {}
    for (const emp of lista) {
      const { data } = await supabase
        .from('asistencia')
        .select('*')
        .eq('empleado_id', emp.id)
        .eq('fecha', hoy)
        .order('fecha_hora', { ascending: false })
        .limit(1).maybeSingle()
      estados[emp.id] = data || null
    }
    setEstadosAsistencia(estados)
  }

  const registrarAsistencia = async (empleado: any, tipo: 'ingreso' | 'salida') => {
    setLoading(true)
    
    // 1. Intentar obtener GPS real
    let urlMapa = "Ubicación no disponible"
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => 
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      )
      urlMapa = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`
    } catch (e) { console.error("Error GPS:", e) }

    const ahora = new Date()

    // 2. Guardar en la base de datos
    const { error } = await supabase.from('asistencia').insert([{
      empleado_id: empleado.id,
      nombres: empleado.nombres, // IMPORTANTE: Enviamos el nombre explícitamente
      tipo_registro: tipo,
      fecha_hora: ahora.toISOString(),
      fecha: ahora.toISOString().split('T')[0],
      ubicacion: urlMapa,
      foto_url: null // Aquí puedes integrar tu lógica de cámara después
    }])

    if (error) {
      alert("Error al guardar: " + error.message)
    } else {
      alert(`${tipo.toUpperCase()} registrado correctamente`)
      fetchEstadosAsistencia(empleados)
    }
    setLoading(false)
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-black">
      <h1 className="text-2xl font-black mb-6 uppercase text-blue-900">Registro de Asistencia</h1>
      <div className="grid gap-4">
        {empleados.map(emp => {
          const ultimo = estadosAsistencia[emp.id]
          const esSalida = ultimo?.tipo_registro === 'ingreso'

          return (
            <div key={emp.id} className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-black uppercase text-sm">{emp.nombres}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{emp.rol_empresa}</p>
              </div>
              <button 
                disabled={loading}
                onClick={() => registrarAsistencia(emp, esSalida ? 'salida' : 'ingreso')}
                className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase text-white ${esSalida ? 'bg-orange-500' : 'bg-blue-600'}`}
              >
                {loading ? 'Procesando...' : esSalida ? 'Marcar Salida' : 'Marcar Ingreso'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}