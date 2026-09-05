import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./style.css";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('https://voxelmarket-backend.onrender.com/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Регистрация прошла успешно! Теперь войдите.');
                navigate('/login');
            } else {
                alert(data.message || 'Ошибка регистрации');
            }
        } catch (error) {
            console.error('Ошибка сети:', error);
            alert('Не удалось подключиться к серверу');
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h1>Регистрация</h1>
                <form onSubmit={handleRegister}>
                    <div className="form-group">
                        <label>Имя:</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Ваше имя"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Введите ваш email"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Пароль:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Придумайте пароль"
                            required
                        />
                    </div>
                    <button type="submit" className="login-btn">Зарегистрироваться</button>
                    
                    <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
                        Уже есть аккаунт? <Link to="/login" style={{ color: '#007bff' }}>Войти</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}