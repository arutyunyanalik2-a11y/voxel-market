import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userAvatar, setUserAvatar] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const authStatus = localStorage.getItem('isAuthenticated') === 'true';
        const avatar = localStorage.getItem('userAvatar');
        setIsAuthenticated(authStatus);
        if (avatar) setUserAvatar(avatar);
    }, []);

    // Синхронизируем инпут, если параметры поиска меняются извне
    useEffect(() => {
        setSearchQuery(searchParams.get('search') || '');
    }, [searchParams]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            navigate(`/`);
        }
        setIsMobileSearchActive(false);
    };

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <>
            {/* --- ВЕРХНЯЯ НАВИГАЦИЯ --- */}
            <nav className={styles.navbar}>
                <div className={`${styles.logoArea} ${isMobileSearchActive ? styles.hiddenOnMobile : ''}`}>
                    <Link to="/" className={styles.logo} onClick={closeMenu}>
                        Voxel Market
                    </Link>
                </div>

                <div className={`${styles.searchArea} ${isMobileSearchActive ? styles.searchAreaActive : ''}`}>
                    <button
                        type="button"
                        className={styles.backButton}
                        onClick={() => setIsMobileSearchActive(false)}
                        aria-label="Закрыть поиск"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>

                    <form className={styles.searchForm} onSubmit={handleSearch}>
                        <input
                            type="text"
                            placeholder="Поиск товаров..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSearchQuery(val);
                                // Живой поиск (опционально): сразу обновляем URL при вводе
                                if (val.trim()) {
                                    setSearchParams({ search: val });
                                } else {
                                    setSearchParams({});
                                }
                            }}
                        />
                        <button type="submit" className={styles.searchButton} aria-label="Поиск">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                    </form>
                </div>

                <div className={`${styles.linksArea} ${isMobileSearchActive ? styles.hiddenOnMobile : ''}`}>
                    <button
                        className={styles.mobileIconButton}
                        onClick={() => setIsMobileSearchActive(true)}
                        aria-label="Открыть поиск"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>

                    <button
                        className={styles.mobileIconButton}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Меню"
                    >
                        {isMenuOpen ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        )}
                    </button>

                    <ul className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ''}`}>
                        {/* <li>
                            <Link to="/catalog" className={styles.link} onClick={closeMenu}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7"></rect>
                                    <rect x="14" y="3" width="7" height="7"></rect>
                                    <rect x="14" y="14" width="7" height="7"></rect>
                                    <rect x="3" y="14" width="7" height="7"></rect>
                                </svg>
                                <span>Каталог</span>
                            </Link>
                        </li> */}

                        <li>
                            <Link to="/ai" className={`${styles.link} ${styles.adminLink}`} onClick={closeMenu}>
                                <span>Zaxar AI</span>
                            </Link>
                        </li>

                        <li>
                            <Link to="/cart" className={styles.link} onClick={closeMenu}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="9" cy="21" r="1"></circle>
                                    <circle cx="20" cy="21" r="1"></circle>
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                </svg>
                                <span>Корзина</span>
                            </Link>
                        </li>

                        <li>
                            <Link to="/admin" className={`${styles.link} ${styles.adminLink}`} onClick={closeMenu}>
                                <span>Админ-панель</span>
                            </Link>
                        </li>

                        <li>
                            <Link to={isAuthenticated ? "/profile" : "/login"} className={styles.bottomNavItem} onClick={closeMenu}>
                                {isAuthenticated ? (
                                    <div className={styles.profileIconWrapper} title="Профиль">
                                        {userAvatar ? (
                                            <img src={userAvatar} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="12" cy="7" r="4"></circle>
                                            </svg>
                                        )}
                                    </div>
                                ) : (
                                    <span>Войти</span>
                                )}
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* --- НИЖНЕЕ МОБИЛЬНОЕ МЕНЮ --- */}
            <nav className={styles.bottomNav}>
                <Link to="/" className={styles.bottomNavItem}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <span>Главная</span>
                </Link>

                {/* <Link to="/catalog" className={styles.bottomNavItem}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    <span>Каталог</span>
                </Link> */}

                <Link to="/cart" className={styles.bottomNavItem}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <span>Корзина</span>
                </Link>

                <Link to="/profile" className={styles.bottomNavItem}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>Профиль</span>
                </Link>
            </nav>
        </>
    );
}