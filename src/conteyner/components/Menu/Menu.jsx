import React, { useState, useEffect } from "react";
import { Form, useNavigate, useSearchParams } from "react-router-dom";
import "./style.css";
import { Link } from "react-router-dom";
import zaxar from "./image/zaxarwith.png";

// Массив с картинками для карусели
const bannerImages = [
    "/image/baner1.jpg",
    "/image/baner2.jpg",
    "/image/baner3.png",
    "/image/baner4.png",
    "/image/baner5.png"
];

export default function Menu() {
    const [products, setProducts] = useState([]);
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';
    const navigate = useNavigate();

    const [currentSlide, setCurrentSlide] = useState(0);

    // Загрузка товаров
    useEffect(() => {
        fetch('https://voxelmarket-backend.onrender.com/api/products')
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(err => console.error("Ошибка загрузки товаров:", err));
    }, []);

    // ИСПРАВЛЕННЫЙ ЭФФЕКТ ДЛЯ АВТОПРОКРУТКИ
    useEffect(() => {
        // Если картинка всего одна, не запускаем прокрутку
        if (bannerImages.length <= 1) return;

        // setTimeout запускается заново каждый раз, когда меняется currentSlide.
        // Это значит, что если ты нажмешь стрелку вручную, отсчет 3 секунд начнется заново!
        const timer = setTimeout(() => {
            setCurrentSlide((prev) => (prev === bannerImages.length - 1 ? 0 : prev + 1));
        }, 3000); // 3000 мс = 3 секунды. Можешь потом вернуть 5000, когда убедишься, что всё работает.

        // Очищаем таймер при размонтировании компонента или перед новым запуском
        return () => clearTimeout(timer);
    }, [currentSlide]); // Зависимость от currentSlide обязательна для правильной работы таймера

    // Функции для ручного переключения слайдов
    const nextSlide = () => setCurrentSlide(prev => (prev === bannerImages.length - 1 ? 0 : prev + 1));
    const prevSlide = () => setCurrentSlide(prev => (prev === 0 ? bannerImages.length - 1 : prev - 1));

    // Функция добавления товара в корзину
    const addToCart = (product, e) => {
        e.stopPropagation();
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

    // Фильтрация поиска
    const filteredProducts = Array.isArray(products) ? products.filter(product => {
        const query = (searchQuery || "").toLowerCase();
        return product.name?.toLowerCase().includes(query) || product.category?.toLowerCase().includes(query);
    }) : [];

    return (
        <div className="menu">
            {/* Показываем карусель только если нет поиска и картинок больше нуля */}
            {!searchQuery && bannerImages.length > 0 && (
                <div className="carousel-container">
                    <div
                        className="carousel-track"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                        {bannerImages.map((img, index) => (
                            <div className="carousel-slide" key={index}>
                                <img src={img} alt={`Banner ${index + 1}`} />
                            </div>
                        ))}
                    </div>

                    {/* ИСПРАВЛЕНИЕ: Кнопки и точки показываются только если слайдов больше одного */}
                    {bannerImages.length > 1 && (
                        <>
                            <button className="carousel-button prev" onClick={prevSlide}>&#10094;</button>
                            <button className="carousel-button next" onClick={nextSlide}>&#10095;</button>

                            <div className="carousel-dots">
                                {bannerImages.map((_, index) => (
                                    <span
                                        key={index}
                                        className={`dot ${currentSlide === index ? "active" : ""}`}
                                        onClick={() => setCurrentSlide(index)}
                                    ></span>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            <h1>{searchQuery ? `Результаты поиска: "${searchQuery}"` : "Рекомендуемые товары"}</h1>

            <div className="products-list">
                {filteredProducts.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666', padding: '50px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {searchQuery ? (
                            <p style={{ margin: 0 }}>Ничего не найдено по вашему запросу...</p>
                        ) : (
                            <div className="voxel-loading-container">
                                <div className="voxel-spinner">
                                    <div className="voxel-spinner-circle"></div>
                                </div>
                                <p className="voxel-loading-text">Загрузка товаров...</p>
                            </div>
                        )}
                    </div>
                ) : (
                    filteredProducts.map(product => (
                        <div
                            key={product._id}
                            className="product-card"
                            onClick={() => navigate(`/product/${product._id}`)}
                        >
                            <img className="menuImg" src={product.image} alt={product.name} />
                            <h3>{product.name}</h3>
                            <p style={{ color: '#777', fontSize: '11px', margin: '2px 0' }}>Категория: {product.category}</p>
                            <p style={{ fontWeight: 'bold', fontSize: '14px', margin: '4px 0' }}>{product.price} ֏</p>
                            <button
                                className="karzinu"
                                onClick={(e) => addToCart(product, e)}
                            >
                                В корзину
                            </button>
                        </div>
                    ))
                )}
            </div>
            <Link to="/ai">
                <div title="Zaxar AI" className="ai-button">
                    <img className="imgzaxar" src={zaxar} alt="" />
                    {/* <span>AI</span> */}
                </div>
            </Link>
        </div>
    );
}