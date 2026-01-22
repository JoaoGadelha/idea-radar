# Design System - Landing Pages IdeaRadar

> 🎨 Sistema de Templates Visuais
> Documento de referência para os 3 templates de alta conversão

## 🎨 Templates Disponíveis

### 1. "Claude" (Padrão Atual)
- **Estilo:** Profissional, suave, roxo/indigo
- **Inspiração:** Claude AI, Notion, Tailwind UI
- **Conversão:** ★★★★★
- **Características:** Glassmorphism, gradientes suaves, muito espaço

### 2. "Stripe" (Minimalista)
- **Estilo:** Ultra limpo, tipografia gigante, preto/branco
- **Inspiração:** Stripe, Linear, Apple
- **Conversão:** ★★★★★
- **Características:** Tipografia extrema, espaçamento máximo, minimal

### 3. "Vercel" (Dark Mode)
- **Estilo:** Elegante dark, cores vibrantes, futurista
- **Inspiração:** Vercel, Framer, GitHub Dark
- **Conversão:** ★★★★☆
- **Características:** Fundo escuro, acentos neon, gradientes vibrantes

---

# Template 1: "Claude" (Atual)

> 🎨 Fingerprint do padrão visual "Claude" - Commit c319fe0
> Documento de referência para manter consistência visual nas landing pages

## 🎨 Paleta de Cores

### Cor Primária
```css
--primary: #6366f1;           /* Indigo 500 - Tailwind */
--primary-dark: #4338ca;      /* Indigo 700 - usado em gradientes */
```

### Cores de Texto
```css
--text-primary: #1a1a2e;      /* Títulos e textos principais */
--text-secondary: #64748b;    /* Subtítulos e descrições */
--text-muted: #475569;        /* Texto terciário */
```

### Cores de Background
```css
--bg-white: #ffffff;
--bg-gray-light: #f8fafc;     /* Slate 50 - seções alternadas */
--bg-gray-border: #e2e8f0;    /* Slate 200 - bordas */
```

### Transparências
```css
--primary-10: rgba(99, 102, 241, 0.1);   /* Badges, ícones */
--primary-15: rgba(99, 102, 241, 0.15);  /* Badges hover */
--primary-20: rgba(99, 102, 241, 0.2);   /* Hero placeholder */
--primary-40: rgba(99, 102, 241, 0.4);   /* Hero placeholder gradient */
```

## 📐 Espaçamentos

### Container
```css
max-width: 1200px;
padding: 0 2rem;
margin: 0 auto;
```

### Seções
```css
padding: 5rem 0;              /* Seções principais */
padding: 4rem 0 5rem;         /* Hero section */
padding: 2rem 0;              /* Social proof bar */
```

### Gaps
```css
gap: 4rem;                    /* Hero grid (desktop) */
gap: 3rem;                    /* Hero grid (tablet) */
gap: 2rem;                    /* Steps grid */
gap: 1.5rem;                  /* FAQ grid */
gap: 0.75rem;                 /* Value list, CTA group */
```

## 🔤 Tipografia

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Tamanhos e Pesos
```css
/* Headlines */
.headline {
  font-size: 3rem;            /* 48px */
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

/* Subheadline */
.subheadline {
  font-size: 1.25rem;         /* 20px */
  line-height: 1.6;
}

/* Section Title */
.sectionTitle {
  font-size: 2.25rem;         /* 36px */
  font-weight: 800;
}

/* Section Tag */
.sectionTag {
  font-size: 0.75rem;         /* 12px */
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
```

## 🎭 Componentes

### Navigation
```css
position: sticky;
top: 0;
z-index: 100;
background: rgba(255, 255, 255, 0.95);
backdrop-filter: blur(10px);
border-bottom: 1px solid rgba(0, 0, 0, 0.05);
padding: 1rem 0;
```

### Badges
```css
display: inline-flex;
padding: 0.5rem 1rem;
border-radius: 100px;         /* Pill shape */
font-size: 0.875rem;
font-weight: 600;
background-color: rgba(99, 102, 241, 0.1);
color: #6366f1;
```

### Buttons
```css
/* Primary CTA */
padding: 0.875rem 1.5rem;
border-radius: 8px;
font-weight: 600;
font-size: 1rem;
background-color: #6366f1;
color: white;
transition: all 0.2s ease;

/* Hover */
transform: translateY(-1px);
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
```

### Cards
```css
padding: 2rem;
background: #f8fafc;
border-radius: 16px;
transition: all 0.3s ease;

/* Hover */
transform: translateY(-4px);
box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.1);
```

### Input Groups
```css
display: flex;
gap: 0.5rem;
background: white;
padding: 0.375rem;
border-radius: 12px;
border: 2px solid #e2e8f0;
```

## 🎨 Border Radius

