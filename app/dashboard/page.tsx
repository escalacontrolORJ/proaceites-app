'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardMarcado() {
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

  // BUSCA EL ÚLTIMO REGISTRO HISTÓRICO (Ignora si fue hoy o ayer para no bloquear)
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

  const registrarAsistencia = async (empleado: any, tipo: 'ingreso' | 'salida') => {
    setLoading(true)
    const ahora = new Date()
    
    // GPS RESISTENTE (Si falla por incógnito, igual permite marcar)
    let urlMapa = "Ubicación no disponible"
    try {
      const pos: any = await new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 });
      });
      urlMapa = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`
    } catch (e) {
      console.log("GPS bloqueado o no disponible");
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
      alert(`✅ ${tipo.toUpperCase()} REGISTRADO`);
      fetchUltimosMovimientos(empleados);
    } else {
      alert("Error: " + error.message);
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-black">
      <div className="max-w-md mx-auto">
        <header className="bg-blue-900 p-6 rounded-t-[30px] shadow-lg">
          <h1 className="text-white text-xl font-black uppercase tracking-tighter">Proaceites</h1>
          <p className="text-blue-300 text-[10px] font-bold uppercase">Panel de Marcación Directa</p>
        </header>

        <div className="bg-white p-4 shadow-sm border-b mb-4">
          <input 
            type="text" 
            placeholder="🔍 BUSCAR TU NOMBRE..." 
            className="w-full p-3 rounded-xl bg-gray-50 border-none text-sm font-bold"
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="space-y-4 mt-4">
          {empleados
            .filter(e => e.nombres.toLowerCase().includes(busqueda.toLowerCase()))
            .map(emp => {
              const ultimo = estadosAsistencia[emp.id]
              const esSalida = ultimo?.tipo_registro === 'ingreso'

              return (
                <div key={emp.id} className="bg-white p-5 rounded-[25px] shadow-md border border-gray-100 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="font-black text-sm uppercase text-gray-800 leading-none">{emp.nombres}</h2>
                      <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{emp.rol_empresa || 'OPERARIO'}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${esSalida ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {esSalida ? '● EN TURNO' : '○ FUERA'}
                    </div>
                  </div>

                  <button 
                    disabled={loading}
                    onClick={() => registrarAsistencia(emp, esSalida ? 'salida' : 'ingreso')}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase text-white transition-transform active:scale-95 ${
                      esSalida ? 'bg-orange-500 shadow-lg shadow-orange-100' : 'bg-blue-600 shadow-lg shadow-blue-100'
                    } ${loading ? 'opacity-50' : ''}`}
                  >
                    {loading ? 'PROCESANDO...' : esSalida ? '🔔 MARCAR SALIDA' : '⚡ MARCAR INGRESO'}
                  </button>

                  {ultimo && (
                    <p className="text-[8px] text-center mt-3 font-bold text-gray-300 uppercase">
                      ÚLTIMO MOVIMIENTO: {ultimo.tipo_registro} ({new Date(ultimo.fecha_hora).toLocaleTimeString()})
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