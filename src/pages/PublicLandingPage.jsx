import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import LandingPagePreview from '../components/LandingPagePreview';
import styles from './PublicLandingPage.module.css';

export default function PublicLandingPage() {
  const { slug } = useParams();
  const [landingPage, setLandingPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLandingPage();
  }, [slug]);

  const fetchLandingPage = async () => {
    try {
      const res = await fetch(`/api/l/${slug}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          setError('Landing page não encontrada');
        } else {
          setError('Erro ao carregar landing page');
        }
        return;
      }

      const data = await res.json();
      setLandingPage(data.landingPage);
    } catch (err) {
      console.error('Erro ao buscar landing page:', err);
      setError('Erro ao carregar landing page');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}>⏳</div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h1>😕</h1>
        <h2>{error}</h2>
        <p>Verifique o link e tente novamente.</p>
      </div>
    );
  }

  if (!landingPage) {
    return null;
  }

  return (
    <div className={styles.container}>
      <LandingPagePreview
        headline={landingPage.headline}
        subheadline={landingPage.subheadline}
        ctaText={landingPage.cta_text}
        primaryColor={landingPage.primary_color}
        heroImage={landingPage.hero_image_url}
        template="claude"
        collectName={landingPage.collect_name}
        collectPhone={landingPage.collect_phone}
        isInteractive={true}
        projectId={landingPage.project_id}
        landingPageId={landingPage.id}
      />
    </div>
  );
}
