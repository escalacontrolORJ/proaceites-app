'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Icono para Clientes (Verde fijo)
const iconCliente = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', shadowSize: [41, 41]
});

// Función para generar iconos de colores dinámicamente
const crearIconoVisita = (color: string) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', shadowSize: [41, 41]
  });
};

export default function MapaComponente({ visitas, puntosClientes, parseCoords }: any) {
  return (
    <MapContainer center={[-0.20, -79.19]} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '30px' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {/* CAPA DE VISITAS (Color dinámico por vendedor) */}
      {visitas.map((v: any) => {
        const pos = parseCoords(v.geolocalizacion)
        // Usamos el color que viene del objeto de la visita
        const iconoColor = crearIconoVisita(v.color || 'blue');
        
        return pos && (
          <Marker key={v.id} position={pos} icon={iconoColor}>
            <Popup>
              <div className="text-[10px]">
                <p className={`font-black uppercase`} style={{ color: v.color }}>Visita Realizada</p>
                <p className="font-bold text-slate-800">{v.nombre_cliente}</p>
                <p className="text-slate-500 font-bold">Por: {v.nombre_vendedor}</p>
                <img src={v.foto} className="w-24 h-24 object-cover rounded-lg mt-2" />
                <p className="text-[8px] text-slate-400 mt-1">{v.fecha_hora}</p>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {/* CAPA DE CLIENTES BASE (VERDE) */}
      {puntosClientes.map((c: any) => {
        const pos = parseCoords(c.ubicacion_gps)
        return pos && (
          <Marker key={c.id} position={pos} icon={iconCliente}>
            <Popup>
              <div className="text-[10px]">
                <p className="font-black text-emerald-600 uppercase">Cliente Base</p>
                <p className="font-bold text-slate-800">{c.nombre_local}</p>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}