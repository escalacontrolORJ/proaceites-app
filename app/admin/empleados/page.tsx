'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import Link from 'next/link'

export default function ListaEmpleados() {
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmarEliminar, setConfirmarEliminar] = useState<any>(null)
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
    
    if (error) {
      console.error("Error al traer empleados:", error.message)
    } else {
      setEmpleados(data || [])
      fetchEstadosAsistencia(data || [])
    }
    setLoading(false)
  }

  async function fetchEstadosAsistencia(listaEmpleados: any[]) {
    const hoy = new Date().toISOString().split('T')[0]
    const estados: Record<string, any> = {}

    for (const emp of listaEmpleados) {
      const { data } = await supabase
        .from('asistencia')
        .select('*')
        .eq('empleado_id', emp.id)
        .eq('fecha', hoy)
        .order('fecha_hora', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      estados[emp.id] = data || null
    }
    setEstadosAsistencia(estados)
  }

  const registrarMarcacion = async (empleado: any, modo: 'ingreso' | 'salida') => {
    const hoy = new Date().toISOString()
    const soloFecha = hoy.split('T')[0]

    const { error } = await supabase
      .from('asistencia')
      .insert([{
        empleado_id: empleado.id,
        nombres: empleado.nombres,
        tipo_registro: modo,
        fecha_hora: hoy,
        fecha: soloFecha
      }])

    if (error) {
      alert("Error al registrar: " + error.message)
    } else {
      fetchEstadosAsistencia(empleados)
    }
  }

  const borrarEmpleado = async () => {
    if (!confirmarEliminar) return
    const { error } = await supabase
      .from('empleados')
      .delete()
      .eq('id', confirmarEliminar.id)

    if (error) {
      alert("Error al eliminar: " + error.message)
    } else {
      setEmpleados(empleados.filter(e => e.id !== confirmarEliminar.id))
      setConfirmarEliminar(null)
    }
  }

  const filtrados = empleados.filter(e => 
    e.nombres?.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.rol_empresa?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24 text-black font-sans">
      <div className="max-w-md mx-auto pt-6">
        
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter leading-none">Personal</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestión Proaceites</p>
          </div>
          <Link 
            href="/admin/empleados/nuevo" 
            className="w-12 h-12 bg-blue-700 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-blue-100 active:scale-90 transition-all"
          >
            +
          </Link>
        </header>

        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Buscar por nombre o cargo..." 
            className="w-full p-4 pl-12 rounded-[22px] border-none shadow-sm text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <span className="absolute left-4 top-4 opacity-30 text-lg">🔍</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-black text-[10px] uppercase tracking-widest text-center">Sincronizando Nómina...</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtrados.map((emp) => {
              const ultimoReg = estadosAsistencia[emp.id]
              const debeMarcarSalida = ultimoReg && ultimoReg.tipo_registro === 'ingreso'
              const turnoCompletado = ultimoReg && ultimoReg.tipo_registro === 'salida'

              return (
                <div key={emp.id} className="bg-white p-4 rounded-[30px] shadow-sm border border-gray-100 flex flex-col gap-4 transition-all active:scale-[0.98]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-700 font-black text-xs uppercase flex-shrink-0">
                        {emp.nombres ? emp.nombres.substring(0, 2) : '??'}
                      </div>
                      
                      <div className="min-w-0">
                        <h2 className="font-black text-[11px] uppercase text-gray-800 leading-tight truncate">
                          {emp.nombres || 'Sin Nombre'}
                        </h2>
                        <span className={`text-[7px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${
                          emp.rol_empresa === 'Supervisor' ? 'bg-purple-100 text-purple-600' :
                          emp.rol_empresa === 'Vendedor' ? 'bg-orange-100 text-orange-600' : 
                          'bg-gray-100 text-gray-400'
                        }`}>
                          {emp.rol_empresa}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Link href={`/admin/empleados/editar/${emp.id}`} className="w-8 h-8 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center">
                        <span className="text-xs">✏️</span>
                      </Link>
                      <button onClick={() => setConfirmarEliminar(emp)} className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                        <span className="text-xs">🗑️</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-50">
                    {turnoCompletado ? (
                      <div className="w-full py-2 bg-green-50 text-green-600 rounded-xl text-[9px] font-black uppercase text-center italic">
                        ✅ Turno Finalizado
                      </div>
                    ) : (
                      <button
                        onClick={() => registrarMarcacion(emp, debeMarcarSalida ? 'salida' : 'ingreso')}
                        className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          debeMarcarSalida 
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' 
                          : 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                        }`}
                      >
                        {debeMarcarSalida ? '🔔 Marcar Salida' : '⚡ Marcar Ingreso'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {confirmarEliminar && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <div className="bg-white rounded-[45px] p-8 w-full max-w-sm text-center shadow-2xl">
              <div className="text-5xl mb-4">🚫</div>
              <h2 className="text-xl font-black uppercase text-gray-900 mb-2 leading-none">Eliminar</h2>
              <p className="text-[11px] text-gray-500 mb-8 px-4 leading-relaxed">
                ¿Eliminar a <span className="font-bold text-black">{confirmarEliminar.nombres}</span>?
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={borrarEmpleado} className="w-full py-5 bg-red-600 text-white rounded-[22px] font-black uppercase transition-transform active:scale-95">
                  Confirmar
                </button>
                <button onClick={() => setConfirmarEliminar(null)} className="w-full py-4 bg-gray-50 text-gray-400 rounded-[22px] font-black uppercase transition-transform active:scale-95">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}