'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import Link from 'next/link'

export default function ListaEmpleados() {
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmarEliminar, setConfirmarEliminar] = useState<any>(null)
  const [busqueda, setBusqueda] = useState('')
  const [estadosAsistencia, setEstadosAsistencia] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchEmpleados()
  }, [])

  async function fetchEmpleados() {
    setLoading(true)
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .order('nombres', { ascending: true })

    if (error) {
      console.error("Error al traer empleados:", error.message)
    } else {
      setEmpleados(data || [])
      fetchEstadosAsistencia(data || [])
    }
    setLoading(false)
  }

  async function fetchEstadosAsistencia(listaEmpleados: any[]) {
    const hoy = new Date().toISOString().split('T')[0]
    const estados: Record<string, any> = {}

    for (const emp of listaEmpleados) {
      const { data } = await supabase
        .from('asistencia')
        .select('*')
        .eq('empleado_id', emp.id)
        .eq('fecha', hoy)
        .order('fecha_hora', { ascending: false })
        .limit(1)
        .maybeSingle()

      estados[emp.id] = data || null
    }
    setEstadosAsistencia(estados)
  }

  const registrarMarcacion = async (empleado: any, modo: 'ingreso' | 'salida') => {
    const ahora = new Date()
    const hoyISO = ahora.toISOString() 
    const hoyISO = ahora.toISOString()
    const soloFecha = hoyISO.split('T')[0]

    const { error } = await supabase
@@ -86,6 +86,7 @@
    }
  }

  // Filtro corregido para evitar errores con valores null o undefined
  const filtrados = empleados.filter(e => 
    (e.nombres?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
    (e.rol_empresa?.toLowerCase() || '').includes(busqueda.toLowerCase())
@@ -142,69 +143,69 @@
                          {emp.nombres || 'Sin Nombre'}
                        </h2>
                        <span className="text-[7px] font-black px-2 py-0.5 bg-gray-100 text-gray-400 rounded-md uppercase tracking-tighter">
                          {emp.rol_empresa}
                          {emp.rol_empresa || 'Sin Rol'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/admin/empleados/editar/${emp.id}`} className="w-8 h-8 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center">
                        <span className="text-xs">✏️</span>
                      </Link>
                      <button onClick={() => setConfirmarEliminar(emp)} className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                        <span className="text-xs">🗑️</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-50">
                    {turnoCompletado ? (
                      <div className="w-full py-2 bg-green-50 text-green-600 rounded-xl text-[9px] font-black uppercase text-center italic">
                        ✅ Turno Finalizado
                      </div>
                    ) : (
                      <button
                        onClick={() => registrarMarcacion(emp, debeMarcarSalida ? 'salida' : 'ingreso')}
                        className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
                          debeMarcarSalida 
                          ? 'bg-orange-500 text-white shadow-orange-100' 
                          : 'bg-blue-600 text-white shadow-blue-100'
                        }`}
                      >
                        {debeMarcarSalida ? '🔔 Marcar Salida' : '⚡ Marcar Ingreso'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {confirmarEliminar && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-[45px] p-8 w-full max-w-sm text-center shadow-2xl border border-gray-100">
              <div className="text-5xl mb-4">🚫</div>
              <h2 className="text-xl font-black uppercase text-gray-900 mb-2 leading-none">Eliminar</h2>
              <p className="text-[11px] text-gray-500 mb-8 px-4 leading-relaxed">
                ¿Eliminar a <span className="font-bold text-black">{confirmarEliminar.nombres}</span>?
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={borrarEmpleado} 
                  className="w-full py-5 bg-red-600 text-white rounded-[22px] font-black uppercase transition-transform active:scale-95 shadow-lg shadow-red-100"
                >
                  Confirmar
                </button>
                <button 
                  onClick={() => setConfirmarEliminar(null)} 
                  className="w-full py-4 bg-gray-50 text-gray-400 rounded-[22px] font-black uppercase transition-transform active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )