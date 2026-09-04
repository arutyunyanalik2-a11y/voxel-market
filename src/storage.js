import { LazyStore } from '@tauri-apps/plugin-store';

// LazyStore автоматически загружает файл при первом обращении
const store = new LazyStore('voxel-market-data.json');

export const appStorage = {
    async get(key) {
        if (window.__TAURI__ || window.__TAURI_INTERNALS__) {
            return await store.get(key);
        }
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },

    async set(key, value) {
        if (window.__TAURI__ || window.__TAURI_INTERNALS__) {
            await store.set(key, value);
            await store.save();
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
    },

    async remove(key) {
        if (window.__TAURI__ || window.__TAURI_INTERNALS__) {
            await store.delete(key);
            await store.save();
        } else {
            localStorage.removeItem(key);
        }
    }
};