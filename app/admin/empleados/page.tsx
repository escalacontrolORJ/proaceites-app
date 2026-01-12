'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ListaEmpleados() {
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [estadosAsistencia, setEstadosAsistencia] = useState<Record<string, any>>({})

  useEffect(() => { fetchEmpleados() }, [])

  async function fetchEmpleados() {
    setLoading(true)
    const { data } = await supabase.from('empleados').select('*').order('nombres', { ascending: true })
    setEmpleados(data || [])
    if (data) fetchEstadosAsistencia(data)
    setLoading(false)
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

  const registrarMarcacion = async (empleado: any, modo: 'ingreso' | 'salida') => {
    const ahora = new Date()
    const isoString = ahora.toISOString()
    
    const { error } = await supabase.from('asistencia').insert([{
      empleado_id: empleado.id,
      nombres: empleado.nombres,
      tipo_registro: modo,
      fecha_hora: isoString,
      fecha: isoString.split('T')[0]
    }])

    if (!error) fetchEstadosAsistencia(empleados)
    else alert("Error: " + error.message)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24 text-black">
      <div className="max-w-md mx-auto pt-6">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-black uppercase text-blue-900 tracking-tighter">Personal</h1>
          <Link href="/admin/empleados/nuevo" className="w-12 h-12 bg-blue-700 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg">+</Link>
        </header>

        <input 
          type="text" 
          placeholder="Buscar..." 
          className="w-full p-4 mb-6 rounded-2xl shadow-sm border-none outline-none focus:ring-2 focus:ring-blue-500" 
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <div className="grid gap-3">
          {empleados.filter(e => e.nombres?.toLowerCase().includes(busqueda.toLowerCase())).map((emp) => {
            const ultimoReg = estadosAsistencia[emp.id]
            const esSalida = ultimoReg?.tipo_registro === 'ingreso'

            return (
              <div key={emp.id} className="bg-white p-5 rounded-[30px] shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="font-black text-[11px] uppercase text-gray-800">{emp.nombres}</h2>
                    <p className="text-[8px] font-bold text-gray-400 uppercase">{emp.rol_empresa || 'Sin Cargo'}</p>
                  </div>
                  {ultimoReg && (
                    <span className="text-[7px] bg-gray-100 px-2 py-0.5 rounded-full font-black uppercase text-gray-500">
                      Último: {ultimoReg.tipo_registro}
                    </span>
                  )}
                </div>

                <button 
                  onClick={() => registrarMarcacion(emp, esSalida ? 'salida' : 'ingreso')}
                  className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase text-white transition-all active:scale-95 shadow-md ${
                    esSalida ? 'bg-orange-500' : 'bg-blue-600'
                  }`}
                >
                  {esSalida ? '🔔 Marcar Salida' : '⚡ Marcar Ingreso'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}