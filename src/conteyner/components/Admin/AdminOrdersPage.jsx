import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Фикс иконок для Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        // Загружаем все заказы для админа
        fetch('https://voxelmarket-backend.onrender.com/api/admin/orders')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setOrders(data);
            })
            .catch(err => console.error("Ошибка загрузки заказов:", err));
    }, []);

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h1 style={{ marginBottom: '20px' }}>Панель администратора: Все заказы</h1>
            
            {orders.length === 0 ? (
                <p style={{ color: '#777' }}>Нет активных заказов.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {orders.map(order => (
                        <div key={order._id} style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '10px', background: '#fafafa', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span><strong>Email клиента:</strong> {order.userEmail}</span>
                                <span style={{ backgroundColor: '#eef2ff', color: '#0056b3', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                    Код: {order.code}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                                {order.productImage && (
                                    <img src={order.productImage} alt={order.productName} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                                )}
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0' }}>{order.productName}</h3>
                                    <p style={{ margin: '0 0 5px 0', color: '#28a745', fontWeight: 'bold' }}>{order.price} ֏</p>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>📞 Тел: {order.phone}</p>
                                </div>
                            </div>

                            <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                                📍 <strong>Адрес доставки:</strong> {order.address}
                            </p>

                            {/* Карта с точной меткой клиента */}
                            {order.coordinates && order.coordinates.length === 2 && (
                                <div style={{ height: '250px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc' }}>
                                    <MapContainer center={order.coordinates} zoom={16} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; OpenStreetMap contributors'
                                        />
                                        <Marker position={order.coordinates}>
                                            <Popup>
                                                <strong>Куда везти:</strong><br />
                                                {order.address}<br />
                                                Телефон: {order.phone}
                                            </Popup>
                                        </Marker>
                                    </MapContainer>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}