```css
--radius-sm: 8px;            /* Buttons, nav CTA */
--radius-md: 10px;           /* CTA final inputs/button */
--radius-lg: 12px;           /* Email input group, FAQ cards */
--radius-xl: 16px;           /* Step cards, hero image */
--radius-full: 100px;        /* Badges (pill shape) */
--radius-circle: 50%;        /* Ícones FAQ */
```

## 🌈 Gradientes

### Background Gradientes
```css
/* Hero Section */
background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);

/* CTA Final */
background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);

/* Hero Placeholder */
background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.4) 100%);
```

## 📦 Grid Layouts

### Hero
```css
display: grid;
grid-template-columns: 1fr 1fr;
gap: 4rem;
align-items: center;

/* Mobile */
@media (max-width: 1024px) {
  grid-template-columns: 1fr;
}
```

### Steps (Como Funciona)
```css
display: grid;
grid-template-columns: repeat(3, 1fr);
gap: 2rem;

/* Mobile */
@media (max-width: 1024px) {
  grid-template-columns: 1fr;
}
```

### FAQ
```css
display: grid;
grid-template-columns: repeat(2, 1fr);
gap: 1.5rem;

/* Mobile */
@media (max-width: 1024px) {
  grid-template-columns: 1fr;
}
```

## ✨ Efeitos Visuais

### Glassmorphism (Nav)
```css
background: rgba(255, 255, 255, 0.95);
backdrop-filter: blur(10px);
```

### Shadows
```css
/* Hover Cards */
box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.1);

/* Hover Buttons */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

/* Hero Image */
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
```

### Transitions
```css
transition: all 0.2s ease;    /* Buttons, inputs */
transition: all 0.3s ease;    /* Cards */
```

### Transforms
```css
/* Hover states */
transform: translateY(-1px);  /* Buttons */
transform: translateY(-2px);  /* CTA Final button */
transform: translateY(-4px);  /* Cards */
```

## 🎯 Ícones e Emojis

### Padrão de Uso
- ✨ Badges (em breve, novidades)
- 🚀 Logo, steps (lançamento, ação)
- ✓ Check marks em listas de benefícios
- 🔒 Segurança e privacidade
- 📊 Analytics, métricas
- 💡 Ideias, criatividade
- 🎨 Design, criação
- ⭐ Ratings, avaliações
- ? FAQ icons (em circles brancos)

## 📱 Breakpoints

```css
/* Tablet */
@media (max-width: 1024px) {
  /* Grid columns: 1fr */
  /* Hero: centro alinhado */
}

/* Mobile */
@media (max-width: 640px) {
  /* Headlines: 2rem */
  /* Email inputs: vertical stack */
  /* Social proof: vertical */
}
```

## 🎨 Aspect Ratios

```css
/* Hero Image/Placeholder */
aspect-ratio: 16/10;
```

## ⚠️ REGRAS IMPORTANTES

### ✅ SEMPRE usar:
- Max-width 1200px nos containers
- Padding 0 2rem nos containers
- Border-radius generosos (8px+)
- Gradientes suaves (180deg ou 135deg)
- Transições suaves (0.2s - 0.3s)
- Transform em hovers (-1px a -4px)
- Emojis nos badges e ícones
- Backdrop-filter na nav
- Gap ao invés de margins quando possível

### ❌ NUNCA usar:
- Cores muito saturadas (manter suavidade)
- Borders muito grossos (max 2px)
- Sombras muito pesadas
- Animações bruscas/rápidas
- Fontes que não sejam system fonts
- Border-radius muito pequenos (<8px)
- Layouts assimétricos complexos

## 🎯 Fórmula Visual

```
Limpo + Espaçoso + Suave + Profissional = Padrão Claude
```

### Características-chave:
1. **Muito espaço em branco**
2. **Tipografia grande e bold**
3. **Cores suaves com ênfase no roxo/indigo**
4. **Gradientes sutis**
5. **Cards com hover effects**
6. **Glassmorphism na nav**
7. **Border-radius generosos**
8. **Emojis como ícones decorativos**
9. **Grid responsivo simples**
10. **Transições e transforms suaves**

---

## 📋 Checklist de Conformidade

Ao criar/revisar uma landing page, verificar:

