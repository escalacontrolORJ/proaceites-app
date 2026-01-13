'use client'
// VERSION 2.5 - FIX BASE64 Y GPS INDEPENDIENTE
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'

export default function ReporteAdministrativo() {
  const [filas, setFilas] = useState<any[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('TODOS')

  useEffect(() => {
    fetchData()
  }, [fechaDesde, fechaHasta, empleadoSeleccionado])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: emps } = await supabase.from('empleados').select('id, nombres')
      setEmpleados(emps || [])
      const nombresMap = Object.fromEntries(emps?.map(e => [e.id, e.nombres]) || [])

      let query = supabase
        .from('asistencia')
        .select('*')
        .gte('fecha', fechaDesde)
        .lte('fecha', fechaHasta)
        .order('fecha_hora', { ascending: true })

      if (empleadoSeleccionado !== 'TODOS') {
        query = query.eq('empleado_id', empleadoSeleccionado)
      }

      const { data: asist } = await query

      const agrupados: Record<string, any> = {}
      asist?.forEach(reg => {
        const llave = reg.empleado_id + '-' + reg.fecha
        if (!agrupados[llave]) {
          agrupados[llave] = {
            nombre: nombresMap[reg.empleado_id] || 'Sin Nombre',
            fecha: reg.fecha,
            entrada: null,
            salida: null
          }
        }
        if (reg.tipo_registro === 'ingreso') agrupados[llave].entrada = reg
        else if (reg.tipo_registro === 'salida') agrupados[llave].salida = reg
      })

      setFilas(Object.values(agrupados))
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const calcularHorasNum = (entrada: any, salida: any) => {
    if (!entrada || !salida) return 0
    const ms = new Date(salida.fecha_hora).getTime() - new Date(entrada.fecha_hora).getTime()
    return Math.max(0, ms / (1000 * 60 * 60))
  }

  // FUNCIÓN PARA ABRIR FOTOS BASE64 EN VENTANA NUEVA
  const abrirFoto = (fotoUrl: string) => {
    const nuevaVentana = window.open();
    if (nuevaVentana) {
      nuevaVentana.document.write(`<img src="${fotoUrl}" style="max-width:100%; height:auto;" />`);
      nuevaVentana.document.title = "Visualización de Foto";
    }
  };

  const CeldaInfo = ({ registro, tipo }: { registro: any, tipo: string }) => {
    if (!registro) return <span className="text-slate-300 text-[10px]">--</span>;

    // URL GPS con formato limpio para Google Maps
    const urlMapa = "https://www.google.com/maps?q=" + registro.latitud + "," + registro.longitud;

    return (
      <div className="flex flex-col items-center justify-center gap-2">
        <span className={tipo === 'entrada' ? 'text-blue-600 font-bold' : 'text-orange-600 font-bold'}>
          {new Date(registro.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        
        <div className="flex gap-4 items-center bg-slate-50 p-2 rounded-2xl border border-slate-100">
          {/* FOTO MINIATURA CON CLIC CORREGIDO */}
          {registro.foto_url ? (
            <button 
              onClick={() => abrirFoto(registro.foto_url)}
              className="hover:scale-110 transition-transform"
            >
              <img 
                src={registro.foto_url} 
                className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-md"
                alt="Foto"
              />
            </button>
          ) : (
            <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-[8px] text-slate-500">NO FOTO</div>
          )}

          {/* LINK GPS - Asegurando visibilidad */}
          {registro.latitud && (
            <a 
              href={urlMapa} 
              target="_blank" 
              rel="noreferrer"
              className="text-2xl hover:scale-125 transition-transform"
              title="Ver en Google Maps"
            >
              📍
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <AdminNav />
      <div className="max-w-7xl mx-auto p-4 md:p-10">
        
        <div className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase">Empleado</label>
            <select value={empleadoSeleccionado} onChange={(e) => setEmpleadoSeleccionado(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-blue-500 font-bold outline-none">
              <option value="TODOS">TODOS LOS EMPLEADOS</option>
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombres}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase">Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 font-bold" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase">Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 font-bold" />
          </div>
        </div>

        <div className="bg-white rounded-[30px] shadow-xl overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                  <th className="p-5">Colaborador</th>
                  <th className="p-5 text-center">Fecha</th>
                  <th className="p-5 text-center">Ingreso (Foto/GPS)</th>
                  <th className="p-5 text-center">Salida (Foto/GPS)</th>
                  <th className="p-5 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filas.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5 font-black text-xs uppercase">{r.nombre}</td>
                    <td className="p-5 text-center text-[10px] font-bold text-slate-400">{r.fecha}</td>
                    <td className="p-5"><CeldaInfo registro={r.entrada} tipo="entrada" /></td>
                    <td className="p-5"><CeldaInfo registro={r.salida} tipo="salida" /></td>
                    <td className="p-5 text-center">
                      <span className="px-3 py-1 bg-slate-900 text-white rounded-lg font-black text-[10px]">
                        {calcularHorasNum(r.entrada, r.salida).toFixed(2)} HRS
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}