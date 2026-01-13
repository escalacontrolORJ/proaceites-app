'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Estados para el formulario
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('') // ¡Necesitamos esto para el acceso!
  const [nombres, setNombres] = useState('')
  const [rol, setRol] = useState('Vendedor')

  // 1. CARGAR LISTADO DE USUARIOS
  const fetchUsuarios = async () => {
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .order('creado_el', { ascending: false })
    
    if (error) console.error('Error al cargar:', error.message)
    else setUsuarios(data || [])
  }

  useEffect(() => {
    fetchUsuarios()
  }, [])

  // 2. FUNCIÓN PARA GRABAR (Aquí está la corrección del ID)
  const handleGuardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // A. CREAR ACCESO EN SUPABASE AUTH
      // Esto genera el correo y la clave para que puedan hacer Login
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password, // La clave que definas en el formulario
      })

      if (authError) throw authError

      if (authData.user) {
        // B. CREAR PERFIL EN TABLA EMPLEADOS
        // Usamos el ID que nos dio Auth para que no salga "ID is null"
        const { error: dbError } = await supabase
          .from('empleados')
          .insert([
            { 
              id: authData.user.id,        // EL ID VITAL
              nombres: nombres,
              nombre: nombres,             // Llenamos ambos por si acaso
              email: email,
              rol_empresa: rol,
              creado_el: new Date().toISOString()
            }
          ])

        if (dbError) throw dbError
        
        alert("Usuario creado y acceso habilitado con éxito")
        // Limpiar formulario y recargar lista
        setEmail('')
        setPassword('')
        setNombres('')
        fetchUsuarios()
      }
    } catch (error: any) {
      alert("Error crítico: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Gestión de Usuarios</h1>
      
      {/* Formulario */}
      <form onSubmit={handleGuardarUsuario} className="bg-white p-6 rounded-xl shadow-md mb-8 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input 
            type="text" placeholder="Nombre Completo" required
            value={nombres} onChange={(e) => setNombres(e.target.value)}
            className="p-2 border rounded"
          />
          <input 
            type="email" placeholder="Correo Electrónico" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="p-2 border rounded"
          />
          <input 
            type="password" placeholder="Contraseña para el usuario" required
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="p-2 border rounded"
          />
          <select 
            value={rol} onChange={(e) => setRol(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="Vendedor">Vendedor</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Administrador">Administrador</option>
          </select>
        </div>
        <button 
          type="submit" disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Grabando...' : 'Grabar Nuevo Usuario'}
        </button>
      </form>

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Email</th>
              <th className="p-4">Rol</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u: any) => (
              <tr key={u.id} className="border-t">
                <td className="p-4">{u.nombres}</td>
                <td className="p-4">{u.email}</td>
                <td className="p-4">{u.rol_empresa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}