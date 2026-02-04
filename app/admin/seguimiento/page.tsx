'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'

// Paleta de colores para diferenciar vendedores
const COLORES_VENDEDORES = [
  '#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', 
  '#0891b2', '#ea580c', '#be185d', '#4f46e5', '#15803d'
];

export default function SeguimientoMapa() {
  const [visitas, setVisitas] = useState<any[]>([])
  const [vendedores, setVendedores] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVisita, setSelectedVisita] = useState<any>(null)
  const [mapaColores, setMapaColores] = useState<Record<string, string>>({})

  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0])
  const [vendedorId, setVendedorId] = useState('todos')

  // CARGA DE GOOGLE MAPS
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "TU_API_KEY_AQUÍ" // Reemplaza con tu llave real
  })

  useEffect(() => {
    inicializarDatos()
  }, [])

  // Esta función carga los nombres de los vendedores para la leyenda y los filtros
  async function inicializarDatos() {
    const { data: vends } = await supabase.from('profiles').select('id, full_name')
    if (vends) {
      setVendedores(vends)
      // Asignar colores fijos a cada vendedor por su ID
      const colores: Record<string, string> = {}
      vends.forEach((v, index) => {
        colores[v.id] = COLORES_VENDEDORES[index % COLORES_VENDEDORES.length]
      })
      setMapaColores(colores)
    }
    fetchVisitas()
  }

  // LA FUNCIÓN ACTUALIZADA CON JOINS
  async function fetchVisitas() {
    setLoading(true)
    try {
      // Sentencia con Joins basada en tu estructura:
      // profiles:vendedor_id indica que use el ID para buscar en la tabla profiles
      let query = supabase
        .from('visitas')
        .select(`
          *,
          clientes (
            nombre_local
          ),
          profiles:vendedor_id (
            full_name
          )
        `)
        .eq('fecha', fechaFiltro)

      if (vendedorId !== 'todos') {
        query = query.eq('vendedor_id', vendedorId)
      }

      const { data, error } = await query
      if (error) throw error

      // Procesar coordenadas GPS
      const procesadas = (data || [])
        .filter(v => v.ubicacion_gps?.includes(','))
        .map(v => {
          const [lat, lng] = v.ubicacion_gps.split(',')
          return {
            ...v,
            position: { 
              lat: parseFloat(lat.trim()), 
              lng: parseFloat(lng.trim()) 
            }
          }
        })
      
      setVisitas(procesadas)
    } catch (err: any) {
      console.error("Error en el mapa:", err.message)
    } finally {
      setLoading(false)
    }
  }

  const crearIcono = (color: string) => ({
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: "#ffffff",
    scale: 1.5
  })

  const containerStyle = { width: '100%', height: '75vh' }
  const center = visitas.length > 0 ? visitas[0].position : { lat: -0.1807, lng: -78.4678 }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <AdminNav />
      <main className="p-4 max-w-7xl mx-auto space-y-4">
        
        {/* PANEL DE FILTROS */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-200">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
              <input 
                type="date" 
                value={fechaFiltro} 
                onChange={(e) => setFechaFiltro(e.target.value)} 
                className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none outline-none" 
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vendedor</label>
              <select 
                value={vendedorId} 
                onChange={(e) => setVendedorId(e.target.value)} 
                className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none outline-none"
              >
                <option value="todos">Todos los vendedores</option>
                {vendedores.map(v => <option key={v.id} value={v.id}>{v.full_name}</option>)}
              </select>
            </div>
            <button 
              onClick={fetchVisitas} 
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all"
            >
              {loading ? 'Cargando...' : 'Actualizar Mapa'}
            </button>
          </div>

          {/* LEYENDA DE COLORES */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-50">
            {vendedores.map(v => (
              <div key={v.id} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mapaColores[v.id] }}></div>
                <span className="text-[9px] font-black uppercase text-slate-600">{v.full_name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MAPA DE GOOGLE */}
        <div className="rounded-[45px] overflow-hidden shadow-2xl border-4 border-white bg-white relative">
          {isLoaded ? (
            <GoogleMap 
              mapContainerStyle={containerStyle} 
              center={center} 
              zoom={13}
            >
              {visitas.map((visita) => (
                <Marker 
                  key={visita.id} 
                  position={visita.position} 
                  icon={crearIcono(mapaColores[visita.vendedor_id] || '#333')}
                  onClick={() => setSelectedVisita(visita)}
                />
              ))}

              {selectedVisita && (
                <InfoWindow 
                  position={selectedVisita.position} 
                  onCloseClick={() => setSelectedVisita(null)}
                >
                  <div className="p-1 max-w-[180px] font-sans">
                    <img 
                      src={selectedVisita.foto_local} 
                      className="w-full h-24 object-cover rounded-lg mb-2 shadow-sm" 
                    />
                    <h4 className="font-black uppercase text-[10px] leading-tight text-slate-900">
                      {selectedVisita.clientes?.nombre_local || 'Local sin nombre'}
                    </h4>
                    <p className="text-[9px] font-bold text-blue-600 mt-1 uppercase">
                      🕒 {selectedVisita.hora} - {selectedVisita.motivo}
                    </p>
                    <p className="text-[9px] text-slate-400 italic">
                      Vendedor: {selectedVisita.profiles?.full_name || 'Desconocido'}
                    </p>
                    {selectedVisita.valor_transaccion > 0 && (
                      <p className="text-[10px] font-black text-emerald-600 mt-1">
                        VENTA: ${selectedVisita.valor_transaccion}
                      </p>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="h-[75vh] flex items-center justify-center font-black text-slate-300 animate-pulse">
              CONECTANDO CON SATÉLITES...
            </div>
          )}
        </div>
      </main>
    </div>
  )
}