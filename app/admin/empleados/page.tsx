'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function MarcadoAsistencia() {
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [estadosAsistencia, setEstadosAsistencia] = useState<Record<string, any>>({})
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetchEmpleados()
  }, [])

  async function fetchEmpleados() {
    const { data } = await supabase.from('empleados').select('*').order('nombres')
    if (data) {
      setEmpleados(data)
      fetchUltimosMovimientos(data)
    }
  }

  // Buscamos el ÚLTIMO registro absoluto (sin importar la fecha) para saber qué botón mostrar
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
    
    // Captura de GPS para el reporte
    let urlMapa = "Sin GPS"
    try {
      const pos: any = await new Promise((res, rej) => 
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      )
      urlMapa = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`
    } catch (e) { console.log("GPS no disponible") }

    const { error } = await supabase.from('asistencia').insert([{
      empleado_id: empleado.id,
      nombres: empleado.nombres,
      tipo_registro: tipo,
      fecha_hora: ahora.toISOString(),
      fecha: ahora.toISOString().split('T')[0],
      ubicacion: urlMapa
    }])

    if (!error) {
      alert(`✅ ${tipo.toUpperCase()} registrado para ${empleado.nombres}`)
      await fetchUltimosMovimientos(empleados) // Actualizar botones
    } else {
      alert("Error: " + error.message)
    }
    setLoading(false)
  }

  const filtrados = empleados.filter(e => e.nombres.toLowerCase().includes(busqueda.toLowerCase()))

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-black font-sans">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-black text-blue-900 uppercase mb-2 tracking-tighter">Panel de Marcado</h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase mb-6">Modo Pruebas: Múltiples registros permitidos</p>

        <input 
          type="text" 
          placeholder="Buscar empleado..." 
          className="w-full p-4 rounded-2xl border-none shadow-sm mb-6 text-sm"
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <div className="grid gap-4">
          {filtrados.map(emp => {
            const ultimo = estadosAsistencia[emp.id]
            // Si el último fue ingreso, mostramos salida. En cualquier otro caso, ingreso.
            const esSalida = ultimo?.tipo_registro === 'ingreso'

            return (
              <div key={emp.id} className="bg-white p-5 rounded-[30px] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="font-black text-sm uppercase">{emp.nombres}</h2>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">{emp.rol_empresa}</p>
                  </div>
                  <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase ${esSalida ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {esSalida ? 'En Turno' : 'Fuera'}
                  </span>
                </div>

                <button 
                  disabled={loading}
                  onClick={() => registrar(emp, esSalida ? 'salida' : 'ingreso')}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase text-white shadow-lg transition-transform active:scale-95 ${
                    esSalida ? 'bg-orange-500 shadow-orange-100' : 'bg-blue-600 shadow-blue-100'
                  }`}
                >
                  {loading ? 'Cargando...' : esSalida ? '🔔 Marcar Salida' : '⚡ Marcar Ingreso'}
                </button>
                
                {ultimo && (
                  <p className="text-center text-[8px] mt-3 text-gray-300 font-bold uppercase">
                    Último: {ultimo.tipo_registro} - {new Date(ultimo.fecha_hora).toLocaleTimeString()}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}