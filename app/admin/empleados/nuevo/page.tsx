'use client'
import { useState } from 'react'
import { supabase } from '../../../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function NuevoEmpleado() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // CORRECCIÓN: Usamos 'nombres' para que coincida con tu base de datos
  const [form, setForm] = useState({
    id: '', 
    nombres: '', 
    cedula: '',
    rol_empresa: 'Operario'
  })

  const crearEmpleado = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Insertar en la tabla empleados
    const { error } = await supabase
      .from('empleados')
      .insert([{
        id: form.id,
        nombres: form.nombres, // Enviamos 'nombres' (plural)
        cedula: form.cedula,
        rol_empresa: form.rol_empresa
      }])

    if (error) {
      alert("Error de base de datos: " + error.message)
      console.error(error)
    } else {
      alert("✅ Empleado creado con éxito")
      router.push('/admin/empleados')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white p-6 pb-24 text-black font-sans">
      <div className="max-w-md mx-auto">
        <header className="mb-8 pt-4 text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
            👤
          </div>
          <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">Nuevo Empleado</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Alta manual de personal</p>
        </header>

        <form onSubmit={crearEmpleado} className="space-y-4">
          
          {/* UUID DE SUPABASE */}
          <div className="bg-gray-50 p-4 rounded-[25px] border-2 border-dashed border-gray-200">
            <label className="text-[10px] font-black text-blue-500 uppercase ml-2 mb-1 block">ID de Usuario (UUID Auth)</label>
            <input 
              type="text"
              required
              placeholder="00000000-0000-0000-0000-000000000000"
              className="w-full p-2 bg-transparent font-mono text-xs text-gray-600 outline-none"
              value={form.id}
              onChange={e => setForm({...form, id: e.target.value})}
            />
          </div>

          {/* NOMBRES */}
          <div className="bg-white p-4 rounded-[25px] shadow-sm border border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">Nombres y Apellidos</label>
            <input 
              type="text"
              required
              placeholder="Ej: Juan Pérez"
              className="w-full p-2 bg-transparent font-bold text-gray-800 outline-none placeholder:text-gray-200"
              value={form.nombres}
              onChange={e => setForm({...form, nombres: e.target.value})}
            />
          </div>

          {/* CÉDULA */}
          <div className="bg-white p-4 rounded-[25px] shadow-sm border border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">Cédula de Identidad</label>
            <input 
              type="text"
              required
              placeholder="0000000000"
              className="w-full p-2 bg-transparent font-bold text-gray-800 outline-none placeholder:text-gray-200"
              value={form.cedula}
              onChange={e => setForm({...form, cedula: e.target.value})}
            />
          </div>

          {/* ROL */}
          <div className="bg-white p-4 rounded-[25px] shadow-sm border border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">Asignar Cargo</label>
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
              disabled={loading}
              className="w-full py-5 bg-blue-700 text-white rounded-[25px] font-black shadow-xl uppercase active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Crear y Vincular'}
            </button>
            <button 
              type="button" 
              onClick={() => router.back()}
              className="w-full py-4 text-gray-400 font-bold uppercase text-xs"
            >
              Regresar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}