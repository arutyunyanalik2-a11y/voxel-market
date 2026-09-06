import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import appStorage from "../../../storage.js";
import 'leaflet/dist/leaflet.css';

// Если у вас эти хелперы уже определены/импортированы в оригинальном файле —
// оставьте свои версии, здесь просто заглушки для целостности примера.
function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
}

function MapClickHandler({ setMarkerPosition }) {
    useMapEvents({
        click(e) {
            setMarkerPosition([e.latlng.lat, e.latlng.lng]);
        },
    });
    return null;
}

export default function ProfilePage() {
    const [isAuthChecked, setIsAuthChecked] = useState(false);

    const [email, setEmail] = useState("");
    const [avatar, setAvatar] = useState("");

    const [addresses, setAddresses] = useState([]);
    const [orders, setOrders] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [markerPosition, setMarkerPosition] = useState(null);
    const [mapCenter, setMapCenter] = useState([40.1872, 44.5152]);
    const [streetName, setStreetName] = useState("");
    const [isMultiStory, setIsMultiStory] = useState(false);
    const [floor, setFloor] = useState("");
    const [apartment, setApartment] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        async function loadProfileData() {
            try {
                const authStatus = await appStorage.get('isAuthenticated');

                if (authStatus !== 'true') {
                    navigate('/login');
                    return;
                }

                setIsAuthChecked(true);

                const userEmail = (await appStorage.get('userEmail')) || '';
                setEmail(userEmail);

                const userAvatar = (await appStorage.get('userAvatar')) || '';
                setAvatar(userAvatar);

                if (userEmail) {
                    try {
                        const addrRes = await fetch(`https://voxelmarket-backend.onrender.com/api/users/addresses/${userEmail}`);
                        const addrData = await addrRes.json();
                        if (Array.isArray(addrData)) setAddresses(addrData);
                    } catch (err) {
                        console.error("Ошибка загрузки адресов:", err);
                    }

                    try {
                        const ordRes = await fetch(`https://voxelmarket-backend.onrender.com/api/orders/user/${userEmail}`);
                        const ordData = await ordRes.json();
                        if (Array.isArray(ordData)) setOrders(ordData);
                    } catch (err) {
                        console.error("Ошибка загрузки заказов:", err);
                    }
                }
            } catch (error) {
                console.error("Ошибка инициализации профиля:", error);
                navigate('/login');
            }
        }

        loadProfileData();
    }, [navigate]);

    const handleLogout = async () => {
        await appStorage.remove('isAuthenticated');
        await appStorage.remove('userEmail');
        await appStorage.remove('userAvatar');
        navigate('/login');
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error("Ошибка при поиске адреса:", error);
        }
    };

    const handleSelectSearchResult = (result) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        setMapCenter([lat, lon]);
        setMarkerPosition([lat, lon]);

        const shortName = result.display_name.split(',')[0];
        setStreetName(shortName);

        setSearchResults([]);
        setSearchQuery("");
    };

    const handleSaveAddress = async () => {
        if (!markerPosition) {
            alert("Пожалуйста, поставьте метку на карте или найдите адрес через поиск!");
            return;
        }
        if (!streetName) {
            alert("Пожалуйста, укажите название улицы/дома!");
            return;
        }

        const newAddress = {
            coordinates: markerPosition,
            street: streetName,
            isMultiStory,
            floor: isMultiStory ? floor : null,
            apartment: isMultiStory ? apartment : null,
        };

        try {
            const response = await fetch(`https://voxelmarket-backend.onrender.com/api/users/addresses/${email}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAddress)
            });

            if (response.ok) {
                const updatedAddresses = await response.json();
                setAddresses(updatedAddresses);

                setMarkerPosition(null);
                setStreetName("");
                setIsMultiStory(false);
                setFloor("");
                setApartment("");
                setSearchQuery("");
                setSearchResults([]);
                setIsModalOpen(false);
            } else {
                alert("Ошибка при сохранении адреса.");
            }
        } catch (error) {
            console.error("Ошибка:", error);
            alert("Ошибка сети. Сервер запущен?");
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm("Вы уверены, что хотите удалить этот адрес?")) return;

        try {
            const response = await fetch(`https://voxelmarket-backend.onrender.com/api/users/addresses/${email}/${addressId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                const updatedAddresses = await response.json();
                setAddresses(updatedAddresses);
            } else {
                alert("Ошибка при удалении адреса.");
            }
        } catch (error) {
            console.error("Ошибка сети:", error);
            alert("Ошибка сети. Сервер запущен?");
        }
    };

    // Пока не подтвердили авторизацию — ничего не показываем,
    // чтобы профиль не "мигал" на экране до редиректа.
    if (!isAuthChecked) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Загрузка...</p>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
                <h1>Личный кабинет</h1>
                <div className="profile-info" style={{ textAlign: 'center', margin: '20px 0' }}>
                    {avatar ? (
                        <img
                            src={avatar}
                            alt="Avatar"
                            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }}
                        />
                    ) : (
                        <div style={{ fontSize: '50px', marginBottom: '10px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                    )}
                    <p><strong>Email:</strong> {email}</p>
                </div>

                <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />

                <div className="orders-section">
                    <h2 style={{ marginBottom: '15px' }}>Мои заказы</h2>
                    {orders.length === 0 ? (
                        <p style={{ color: '#777', textAlign: 'center' }}>У вас пока нет активных заказов.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {orders.map((order) => (
                                <div key={order._id} style={{ border: '1px solid #e0e0e0', padding: '15px', borderRadius: '10px', backgroundColor: '#ffffff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '14px', color: '#666' }}>Код для получения:</span>
                                        <span style={{ backgroundColor: '#eef2ff', color: '#0056b3', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '18px', letterSpacing: '2px' }}>
                                            {order.code}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        {order.productImage && (
                                            <img src={order.productImage} alt={order.productName} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                                        )}
                                        <div>
                                            <h4 style={{ margin: '0 0 5px 0' }}>{order.productName}</h4>
                                            <p style={{ margin: 0, fontWeight: 'bold', color: '#28a745' }}>{order.price} ֏</p>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '12px', fontSize: '13px', color: '#777', borderTop: '1px solid #f0f0f0', paddingTop: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <span className="status" style={{ fontWeight: 'bold' }}>Статус:</span>
                                            <span style={{
                                                backgroundColor:
                                                    order.status === 'Доставка' ? '#d4edda' :
                                                    order.status === 'В печать' ? '#fff3cd' : '#f8f9fa',
                                                color:
                                                    order.status === 'Доставка' ? '#155724' :
                                                    order.status === 'В печать' ? '#856404' : '#495057',
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontWeight: 'bold',
                                                border: '1px solid #e0e0e0'
                                            }}>
                                                {order.status || 'Оформлен'}
                                            </span>
                                        </div>
                                        <div>Адрес: {order.address}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <hr style={{ margin: '30px 0 20px 0', border: 'none', borderTop: '1px solid #eee' }} />

                <div className="addresses-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h2>Мои адреса доставки</h2>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            + Добавить адрес
                        </button>
                    </div>

                    {addresses.length === 0 ? (
                        <p style={{ color: '#777', textAlign: 'center' }}>У вас пока нет сохраненных адресов.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {addresses.map((addr) => (
                                <div key={addr._id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 5px 0' }}>{addr.street}</h4>
                                        {addr.isMultiStory && (
                                            <p style={{ margin: '0', fontSize: '14px', color: '#555' }}>
                                                Многоэтажный дом • Этаж: {addr.floor || '-'} • Квартира: {addr.apartment || '-'}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteAddress(addr._id)}
                                        style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <hr style={{ margin: '30px 0 20px 0', border: 'none', borderTop: '1px solid #eee' }} />

                <button onClick={handleLogout} style={{ backgroundColor: '#ff4d4d', width: '100%', padding: '12px', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Выйти из аккаунта
                </button>
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginTop: 0 }}>Поиск и выбор адреса</h2>

                        <div style={{ position: 'relative', marginBottom: '15px', zIndex: 2000 }}>
                            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    placeholder="Например: Ереван, Абовяна 10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                                />
                                <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                                    Найти
                                </button>
                            </form>

                            {searchResults.length > 0 && (
                                <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '5px', maxHeight: '200px', overflowY: 'auto', listStyle: 'none', padding: 0, margin: '5px 0 0 0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                    {searchResults.map((result) => (
                                        <li
                                            key={result.place_id}
                                            onClick={() => handleSelectSearchResult(result)}
                                            style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: '14px' }}
                                            onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                                            onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                                        >
                                            {result.display_name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div style={{ height: '300px', width: '100%', marginBottom: '15px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc', position: 'relative', zIndex: 1 }}>
                            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <MapUpdater center={mapCenter} />
                                <MapClickHandler setMarkerPosition={setMarkerPosition} />
                                {markerPosition && <Marker position={markerPosition} />}
                            </MapContainer>
                        </div>

                        <div className="address-form" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input
                                type="text"
                                placeholder="Название улицы и номер дома..."
                                value={streetName}
                                onChange={(e) => setStreetName(e.target.value)}
                                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' }}
                            />

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                <input
                                    type="checkbox"
                                    checked={isMultiStory}
                                    onChange={(e) => setIsMultiStory(e.target.checked)}
                                    style={{ transform: 'scale(1.2)' }}
                                />
                                Это многоэтажный дом
                            </label>

                            {isMultiStory && (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        placeholder="Этаж"
                                        value={floor}
                                        onChange={(e) => setFloor(e.target.value)}
                                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '50%', boxSizing: 'border-box' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Квартира/Дверь"
                                        value={apartment}
                                        onChange={(e) => setApartment(e.target.value)}
                                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '50%', boxSizing: 'border-box' }}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button
                                    onClick={handleSaveAddress}
                                    style={{ flex: 1, backgroundColor: '#007bff', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Сохранить адрес
                                </button>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    style={{ flex: 1, backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}