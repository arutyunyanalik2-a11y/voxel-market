import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import './dashboard.css';

// Исправление стандартных иконок маркеров Leaflet в React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Выносим URL API для легкой настройки при деплое
const API_BASE_URL = 'https://voxelmarket-backend.onrender.com/api';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: '3D Модели',
        description: '',
        format: '.vox',
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [notification, setNotification] = useState(null);
    const [selectedOrderMap, setSelectedOrderMap] = useState(null);

    const notificationTimeoutRef = useRef(null);

    const showNotification = (msg) => {
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }
        setNotification(msg);
        notificationTimeoutRef.current = setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    useEffect(() => {
        return () => {
            if (notificationTimeoutRef.current) {
                clearTimeout(notificationTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const [productsRes, ordersRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/products`),
                    fetch(`${API_BASE_URL}/orders`)
                ]);

                if (isMounted) {
                    if (productsRes.ok) {
                        const pData = await productsRes.json();
                        setProducts(Array.isArray(pData) ? pData : []);
                    }
                    if (ordersRes.ok) {
                        const oData = await ordersRes.json();
                        setOrders(Array.isArray(oData) ? oData : []);
                    }
                }
            } catch (error) {
                console.error("Ошибка загрузки данных:", error);
                if (isMounted) showNotification("Ошибка при загрузке данных с сервера");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchDashboardData();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showNotification('Файл слишком большой! Максимум 5MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.price || !imagePreview) {
            showNotification('Заполните название, цену и загрузите изображение!');
            return;
        }

        const newProductData = {
            ...formData,
            price: Number(formData.price),
            image: imagePreview,
            createdAt: new Date().toLocaleDateString('ru-RU')
        };

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProductData)
            });

            if (response.ok) {
                const savedProduct = await response.json().catch(() => null);
                const createdItem = savedProduct || { id: Date.now(), ...newProductData };

                setProducts(prev => [createdItem, ...prev]);
                setFormData({
                    name: '',
                    price: '',
                    category: '3D Модели',
                    description: '',
                    format: '.vox'
                });
                setImagePreview(null);
                showNotification('Товар успешно добавлен!');
                setActiveTab('products');
            } else {
                showNotification('Ошибка при добавлении товара на сервер.');
            }
        } catch (error) {
            console.error("Ошибка:", error);
            showNotification('Ошибка связи с сервером!');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/products/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    setProducts(prev => prev.filter(p => (p._id || p.id) !== id));
                    showNotification('Товар удален.');
                } else {
                    showNotification('Ошибка при удалении товара.');
                }
            } catch (error) {
                console.error("Ошибка:", error);
                showNotification('Ошибка связи с сервером!');
            }
        }
    };

    const handleDeleteOrder = async (id) => {
        if (window.confirm('Завершить и удалить этот заказ?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    setOrders(prev => prev.filter(order => order._id !== id));
                    showNotification('Заказ выполнен и удален');
                } else {
                    showNotification('Ошибка при удалении заказа');
                }
            } catch (error) {
                console.error("Ошибка:", error);
                showNotification('Ошибка связи с сервером!');
            }
        }
    };

    // --- НОВАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ СТАТУСА ---
    const handleStatusChange = async (id, newStatus) => {
        // Оптимистичное обновление (UI меняется сразу)
        setOrders(prevOrders => prevOrders.map(order => 
            order._id === id ? { ...order, status: newStatus } : order
        ));

        try {
            // Отправляем на сервер PATCH запрос с новым статусом
            const response = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                showNotification(`Статус изменен на "${newStatus}"`);
            } else {
                console.log('Бэкенд пока не принял статус, сохранено локально.');
            }
        } catch (error) {
            console.error("Ошибка при обновлении статуса:", error);
        }
    };

    // Функция для определения цвета в зависимости от статуса
    const getStatusColor = (status) => {
        switch (status) {
            case 'Печать': return '#cce5ff';    // Голубой
            case 'Доставка': return '#d4edda';  // Зеленый
            case 'Оформлен': 
            default: return '#fff3cd';          // Желтый (начальный)
        }
    };

    const handleLogout = () => {
        navigate('/admin');
    };

    const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.price) || 0), 0);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="dashboard-section" style={{ textAlign: 'center', padding: '50px' }}>
                    <h3>Загрузка данных...</h3>
                </div>
            );
        }

        switch (activeTab) {
            case 'overview':
                return (
                    <div className="dashboard-section">
                        <h2>Обзор системы</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <h3>Всего товаров</h3>
                                <p className="stat-value">{products.length}</p>
                            </div>
                            <div className="stat-card">
                                <h3>Заказы</h3>
                                <p className="stat-value">{orders.length}</p>
                            </div>
                            <div className="stat-card">
                                <h3>Выручка</h3>
                                <p className="stat-value">{totalRevenue.toLocaleString('ru-RU')} ֏</p>
                            </div>
                        </div>

                        <div className="quick-actions">
                            <h3>Быстрые действия</h3>
                            <div className="actions-buttons">
                                <button className="action-btn" onClick={() => setActiveTab('add-product')}>
                                    + Добавить товар
                                </button>
                                <button className="action-btn secondary" onClick={() => setActiveTab('products')}>
                                    Все товары
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'products':
                return (
                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Каталог ({products.length})</h2>
                            <button className="primary-btn desktop-only" onClick={() => setActiveTab('add-product')}>
                                + Добавить
                            </button>
                        </div>

                        {products.length === 0 ? (
                            <div className="empty-state">
                                <h3>Список товаров пуст</h3>
                                <p>Вы еще не добавили ни одного товара.</p>
                            </div>
                        ) : (
                            <div className="products-grid">
                                {products.map(product => {
                                    const productId = product._id || product.id;
                                    return (
                                        <div key={productId} className="product-admin-card">
                                            <div className="product-img-wrapper">
                                                <img src={product.image} alt={product.name || 'Товар'} />
                                                <span className="product-badge">{product.category}</span>
                                            </div>
                                            <div className="product-info">
                                                <h4>{product.name}</h4>
                                                <p className="product-format">Формат: {product.format}</p>
                                                <p className="product-desc">{product.description || 'Без описания'}</p>
                                                <div className="product-footer">
                                                    <span className="product-price">
                                                        {(Number(product.price) || 0).toLocaleString('ru-RU')} ֏
                                                    </span>
                                                    <button 
                                                        className="delete-btn"
                                                        onClick={() => handleDeleteProduct(productId)}
                                                    >
                                                        Удалить
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );

            case 'add-product':
                return (
                    <div className="dashboard-section">
                        <h2>Добавление товара</h2>
                        <form className="add-product-form" onSubmit={handleAddProduct}>
                            {/* ... (остальной код формы без изменений) ... */}
                            <div className="form-group">
                                <label>Название товара *</label>
                                <input 
                                    type="text" 
                                    name="name"
                                    placeholder="Например: Voxel City" 
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group row">
                                <div className="third">
                                    <label>Цена (֏) *</label>
                                    <input 
                                        type="number" 
                                        name="price"
                                        placeholder="500" 
                                        min="0"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="third">
                                    <label>Категория</label>
                                    <select name="category" value={formData.category} onChange={handleInputChange}>
                                        <option value="3D Модели">3D Модели</option>
                                        <option value="Текстуры & Скины">Текстуры & Скины</option>
                                        <option value="Персонажи">Персонажи</option>
                                        <option value="Окружение">Окружение</option>
                                    </select>
                                </div>
                                <div className="third">
                                    <label>Формат</label>
                                    <select name="format" value={formData.format} onChange={handleInputChange}>
                                        <option value=".vox">.vox</option>
                                        <option value=".obj">.obj</option>
                                        <option value=".gltf">GLTF/GLB</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Описание</label>
                                <textarea 
                                    name="description"
                                    placeholder="Подробности о модели..." 
                                    rows="4"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                ></textarea>
                            </div>

                            <div className="form-group">
                                <label>Изображение *</label>
                                {!imagePreview ? (
                                    <label className="file-upload-area">
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleImageChange}
                                            style={{ display: 'none' }}
                                        />
                                        <span>Нажмите для загрузки</span>
                                    </label>
                                ) : (
                                    <div className="image-preview-container">
                                        <img src={imagePreview} alt="Превью" className="image-preview" />
                                        <button type="button" className="remove-image-btn" onClick={handleRemoveImage}>
                                            Удалить
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="save-btn" disabled={isSubmitting}>
                                {isSubmitting ? 'Публикация...' : 'Опубликовать'}
                            </button>
                        </form>
                    </div>
                );

            case 'orders':
                return (
                    <div className="dashboard-section">
                        <h2>Список заказов</h2>
                        {orders.length === 0 ? (
                            <div className="empty-state">
                                <h3>Заказов пока нет</h3>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Код заказа</th>
                                            <th>Покупатель (Email)</th>
                                            <th>Товар</th>
                                            <th>Телефон</th>
                                            <th>Адрес / Местоположение</th>
                                            <th>Сумма</th>
                                            <th>Статус</th> {/* НОВЫЙ СТОЛБЕЦ */}
                                            <th>Действие</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(order => {
                                            const currentStatus = order.status || 'Оформлен';
                                            return (
                                                <tr key={order._id}>
                                                    <td><strong style={{ color: '#0056b3' }}>#{order.code}</strong></td>
                                                    <td>{order.userEmail}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {order.productImage && (
                                                                <img src={order.productImage} alt="" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} />
                                                            )}
                                                            <span>{order.productName}</span>
                                                        </div>
                                                    </td>
                                                    <td>{order.phone}</td>
                                                    <td>
                                                        <span>{order.address || 'Адрес не указан'}</span>
                                                        {order.address && (
                                                            <div style={{ marginTop: '5px' }}>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => setSelectedOrderMap(order)}
                                                                    style={{ backgroundColor: '#17a2b8', color: 'white', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                                                                >
                                                                    🗺️ На карте Leaflet
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>{(Number(order.price) || 0).toLocaleString('ru-RU')} ֏</td>
                                                    
                                                    {/* ВЫПАДАЮЩЕЕ ОКНО СТАТУСА */}
                                                    <td>
                                                        <select
                                                            value={currentStatus}
                                                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                            style={{
                                                                padding: '6px',
                                                                borderRadius: '6px',
                                                                border: '1px solid #ced4da',
                                                                backgroundColor: getStatusColor(currentStatus),
                                                                color: '#212529',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                outline: 'none'
                                                            }}
                                                        >
                                                            <option value="Оформлен">Оформлен</option>
                                                            <option value="Печать">Печать</option>
                                                            <option value="Доставка">Доставка</option>
                                                            {/* Здесь можно будет легко добавить новые пункты */}
                                                        </select>
                                                    </td>

                                                    <td>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleDeleteOrder(order._id)}
                                                            style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                                        >
                                                            Завершить
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="dashboard-layout">
            {notification && (
                <div className="toast-notification">
                    {notification}
                </div>
            )}

            {/* Модальное окно с Leaflet картой */}
            {selectedOrderMap && (
                <LeafletMapModal 
                    order={selectedOrderMap} 
                    onClose={() => setSelectedOrderMap(null)} 
                />
            )}

            <aside className="dashboard-sidebar">
                <div className="sidebar-logo">
                    <h2>Voxel Market <br/><span>Admin Panel</span></h2>
                </div>
                <nav className="sidebar-nav">
                    <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
                        <span className="nav-text">Обзор</span>
                    </button>
                    <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
                        <span className="nav-text">Товары</span>
                    </button>
                    <button className={activeTab === 'add-product' ? 'active' : ''} onClick={() => setActiveTab('add-product')}>
                        <span className="nav-text">Добавить</span>
                    </button>
                    <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
                        <span className="nav-text">Заказы</span>
                    </button>
                </nav>
                <div className="sidebar-footer">
                    <button className="logout-dir logout-btn" onClick={handleLogout}>
                        Выйти
                    </button>
                </div>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="mobile-header-brand">
                        <h2>Voxel Admin</h2>
                    </div>
                    <div className="header-actions">
                        <div className="header-status">
                            <span className="status-dot"></span> <span className="status-text">В сети</span>
                        </div>
                    </div>
                </header>
                <div className="dashboard-content">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

// Вспомогательный компонент для Leaflet модалки
function LeafletMapModal({ order, onClose }) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const [loadingGeo, setLoadingGeo] = useState(true);
    const [geoError, setGeoError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        function initMap() {
            try {
                setLoadingGeo(true);
                setGeoError(null);

                if (!order.coordinates || order.coordinates.length !== 2) {
                    setGeoError('У этого заказа нет точных координат метки.');
                    setLoadingGeo(false);
                    return;
                }

                const lat = parseFloat(order.coordinates[0]);
                const lon = parseFloat(order.coordinates[1]);

                setLoadingGeo(false);

                setTimeout(() => {
                    if (!mapContainerRef.current || !isMounted) return;

                    if (mapInstanceRef.current) {
                        mapInstanceRef.current.remove();
                    }

                    const map = L.map(mapContainerRef.current).setView([lat, lon], 17);
                    mapInstanceRef.current = map;

                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '&copy; OpenStreetMap contributors'
                    }).addTo(map);

                    L.marker([lat, lon])
                        .addTo(map)
                        .bindPopup(`<b>Заказ #${order.code}</b><br/>${order.address}`)
                        .openPopup();
                }, 100);

            } catch (err) {
                console.error("Ошибка карты:", err);
                if (isMounted) {
                    setGeoError('Ошибка загрузки карты.');
                    setLoadingGeo(false);
                }
            }
        }

        initMap();

        return () => {
            isMounted = false;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [order]);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={onClose}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '650px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>Точная метка заказчика (#{order.code})</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                </div>
                <p style={{ margin: '0 0 10px 0', color: '#555' }}><strong>Адрес:</strong> {order.address}</p>
                
                <div style={{ width: '100%', height: '350px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #ddd', position: 'relative', background: '#f8f9fa' }}>
                    {loadingGeo && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#666', fontWeight: 'bold' }}>
                            Загрузка метки...
                        </div>
                    )}
                    {geoError && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#dc3545', textAlign: 'center', padding: '20px' }}>
                            {geoError}
                        </div>
                    )}
                    <div ref={mapContainerRef} style={{ width: '100%', height: '100%', display: loadingGeo || geoError ? 'none' : 'block' }} />
                </div>

                <div style={{ textAlign: 'right', marginTop: '15px' }}>
                    <button 
                        onClick={onClose}
                        style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
}