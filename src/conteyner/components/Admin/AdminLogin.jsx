import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Импортируем хук навигации
import "./style.css";

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // Стейт для ошибки
    
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Пример хардкод-проверки (в будущем здесь будет запрос к серверу)
        if (email === 'admin2@voxelmarket.com' && password === 'VoxelMarket.2012/') {
            setError('');
            // Перенаправляем на страницу дашборда
            navigate('/admin/dashboard'); 
        } else {
            setError('Неверный Email или пароль');
        }
    };

    return (
        <div className="admin-login-wrapper">
            <div className="admin-login-card">
                <div className="admin-login-header">
                    <span className="admin-badge">Панель управления</span>
                    <h1>Admin Login</h1>
                    <p>Введите данные для доступа к админ-панели Voxel Market</p>
                </div>

                <form onSubmit={handleSubmit} className="admin-login-form">
                    {/* Если есть ошибка, выводим её */}
                    {error && <div className="error-message">{error}</div>}

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input 
                            id="email"
                            type="email" 
                            placeholder="Логин" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Пароль</label>
                        <input 
                            id="password"
                            type="password" 
                            placeholder="Пароль" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                        />
                    </div>

                    <button type="submit" className="login-btn">
                        Войти в систему
                    </button>
                </form>
            </div>
        </div>
    );
}