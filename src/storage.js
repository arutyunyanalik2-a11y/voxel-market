import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('voxel-market-data.json');

// Проверка запуска внутри Tauri (включая Android WebView)
const isTauriEnv = () => typeof window !== 'undefined' && (!!window.__TAURI__ || !!window.__TAURI_INTERNALS__);

export const appStorage = {
    async get(key) {
        try {
            if (isTauriEnv()) {
                // LazyStore сам сериализует/десериализует значения и возвращает
                // ровно тот тип, который был передан в set(). Дополнительный
                // JSON.parse() здесь был ОШИБКОЙ: JSON.parse('true') превращает
                // строку 'true' в булево true, из-за чего строгое сравнение
                // authStatus !== 'true' в ProfilePage всегда было истинным
                // (true !== 'true'), и пользователя выкидывало на /login
                // сразу после успешного логина.
                const val = await store.get(key);
                return val === undefined ? null : val;
            } else {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            }
        } catch (error) {
            console.error(`[appStorage] Ошибка чтения ключа "${key}":`, error);
            return null;
        }
    },

    async set(key, value) {
        try {
            if (isTauriEnv()) {
                await store.set(key, value);
                await store.save();
            } else {
                localStorage.setItem(key, JSON.stringify(value));
            }
        } catch (error) {
            console.error(`[appStorage] Ошибка записи ключа "${key}":`, error);
        }
    },

    async remove(key) {
        try {
            if (isTauriEnv()) {
                await store.delete(key);
                await store.save();
            } else {
                localStorage.removeItem(key);
            }
        } catch (error) {
            console.error(`[appStorage] Ошибка удаления ключа "${key}":`, error);
        }
    }
};

// Внутри storage.js
export default appStorage;