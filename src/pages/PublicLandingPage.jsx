import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import LandingPagePreview from '../components/LandingPagePreview';
import { setupLandingPageAnalytics } from '../services/analytics';
import styles from './PublicLandingPage.module.css';

export default function PublicLandingPage() {
  const { slug } = useParams();
  const [landingPage, setLandingPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLandingPage();
  }, [slug]);

  // Inicializar GA4 quando a landing page carregar
  useEffect(() => {
    if (landingPage) {
      setupLandingPageAnalytics({
        landingPageId: landingPage.id,
        projectId: landingPage.project_id,
        slug: landingPage.slug,
      });
    }
  }, [landingPage]);

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
        collectPhone={landingPage.collect_phone}
        collectSuggestions={landingPage.collect_suggestions}
        isInteractive={true}
        projectId={landingPage.project_id}
        landingPageId={landingPage.id}
      />
    </div>
  );
}
