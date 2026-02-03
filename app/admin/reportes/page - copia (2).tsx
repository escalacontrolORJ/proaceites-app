'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'

export default function ReporteAdministrativo() {
  const [filas, setFilas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchData()
  }, [fechaDesde, fechaHasta])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: emps } = await supabase.from('empleados').select('id, nombres')
      const nombresMap = (emps || []).reduce((acc: any, cur: any) => ({ ...acc, [cur.id]: cur.nombres }), {})

      const { data: asistencia, error } = await supabase
        .from('asistencia')
        .select('empleado_id, fecha, fecha_hora, tipo_registro, foto, geolocalizacion')
        .gte('fecha', fechaDesde)
        .lte('fecha', fechaHasta)
        .order('fecha_hora', { ascending: true })

      if (error) throw error

      const agrupados: any = {}

      asistencia?.forEach(reg => {
        const key = `${reg.empleado_id}_${reg.fecha}`
        if (!agrupados[key]) {
          agrupados[key] = {
            id: key,
            nombre: nombresMap[reg.empleado_id] || 'Usuario',
            fecha: reg.fecha,
            entrada: null,
            salida: null,
            horas: '0.00'
          }
        }

        const d = new Date(reg.fecha_hora)
        d.setHours(d.getHours() - 5) // Ajuste Ecuador
        const horaStr = d.getUTCHours().toString().padStart(2, '0') + ':' + 
                        d.getUTCMinutes().toString().padStart(2, '0')

        const datosEvento = {
          hora: horaStr,
          foto: reg.foto,
          gps: reg.geolocalizacion,
          raw_time: d.getTime()
        }

        const tipo = reg.tipo_registro?.toUpperCase()
        if (tipo === 'INGRESO') {
          agrupados[key].entrada = datosEvento
        } else if (tipo === 'SALIDA') {
          agrupados[key].salida = datosEvento
        }

        if (agrupados[key].entrada && agrupados[key].salida) {
          const diffMs = agrupados[key].salida.raw_time - agrupados[key].entrada.raw_time
          agrupados[key].horas = (diffMs / 3600000).toFixed(2)
        }
      })

      setFilas(Object.values(agrupados).reverse())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const abrirMapa = (gps: any) => {
    if (!gps) return alert("Sin ubicación")
    const coords = gps.toString().replace(/[() ]/g, '')
    window.open(`https://www.google.com/maps?q=${coords}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <AdminNav />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-slate-900/50 p-6 rounded-3xl border border-white/5">
          <h1 className="text-xl font-black italic uppercase tracking-tighter">Reporte Administrativo</h1>
          <div className="flex gap-2">
            <input 
              type="date" 
              value={fechaDesde} 
              onChange={e => setFechaDesde(e.target.value)} 
              className="bg-slate-800 border-none rounded-xl p-2 text-xs font-bold outline-none" 
            />
            <input 
              type="date" 
              value={fechaHasta} 
              onChange={e => setFechaHasta(e.target.value)} 
              className="bg-slate-800 border-none rounded-xl p-2 text-xs font-bold outline-none" 
            />
          </div>
        </div>

        <div className="bg-slate-900 rounded-[35px] border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  <th className="p-6">Colaborador</th>
                  <th className="p-6">Ingreso</th>
                  <th className="p-6">Salida</th>
                  <th className="p-6 text-center">Horas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filas.map((r: any) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <p className="font-black text-white italic text-lg leading-tight">{r.nombre}</p>
                      <p className="text-[10px] font-bold text-slate-500">{r.fecha}</p>
                    </td>
                    <td className="p-6">
                      {r.entrada ? (
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center">
                            {r.entrada.foto ? <img src={r.entrada.foto} alt="E" className="w-full h-full object-cover" /> : <span className="text-[8px] text-slate-600 tracking-tighter text-center px-1">SIN FOTO</span>}
                          </div>
                          <div>
                            <p className="text-emerald-400 font-black text-xl leading-none mb-1">{r.entrada.hora}</p>
                            <button onClick={() => abrirMapa(r.entrada.gps)} className="text-[9px] font-black text-slate-500 hover:text-white uppercase">📍 GPS</button>
                          </div>
                        </div>
                      ) : <span className="text-slate-700 italic">--:--</span>}
                    </td>
                    <td className="p-6">
                      {r.salida ? (
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center">
                            {r.salida.foto ? <img src={r.salida.foto} alt="S" className="w-full h-full object-cover" /> : <span className="text-[8px] text-slate-600 tracking-tighter text-center px-1">SIN FOTO</span>}
                          </div>
                          <div>
                            <p className="text-rose-400 font-black text-xl leading-none mb-1">{r.salida.hora}</p>
                            <button onClick={() => abrirMapa(r.salida.gps)} className="text-[9px] font-black text-slate-500 hover:text-white uppercase">📍 GPS</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                          <span className="text-amber-500 font-black text-[10px] uppercase">Laborando...</span>
                        </div>
                      )}
                    </td>
                    <td className="p-6 text-center">
                      <div className="inline-block bg-slate-950 px-6 py-3 rounded-3xl border border-white/5 shadow-inner">
                        <p className="text-2xl font-black text-white leading-none">{r.horas}</p>
                        <p className="text-[9px] font-bold text-slate-600 uppercase mt-1 tracking-widest">Jornada</p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filas.length === 0 && !loading && (
            <div className="p-24 text-center">
              <p className="text-slate-600 font-bold italic text-lg uppercase tracking-tighter">No hay registros</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}