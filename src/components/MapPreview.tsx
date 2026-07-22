"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path issues in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const customMarkerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const outletMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapPreviewProps {
  lat: number;
  lng: number;
  customerName: string;
}

// Koordinat Outlet (Dummy / Default)
const OUTLET_LAT = 0.9161; // Koordinat contoh Tanjungpinang
const OUTLET_LNG = 104.4485;

function BoundsFitter({ customerLat, customerLng }: { customerLat: number, customerLng: number }) {
  const map = useMap();
  useEffect(() => {
    if (!customerLat || !customerLng) return;
    const bounds = L.latLngBounds([
      [OUTLET_LAT, OUTLET_LNG],
      [customerLat, customerLng]
    ]);
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, customerLat, customerLng]);
  return null;
}

export default function MapPreview({ lat, lng, customerName }: MapPreviewProps) {
  if (!lat || !lng) {
    return (
      <div className="w-full h-48 bg-[#1A1A1A] rounded-xl flex items-center justify-center border border-white/5">
        <p className="text-sm text-neutral-500 font-bold">Koordinat tidak tersedia</p>
      </div>
    );
  }

  return (
    <div className="w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-white/5 relative z-0">
      <MapContainer 
        center={[lat, lng]} 
        zoom={13} 
        style={{ width: "100%", height: "100%", backgroundColor: '#1A1A1A' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Outlet Marker */}
        <Marker position={[OUTLET_LAT, OUTLET_LNG]} icon={outletMarkerIcon}>
          <Popup>Seru.ni Outlet</Popup>
        </Marker>

        {/* Customer Marker */}
        <Marker position={[lat, lng]} icon={customMarkerIcon}>
          <Popup>{customerName}</Popup>
        </Marker>

        {/* Line connection */}
        <Polyline 
          positions={[
            [OUTLET_LAT, OUTLET_LNG],
            [lat, lng]
          ]} 
          pathOptions={{ color: '#ea580c', dashArray: '5, 10', weight: 3 }} 
        />

        <BoundsFitter customerLat={lat} customerLng={lng} />
      </MapContainer>
    </div>
  );
}
