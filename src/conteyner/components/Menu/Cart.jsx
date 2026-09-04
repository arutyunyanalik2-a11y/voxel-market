import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { appStorage } from "../../../storage"; // Путь к вашему файлу storage.js
import "./style.css";

export default function Cart() {
    const [cartItems, setCartItems] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const loadCart = async () => {
            const savedCart = (await appStorage.get('voxel_cart')) || [];
            setCartItems(savedCart);
        };
        loadCart();
    }, []);

    const updateCart = async (newItems) => {
        setCartItems(newItems);
        await appStorage.set('voxel_cart', newItems);
    };

    const increaseQuantity = (id) => {
        const updated = cartItems.map(item => 
            item._id === id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        );
        updateCart(updated);
    };

    const decreaseQuantity = (id) => {
        const updated = cartItems.map(item => {
            if (item._id === id) {
                const newQty = (item.quantity || 1) - 1;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
        }).filter(Boolean);
        updateCart(updated);
    };

    const removeItem = (id) => {
        const updated = cartItems.filter(item => item._id !== id);
        updateCart(updated);
    };

    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    return (
        <div className="menu">
            <h1>Корзина</h1>
            
            {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <p style={{ color: '#666', marginBottom: '15px', fontSize: '15px' }}>Ваша корзина пуста</p>
                    <button className="back-button" onClick={() => navigate('/')}>Перейти к покупкам</button>
                </div>
            ) : (
                <div>
                    <div className="products-list">
                        {cartItems.map(item => (
                            <div key={item._id} className="product-card">
                                <div 
                                    onClick={() => navigate(`/product/${item._id}`)} 
                                    style={{ cursor: 'pointer' }}
                                >
                                    <img src={item.image} alt={item.name} />
                                    <h3>{item.name}</h3>
                                </div>

                                <p style={{ color: '#777', fontSize: '11px', margin: '2px 0' }}>Цена: {item.price} ₽</p>
                                <p style={{ fontWeight: 'bold', fontSize: '14px', margin: '4px 0' }}>
                                    Сумма: {item.price * (item.quantity || 1)} ₽
                                </p>
                                
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', gap: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <button className="karzinu" style={{ width: '25px', padding: '4px', margin: 0 }} onClick={() => decreaseQuantity(item._id)}>-</button>
                                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{item.quantity || 1}</span>
                                        <button className="karzinu" style={{ width: '25px', padding: '4px', margin: 0 }} onClick={() => increaseQuantity(item._id)}>+</button>
                                    </div>
                                    <button 
                                        className="karzinu" 
                                        style={{ background: '#d9534f', width: 'auto', padding: '4px 8px', margin: 0, fontSize: '10px' }} 
                                        onClick={() => removeItem(item._id)}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '25px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>Итого: {totalPrice} ₽</h3>
                    </div>
                </div>
            )}
        </div>
    );
}