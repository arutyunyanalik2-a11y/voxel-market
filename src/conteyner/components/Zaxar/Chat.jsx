import React, { useState, useRef, useEffect } from 'react';
import './style.css';

const MiniZahar = () => {
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Привет! Я Захар, ИИ-ассистент Voxel Market. Чем могу помочь?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Автопрокрутка вниз при новом сообщении
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // URL берется из твоего .env файла
            // Замени import.meta.env на process.env, если используешь Create React App
            // Если мы за компьютером (localhost), то стучимся на локальный порт 5000.
            // Если сайт уже в интернете (на Render/Vercel), то автоматически используется адрес твоего бэкенда на Render.
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:5000/api/chat'
                : 'https://voxelmarket-backend.onrender.com/api/chat';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage.text }),
            });

            if (!response.ok) {
                throw new Error('Ошибка соединения с сервером Захара');
            }

            const data = await response.json();
            const aiMessage = { role: 'ai', text: data.reply }; // Предполагается, что бэкенд возвращает { "reply": "текст" }
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error('Ошибка:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'ai', text: 'Извини, я временно недоступен. Проверь подключение к серверу.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div className="zahar-chat-container">
            <div className="zahar-chat-header">
                <h3> Ассистент Захар</h3>
            </div>

            <div className="zahar-chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        <div className="message-content">
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="message ai">
                        <div className="message-content typing">Захар печатает...</div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="zahar-chat-input-area">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Напиши сообщение..."
                    disabled={isLoading}
                />
                <button className='otprav' onClick={sendMessage} disabled={isLoading || !input.trim()}>
                    Отправить
                </button>
            </div>
        </div>
    );
};

export default MiniZahar;