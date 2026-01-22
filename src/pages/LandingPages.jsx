import { useState } from 'react';
import styles from './LandingPages.module.css';

export default function LandingPages() {
  const [landingPages, setLandingPages] = useState([]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Landing Pages</h1>
        <button className={styles.createButton}>
          + Nova Landing Page
        </button>
      </div>

      {landingPages.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🚀</div>
          <h2>Nenhuma landing page criada</h2>
          <p>Crie landing pages para validar suas ideias e coletar leads</p>
          <button className={styles.emptyButton}>
            + Criar Primeira Landing Page
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {/* Lista de landing pages virá aqui */}
        </div>
      )}
    </div>
  );
}
