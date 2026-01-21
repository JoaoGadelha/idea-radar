import { useAuth } from '../contexts/AuthContext';
import styles from './Header.module.css';

export default function Header({ onAddProject }) {
  const { user, logout } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <span className={styles.icon}>📡</span>
          <span className={styles.name}>IdeaRadar</span>
        </div>

        <div className={styles.actions}>
          <span className={styles.user}>{user?.email}</span>
          <button className={styles.logout} onClick={logout}>
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
