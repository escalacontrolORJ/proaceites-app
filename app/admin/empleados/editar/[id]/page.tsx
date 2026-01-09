'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'

export default function EditarEmpleado() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  
  // Lista de usuarios que se han registrado en la Auth de Supabase
  const [usuariosSistema, setUsuariosSistema] = useState<any[]>([])
  
  const [form, setForm] = useState({
    nombre: '',
    cedula: '',
    rol_empresa: 'Operario',
    user_id: '' // Este es el ID que vincula con auth.users
  })

  useEffect(() => {
    fetchDatos()
  }, [id])

  async function fetchDatos() {
    setLoading(true)
    
    // 1. Obtener datos del empleado
    const { data: empData } = await supabase
      .from('empleados')
      .select('*')
      .eq('id', id)
      .single()

    // 2. Obtener lista de usuarios registrados (desde una tabla de perfiles o similar)
    // Nota: Usamos la tabla 'empleados' misma para buscar usuarios que ya se loguearon
    const { data: usersData } = await supabase
      .from('empleados')
      .select('id, nombre')
      .not('id', 'eq', id) // Evitar duplicados

    if (empData) {
      setForm({
        nombre: empData.nombre || '',
        cedula: empData.cedula || '',
        rol_empresa: empData.rol_empresa || 'Operario',
        user_id: empData.id // En tu sistema, el ID del empleado suele ser el mismo UUID de Auth
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
        nombre: form.nombre,
        cedula: form.cedula,
        rol_empresa: form.rol_empresa,
      })
      .eq('id', id)

    if (error) {
      alert("Error al actualizar: " + error.message)
    } else {
      alert("✅ Empleado actualizado correctamente")
      router.push('/admin/empleados')
    }
    setUpdating(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen font-black text-gray-400 uppercase">
      Cargando perfil...
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24 text-black font-sans">
      <div className="max-w-md mx-auto">
        <header className="mb-8 pt-4">
          <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">Editar Perfil</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">ID vinculada: {id.toString().slice(0,8)}...</p>
        </header>

        <form onSubmit={guardarCambios} className="space-y-4">
          {/* Nombre */}
          <div className="bg-white p-4 rounded-[25px] shadow-sm border border-gray-100">
            <label className="text-[10px] font-black text-blue-400 uppercase ml-2 mb-1 block">Nombre Completo</label>
            <input 
              type="text"
              required
              className="w-full p-2 bg-transparent font-bold text-gray-800 outline-none"
              value={form.nombre}
              onChange={e => setForm({...form, nombre: e.target.value})}
            />
          </div>

          {/* Cédula */}
          <div className="bg-white p-4 rounded-[25px] shadow-sm border border-gray-100">
            <label className="text-[10px] font-black text-blue-400 uppercase ml-2 mb-1 block">Número de Cédula</label>
            <input 
              type="text"
              className="w-full p-2 bg-transparent font-bold text-gray-800 outline-none"
              value={form.cedula}
              onChange={e => setForm({...form, cedula: e.target.value})}
            />
          </div>

          {/* Rol de Empresa */}
          <div className="bg-white p-4 rounded-[25px] shadow-sm border border-gray-100">
            <label className="text-[10px] font-black text-blue-400 uppercase ml-2 mb-1 block">Rol del Usuario</label>
            <select 
              className="w-full p-2 bg-transparent font-bold text-blue-900 outline-none appearance-none"
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
              Cancelar y Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}