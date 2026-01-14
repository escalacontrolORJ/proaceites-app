async function crearUsuario(e: React.FormEvent) {
    e.preventDefault()
    setCreando(true)
    
    // Generamos un ID único para evitar el error de "null value in column id"
    const nuevoId = crypto.randomUUID()

    const { error } = await supabase
      .from('empleados')
      .insert([{
        id: nuevoId, // <-- Aquí enviamos el ID generado
        nombres: nuevoUsuario.nombres,
        email: nuevoUsuario.email,
        cedula: nuevoUsuario.cedula,
        rol_empresa: nuevoUsuario.rol_empresa
      }])

    if (!error) {
      setNuevoUsuario({ nombres: '', email: '', cedula: '', rol_empresa: 'Operario' })
      setMostrarModal(false)
      fetchUsuarios()
    } else {
      console.error(error)
      alert('Error al crear: ' + error.message)
    }
    setCreando(false)
  }