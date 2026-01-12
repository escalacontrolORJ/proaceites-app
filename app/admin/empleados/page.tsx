'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ListaEmpleados() {
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [estadosAsistencia, setEstadosAsistencia] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchEmpleados()
  }, [])

  async function fetchEmpleados() {
    setLoading(true)
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .order('nombres', { ascending: true })

    if (!error) {
      setEmpleados(data || [])
      if (data) fetchEstadosAsistencia(data)
    }
    setLoading(false)
  }

  async function fetchEstadosAsistencia(lista: any[]) {
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

  // FUNCIÓN PARA OBTENER GPS
  const obtenerUbicacion = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve("GPS no soportado")
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          resolve(`https://www.google.com/maps?q=${latitude},${longitude}`)
        },
        () => resolve("Ubicación denegada")
      )
    })
  }

  const registrarMarcacion = async (empleado: any, modo: 'ingreso' | 'salida') => {
    setLoading(true)
    const ubicacionGPS = await obtenerUbicacion()
    const ahora = new Date()
    const isoString = ahora.toISOString()

    const { error } = await supabase.from('asistencia').insert([{
      empleado_id: empleado.id,
      nombres: empleado.nombres,
      tipo_registro: modo,
      fecha_hora: isoString,
      fecha: isoString.split('T')[0],
      ubicacion: ubicacionGPS // Guardamos el link de Maps
    }])

    if (!error) {
      alert(`✅ ${modo.toUpperCase()} exitoso`)
      fetchEstadosAsistencia(empleados)
    } else {
      alert("Error: " + error.message)
    }
    setLoading(false)
  }

  const filtrados = empleados.filter(e => 
    (e.nombres || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24 text-black font-sans">
      <div className="max-w-md mx-auto pt-6">
        
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black uppercase text-blue-900 tracking-tighter">Asistencia</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Con Geolocalización activa 📍</p>
          </div>
          <Link href="/admin/empleados/nuevo" className="w-12 h-12 bg-blue-700 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-blue-100">
            +
          </Link>
        </header>

        <div className="mb-6 relative">
          <input 
            type="text" 
            placeholder="Buscar personal..." 
            className="w-full p-4 pl-12 rounded-[20px] border-none shadow-sm text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500" 
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <span className="absolute left-4 top-4 opacity-20 text-lg">🔍</span>
        </div>

        <div className="grid gap-4">
          {loading && <div className="text-center py-4 text-[10px] font-black uppercase text-blue-600 animate-bounce">Procesando...</div>}
          
          {filtrados.map((emp) => {
            const ultimoReg = estadosAsistencia[emp.id]
            const debeMarcarSalida = ultimoReg?.tipo_registro === 'ingreso'

            return (
              <div key={emp.id} className="bg-white p-5 rounded-[30px] shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="font-black text-[13px] uppercase text-gray-800 leading-none">{emp.nombres}</h2>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{emp.rol_empresa || 'Operativo'}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${debeMarcarSalida ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                    {debeMarcarSalida ? '● En turno' : '○ Fuera'}
                  </div>
                </div>

                <button 
                  disabled={loading}
                  onClick={() => registrarMarcacion(emp, debeMarcarSalida ? 'salida' : 'ingreso')}
                  className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase text-white transition-all active:scale-95 shadow-md ${
                    debeMarcarSalida ? 'bg-orange-500' : 'bg-blue-600'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {debeMarcarSalida ? '🔔 Marcar Salida' : '⚡ Marcar Ingreso'}
                </button>

                {ultimoReg && (
                  <div className="mt-3 flex flex-col gap-1 items-center">
                    <p className="text-[8px] font-bold text-gray-300 uppercase">
                      Último: {ultimoReg.tipo_registro} - {new Date(ultimoReg.fecha_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    {ultimoReg.ubicacion && ultimoReg.ubicacion.includes('http') && (
                      <a href={ultimoReg.ubicacion} target="_blank" className="text-[8px] font-black text-blue-400 underline uppercase">Ver mapa anterior 📍</a>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}