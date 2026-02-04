'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Configuración de iconos (Leaflet necesita esto para encontrar las imágenes)
const iconVisita = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const iconCliente = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MapaComponente({ visitas, puntosClientes, mostrarClientes, parseCoords }: any) {
  return (
    <MapContainer 
      center={[-0.1807, -78.4678]} 
      zoom={13} 
      style={{ height: '100%', width: '100%', borderRadius: '25px' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {visitas.map((visita: any) => {
        const pos = parseCoords(visita.geolocalizacion)
        return pos && (
          <Marker key={visita.id} position={pos} icon={iconVisita}>
            <Popup>
              <div className="text-xs">
                <p className="font-black text-blue-600 uppercase">Visita</p>
                <p className="font-bold">{visita.clientes?.nombre}</p>
                <p>{visita.usuarios?.nombre}</p>
                <p className="text-slate-400">{new Date(visita.fecha_hora).toLocaleString()}</p>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {mostrarClientes && puntosClientes.map((cliente: any) => {
        const pos = parseCoords(cliente.ubicacion_gps)
        return pos && (
          <Marker key={`cli-${cliente.id}`} position={pos} icon={iconCliente}>
            <Popup>
              <p className="font-bold uppercase text-[10px]">Cliente Base:</p>
              <p className="text-xs">{cliente.nombre}</p>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}