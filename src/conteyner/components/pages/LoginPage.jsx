import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./style.css";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('https://voxelmarket-backend.onrender.com/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('userEmail', email);
                if (data.avatar) {
                    localStorage.setItem('userAvatar', data.avatar);
                }
                
                navigate('/profile');
                window.location.reload();
            } else {
                alert(data.message || 'Ошибка входа');
            }
        } catch (error) {
            console.error('Ошибка сети:', error);
            alert('Не удалось подключиться к серверу');
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h1>Вход в систему</h1>
                <form onSubmit={handleSubmit}>
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
                        <label>Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Введите пароль"
                            required
                        />
                    </div>
                    <button type="submit" className="login-btn">Войти</button>

                    <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
                        Нет аккаунта? <Link to="/register" style={{ color: '#007bff' }}>Зарегистрироваться</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}