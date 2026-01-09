'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'

export default function EditarEmpleado() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  
  const [form, setForm] = useState({
    nombres: '', // Corregido a plural
    cedula: '',
    rol_empresa: 'Operario'
  })

  useEffect(() => {
    fetchEmpleado()
  }, [id])

  async function fetchEmpleado() {
    setLoading(true)
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .eq('id', id)
      .single()

    if (data) {
      setForm({
        nombres: data.nombres || '',
        cedula: data.cedula || '',
        rol_empresa: data.rol_empresa || 'Operario'
      })
    }
    setLoading(false)
  }

  const guardarCambios = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    const { error } = await supabase
      .from('empleados')
      .update({
        nombres: form.nombres, // Enviamos como 'nombres'
        cedula: form.cedula,
        rol_empresa: form.rol_empresa,
      })
      .eq('id', id)

    if (error) {
      alert("Error al actualizar: " + error.message)
    } else {
      alert("✅ Datos actualizados correctamente")
      router.push('/admin/empleados')
    }
    setUpdating(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen font-black text-gray-400 uppercase text-xs tracking-widest">
      Cargando Datos...
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24 text-black font-sans">
      <div className="max-w-md mx-auto">
        <header className="mb-8 pt-4">
          <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">Editar Perfil</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">ID: {id.toString().slice(0,12)}...</p>
        </header>

        <form onSubmit={guardarCambios} className="space-y-4">
          {/* NOMBRES */}
          <div className="bg-white p-4 rounded-[25px] shadow-sm border border-gray-100">
            <label className="text-[10px] font-black text-blue-400 uppercase ml-2 mb-1 block">Nombres y Apellidos</label>
            <input 
              type="text"
              required
              className="w-full p-2 bg-transparent font-bold text-gray-800 outline-none"
              value={form.nombres}
              onChange={e => setForm({...form, nombres: e.target.value})}
            />
          </div>

          {/* CÉDULA */}
          <div className="bg-white p-4 rounded-[25px] shadow-sm border border-gray-100">
            <label className="text-[10px] font-black text-blue-400 uppercase ml-2 mb-1 block">Cédula / ID</label>
            <input 
              type="text"
              required
              className="w-full p-2 bg-transparent font-bold text-gray-800 outline-none"
              value={form.cedula}
              onChange={e => setForm({...form, cedula: e.target.value})}
            />
          </div>

          {/* ROL */}
          <div className="bg-white p-4 rounded-[25px] shadow-sm border border-gray-100">
            <label className="text-[10px] font-black text-blue-400 uppercase ml-2 mb-1 block">Rol Asignado</label>
            <select 
              className="w-full p-2 bg-transparent font-black text-blue-900 outline-none appearance-none"
              value={form.rol_empresa}
              onChange={e => setForm({...form, rol_empresa: e.target.value})}
            >
              <option value="Operario">👷 Operario</option>
              <option value="Vendedor">💼 Vendedor</option>
              <option value="Supervisor">🔑 Supervisor</option>
            </select>
          </div>

          <div className="pt-6 space-y-3">
            <button 
              type="submit" 
              disabled={updating}
              className="w-full py-5 bg-blue-700 text-white rounded-[25px] font-black shadow-xl uppercase active:scale-95 transition-all disabled:opacity-50"
            >
              {updating ? 'Guardando...' : 'Confirmar Cambios'}
            </button>
            
            <button 
              type="button" 
              onClick={() => router.back()}
              className="w-full py-4 text-gray-400 font-bold uppercase text-xs"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}