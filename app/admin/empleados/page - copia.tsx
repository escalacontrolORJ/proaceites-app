'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function MarcadoAsistencia() {
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [estadosAsistencia, setEstadosAsistencia] = useState<Record<string, any>>({})
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => { fetchEmpleados() }, [])

  async function fetchEmpleados() {
    const { data } = await supabase.from('empleados').select('*').order('nombres')
    if (data) {
      setEmpleados(data)
      fetchUltimosMovimientos(data)
    }
  }

  async function fetchUltimosMovimientos(lista: any[]) {
    const estados: Record<string, any> = {}
    for (const emp of lista) {
      const { data } = await supabase
        .from('asistencia')
        .select('*')
        .eq('empleado_id', emp.id)
        .order('fecha_hora', { ascending: false })
        .limit(1)
        .maybeSingle()
      estados[emp.id] = data || null
    }
    setEstadosAsistencia(estados)
  }

  const registrar = async (empleado: any, tipo: 'ingreso' | 'salida') => {
    setLoading(true)
    const ahora = new Date()
    
    // Lógica de GPS con tiempo de espera corto para que no se quede "colgado"
    let urlMapa = "Ubicación no disponible (Incógnito/Sin permiso)"
    
    try {
      const pos = await new Promise<any>((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 });
      });
      urlMapa = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`
    } catch (e) {
      console.log("No se pudo obtener GPS, procediendo sin ubicación...");
    }

    const { error } = await supabase.from('asistencia').insert([{
      empleado_id: empleado.id,
      nombres: empleado.nombres,
      tipo_registro: tipo,
      fecha_hora: ahora.toISOString(),
      fecha: ahora.toISOString().split('T')[0],
      ubicacion: urlMapa
    }])

    if (!error) {
      alert(`Registrado: ${tipo.toUpperCase()}`);
      await fetchUltimosMovimientos(empleados);
    } else {
      alert("Error de base de datos: " + error.message);
    }
    setLoading(false)
  }

  return (
    <div className="p-4 max-w-md mx-auto bg-white min-h-screen text-black">
      <h1 className="text-xl font-black text-blue-900 uppercase mb-4">Registro Libre</h1>
      
      <input 
        type="text" placeholder="Buscar..." 
        className="w-full p-3 rounded-xl border mb-4 text-sm"
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="space-y-3">
        {empleados.filter(e => e.nombres.toLowerCase().includes(busqueda.toLowerCase())).map(emp => {
          const ultimo = estadosAsistencia[emp.id]
          const esSalida = ultimo?.tipo_registro === 'ingreso'

          return (
            <div key={emp.id} className="p-4 border rounded-2xl shadow-sm bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <p className="font-bold text-sm uppercase">{emp.nombres}</p>
                <span className="text-[9px] bg-white px-2 py-1 rounded border uppercase font-bold text-gray-400">
                  {esSalida ? 'En turno' : 'Fuera'}
                </span>
              </div>
              
              <button 
                disabled={loading}
                onClick={() => registrar(emp, esSalida ? 'salida' : 'ingreso')}
                className={`w-full py-3 rounded-xl font-black text-xs uppercase text-white shadow-md ${
                  esSalida ? 'bg-orange-500' : 'bg-blue-600'
                } ${loading ? 'opacity-50' : ''}`}
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