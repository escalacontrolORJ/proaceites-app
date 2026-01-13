'use client'
// VERSION 2.9 - EXTRACTOR DE COORDENADAS REFORZADO
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
        const llave = `${reg.empleado_id}-${reg.fecha}`
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
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const calcularHorasNum = (entrada: any, salida: any) => {
    if (!entrada || !salida) return 0
    const ms = new Date(salida.fecha_hora).getTime() - new Date(entrada.fecha_hora).getTime()
    return Math.max(0, ms / (1000 * 60 * 60))
  }

  const abrirFoto = (fotoUrl: string) => {
    const nuevaVentana = window.open();
    if (nuevaVentana) {
      nuevaVentana.document.write(`<img src="${fotoUrl}" style="max-width:100%; height:auto; border-radius:10px;" />`);
      nuevaVentana.document.title = "Visualización de Foto";
    }
  };

  const CeldaInfo = ({ registro, tipo }: { registro: any, tipo: string }) => {
    if (!registro) return <span className="text-slate-300 text-[10px] font-bold">SIN REGISTRO</span>;

    // --- LÓGICA DE GPS CORREGIDA ---
    let urlMapa = "";
    const geo = registro.geolocalizacion || "";

    if (geo) {
      // Esta expresión regular extrae solo los números, puntos y la coma:
      // Ejemplo: "Lat: -1.2, Lon: -78.5" -> "-1.2,-78.5"
      const soloCoordenadas = geo.replace(/[^\d.,-]/g, '');
      urlMapa = `https://www.google.com/maps/search/?api=1&query=${soloCoordenadas}`;
    }

    return (
      <div className="flex flex-col items-center justify-center gap-2 py-2">
        <span className={`font-black text-xs ${tipo === 'entrada' ? 'text-blue-600' : 'text-orange-600'}`}>
          {new Date(registro.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        
        <div className="flex gap-3 items-center bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-sm">
          {/* BOTÓN FOTO */}
          {registro.foto_url ? (
            <button 
              onClick={() => abrirFoto(registro.foto_url)}
              className="hover:scale-110 transition-transform cursor-pointer"
            >
              <img 
                src={registro.foto_url} 
                className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-md"
                alt="Foto"
              />
            </button>
          ) : (
            <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-[8px] text-slate-500 font-bold uppercase p-1 text-center">Sin foto</div>
          )}

          {/* BOTÓN GPS REAL */}
          {urlMapa ? (
            <a 
              href={urlMapa} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-md border border-slate-200 hover:bg-blue-600 hover:text-white transition-all text-xl cursor-pointer"
            >
              📍
            </a>
          ) : (
            <div className="w-10 h-10 flex items-center justify-center opacity-20 grayscale text-xl">
              📍
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <AdminNav />
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Empleado</label>
            <select value={empleadoSeleccionado} onChange={(e) => setEmpleadoSeleccionado(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 font-bold outline-none transition-all">
              <option value="TODOS">👥 TODOS</option>
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombres}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 font-bold" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 font-bold" />
          </div>
        </div>

        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                  <th className="p-6">Empleado</th>
                  <th className="p-6 text-center">Fecha</th>
                  <th className="p-6 text-center">Ingreso (Foto/GPS)</th>
                  <th className="p-6 text-center">Salida (Foto/GPS)</th>
                  <th className="p-6 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-20 text-center font-black text-slate-400 italic animate-pulse tracking-widest uppercase">Cargando reportes...</td></tr>
                ) : (
                  filas.map((r, i) => (
                    <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-6 font-black text-xs uppercase tracking-tight">{r.nombre}</td>
                      <td className="p-6 text-center text-[10px] font-bold text-slate-400">{r.fecha}</td>
                      <td className="p-6"><CeldaInfo registro={r.entrada} tipo="entrada" /></td>
                      <td className="p-6"><CeldaInfo registro={r.salida} tipo="salida" /></td>
                      <td className="p-6 text-center">
                        <span className="px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[11px] shadow-lg shadow-slate-200">
                          {calcularHorasNum(r.entrada, r.salida).toFixed(2)} HRS
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}