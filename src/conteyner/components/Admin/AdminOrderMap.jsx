import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Фикс иконок для Leaflet в React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function AdminOrderMap({ order }) {
    // Проверяем, есть ли координаты в заказе
    if (!order || !order.coordinates || order.coordinates.length !== 2) {
        return <div style={{ padding: '20px', color: 'red' }}>Координаты доставки не указаны</div>;
    }

    const position = [order.coordinates[0], order.coordinates[1]];

    return (
        <div style={{ height: '400px', width: '100%', borderRadius: '10px', overflow: 'hidden', border: '2px solid #ddd' }}>
            <MapContainer center={position} zoom={16} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                {/* Метка с точным местом, которое выбрал клиент */}
                <Marker position={position}>
                    <Popup>
                        <strong>Адрес доставки:</strong><br />
                        {order.address}<br />
                        {order.isMultiStory && (
                            <span>Этаж: {order.floor}, Кв: {order.apartment}</span>
                        )}
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}