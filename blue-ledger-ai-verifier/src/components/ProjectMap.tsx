// src/components/ProjectMap.tsx

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';

// ✅ ADD: Import marker images at the top of the file using ES Module syntax
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';


interface ProjectMapProps {
  coords: { lat: number; lng: number };
  projectName: string;
}

// Set a default icon for the marker using the imported image URLs
const markerIcon = new L.Icon({
    // ✅ FIX: Use the imported variables instead of require()
    iconUrl: iconUrl,
    iconRetinaUrl: iconRetinaUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});


export function ProjectMap({ coords, projectName }: ProjectMapProps) {
  const position: LatLngExpression = [coords.lat, coords.lng];

  return (
    <MapContainer center={position} zoom={13} scrollWheelZoom={false} className="h-full w-full rounded-lg z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={markerIcon}>
        <Popup>
          {projectName}
        </Popup>
      </Marker>
    </MapContainer>
  );
}