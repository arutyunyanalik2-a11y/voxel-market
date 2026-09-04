import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function CustomerMap({ customerLat, customerLng, customerName, customerAddress }) {
    // По умолчанию ставим центр, если координаты не пришли (например, Ереван)
    const position = [customerLat || 40.1872, customerLng || 44.5152];

    return (
        <div style={{ height: '350px', width: '100%', borderRadius: '6px', overflow: 'hidden' }}>
            <MapContainer
                center={position}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position}>
                    <Popup>
                        <strong>{customerName || "Заказчик"}</strong><br />
                        {customerAddress}
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}