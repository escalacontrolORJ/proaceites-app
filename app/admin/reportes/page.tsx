// Reemplaza la función procesarReporte dentro de app/admin/reportes/page.tsx
const procesarReporte = () => {
  const mapa: Record<string, any> = {}

  datosRaw.forEach(reg => {
    const fechaLimpia = reg.fecha || reg.fecha_hora?.split('T')[0]
    const idEmp = reg.empleado_id
    const llave = `${idEmp}-${fechaLimpia}`

    if (!mapa[llave]) {
      // Si reg.nombres está vacío, buscamos en la lista de empleados por ID
      const nombreEncontrado = reg.nombres || empleados.find(e => e.id === idEmp)?.nombres || 'Empleado Desconocido'
      
      mapa[llave] = {
        nombre: nombreEncontrado,
        fecha: fechaLimpia,
        ingreso: null,
        salida: null,
        gps: reg.ubicacion || reg.geolocalizacion,
      }
    }

    if (reg.tipo_registro === 'ingreso') mapa[llave].ingreso = reg.fecha_hora
    else if (reg.tipo_registro === 'salida') mapa[llave].salida = reg.fecha_hora
  })

  return Object.values(mapa).filter((r: any) => {
    const cumpleFecha = r.fecha >= fechaInicio && r.fecha <= fechaFin
    const cumpleNombre = !filtroNombre || r.nombre === filtroNombre
    return cumpleFecha && cumpleNombre
  })
}