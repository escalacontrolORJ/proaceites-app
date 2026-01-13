'use client'
/**
 * SISTEMA DE GESTIÓN DE ASISTENCIA - V1.3
 * MÓDULO: EDICIÓN DE USUARIO (DINÁMICO)
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'
import AdminNav from '@/components/AdminNav'

export default function EditarUsuario() {
  const { id } = useParams()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Estado del formulario (basado en tus columnas del CSV)
  const [formData, setFormData] = useState({
    nombres: '',
    email: '',
    rol_empresa: 'Operario',
    fecha_nacimiento: ''
  })

  useEffect(() => {
    fetchUsuario()
  }, [id])

  async function fetchUsuario() {
    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (data) {
        setFormData({
          nombres: data.nombres || '',
          email: data.email || '',
          rol_empresa: data.rol_empresa || 'Operario',
          fecha_nacimiento: data.fecha_nacimiento || ''
        })
      }
    } catch (error) {
      console.error('Error:', error)
      alert('No se pudo cargar el usuario')
      router.push('/admin/usuarios')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    
    try {
      const { error } = await supabase
        .from('empleados')
        .update({
          nombres: formData.nombres,
          email: formData.email,
          rol_empresa: formData.rol_empresa,
          fecha_nacimiento: formData.fecha_nacimiento || null
        })
        .eq('id', id)

      if (error) throw error
      
      alert('Usuario actualizado correctamente')
      router.push('/admin/usuarios')
    } catch (error: any) {
      alert('Error al actualizar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-20 text-center font-black animate-pulse">CARGANDO DATOS...</div>

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <AdminNav />
      
      <div className="max-w-2xl mx-auto p-4 md:p-10">
        <button 
          onClick={() => router.back()}
          className="mb-6 text-slate-400 font-black text-xs hover:text-slate-900 transition-colors uppercase tracking-widest"
        >
          ← Volver al listado
        </button>

        <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 border border-slate-100">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">Editar Perfil</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-10">ID: {id}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* NOMBRE */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Nombre Completo</label>
              <input 
                type="text"
                required
                value={formData.nombres}
                onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                className="p-4 rounded-2xl bg-slate-100 font-bold outline-none focus:ring-2 ring-blue-500 transition-all"
              />
            </div>

            {/* EMAIL */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Correo Electrónico</label>
              <input 
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="p-4 rounded-2xl bg-slate-100 font-bold outline-none focus:ring-2 ring-blue-500 transition-all"
              />
            </div>

            {/* ROL / CARGO */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Cargo en la Empresa</label>
              <select 
                value={formData.rol_empresa}
                onChange={(e) => setFormData({...formData, rol_empresa: e.target.value})}
                className="p-4 rounded-2xl bg-slate-100 font-bold outline-none focus:ring-2 ring-blue-500 transition-all appearance-none"
              >
                <option value="Operario">Operario</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>

            {/* FECHA NACIMIENTO */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Fecha de Nacimiento</label>
              <input 
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
                className="p-4 rounded-2xl bg-slate-100 font-bold outline-none focus:ring-2 ring-blue-500 transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={saving}
              className={`w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all uppercase tracking-widest mt-6 ${saving ? 'bg-slate-300' : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02]'}`}
            >
              {saving ? 'GUARDANDO CAMBIOS...' : 'ACTUALIZAR USUARIO'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}