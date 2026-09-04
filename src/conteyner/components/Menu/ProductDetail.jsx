import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./style.css";

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // Состояния товара
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    // Состояния для оформления заказа
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [phone, setPhone] = useState("");

    // Получаем email текущего пользователя (если он авторизован)
    const userEmail = localStorage.getItem('userEmail');

    useEffect(() => {
        // 1. Загружаем данные товара
        fetch(`https://voxelmarket-backend.onrender.com/api/products/${id}`)
            .then(res => res.json())
            .then(data => {
                setProduct(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Ошибка загрузки товара:", err);
                setLoading(false);
            });

        // 2. Загружаем адреса пользователя, если он вошел в систему
        if (userEmail) {
            fetch(`https://voxelmarket-backend.onrender.com/api/users/addresses/${userEmail}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setAddresses(data);
                    }
                })
                .catch(err => console.error("Ошибка загрузки адресов:", err));
        }
    }, [id, userEmail]);

    // Функция добавления текущего товара в localStorage (корзину)
    const addToCart = () => {
        if (!product) return;
        
        const cart = JSON.parse(localStorage.getItem('voxel_cart')) || [];
        const existingIndex = cart.findIndex(item => item._id === product._id);

        if (existingIndex > -1) {
            cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        localStorage.setItem('voxel_cart', JSON.stringify(cart));
        alert('Товар успешно добавлен в корзину!');
    };

    const handleOpenModal = () => {
        if (!userEmail) {
            alert("Пожалуйста, войдите в аккаунт, чтобы оформить заказ.");
            navigate('/login');
            return;
        }
        setIsModalOpen(true);
    };

    const handleOrderSubmit = async () => {
        if (!selectedAddress) {
            alert("Пожалуйста, выберите адрес доставки!");
            return;
        }
        if (!phone.trim()) {
            alert("Пожалуйста, введите номер телефона!");
            return;
        }

        // Проверяем, есть ли координаты у выбранного адреса
        if (!selectedAddress.coordinates || selectedAddress.coordinates.length === 0) {
            alert("У выбранного адреса отсутствуют координаты. Пожалуйста, пересоздайте адрес в профиле с использованием карты.");
            return;
        }

        // Формируем красивую строку с адресом (включая этаж и квартиру, если есть)
        let fullAddress = selectedAddress.street;
        if (selectedAddress.isMultiStory) {
            fullAddress += `, Этаж: ${selectedAddress.floor || '-'}, Кв: ${selectedAddress.apartment || '-'}`;
        }

        // Собираем данные заказа
        const orderData = {
            userEmail, // Чтобы потом показать заказ в профиле
            productName: product.name,
            productImage: product.image,
            price: product.price,
            phone: phone,
            address: fullAddress,
            coordinates: selectedAddress.coordinates // Координаты для карты в админке
        };

        try {
            const response = await fetch('https://voxelmarket-backend.onrender.com/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const savedOrder = await response.json();
                alert(`Успешно! Заказ оформлен.\nВаш код для получения: ${savedOrder.code}`);
                setIsModalOpen(false);
                setPhone("");
            } else {
                const errorData = await response.json();
                alert(`Ошибка при оформлении заказа: ${errorData.message || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            console.error("Ошибка:", error);
            alert("Ошибка сети. Сервер запущен?");
        }
    };

    if (loading) return <p style={{ padding: '20px' }}>Загрузка...</p>;
    if (!product) return <p style={{ padding: '20px' }}>Товар не найден</p>;

    return (
        <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
            <button 
                className="back-button"
                onClick={() => navigate(-1)} 
                style={{ marginBottom: '20px', padding: '8px 15px', cursor: 'pointer' }}
            >
                ← Назад
            </button>
            
            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                <img 
                    src={product.image} 
                    alt={product.name} 
                    style={{ width: '350px', height: '350px', objectFit: 'cover', borderRadius: '8px' }} 
                />
                <div style={{ flex: 1 }}>
                    <h1>{product.name}</h1>
                    <p style={{ color: '#777', fontSize: '16px' }}>Категория: {product.category}</p>
                    <p style={{ fontSize: '15px', margin: '15px 0' }}>{product.description || "Описание отсутствует"}</p>
                    <p style={{ fontSize: '14px', color: '#555' }}>Формат: {product.format}</p>
                    <p style={{ fontWeight: 'bold', fontSize: '24px', margin: '20px 0' }}>{product.price} ֏</p>
                    
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button 
                            className="karzinu1" 
                            style={{ padding: '12px 20px', fontSize: '16px' }}
                            onClick={addToCart}
                        >
                            В корзину
                        </button>
                        <button 
                        className="order-button"
                            onClick={handleOpenModal}
                        >
                            Оформить заказ
                        </button>
                    </div>
                </div>
            </div>

            {/* МОДАЛЬНОЕ ОКНО ОФОРМЛЕНИЯ ЗАКАЗА */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '450px' }}>
                        <h2 style={{ marginTop: 0 }}>Оформление заказа</h2>
                        
                        {/* Выбор адреса */}
                        <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 10px 0' }}>1. Выберите адрес доставки:</h4>
                            {addresses.length === 0 ? (
                                <p style={{ color: 'red', fontSize: '14px' }}>У вас нет сохраненных адресов. Добавьте их в Личном кабинете.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '150px', overflowY: 'auto', padding: '5px' }}>
                                    {addresses.map((addr, index) => (
                                        <label key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '10px', border: selectedAddress === addr ? '2px solid #007bff' : '1px solid #ddd', borderRadius: '8px', backgroundColor: selectedAddress === addr ? '#f0f8ff' : '#fafafa' }}>
                                            <input 
                                                type="radio" 
                                                name="address" 
                                                checked={selectedAddress === addr}
                                                onChange={() => setSelectedAddress(addr)}
                                                style={{ marginTop: '4px' }}
                                            />
                                            <div>
                                                <strong style={{ display: 'block' }}>{addr.street}</strong>
                                                {addr.isMultiStory && (
                                                    <span style={{ fontSize: '13px', color: '#555' }}>
                                                        Этаж: {addr.floor || '-'}, Кв: {addr.apartment || '-'}
                                                    </span>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Ввод телефона */}
                        <div style={{ marginBottom: '25px' }}>
                            <h4 style={{ margin: '0 0 10px 0' }}>2. Ваш номер телефона:</h4>
                            <input 
                                type="tel" 
                                placeholder="+374..." 
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '16px' }}
                            />
                        </div>

                        {/* Кнопки */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={handleOrderSubmit}
                                disabled={addresses.length === 0}
                                style={{ flex: 1, backgroundColor: addresses.length === 0 ? '#ccc' : '#28a745', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: addresses.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                            >
                                Подтвердить заказ
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
            )}
        </div>
    );
}