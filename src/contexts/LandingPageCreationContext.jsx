import { createContext, useContext, useState } from 'react';

const LandingPageCreationContext = createContext();

export function LandingPageCreationProvider({ children }) {
  const [currentView, setCurrentView] = useState('choice'); // 'choice' | 'chat' | 'builder'
  const [previousView, setPreviousView] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [collectedData, setCollectedData] = useState({
    // Dados básicos
    title: '',
    slug: '',
    brief: '',
    
    // Template e design
    template: 'claude',
    primary_color: '',
    
    // Hero
    hero_image_type: 'none',
    hero_image_url: '',
    
    // Showcase (About/Product)
    showcase_type: 'none',
    about_title: '',
    about_paragraphs: [],
    about_image_type: 'none',
    about_image_url: '',
    product_title: '',
    product_paragraphs: [],
    product_image_type: 'none',
    product_image_url: '',
    
    // Configurações
    collect_phone: false,
    collect_suggestions: true,
    
    // Novos campos que serão coletados
    pricing_plans: [], // [{name, price, features: []}]
    testimonials: [], // [{name, role, quote, rating}]
    guarantee: null, // {days, description}
    features: [], // Lista detalhada de funcionalidades
    benefits: {}, // {category: [benefits]}
    stats: [], // [{value, label}]
  });

  const updateCollectedData = (updates) => {
    setCollectedData(prev => ({ ...prev, ...updates }));
  };

  const addChatMessage = (message) => {
    setChatHistory(prev => [...prev, message]);
  };

  const changeView = (newView) => {
    setPreviousView(currentView);
    setCurrentView(newView);
  };

  const goBack = () => {
    if (previousView) {
      setCurrentView(previousView);
      setPreviousView(null);
    } else {
      setCurrentView('choice');
    }
  };

  const resetCreation = () => {
    setCurrentView('choice');
    setPreviousView(null);
    setChatHistory([]);
    setCollectedData({
      title: '',
      slug: '',
      brief: '',
      template: 'claude',
      primary_color: '',
      hero_image_type: 'none',
      hero_image_url: '',
      showcase_type: 'none',
      about_title: '',
      about_paragraphs: [],
      about_image_type: 'none',
      about_image_url: '',
      product_title: '',
      product_paragraphs: [],
      product_image_type: 'none',
      product_image_url: '',
      collect_phone: false,
      collect_suggestions: true,
      pricing_plans: [],
      testimonials: [],
      guarantee: null,
      features: [],
      benefits: {},
      stats: [],
    });
  };

  return (
    <LandingPageCreationContext.Provider
      value={{
        currentView,
        setCurrentView,
        previousView,
        changeView,
        goBack,
        chatHistory,
        addChatMessage,
        collectedData,
        updateCollectedData,
        resetCreation,
      }}
    >
      {children}
    </LandingPageCreationContext.Provider>
  );
}

export function useLandingPageCreation() {
  const context = useContext(LandingPageCreationContext);
  if (!context) {
    throw new Error('useLandingPageCreation must be used within LandingPageCreationProvider');
  }
  return context;
}
