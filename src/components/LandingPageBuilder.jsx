import { useState, useEffect, useRef } from 'react';
import styles from './LandingPageBuilder.module.css';
import LandingPagePreview from './LandingPagePreview';
import TemplateSelector from './TemplateSelector';
import { useAuth } from '../contexts/AuthContext';
import { useLandingPageCreation } from '../contexts/LandingPageCreationContext';

// Templates com cor fixa (não permitem customização)
const TEMPLATES_WITH_FIXED_COLOR = {
  soft: '#ffb3c6',
  gradient: '#667eea',
  vercel: '#00d9ff',
};

export default function LandingPageBuilder({ onClose, onSave }) {
  const { token } = useAuth();
  const { collectedData, updateCollectedData, setShowChat } = useLandingPageCreation();
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [improveData, setImproveData] = useState({
    benefits: '',
    howItWorks: '',
    faq: '',
  });
  const previewRef = useRef(null);
  const inputsRef = useRef(null);
  
  // Initialize dark mode from localStorage or system preference
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('landingPageBuilderDarkMode');
    if (saved !== null) {
      return saved === 'true';
    }
    // Fallback to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    brief: '',
    primary_color: '#10b981',
    template: 'claude', // Template padrão
    collect_phone: false,
    collect_suggestions: true,
    hero_image_type: 'ai', // 'none', 'url', 'upload', 'ai'
    hero_image_url: '',
    about_image_type: 'ai', // 'none', 'url', 'upload', 'ai'
    about_image_url: '',
    product_image_type: 'ai', // 'none', 'url', 'upload', 'ai'
    product_image_url: '',
  });
  
  const [imageAccordionOpen, setImageAccordionOpen] = useState({
    hero: true,
    about: false,
    product: false,
  });

  // Sincronizar collectedData do Context com formData
  useEffect(() => {
    if (collectedData.title || collectedData.brief || collectedData.slug) {
      setFormData(prev => ({
        ...prev,
        title: collectedData.title || prev.title,
        slug: collectedData.slug || prev.slug,
        brief: collectedData.brief || prev.brief,
        primary_color: collectedData.primary_color || prev.primary_color,
        template: collectedData.template || prev.template,
        collect_phone: collectedData.collect_phone ?? prev.collect_phone,
        collect_suggestions: collectedData.collect_suggestions ?? prev.collect_suggestions,
        hero_image_type: collectedData.hero_image_type || prev.hero_image_type,
        hero_image_url: collectedData.hero_image_url || prev.hero_image_url,
        about_image_type: collectedData.about_image_type || prev.about_image_type,
        about_image_url: collectedData.about_image_url || prev.about_image_url,
        product_image_type: collectedData.product_image_type || prev.product_image_type,
        product_image_url: collectedData.product_image_url || prev.product_image_url,
      }));
    }
  }, [collectedData]);

  // Sincronizar formData de volta para Context quando mudar
  const updateFormData = (updates) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      
      // Sincronizar com Context (apenas campos principais)
      updateCollectedData({
        title: newData.title,
        slug: newData.slug,
        brief: newData.brief,
        primary_color: newData.primary_color,
        template: newData.template,
        collect_phone: newData.collect_phone,
        collect_suggestions: newData.collect_suggestions,
        hero_image_type: newData.hero_image_type,
        hero_image_url: newData.hero_image_url,
        about_image_type: newData.about_image_type,
        about_image_url: newData.about_image_url,
        product_image_type: newData.product_image_type,
        product_image_url: newData.product_image_url,
      });
      
      return newData;
    });
  };

  // Retorna a cor efetiva (fixa ou customizável)
  const getEffectiveColor = () => {
    return TEMPLATES_WITH_FIXED_COLOR[formData.template] || formData.primary_color;
  };

  // Scroll to top on mount - múltiplos timers para garantir
  useEffect(() => {
    console.log('[Scroll Debug] Component mounted');
    
    const scrollToTop = () => {
      console.log('[Scroll Debug] Tentando scroll to top', {
        previewScrollTop: previewRef.current?.scrollTop,
        inputsScrollTop: inputsRef.current?.scrollTop,
        windowScrollY: window.scrollY
      });
      
      if (previewRef.current) previewRef.current.scrollTop = 0;
      if (inputsRef.current) inputsRef.current.scrollTop = 0;
      window.scrollTo(0, 0);
      
      console.log('[Scroll Debug] Após scroll', {
        previewScrollTop: previewRef.current?.scrollTop,
        inputsScrollTop: inputsRef.current?.scrollTop,
        windowScrollY: window.scrollY
      });
    };
    
    // Executar várias vezes para garantir após renders
    scrollToTop();
    const t1 = setTimeout(scrollToTop, 0);
    const t2 = setTimeout(scrollToTop, 50);
    const t3 = setTimeout(scrollToTop, 150);
    const t4 = setTimeout(scrollToTop, 300);
    const t5 = setTimeout(scrollToTop, 500);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  // Scroll preview to top when variations change
  useEffect(() => {
    if (variations.length > 0 && previewRef.current) {
      previewRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [variations, selectedIndex]);

  // Dark mode persistence and system preference sync
  useEffect(() => {
    // Save to localStorage when dark mode changes
    localStorage.setItem('landingPageBuilderDarkMode', darkMode.toString());

    // Listen to system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only auto-sync if user hasn't explicitly set a preference
      const saved = localStorage.getItem('landingPageBuilderDarkMode');
      if (saved === null) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [darkMode]);

  // Verifica se o template atual tem cor fixa
  const hasFixedColor = () => {
    return formData.template in TEMPLATES_WITH_FIXED_COLOR;
  };

  // Incorporar dados do modal ao brief
  const handleIncorporateImproveData = () => {
    let additionalInfo = '';

    if (improveData.benefits.trim()) {
      additionalInfo += `\n\n[beneficios]\n${improveData.benefits.trim()}`;
    }

    if (improveData.howItWorks.trim()) {
      additionalInfo += `\n\n[como-funciona]\n${improveData.howItWorks.trim()}`;
    }

    if (improveData.faq.trim()) {
      additionalInfo += `\n\n[perguntas-frequentes]\n${improveData.faq.trim()}`;
    }

    if (additionalInfo) {
      setFormData({
        ...formData,
        brief: formData.brief + additionalInfo
      });
    }

    // Limpar dados do modal e fechar
    setImproveData({ benefits: '', howItWorks: '', faq: '' });
    setShowImproveModal(false);
  };

  // DEV: Preencher com exemplo do SkillSwap
  const handleDevPopulate = () => {
    setFormData({
      ...formData,
      title: 'SkillSwap',
      slug: 'skillswap',
      brief: 'O projeto consiste no desenvolvimento de um aplicativo chamado SkillSwap, voltado para a troca de habilidades entre pessoas interessadas em aprender e ensinar diferentes conhecimentos sem a utilização de dinheiro. A plataforma permite que usuários criem perfis informando quais habilidades dominam e quais desejam aprender, possibilitando a conexão entre indivíduos com interesses complementares. Por meio de um sistema de busca e matching, os usuários podem encontrar parceiros para troca de conhecimento, comunicar-se via chat, agendar sessões e avaliar as experiências após cada interação. O aplicativo utiliza um sistema de créditos baseado no tempo dedicado ao ensino, incentivando a colaboração contínua e a construção de uma comunidade de aprendizagem colaborativa, segura e escalável.',
    });
  };

  const handleZenFlowPopulate = () => {
    setFormData({
      ...formData,
      title: 'ZenFlow',
      slug: 'zenflow',
      brief: 'Um aplicativo de meditação guiada com IA que personaliza sessões baseadas no seu nível de estresse, humor e objetivos pessoais. Oferece meditações de 5 a 30 minutos, sons da natureza, e tracking de progresso emocional.',
    });
  };

  const handlePetChefPopulate = () => {
    setFormData({
      ...formData,
      title: 'PetChef Pro',
      slug: 'petchef-pro',
      brief: 'Serviço de assinatura mensal que entrega refeições frescas e personalizadas para cães e gatos, formuladas por veterinários nutricionistas. As receitas são adaptadas à idade, raça, peso e condições de saúde do pet, com ingredientes naturais e embalagem eco-friendly.',
    });
  };

  const handleCodeMentorPopulate = () => {
    setFormData({
      ...formData,
      title: 'CodeMentor AI',
      slug: 'codementor-ai',
      brief: 'Plataforma de ensino de programação com tutor de IA disponível 24/7 que corrige código em tempo real, explica conceitos complexos de forma simples, e cria exercícios personalizados baseados no seu nível. Suporta mais de 15 linguagens de programação.',
    });
  };

  const handleFitPlatePopulate = () => {
    const brief = `Nome: FitPlate Revolution

O que é:
FitPlate Revolution é uma plataforma integrada de nutrição e fitness que combina planejamento de refeições automatizado, delivery de ingredientes pré-porcionados e treinos personalizados em um único ecossistema. Utilizando inteligência artificial avançada e dados biométricos coletados via smartwatch ou aplicativo, a plataforma cria um plano completo de transformação corporal adaptado ao seu metabolismo, rotina e objetivos.

Para quem serve:
Profissionais ocupados entre 25-45 anos que querem resultados reais na saúde e forma física, mas não têm tempo para planejar refeições, fazer compras ou criar treinos. Ideal para quem já tentou várias dietas e academias sem sucesso por falta de consistência ou orientação adequada.

Principais funcionalidades:
- Análise metabólica via questionário detalhado e integração com wearables (Apple Watch, Fitbit, Garmin)
- Planos de refeição semanais personalizados com receitas fáceis (15-30 minutos de preparo)
- Delivery opcional de meal kits com ingredientes frescos, pré-medidos e orgânicos
- Biblioteca com 500+ receitas adaptáveis a restrições alimentares (vegano, sem glúten, low carb, etc.)
- Treinos em vídeo de 20-45 minutos para fazer em casa ou na academia
- Ajuste automático do plano baseado em progresso real (peso, medidas, energia)
- Comunidade exclusiva com desafios mensais e suporte de nutricionistas certificados
- Sistema de gamificação com pontos, conquistas e recompensas

Ganhos para quem vai usar:

Saúde e Corpo:
- Perda de peso sustentável (média de 0,5-1kg por semana de forma saudável)
- Aumento de energia e disposição no dia a dia
- Melhora na qualidade do sono e redução de estresse
- Ganho de massa muscular magra e definição corporal
- Redução de riscos de doenças crônicas (diabetes, hipertensão, colesterol alto)
- Melhora na digestão e saúde intestinal

Tempo e Conveniência:
- Economize 5-8 horas por semana em planejamento de refeições e compras
- Elimine o estresse de "o que vou comer hoje?"
- Treinos eficientes que cabem em qualquer agenda
- Acesso 24/7 pelo app no celular, tablet ou computador

Financeiro:
- Reduza desperdício de alimentos em até 60%
- Economize com restaurantes e delivery de fast food
- Evite gastos com personal trainer (economia média de R$ 800-1.500/mês)
- Reduza consultas médicas e medicamentos a longo prazo

Mental e Emocional:
- Aumente autoconfiança e autoestima
- Desenvolva uma relação saudável com a comida (sem culpa ou restrições extremas)
- Sinta-se parte de uma comunidade motivadora
- Elimine a fadiga de decisão sobre alimentação e exercícios

Resultados comprovados:
- 94% dos usuários relatam aumento significativo de energia nas primeiras 2 semanas
- Média de 8-12kg de perda de peso nos primeiros 3 meses
- 87% mantêm os resultados após 1 ano (vs. 5% em dietas tradicionais)
- NPS (Net Promoter Score) de 78 - considerado excelente no setor

Diferenciais competitivos:
- Única plataforma que integra nutrição + treino + delivery em um só lugar
- IA que aprende com você e melhora as recomendações continuamente
- Flexibilidade total: ajuste seu plano a qualquer momento
- Sem contratos de longo prazo - cancele quando quiser
- Aplicativo premiado com design intuitivo e bonito

Garantia:
Experimente por 30 dias risk-free. Se não estiver satisfeito, devolvemos 100% do seu dinheiro, sem perguntas.

Depoimentos de clientes:

"Perdi 11kg em 3 meses sem sofrimento. O app me guiou em cada refeição e eu finalmente entendi o que meu corpo precisa. Mudou minha relação com comida!" - Marina Silva, Arquiteta, São Paulo

"Como médico, sou cético com apps de dieta. Mas o FitPlate usa ciência de verdade. Recomendo para meus pacientes com sobrepeso. Os resultados são consistentes." - Dr. Roberto Almeida, Endocrinologista

"Trabalho 12h por dia e achava impossível comer bem. O FitPlate resolve minhas refeições em 5 minutos. Já são 8kg a menos e muito mais energia!" - Carlos Mendes, Empreendedor, Rio de Janeiro

Planos e preços:
- Básico (R$ 97/mês): Planos de refeição + treinos + app
- Premium (R$ 197/mês): Básico + 2 meal kits por semana + consultas mensais com nutricionista
- Elite (R$ 297/mês): Premium + 4 meal kits por semana + suporte prioritário + análise corporal trimestral

Call to action:
Transforme seu corpo e sua vida em 90 dias. Comece hoje sua jornada FitPlate Revolution - Primeiros 7 dias grátis!`;

    setFormData({
      ...formData,
      title: 'FitPlate Revolution',
      slug: 'fitplate-revolution',
      brief: brief,
    });
  };

  const handleClarityAIPopulate = () => {
    const brief = `Nome: Clarity AI
Slogan: Transforme caos em decisões.

Missão:
Ajudar empresas e profissionais a tomarem decisões melhores e mais rápidas usando inteligência artificial aplicada ao contexto real do negócio — não só dados soltos.

O que é:
O Clarity AI é uma plataforma digital de inteligência estratégica que conecta dados, metas e contexto humano para gerar recomendações acionáveis em tempo real. Enquanto ferramentas tradicionais só mostram gráficos, o Clarity explica o que fazer e por quê.

Descrição do Produto:
O Clarity AI atua como um consultor digital inteligente, que:
- Analisa dados de diferentes fontes (CRM, financeiro, marketing, produto)
- Entende os objetivos da empresa
- Detecta padrões, riscos e oportunidades
- Sugere ações práticas e priorizadas
- Aprende com as decisões tomadas ao longo do tempo

Tudo isso em linguagem simples, sem jargão técnico.

Principais Funcionalidades:

📊 Análise Inteligente:
- Conecta-se a ferramentas como Google Analytics, HubSpot, Notion, Stripe, etc.
- Cruza dados automaticamente
- Detecta gargalos e oportunidades ocultas

🤖 Recomendações Ação-a-Ação:
Exemplo: "Se você aumentar o orçamento do canal X em 15%, a chance de crescimento mensal sobe em 22%."

🧭 Painel de Decisão:
- Lista diária de decisões prioritárias
- Explicação do impacto de cada escolha
- Simulações de cenários

🧠 Memória Estratégica:
- Aprende com decisões passadas
- Entende o "jeito" da empresa
- Evolui junto com o negócio

Público-Alvo:
- Startups em crescimento (Seed a Série B)
- Fundadores e C-levels
- Times de produto, marketing e estratégia
- Consultorias e agências premium

Modelo de Preços (SaaS):

🔹 Starter — R$ 99/mês
- Até 3 integrações
- Relatórios semanais
- Recomendações básicas

🔹 Pro — R$ 299/mês (mais vendido)
- Integrações ilimitadas
- Recomendações em tempo real
- Simulações de cenários
- Suporte prioritário

🔹 Enterprise — Sob consulta
- IA personalizada por negócio
- Treinamento dedicado
- SLA e segurança avançada
- Onboarding estratégico

Prova Social:

🗣️ "O Clarity AI virou praticamente um sócio silencioso. Tomamos decisões mais rápidas e erramos menos."
— Mariana Lopes, CEO da Growly

🗣️ "Em 3 meses, reduzimos custos em 18% só seguindo as recomendações da plataforma."
— Rafael Costa, Head de Ops na NexaTech

Números:
📈 +2.300 empresas usando
🌍 Presente em 12 países
⚡ Mais de 1 milhão de decisões analisadas

Diferenciais Competitivos:
- Não só mostra dados → recomenda ações
- Linguagem humana, não técnica
- Aprende com o contexto do negócio
- Foco em decisão, não em relatório

Visão de Futuro:
Ser o sistema operacional de decisões das empresas modernas. No futuro, o Clarity AI:
- Participará de reuniões
- Antecipará problemas antes de acontecerem
- Automatizará decisões de baixo risco
- Será o "cérebro estratégico" das empresas

Call to Action:
👉 Pare de decidir no escuro.
👉 Experimente o Clarity AI por 14 dias grátis.`;

    setFormData({
      ...formData,
      title: 'Clarity AI',
      slug: 'clarity-ai',
      brief: brief,
    });
  };

  const handleRegenerateImage = async (variationIndex) => {
    if (!variations[variationIndex]?.hero_image_prompt) {
      alert('Esta variação não tem prompt de imagem definido.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/landing-pages/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectData: { title: formData.title },
          brief: variations[variationIndex].hero_image_prompt,
          generateHeroImage: true,
          regenerateImageOnly: true,
        }),
      });

      if (!res.ok) {
        throw new Error('Erro ao regenerar imagem');
      }

      const data = await res.json();
      if (data.variation?.hero_image) {
        // Atualizar apenas a imagem da variação selecionada
        setVariations(prev => {
          const updated = [...prev];
          updated[variationIndex].hero_image = data.variation.hero_image;
          return updated;
        });
      }
    } catch (err) {
      console.error('Erro ao regenerar imagem:', err);
      alert('Erro ao regenerar imagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateAboutImage = async (variationIndex) => {
    if (!variations[variationIndex]?.about_image_prompt) {
      alert('Esta variação não tem prompt de imagem do about.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/landing-pages/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectData: { title: formData.title },
          brief: variations[variationIndex].about_image_prompt,
          generateAboutImage: true,
          regenerateAboutImageOnly: true,
        }),
      });

      if (!res.ok) {
        throw new Error('Erro ao regenerar imagem do about');
      }

      const data = await res.json();
      if (data.variation?.about_image) {
        // Atualizar apenas a imagem about da variação selecionada
        setVariations(prev => {
          const updated = [...prev];
          updated[variationIndex] = {
            ...updated[variationIndex],
            about_image: data.variation.about_image
          };
          return updated;
        });
      }
    } catch (error) {
      console.error('Erro ao regenerar imagem do about:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateProductImage = async (variationIndex) => {
    if (!variations[variationIndex]?.product_image_prompt) {
      alert('Esta variação não tem prompt de imagem do produto.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/landing-pages/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectData: { title: formData.title },
          brief: variations[variationIndex].product_image_prompt,
          generateProductImage: true,
          regenerateProductImageOnly: true,
        }),
      });

      if (!res.ok) {
        throw new Error('Erro ao regenerar imagem do produto');
      }

      const data = await res.json();
      if (data.variation?.product_image) {
        // Atualizar apenas a imagem product da variação selecionada
        setVariations(prev => {
          const updated = [...prev];
          updated[variationIndex] = {
            ...updated[variationIndex],
            product_image: data.variation.product_image
          };
          return updated;
        });
      }
    } catch (error) {
      console.error('Erro ao regenerar imagem do produto:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.title || !formData.brief) {
      alert('Preencha o título e a descrição do projeto');
      return;
    }

    setLoading(true);
    try {
      // Usar dados do formulário diretamente
      const projectData = {
        name: formData.title,
        description: formData.brief,
      };

      console.log('📤 [Generate] Enviando dados:', {
        title: formData.title,
        briefPreview: formData.brief.substring(0, 100) + '...'
      });

      // Gerar variações
      const res = await fetch('/api/landing-pages/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectData,
          brief: formData.brief,
          generateHeroImage: formData.hero_image_type === 'ai',
          generateAboutImage: formData.about_image_type === 'ai',
          generateProductImage: formData.product_image_type === 'ai',
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao gerar landing pages');
      }

      const data = await res.json();
      setVariations(prev => [...prev, data.variation]);
      setSelectedIndex(variations.length);

      // Verificar campos faltando
      const variation = data.variation;
      const missing = [];
      if (!variation.value_proposition || variation.value_proposition.length === 0) {
        missing.push('Benefícios/Proposta de Valor');
      }
      if (!variation.how_it_works || variation.how_it_works.length === 0) {
        missing.push('Como Funciona');
      }
      if (!variation.faq_items || variation.faq_items.length === 0) {
        missing.push('Perguntas Frequentes (FAQ)');
      }

      setMissingFields(missing);
      if (missing.length > 0) {
        setShowImproveModal(true);
      }
    } catch (error) {
      console.error('Erro ao gerar:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const selectedVariation = variations[selectedIndex];
    if (!selectedVariation) return;

    try {
      // Criar projeto + landing page em uma única chamada
      const res = await fetch('/api/landing-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          // Dados para criar projeto automaticamente
          project_name: formData.title,
          project_description: formData.brief,
          // Dados da landing page
          slug: formData.slug,
          title: formData.title || selectedVariation.headline,
          headline: selectedVariation.headline,
          subheadline: selectedVariation.subheadline,
          description: formData.brief, // Usar o brief como description
          cta_text: selectedVariation.cta_text,
          value_proposition: selectedVariation.value_proposition,
          how_it_works: selectedVariation.how_it_works,
          faq_items: selectedVariation.faq_items,
          cta_headline: selectedVariation.cta_headline,
          cta_subheadline: selectedVariation.cta_subheadline,
          primary_color: getEffectiveColor(),
          template: formData.template,
          collect_phone: formData.collect_phone,
          collect_suggestions: formData.collect_suggestions,
          hero_image: formData.hero_image_type === 'url' ? formData.hero_image_url : null,
          status: 'draft',
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao salvar');
      }

      const { landingPage } = await res.json();
      onSave(landingPage);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert(error.message);
    }
  };

  return (
    <div className={`${styles.container} ${darkMode ? styles.darkMode : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>Nova Landing Page</h2>
          <button 
            onClick={handleDevPopulate} 
            className={styles.devBtn}
            title="Preencher com exemplo"
          >
            SkillSwap
          </button>
          <button 
            onClick={handleZenFlowPopulate} 
            className={styles.devBtn}
            title="ZenFlow - Meditação com IA"
          >
            ZenFlow
          </button>
          <button 
            onClick={handlePetChefPopulate} 
            className={styles.devBtn}
            title="PetChef Pro - Refeições para pets"
          >
            PetChef Pro
          </button>
          <button 
            onClick={handleCodeMentorPopulate} 
            className={styles.devBtn}
            title="CodeMentor AI - Tutor de programação"
          >
            CodeMentor AI
          </button>
          <button 
            onClick={handleFitPlatePopulate} 
            className={styles.fitPlateBtn}
            title="FitPlate Revolution - Plataforma completa de nutrição e fitness"
          >
            💪 FitPlate
          </button>
          <button 
            onClick={handleClarityAIPopulate} 
            className={styles.clarityBtn}
            title="Clarity AI - Inteligência estratégica para decisões empresariais"
          >
            🧠 Clarity AI
          </button>
        </div>
        <div className={styles.headerRight}>
          <button 
            onClick={() => setShowChat(true)} 
            className={styles.assistantBtn}
            title="Abrir Assistente AI"
          >
            💬 Assistente
          </button>
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className={styles.darkModeBtn}
            title={darkMode ? "Modo claro" : "Modo escuro"}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>
      </div>

      <div className={styles.content}>
        {/* Input Section */}
        <div className={styles.inputs} ref={inputsRef}>
          {loading && <div className={styles.inputsOverlay} />}
          <div className={styles.inputGroup}>
            <label>Título da LP</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateFormData({ title: e.target.value })}
              placeholder="Nome interno da landing page"
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Slug (URL)</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => updateFormData({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
              placeholder="minha-landing-page"
              required
            />
            <small>app.com/l/{formData.slug || 'slug'}</small>
          </div>

          <div className={styles.inputGroup}>
            <label>Descreva sua ideia de produto/serviço</label>
            <textarea
              value={formData.brief}
              onChange={(e) => updateFormData({ brief: e.target.value })}
              placeholder="Ex: App de delivery vegano para universitários, Curso online de Python para iniciantes, Consultoria financeira para MEIs..."
              rows="5"
            />
            {missingFields.length > 0 && (
              <button
                type="button"
                onClick={() => setShowImproveModal(true)}
                className={styles.improveBtn}
              >
                💡 Melhorar descrição ({missingFields.length} {missingFields.length === 1 ? 'seção faltando' : 'seções faltando'})
              </button>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label>Template Visual</label>
            <button
              type="button"
              className={styles.templateButton}
              onClick={() => setShowTemplateSelector(true)}
            >
              <span className={styles.templateIcon}>
                {formData.template === 'claude' && '🎨'}
                {formData.template === 'stripe' && '⚡'}
                {formData.template === 'vercel' && '🌙'}
                {formData.template === 'gradient' && '🌈'}
                {formData.template === 'brutalist' && '⬛'}
                {formData.template === 'soft' && '🧸'}
              </span>
              <span className={styles.templateName}>
                {formData.template === 'claude' && 'Claude - Profissional'}
                {formData.template === 'stripe' && 'Stripe - Minimalista'}
                {formData.template === 'vercel' && 'Vercel - Dark Mode'}
                {formData.template === 'gradient' && 'Gradient - Colorido'}
                {formData.template === 'brutalist' && 'Brutalist - Ousado'}
                {formData.template === 'soft' && 'Soft - Suave'}
                {hasFixedColor() && (
                  <span 
                    className={styles.fixedColorBadge}
                    style={{ backgroundColor: getEffectiveColor() }}
                  >
                    Cor Fixa
                  </span>
                )}
              </span>
              <span className={styles.templateChange}>Alterar →</span>
            </button>
          </div>

          {/* Seção de Imagens com Accordions */}
          <div className={styles.inputGroup}>
            <label>Imagens</label>
            
            {/* Accordion Hero */}
            <div className={styles.accordion}>
              <button
                type="button"
                className={`${styles.accordionHeader} ${imageAccordionOpen.hero ? styles.accordionOpen : ''}`}
                onClick={() => setImageAccordionOpen({ ...imageAccordionOpen, hero: !imageAccordionOpen.hero })}
              >
                <span>Hero</span>
                <span className={styles.accordionIcon}>{imageAccordionOpen.hero ? '▼' : '▶'}</span>
              </button>
              {imageAccordionOpen.hero && (
                <div className={styles.accordionContent}>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="hero_image_type"
                        value="none"
                        checked={formData.hero_image_type === 'none'}
                        onChange={(e) => setFormData({ ...formData, hero_image_type: e.target.value, hero_image_url: '' })}
                      />
                      <span>Sem imagem (texto centralizado)</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="hero_image_type"
                        value="url"
                        checked={formData.hero_image_type === 'url'}
                        onChange={(e) => setFormData({ ...formData, hero_image_type: e.target.value })}
                      />
                      <span>URL externa</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="hero_image_type"
                        value="upload"
                        checked={formData.hero_image_type === 'upload'}
                        onChange={(e) => setFormData({ ...formData, hero_image_type: e.target.value })}
                        disabled
                      />
                      <span>Upload (em breve)</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="hero_image_type"
                        value="ai"
                        checked={formData.hero_image_type === 'ai'}
                        onChange={(e) => setFormData({ ...formData, hero_image_type: e.target.value })}
                      />
                      <span>🤖 Gerar com IA</span>
                    </label>
                  </div>
                  {formData.hero_image_type === 'url' && (
                    <input
                      type="url"
                      value={formData.hero_image_url}
                      onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                      placeholder="https://exemplo.com/imagem.jpg"
                      className={styles.urlInput}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Accordion About (Missão) */}
            <div className={styles.accordion}>
              <button
                type="button"
                className={`${styles.accordionHeader} ${imageAccordionOpen.about ? styles.accordionOpen : ''}`}
                onClick={() => setImageAccordionOpen({ ...imageAccordionOpen, about: !imageAccordionOpen.about })}
              >
                <span>Missão</span>
                <span className={styles.accordionIcon}>{imageAccordionOpen.about ? '▼' : '▶'}</span>
              </button>
              {imageAccordionOpen.about && (
                <div className={styles.accordionContent}>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="about_image_type"
                        value="none"
                        checked={formData.about_image_type === 'none'}
                        onChange={(e) => setFormData({ ...formData, about_image_type: e.target.value, about_image_url: '' })}
                      />
                      <span>Sem imagem</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="about_image_type"
                        value="url"
                        checked={formData.about_image_type === 'url'}
                        onChange={(e) => setFormData({ ...formData, about_image_type: e.target.value })}
                      />
                      <span>URL externa</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="about_image_type"
                        value="upload"
                        checked={formData.about_image_type === 'upload'}
                        onChange={(e) => setFormData({ ...formData, about_image_type: e.target.value })}
                        disabled
                      />
                      <span>Upload (em breve)</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="about_image_type"
                        value="ai"
                        checked={formData.about_image_type === 'ai'}
                        onChange={(e) => setFormData({ ...formData, about_image_type: e.target.value })}
                      />
                      <span>🤖 Gerar com IA</span>
                    </label>
                  </div>
                  {formData.about_image_type === 'url' && (
                    <input
                      type="url"
                      value={formData.about_image_url}
                      onChange={(e) => setFormData({ ...formData, about_image_url: e.target.value })}
                      placeholder="https://exemplo.com/imagem.jpg"
                      className={styles.urlInput}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Accordion Product */}
            <div className={styles.accordion}>
              <button
                type="button"
                className={`${styles.accordionHeader} ${imageAccordionOpen.product ? styles.accordionOpen : ''}`}
                onClick={() => setImageAccordionOpen({ ...imageAccordionOpen, product: !imageAccordionOpen.product })}
              >
                <span>Descrição do Produto</span>
                <span className={styles.accordionIcon}>{imageAccordionOpen.product ? '▼' : '▶'}</span>
              </button>
              {imageAccordionOpen.product && (
                <div className={styles.accordionContent}>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="product_image_type"
                        value="none"
                        checked={formData.product_image_type === 'none'}
                        onChange={(e) => setFormData({ ...formData, product_image_type: e.target.value, product_image_url: '' })}
                      />
                      <span>Sem imagem</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="product_image_type"
                        value="url"
                        checked={formData.product_image_type === 'url'}
                        onChange={(e) => setFormData({ ...formData, product_image_type: e.target.value })}
                      />
                      <span>URL externa</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="product_image_type"
                        value="upload"
                        checked={formData.product_image_type === 'upload'}
                        onChange={(e) => setFormData({ ...formData, product_image_type: e.target.value })}
                        disabled
                      />
                      <span>Upload (em breve)</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="product_image_type"
                        value="ai"
                        checked={formData.product_image_type === 'ai'}
                        onChange={(e) => setFormData({ ...formData, product_image_type: e.target.value })}
                      />
                      <span>🤖 Gerar com IA</span>
                    </label>
                  </div>
                  {formData.product_image_type === 'url' && (
                    <input
                      type="url"
                      value={formData.product_image_url}
                      onChange={(e) => setFormData({ ...formData, product_image_url: e.target.value })}
                      placeholder="https://exemplo.com/imagem.jpg"
                      className={styles.urlInput}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {!hasFixedColor() && (
            <div className={styles.inputGroup}>
              <label>Cor primária</label>
              <div className={styles.colorPicker}>
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value.trim() })}
                  placeholder="#667eea"
                />
              </div>
            </div>
          )}

          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.collect_phone}
                onChange={(e) => setFormData({ ...formData, collect_phone: e.target.checked })}
              />
              Coletar telefone
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.collect_suggestions}
                onChange={(e) => setFormData({ ...formData, collect_suggestions: e.target.checked })}
              />
              Coletar sugestões/feedback
            </label>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className={styles.generateBtn}
          >
            {loading ? '🤖 Gerando...' : variations.length > 0 ? '🔄 Gerar outra versão' : '✨ Gerar com IA'}
          </button>

          {variations.length > 0 && (
            <button
              onClick={handleSave}
              disabled={!formData.slug}
              className={styles.saveBtn}
            >
              💾 Salvar Landing Page
            </button>
          )}
          {/* Thumbnails */}
          {variations.length > 0 && (
            <div className={styles.thumbnailSection}>
              <label>Variações geradas ({variations.length})</label>
              <div className={styles.thumbnails}>
                {variations.map((variation, idx) => (
                  <div
                    key={idx}
                    className={`${styles.thumbnail} ${idx === selectedIndex ? styles.selected : ''}`}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    <div className={styles.thumbnailNumber}>#{idx + 1}</div>
                    <div className={styles.thumbnailContent}>
                      <strong>{variation.headline}</strong>
                      <p>{variation.subheadline?.substring(0, 60)}...</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}        </div>

        {/* Preview */}
        <div className={styles.preview} ref={previewRef}>
          {loading ? (
            <div className={styles.emptyPreview}>
              <div className={styles.loadingSpinner}>⏳</div>
              <p>Gerando sua landing page...</p>
            </div>
          ) : variations.length > 0 ? (
            <LandingPagePreview
              headline={variations[selectedIndex].headline}
              subheadline={variations[selectedIndex].subheadline}
              ctaText={variations[selectedIndex].cta_text}
              valueProposition={variations[selectedIndex].value_proposition}
              howItWorks={variations[selectedIndex].how_it_works}
              faqItems={variations[selectedIndex].faq_items}
              ctaHeadline={variations[selectedIndex].cta_headline}
              ctaSubheadline={variations[selectedIndex].cta_subheadline}
              heroImage={formData.hero_image_type === 'url' ? formData.hero_image_url : variations[selectedIndex].hero_image}
              heroImageType={formData.hero_image_type}
              primaryColor={getEffectiveColor()}
              template={formData.template}
              collectPhone={formData.collect_phone}
              collectSuggestions={formData.collect_suggestions}
              onRegenerateImage={() => handleRegenerateImage(selectedIndex)}
              onRegenerateAboutImage={() => handleRegenerateAboutImage(selectedIndex)}
              onRegenerateProductImage={() => handleRegenerateProductImage(selectedIndex)}
              showcaseType={variations[selectedIndex].showcase_type}
              showcaseData={variations[selectedIndex].showcase_data}
              aboutTitle={variations[selectedIndex].about_title}
              aboutParagraphs={variations[selectedIndex].about_paragraphs}
              aboutImage={formData.about_image_type === 'url' ? formData.about_image_url : variations[selectedIndex].about_image}
              aboutImageType={formData.about_image_type}
              productTitle={variations[selectedIndex].product_title}
              productParagraphs={variations[selectedIndex].product_paragraphs}
              productImage={formData.product_image_type === 'url' ? formData.product_image_url : variations[selectedIndex].product_image}
              productImageType={formData.product_image_type}
              features={variations[selectedIndex].features || collectedData.features || []}
              benefits={variations[selectedIndex].benefits || collectedData.benefits || []}
              testimonials={variations[selectedIndex].testimonials || collectedData.testimonials || []}
              pricingPlans={variations[selectedIndex].pricingPlans || collectedData.pricing_plans || []}
              guarantee={variations[selectedIndex].guarantee || collectedData.guarantee}
              stats={variations[selectedIndex].stats || collectedData.stats || []}
            />
          ) : (
            <div className={styles.emptyPreview}>
              <p>👈 Preencha os campos e clique em "Gerar com IA"</p>
            </div>
          )}
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <TemplateSelector
          currentTemplate={formData.template}
          onTemplateChange={(template) => setFormData({ ...formData, template })}
          onClose={() => setShowTemplateSelector(false)}
          darkMode={darkMode}
        />
      )}

      {/* Improve Description Modal */}
      {showImproveModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImproveModal(false)}>
          <div className={styles.improveModal} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowImproveModal(false)} className={styles.closeBtn}>✕</button>
            
            <div className={styles.improveModalContent}>
              <h3>💡 Melhore sua landing page</h3>
              <p>A IA não conseguiu gerar algumas seções. Preencha abaixo para complementar sua descrição:</p>
              
              <ul className={styles.missingList}>
                {missingFields.map((field, idx) => (
                  <li key={idx}>
                    <span className={styles.missingIcon}>❌</span>
                    {field}
                  </li>
                ))}
              </ul>

              <div className={styles.improveFields}>
                {missingFields.includes('Benefícios/Proposta de Valor') && (
                  <div className={styles.improveField}>
                    <label>
                      <strong>📌 Benefícios/Proposta de Valor</strong>
                      <small>Liste os principais benefícios, um por linha</small>
                    </label>
                    <textarea
                      value={improveData.benefits}
                      onChange={(e) => setImproveData({ ...improveData, benefits: e.target.value })}
                      placeholder="Ex:&#10;- Economia de até 50% no tempo&#10;- Interface intuitiva e fácil de usar&#10;- Resultados em 24 horas"
                      rows={4}
                    />
                  </div>
                )}

                {missingFields.includes('Como Funciona') && (
                  <div className={styles.improveField}>
                    <label>
                      <strong>🔄 Como Funciona</strong>
                      <small>Descreva o passo a passo, pode numerar</small>
                    </label>
                    <textarea
                      value={improveData.howItWorks}
                      onChange={(e) => setImproveData({ ...improveData, howItWorks: e.target.value })}
                      placeholder="Ex:&#10;1. Faça seu cadastro em 2 minutos&#10;2. Configure suas preferências&#10;3. Comece a usar imediatamente"
                      rows={4}
                    />
                  </div>
                )}

                {missingFields.includes('Perguntas Frequentes (FAQ)') && (
                  <div className={styles.improveField}>
                    <label>
                      <strong>❓ Perguntas Frequentes</strong>
                      <small>Liste perguntas e respostas que seu público pode ter</small>
                    </label>
                    <textarea
                      value={improveData.faq}
                      onChange={(e) => setImproveData({ ...improveData, faq: e.target.value })}
                      placeholder="Ex:&#10;1. Quanto custa? R$ 49/mês&#10;2. Tem período de teste? Sim, 7 dias grátis&#10;3. Posso cancelar quando quiser? Sim, sem multa"
                      rows={5}
                    />
                  </div>
                )}
              </div>

              <div className={styles.improveModalActions}>
                <button 
                  className={styles.improveCloseBtn}
                  onClick={handleIncorporateImproveData}
                >
                  ✅ Adicionar e gerar novamente
                </button>
                <button 
                  className={styles.improveContinueBtn}
                  onClick={() => setShowImproveModal(false)}
                >
                  Continuar assim mesmo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
