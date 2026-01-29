import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Header.module.css';

export default function Header({ onAddProject }) {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [credits, setCredits] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (token) {
      fetchCredits();
    }
  }, [token]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/usage', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
    }
  };

  const handleLogout = () => {
    setShowMenu(false);
    logout();
  };

  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <span className={styles.icon}>📡</span>
          <span className={styles.name}>IdeaRadar</span>
        </div>

        <div className={styles.actions}>
          {/* Créditos */}
          {credits && (
            <div className={styles.credits} onClick={() => navigate('/pricing')}>
              <div className={styles.creditItem} title="Landing Pages disponíveis">
                <span>🚀</span>
                <span className={styles.creditValue}>{credits.lpRemaining}</span>
              </div>
              <div className={styles.creditItem} title="Análises IA disponíveis">
                <span>🤖</span>
                <span className={styles.creditValue}>{credits.analysisRemaining}</span>
              </div>
            </div>
          )}

          {/* Menu do usuário */}
          <div className={styles.userMenu} ref={menuRef}>
            <button 
              className={styles.userButton}
              onClick={() => setShowMenu(!showMenu)}
            >
              <span className={styles.userAvatar}>
                {user?.email?.[0]?.toUpperCase() || '?'}
              </span>
              <span className={styles.userName}>{user?.email}</span>
              <span className={styles.chevron}>{showMenu ? '▲' : '▼'}</span>
            </button>

            {showMenu && (
              <div className={styles.dropdown}>
                <button 
                  className={styles.dropdownItem}
                  onClick={() => {
                    setShowMenu(false);
                    navigate('/pricing');
                  }}
                >
                  <span>💳</span>
                  Comprar créditos
                </button>
                <div className={styles.dropdownDivider} />
                <button 
                  className={styles.dropdownItem}
                  onClick={handleLogout}
                >
                  <span>🚪</span>
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
