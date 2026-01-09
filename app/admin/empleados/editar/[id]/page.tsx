'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'

export default function EditarEmpleado() {
  const { id } = useParams()
  const router = useRouter()
  const [form, setForm] = useState({ nombre: '', rol_empresa: 'Operario', cedula: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEmp() {
      const { data } = await supabase.from('empleados').select('*').eq('id', id).single()
      if (data) setForm(data)
      setLoading(false)
    }
    fetchEmp()
  }, [id])

  const guardar = async (e: any) => {
    e.preventDefault()
    const { error } = await supabase.from('empleados').update(form).eq('id', id)
    if (error) alert(error.message)
    else {
      alert("✅ Datos actualizados")
      router.push('/admin/empleados')
    }
  }

  if (loading) return <div className="p-10 text-center font-black">CARGANDO...</div>

  return (
    <div className="p-6 bg-white min-h-screen text-black font-sans">
      <h1 className="text-xl font-black text-blue-900 mb-8 uppercase tracking-tighter">Perfil de Empleado</h1>
      
      <form onSubmit={guardar} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Nombre Completo</label>
          <input 
            className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-none" 
            value={form.nombre} 
            onChange={e => setForm({...form, nombre: e.target.value})} 
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Cédula / ID</label>
          <input 
            className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-none" 
            value={form.cedula} 
            onChange={e => setForm({...form, cedula: e.target.value})} 
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Rol de Acceso</label>
          <select 
            className="w-full p-4 bg-blue-50 text-blue-700 rounded-2xl font-black border-none"
            value={form.rol_empresa}
            onChange={e => setForm({...form, rol_empresa: e.target.value})}
          >
            <option value="Operario">Operario (Solo Asistencia)</option>
            <option value="Vendedor">Vendedor (Asistencia + Ventas)</option>
            <option value="Supervisor">Supervisor (Todo + Reportes)</option>
          </select>
        </div>

        <div className="pt-6 space-y-3">
          <button type="submit" className="w-full py-5 bg-blue-700 text-white rounded-[25px] font-black shadow-xl uppercase">Guardar Cambios</button>
          <button type="button" onClick={() => router.back()} className="w-full py-4 text-gray-400 font-bold uppercase">Volver</button>
        </div>
      </form>
    </div>
  )
}