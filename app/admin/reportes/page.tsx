'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ReporteAdministrativo() {
  const [tipoReporte, setTipoReporte] = useState('asistencia') 
  const [filas, setFilas] = useState<any[]>([])
  const [filasFiltradas, setFilasFiltradas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])
  
  const [empleados, setEmpleados] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [filtroEmpleado, setFiltroEmpleado] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')

  useEffect(() => {
    fetchData()
  }, [fechaDesde, fechaHasta, tipoReporte])

  useEffect(() => {
    aplicarFiltros()
  }, [filtroEmpleado, filtroCliente, filas])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: emps } = await supabase.from('perfiles').select('*')
      const { data: clis } = await supabase.from('clientes').select('*')
      setEmpleados(emps || [])
      setClientes(clis || [])

      let query = supabase.from(tipoReporte === 'asistencia' ? 'vista_asistencia_detallada' : 'vista_gestion_visitas_detallada')
        .select('*')
        .gte('fecha', fechaDesde)
        .lte('fecha', fechaHasta)

      if (tipoReporte === 'proximas') {
        query = supabase.from('vista_gestion_visitas_detallada')
          .select('*')
          .not('proxima_visita', 'is', null)
          .gte('proxima_visita', fechaDesde)
          .lte('proxima_visita', fechaHasta)
      }

      const { data, error } = await query
      if (error) throw error
      setFilas(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  function aplicarFiltros() {
    let filtradas = [...filas]
    if (filtroEmpleado) {
      filtradas = filtradas.filter(f => f.empleado_id === filtroEmpleado)
    }
    if (filtroCliente && tipoReporte !== 'asistencia') {
      filtradas = filtradas.filter(f => f.cliente_id === filtroCliente)
    }
    setFilasFiltradas(filtradas)
  }

  // --- NUEVA FUNCIÓN WHATSAPP ---
  const enviarWhatsApp = () => {
    if (filasFiltradas.length === 0) return alert("No hay datos para enviar")

    let mensaje = `*RESUMEN DE REPORTE: ${tipoReporte.toUpperCase()}*\n`
    mensaje += `📅 Periodo: ${fechaDesde} al ${fechaHasta}\n`
    mensaje += `----------------------------------\n\n`

    if (tipoReporte === 'asistencia') {
      filasFiltradas.forEach(r => {
        mensaje += `👤 *${r.nombre_empleado}*\n`
        mensaje += `➡ Ent: ${r.hora_ingreso || '--'}\n`
        mensaje += `⬅ Sal: ${r.hora_salida || '--'}\n\n`
      })
    } else if (tipoReporte === 'visitas') {
      let totalRecaudado = 0
      filasFiltradas.forEach(r => {
        const valor = parseFloat(r.valor_transaccion) || 0
        totalRecaudado += valor
        mensaje += `🏢 *${r.nombre_cliente}*\n`
        mensaje += `📋 Motivo: ${r.motivo}\n`
        mensaje += `💰 Valor: $${valor.toFixed(2)}\n\n`
      })
      mensaje += `----------------------------------\n`
      mensaje += `💵 *TOTAL RECAUDADO: $${totalRecaudado.toFixed(2)}*\n`
      mensaje += `_(Comparar con depósitos bancarios)_`
    } else if (tipoReporte === 'proximas') {
      filasFiltradas.forEach(r => {
        mensaje += `🗓 *${r.proxima_visita}*\n`
        mensaje += `🏢 Cliente: ${r.nombre_cliente}\n`
        mensaje += `👤 Vendedor: ${r.nombre_empleado}\n\n`
      })
    }

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  const exportarPDF = () => {
    const doc = jsPDF()
    doc.text(`Reporte de ${tipoReporte}`, 14, 15)
    
    const body = filasFiltradas.map(r => {
      if (tipoReporte === 'asistencia') return [r.fecha, r.nombre_empleado, r.hora_ingreso, r.hora_salida]
      return [r.fecha, r.nombre_empleado, r.nombre_cliente, r.motivo, r.valor_transaccion, r.proxima_visita]
    })

    const head = tipoReporte === 'asistencia' 
      ? [['Fecha', 'Empleado', 'Ingreso', 'Salida']]
      : [['Fecha', 'Vendedor', 'Cliente', 'Motivo', 'Valor', 'Próx. Visita']]

    autoTable(doc, { head, body, startY: 20 })
    doc.save(`reporte_${tipoReporte}.pdf`)
  }

  const abrirMapa = (coords: string) => {
    if (!coords) return
    const cleanCoords = coords.replace(/[()]/g, '')
    window.open(`https://www.google.com/maps?q=${cleanCoords}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <AdminNav />
      <main className="p-4 lg:p-8 pt-24">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 p-6 rounded-[30px] border border-white/10">
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter">Reportes</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Panel de Control Operativo</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={enviarWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase px-6 py-3 rounded-2xl transition-all flex items-center gap-2"
              >
                <span>WhatsApp</span>
              </button>
              <button 
                onClick={exportarPDF}
                className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase px-6 py-3 rounded-2xl transition-all"
              >
                PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white/5 p-6 rounded-[30px] border border-white/10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Tipo de Reporte</label>
              <select 
                value={tipoReporte} 
                onChange={(e) => setTipoReporte(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-2xl p-3 text-xs font-bold outline-none focus:border-amber-500"
              >
                <option value="asistencia">Asistencia Diaria</option>
                <option value="visitas">Gestión de Visitas</option>
                <option value="proximas">Agenda Próximas Visitas</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Desde</label>
              <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-3 text-xs font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Hasta</label>
              <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-3 text-xs font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Filtro Empleado</label>
              <select value={filtroEmpleado} onChange={(e) => setFiltroEmpleado(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-3 text-xs font-bold">
                <option value="">Todos los empleados</option>
                {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white/5 rounded-[40px] border border-white/10 overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-6 text-[10px] font-black uppercase text-slate-500">Detalles del Registro</th>
                  {tipoReporte !== 'asistencia' && <th className="p-6 text-center text-[10px] font-black uppercase text-slate-500">Multimedia</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filasFiltradas.map((r, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-[10px] font-black bg-amber-500 text-black px-3 py-1 rounded-full uppercase italic">
                          {r.fecha}
                        </span>
                        <span className="text-xs font-black uppercase tracking-tight text-slate-300">
                          {r.nombre_empleado}
                        </span>
                      </div>
                      
                      {tipoReporte === 'asistencia' ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl">
                            <p className="text-[8px] font-black text-emerald-500 uppercase">Ingreso</p>
                            <p className="text-lg font-black text-emerald-400">{r.hora_ingreso || '--:--'}</p>
                          </div>
                          <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl">
                            <p className="text-[8px] font-black text-rose-500 uppercase">Salida</p>
                            <p className="text-lg font-black text-rose-400">{r.hora_salida || '--:--'}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-lg font-black leading-tight">{r.nombre_cliente}</p>
                          <div className="flex items-center gap-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                              <span className="text-amber-500">◆</span> {r.motivo}
                            </p>
                            {r.valor_transaccion > 0 && (
                              <p className="text-sm font-black text-emerald-400 tracking-tighter">
                                Recaudado: ${r.valor_transaccion}
                              </p>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 italic leading-tight max-w-[250px] break-words">
                            {r.observaciones ? `"${r.observaciones}"` : 'Sin observaciones'}
                          </p>
                          {r.proxima_visita && (
                            <p className="text-[9px] font-black text-amber-500 uppercase border-t border-white/5 pt-1">
                              📅 Prox: {r.proxima_visita}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    {tipoReporte !== 'asistencia' && (
                      <td className="p-6 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <img 
                            src={r.foto_local} 
                            className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-md cursor-pointer" 
                            onClick={() => window.open(r.foto_local, '_blank')}
                          />
                          <button onClick={() => abrirMapa(r.ubicacion_gps)} className="text-[8px] font-black text-blue-400 uppercase">📍 Mapa</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}