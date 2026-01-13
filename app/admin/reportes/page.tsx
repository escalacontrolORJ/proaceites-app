'use client'
// VERSION 3.2 - MULTI-EXTRACTOR DE GPS (Point, Text y Columnas específicas)
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

  const abrirFoto = (fotoUrl: string) => {
    const nuevaVentana = window.open();
    if (nuevaVentana) {
      nuevaVentana.document.write(`<img src="${fotoUrl}" style="max-width:100%; border-radius:15px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);" />`);
      nuevaVentana.document.title = "Foto de Asistencia";
    }
  };

  const CeldaInfo = ({ registro, tipo }: { registro: any, tipo: string }) => {
    if (!registro) return <span className="text-slate-300 text-[10px] font-bold tracking-tighter">SIN REGISTRO</span>;

    // --- LOGICA DE EXTRACCION DE GPS REFORZADA ---
    let urlMapa = "";
    
    // 1. Intentar desde columnas específicas (ubicacion_ingreso / ubicacion_salida)
    const ubicacionTexto = tipo === 'entrada' ? registro.ubicacion_ingreso : registro.ubicacion_salida;
    
    // 2. Intentar desde columna genérica 'geolocalizacion' o 'ubicacion'
    const geoPoint = registro.geolocalizacion;
    const geoRaw = registro.ubicacion || "";

    let coordenadasFinales = "";

    if (geoPoint) {
      // Si es objeto Point {x, y}
      if (typeof geoPoint === 'object') coordenadasFinales = `${geoPoint.y},${geoPoint.x}`;
      // Si es string "(x,y)"
      else if (typeof geoPoint === 'string') coordenadasFinales = geoPoint.replace(/[()]/g, '');
    } 
    else if (ubicacionTexto) {
      coordenadasFinales = ubicacionTexto.replace(/[a-zA-Z\s:]/g, '');
    }
    else if (geoRaw) {
      coordenadasFinales = geoRaw.replace(/[a-zA-Z\s:]/g, '');
    }

    if (coordenadasFinales) {
      urlMapa = `https://www.google.com/maps/search/?api=1&query=${coordenadasFinales}`;
    }

    return (
      <div className="flex flex-col items-center gap-2 py-1">
        <span className={`text-[11px] font-black ${tipo === 'entrada' ? 'text-blue-600' : 'text-orange-500'}`}>
          {new Date(registro.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        
        <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-2xl border border-slate-200">
          {/* FOTO */}
          {registro.foto_url ? (
            <button onClick={() => abrirFoto(registro.foto_url)} className="hover:scale-110 transition-transform active:scale-90">
              <img src={registro.foto_url} className="w-10 h-10 rounded-lg object-cover border border-white shadow-sm" alt="F" />
            </button>
          ) : <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-[8px] text-slate-400">NA</div>}

          {/* BOTON GPS */}
          {urlMapa ? (
            <a 
              href={urlMapa} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center bg-white text-blue-600 rounded-lg shadow-sm border border-slate-200 hover:bg-blue-600 hover:text-white transition-all text-xl"
            >
              📍
            </a>
          ) : (
            <div className="w-10 h-10 flex items-center justify-center opacity-10 grayscale text-xl">📍</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <AdminNav />
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* FILTROS */}
        <div className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 mb-8 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Empleado</label>
            <select value={empleadoSeleccionado} onChange={(e) => setEmpleadoSeleccionado(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 font-bold border-2 border-transparent focus:border-blue-500 outline-none">
              <option value="TODOS">TODOS</option>
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombres}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="p-3 rounded-xl bg-slate-50 font-bold outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="p-3 rounded-xl bg-slate-50 font-bold outline-none" />
          </div>
        </div>

        {/* TABLA ESTILO DASHBOARD */}
        <div className="bg-white rounded-[35px] shadow-xl overflow-hidden border border-slate-100">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                <th className="p-6">Colaborador</th>
                <th className="p-6 text-center">Fecha</th>
                <th className="p-6 text-center">Entrada</th>
                <th className="p-6 text-center">Salida</th>
                <th className="p-6 text-center">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {filas.map((r, i) => (
                <tr key={i} className="hover:bg-blue-50/20 transition-colors">
                  <td className="p-6 text-xs uppercase text-slate-700">{r.nombre}</td>
                  <td className="p-6 text-center text-[10px] text-slate-400">{r.fecha}</td>
                  <td className="p-6"><CeldaInfo registro={r.entrada} tipo="entrada" /></td>
                  <td className="p-6"><CeldaInfo registro={r.salida} tipo="salida" /></td>
                  <td className="p-6 text-center">
                    <span className="px-4 py-2 bg-slate-100 text-slate-900 rounded-xl text-[10px] font-black shadow-inner">
                      { ( (r.entrada && r.salida) ? ( (new Date(r.salida.fecha_hora).getTime() - new Date(r.entrada.fecha_hora).getTime()) / (1000*60*60) ).toFixed(2) : "0.00" ) } H
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filas.length === 0 && <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest">No hay registros</div>}
        </div>
      </div>
    </div>
  )
}