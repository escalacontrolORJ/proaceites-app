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
        .limit(1)
        .maybeSingle()
      estados[emp.id] = data || null
    }
    setEstadosAsistencia(estados)
  }

  const registrarMarcacion = async (empleado: any, modo: 'ingreso' | 'salida') => {
    const ahora = new Date().toISOString()
    const { error } = await supabase.from('asistencia').insert([{
      empleado_id: empleado.id,
      nombres: empleado.nombres,
      tipo_registro: modo,
      fecha_hora: ahora,
      fecha: ahora.split('T')[0]
    }])

    if (!error) fetchEstadosAsistencia(empleados)
    else alert("Error: " + error.message)
  }

  const filtrados = empleados.filter(e => e.nombres?.toLowerCase().includes(busqueda.toLowerCase()))

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24 text-black">
      <div className="max-w-md mx-auto pt-6">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-black uppercase text-blue-900">Personal</h1>
          <Link href="/admin/empleados/nuevo" className="w-10 h-10 bg-blue-700 text-white rounded-full flex items-center justify-center">+</Link>
        </header>

        <input 
          type="text" 
          placeholder="Buscar..." 
          className="w-full p-4 mb-6 rounded-2xl shadow-sm border-none" 
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <div className="grid gap-3">
          {filtrados.map((emp) => {
            const ultimoReg = estadosAsistencia[emp.id]
            const esSalida = ultimoReg?.tipo_registro === 'ingreso'
            const yaTermino = ultimoReg?.tipo_registro === 'salida'

            return (
              <div key={emp.id} className="bg-white p-4 rounded-[25px] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-xs uppercase">{emp.nombres}</span>
                  <span className="text-[9px] text-gray-400">{emp.rol_empresa}</span>
                </div>

                {yaTermino ? (
                  <div className="flex flex-col gap-2">
                    <div className="text-center py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase">✅ Jornada Finalizada</div>
                    <button onClick={() => registrarMarcacion(emp, 'ingreso')} className="text-[9px] font-bold text-blue-600 uppercase underline">Reiniciar nuevo turno</button>
                  </div>
                ) : (
                  <button 
                    onClick={() => registrarMarcacion(emp, esSalida ? 'salida' : 'ingreso')}
                    className={`w-full py-3 rounded-xl font-black text-[10px] uppercase text-white shadow-lg ${esSalida ? 'bg-orange-500 shadow-orange-100' : 'bg-blue-600 shadow-blue-100'}`}
                  >
                    {esSalida ? '🔔 Marcar Salida' : '⚡ Marcar Ingreso'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}