- [ ] Cor primária é #6366f1
- [ ] Container max-width: 1200px
- [ ] Padding lateral: 2rem
- [ ] Nav com backdrop-filter: blur(10px)
- [ ] Headlines: 3rem, weight 800
- [ ] Border-radius mínimo: 8px
- [ ] Gradientes 180deg ou 135deg
- [ ] Transitions: 0.2s - 0.3s ease
- [ ] Hover com transform: translateY(-)
- [ ] Gap ao invés de margins
- [ ] Grid responsivo (1fr em mobile)
- [ ] Emojis nos badges
- [ ] Social proof com dividers
- [ ] FAQ em cards com ?
- [ ] CTA final com gradiente roxo
- [ ] Footer dark (#1a1a2e)

---

> 💡 **Quando em dúvida:** Prefira mais espaço, bordas mais arredondadas e cores mais suaves.
> Este é o DNA visual das landing pages que convertem bem e têm aparência profissional.

---

# Template 2: "Stripe" (Minimalista)

## 🎨 Paleta de Cores

### Cor Primária
```css
--primary: #000000;           /* Preto puro */
--primary-light: #333333;     /* Cinza escuro */
```

### Cores de Texto
```css
--text-primary: #000000;      /* Preto para títulos */
--text-secondary: #666666;    /* Cinza médio */
--text-muted: #999999;        /* Cinza claro */
```

### Cores de Background
```css
--bg-white: #ffffff;
--bg-gray-light: #fafafa;     /* Quase branco */
--bg-gray-border: #e6e6e6;    /* Cinza muito claro */
```

### Acentos
```css
--accent-blue: #0070f3;       /* Azul Stripe/Vercel */
--accent-purple: #7928ca;     /* Roxo vibrante (opcional) */
```

## 📐 Espaçamentos

### Container
```css
max-width: 1280px;            /* Mais largo que Claude */
padding: 0 3rem;              /* Mais padding lateral */
margin: 0 auto;
```

### Seções
```css
padding: 8rem 0;              /* Seções MUITO espaçosas */
padding: 10rem 0 8rem;        /* Hero section - gigante */
```

### Gaps
```css
gap: 6rem;                    /* Espaçamento extremo */
gap: 4rem;                    /* Entre elementos */
```

## 🔤 Tipografia

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Tamanhos e Pesos (GIGANTES)
```css
/* Headlines */
.headline {
  font-size: 4.5rem;          /* 72px - ENORME */
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;    /* Tight */
}

/* Subheadline */
.subheadline {
  font-size: 1.5rem;          /* 24px */
  line-height: 1.5;
  font-weight: 400;
}
```

## 🎭 Componentes

### Navigation
```css
position: sticky;
top: 0;
z-index: 100;
background: rgba(255, 255, 255, 0.8);
backdrop-filter: saturate(180%) blur(20px);
border-bottom: 1px solid #e6e6e6;
padding: 1.5rem 0;
```

### Buttons
```css
/* Primary - Minimal */
padding: 1rem 2rem;
border-radius: 6px;           /* Menos arredondado */
font-weight: 500;
font-size: 1rem;
background-color: #000000;
color: white;
transition: all 0.15s ease;

/* Hover */
transform: translateY(-2px);
box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
```

### Cards
```css
padding: 3rem;                /* Muito padding */
background: #ffffff;
border: 1px solid #e6e6e6;    /* Border sutil */
border-radius: 8px;           /* Pouco arredondado */
transition: all 0.2s ease;

/* Hover */
border-color: #000000;
transform: translateY(-2px);
```

## 🎨 Border Radius (Minimal)

```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
```

## 🌈 Gradientes (Sutis)

```css
/* Hero Section - quase imperceptível */
background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);

/* CTA - sólido preto */
background: #000000;
```

## ⚠️ REGRAS STRIPE

### ✅ SEMPRE usar:
- Tipografia GIGANTE (4rem+)
- Espaçamento EXTREMO (8rem+)
- Preto/Branco dominantes
- Borders sutis (1px)
- Animações rápidas (0.15s)
- System fonts apenas
- Layout simétrico e centralizado

### ❌ NUNCA usar:
- Cores saturadas demais
- Gradientes chamativos
- Border-radius grandes
- Sombras pesadas
- Emojis (usar SVG icons)
- Backgrounds coloridos

## 🎯 Fórmula Visual

```
Minimalismo Extremo + Tipografia Gigante + Preto/Branco = Stripe
```

---

# Template 3: "Vercel" (Dark Mode)

## 🎨 Paleta de Cores

### Backgrounds
```css
--bg-primary: #000000;        /* Preto puro */
--bg-secondary: #111111;      /* Preto quase puro */
--bg-card: #171717;           /* Cinza muito escuro */
```

### Cores de Texto
```css
--text-primary: #ffffff;      /* Branco */
--text-secondary: #a1a1a1;    /* Cinza médio */
--text-muted: #666666;        /* Cinza escuro */
```

### Acentos Vibrantes
```css
--accent-cyan: #00d9ff;       /* Ciano neon */
--accent-purple: #a855f7;     /* Roxo vibrante */
--accent-pink: #ec4899;       /* Rosa vibrante */
--accent-blue: #3b82f6;       /* Azul */
```

### Borders
```css
--border-primary: #262626;    /* Cinza escuro sutil */
--border-glow: rgba(0, 217, 255, 0.3);  /* Glow ciano */
```

## 📐 Espaçamentos

### Container
```css
max-width: 1200px;
padding: 0 2rem;
margin: 0 auto;
```

### Seções
```css
padding: 6rem 0;
padding: 8rem 0 6rem;         /* Hero */
```

## 🔤 Tipografia

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Tamanhos e Pesos
```css
/* Headlines */
.headline {
  font-size: 3.5rem;          /* 56px */
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #ffffff 0%, #a1a1a1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Subheadline */
.subheadline {
  font-size: 1.25rem;
  line-height: 1.6;
  color: #a1a1a1;
}
```

## 🎭 Componentes

### Navigation
```css
position: sticky;
top: 0;
z-index: 100;
background: rgba(0, 0, 0, 0.8);
backdrop-filter: blur(12px);
border-bottom: 1px solid #262626;
padding: 1rem 0;
```

### Buttons
```css
/* Primary - Gradiente vibrante */
padding: 0.875rem 1.5rem;
border-radius: 8px;
font-weight: 600;
font-size: 1rem;
background: linear-gradient(135deg, #00d9ff 0%, #a855f7 100%);
color: #000000;              /* Texto escuro no gradiente */
transition: all 0.3s ease;

/* Hover */
transform: translateY(-2px);
box-shadow: 0 8px 24px rgba(0, 217, 255, 0.4);
filter: brightness(1.1);
```

### Cards
```css
padding: 2rem;
background: #171717;
border: 1px solid #262626;
border-radius: 12px;
transition: all 0.3s ease;

/* Hover - Glow effect */
border-color: rgba(0, 217, 255, 0.5);
box-shadow: 0 0 24px rgba(0, 217, 255, 0.15);
transform: translateY(-4px);
```

### Input Groups
```css
background: #171717;
border: 1px solid #262626;
border-radius: 8px;

/* Focus */
border-color: #00d9ff;
box-shadow: 0 0 0 3px rgba(0, 217, 255, 0.1);
```

## 🎨 Border Radius

```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
```

## 🌈 Gradientes (Vibrantes)

```css
/* Hero Section */
background: radial-gradient(ellipse at top, #111111 0%, #000000 100%);

/* CTA Button */
background: linear-gradient(135deg, #00d9ff 0%, #a855f7 100%);

/* Card Hover Glow */
background: radial-gradient(circle at top, rgba(0, 217, 255, 0.1) 0%, transparent 70%);

/* Text Gradient */
background: linear-gradient(135deg, #00d9ff 0%, #a855f7 50%, #ec4899 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

## ✨ Efeitos Visuais

### Glow Effects
```css
/* Button Hover */
box-shadow: 0 8px 32px rgba(0, 217, 255, 0.4);

/* Card Hover */
box-shadow: 0 0 24px rgba(0, 217, 255, 0.15);

/* Input Focus */
box-shadow: 0 0 0 3px rgba(0, 217, 255, 0.1);
```

### Transitions (Suaves)
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

## ⚠️ REGRAS VERCEL

### ✅ SEMPRE usar:
- Background preto (#000000)
- Acentos ciano/roxo/rosa vibrantes
- Glow effects em hovers
- Gradientes em textos
- Borders sutis (#262626)
- Backdrop-filter blur
- Text gradients em headlines
- Transições suaves (0.3s)

### ❌ NUNCA usar:
- Backgrounds claros
- Cores apagadas
- Sombras pesadas sem glow
- Texto preto
- Borders grossos
- Cores quentes (laranja, vermelho forte)

## 🎯 Fórmula Visual

```
Dark Mode + Cores Neon + Glow Effects + Futurista = Vercel
```

---

## 📊 Comparação dos Templates

| Característica | Claude | Stripe | Vercel |
|----------------|--------|--------|--------|
| **Background** | Branco/Cinza claro | Branco puro | Preto |
| **Cor Principal** | Roxo #6366f1 | Preto #000000 | Ciano #00d9ff |
| **Tipografia** | 3rem (48px) | 4.5rem (72px) | 3.5rem (56px) |
| **Espaçamento** | Generoso (5rem) | Extremo (8rem) | Moderado (6rem) |
| **Border Radius** | Grande (8-16px) | Pequeno (4-8px) | Médio (6-12px) |
| **Efeito Signature** | Glassmorphism | Minimalismo | Glow/Neon |
| **Conversão** | ★★★★★ | ★★★★★ | ★★★★☆ |
| **Melhor Para** | SaaS B2B | Fintech, Dev Tools | Tech, Gaming |

---

> 💡 **Escolha o template baseado no público:**
> - **Claude:** Empresas, profissionais, SaaS tradicional
> - **Stripe:** Desenvolvedores, fintechs, produtos premium
> - **Vercel:** Startups tech, produtos inovadores, público jovem
