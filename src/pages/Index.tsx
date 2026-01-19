
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from "framer-motion";
import { ArrowRight, Check, ExternalLink, MessageCircle, Video, Palette, Smartphone, Globe, Users } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { AuroraBackground } from '@/components/AuroraBackground';

// Componente de Header com navegação
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0e0f12]/80 backdrop-blur-md border-b border-[#8A8F99]/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[#F3F3F3] font-bold text-xl">my</span>
              <span className="text-orange-500 font-bold text-xl">Links</span>
              <span className="text-[#8A8F99] font-bold text-xl">.com</span>
            </div>
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#recursos" className="text-[#8A8F99] hover:text-[#F3F3F3] transition-colors">Recursos</a>
            <a href="#planos" className="text-[#8A8F99] hover:text-[#F3F3F3] transition-colors">Planos</a>
            <a href="#ajuda" className="text-[#8A8F99] hover:text-[#F3F3F3] transition-colors">Ajuda</a>
            <a href="#faq" className="text-[#8A8F99] hover:text-[#F3F3F3] transition-colors">FAQ</a>
          </nav>

          {/* CTA Button */}
          <div className="flex items-center gap-4">
            <Button
              asChild
              className="bg-gradient-to-r from-[#FF7A1A] to-[#FF5A00] hover:from-[#FF5A00] hover:to-[#FF7A1A] text-[#F3F3F3] rounded-full px-6 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
            >
              <Link to="/auth?mode=register">Criar grátis</Link>
            </Button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center gap-1">
                <span className={`w-6 h-0.5 bg-foreground transition-all ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                <span className={`w-6 h-0.5 bg-foreground transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`w-6 h-0.5 bg-foreground transition-all ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-[#8A8F99]/20 py-4"
          >
            <nav className="flex flex-col gap-4">
              <a href="#recursos" className="text-[#8A8F99] hover:text-[#F3F3F3] transition-colors py-2">Recursos</a>
              <a href="#planos" className="text-[#8A8F99] hover:text-[#F3F3F3] transition-colors py-2">Planos</a>
              <a href="#ajuda" className="text-[#8A8F99] hover:text-[#F3F3F3] transition-colors py-2">Ajuda</a>
              <a href="#faq" className="text-[#8A8F99] hover:text-[#F3F3F3] transition-colors py-2">FAQ</a>
              <Button
                asChild
                className="bg-gradient-to-r from-[#FF7A1A] to-[#FF5A00] hover:from-[#FF5A00] hover:to-[#FF7A1A] text-[#F3F3F3] rounded-full"
              >
                <Link to="/auth?mode=register">Criar grátis</Link>
              </Button>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
};

// Componente Hero Section
const HeroSection = () => {
  return (
    <AuroraBackground className="min-h-screen">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-orange-500/30 to-orange-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-teal-500/30 to-teal-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 mb-6"
              >
                <span className="text-sm font-medium">Ganhe 20% de desconto</span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
              >
                Transforme sua bio em um{' '}
                <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  mini-site que converte
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0"
              >
                Seu mini-site em minutos. Adicione links, cards, WhatsApp com mensagem personalizada e vídeos do YouTube. Comece grátis.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Button
                  size="lg"
                  asChild
                  className="bg-gradient-to-r from-[#FF7A1A] to-[#FF5A00] hover:from-[#FF5A00] hover:to-[#FF7A1A] text-[#F3F3F3] rounded-full px-8 py-6 text-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
                >
                  <Link to="/auth?mode=register" className="flex items-center gap-2">
                    Crie seu mini site grátis
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-[#8A8F99] text-[#B0B6C1] hover:text-[#F3F3F3] hover:border-[#F3F3F3] rounded-full px-8 py-6 text-lg"
                >
                  <Link to="#planos">Conheça os planos</Link>
                </Button>
              </motion.div>

              {/* Trust indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex items-center gap-2 mt-8 text-[#8A8F99]"
              >
                <Check className="w-5 h-5 text-[#69E36E]" />
                <span>+ 5.820 criadores já usam</span>
              </motion.div>
            </motion.div>

            {/* Right content - Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative flex justify-center items-center"
            >
              <img
                src="/mini-site-hiro.png"
                alt="Demonstração do mini-site em celulares"
                className="w-full max-w-lg"
              />
              <div className="absolute bottom-6 right-6">
                <Button
                  asChild
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full px-6 py-3 text-base shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
                >
                  <Link to="/club-mylinksss">Marketingplace</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </AuroraBackground>
  );
};

// Componente Feature Cards
const FeatureCards = () => {
  const features = [
    {
      icon: <Palette className="w-8 h-8 text-orange-500" />,
      title: "Links customizáveis",
      description: "Personalize cores, ícones e ordem dos seus links para criar uma experiência única.",
      color: "orange"
    },
    {
      icon: <Smartphone className="w-8 h-8 text-teal-500" />,
      title: "Cards interativos",
      description: "Destaque promoções e conteúdos com cards visuais e botões de chamada.",
      color: "teal"
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-green-500" />,
      title: "WhatsApp integrado",
      description: "Botão direto para WhatsApp com mensagem personalizada e número de telefone.",
      color: "green"
    },
    {
      icon: <Video className="w-8 h-8 text-purple-500" />,
      title: "Vídeos do YouTube",
      description: "Incorpore e destaque vídeos do YouTube diretamente na sua página.",
      color: "purple"
    }
  ];

  return (
    <section id="recursos" className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#F3F3F3] mb-4">
            Tudo o que você precisa para uma bio{' '}
            <span className="bg-gradient-to-r from-[#FF7A1A] to-[#FF5A00] bg-clip-text text-transparent">
              irresistível
            </span>
          </h2>
          <p className="text-lg text-[#B0B6C1] max-w-2xl mx-auto">
            Recursos poderosos para fazer suas redes e conteúdo se conectarem nas suas mensagens
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative bg-gradient-to-br from-[#121417] to-[#0e0f12] p-6 rounded-2xl border border-[#8A8F99]/30 hover:border-[#8A8F99]/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-2"
            >
              {/* Glow effect on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br from-${feature.color}-500/15 to-${feature.color}-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

              <div className="relative z-10">
                <div className="mb-4 p-3 bg-[#0e0f12] rounded-xl border border-[#8A8F99]/20 group-hover:border-[#8A8F99]/40 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#F3F3F3] mb-3">{feature.title}</h3>
                <p className="text-[#B0B6C1]">{feature.description}</p>
              </div>
            </motion.div>
          ))}

        </div>
      </div>
    </section>
  );
};

// Componente Pricing Section
const PricingSection = () => {
  const plans = [
    {
      name: "Gratuito",
      price: "R$ 0",
      period: "para sempre",
      link: "http://localhost:8080/auth?mode=register",
      features: [
        "Até 3 links personalizados",
        "Botão do WhatsApp",
        "Cards básicos",
        "Incorporação de vídeos do YouTube",
        "Estatísticas simples"
      ],
      cta: "Assina Agora",
      highlighted: false
    },
    {
      name: "Pro",
      price: "R$ 9,99",
      period: "por mês",
      badge: "Plano Anual",
      link: "https://buy.stripe.com/test_4gM7sNgMA34Zaste2557W00",
      features: [
        "Links ilimitados",
        "WhatsApp com mensagem personalizada",
        "Destaques e carrosséis personalizados",
        "Incorporação de vídeos do YouTube",
        "Análises de cliques detalhadas"
      ],
      cta: "Assinar agora",
      highlighted: true
    },
    {
      name: "Plano Mensal",
      price: "R$ 14,99",
      period: "por mês",
      link: "https://buy.stripe.com/test_7sY28t9k8bBv445aPT57W01",
      features: [
        "Links ilimitados",
        "WhatsApp com mensagem personalizada",
        "Destaques e carrosséis personalizados",
        "Incorporação de vídeos do YouTube",
        "Análises de cliques detalhadas"
      ],
      cta: "Assinar mensal",
      highlighted: false
    }
  ];

  return (
    <section id="planos" className="py-20 bg-gradient-to-br from-[#0e0f12] to-[#121417]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#F3F3F3] mb-4">
            Escolha o plano ideal para sua{' '}
            <span className="bg-gradient-to-r from-[#FF7A1A] to-[#FF5A00] bg-clip-text text-transparent">
              bio
            </span>
          </h2>
          <p className="text-lg text-[#B0B6C1] max-w-2xl mx-auto">
            Planos flexíveis que crescem com você. Comece grátis e upgrade quando quiser.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={cn(
                "relative bg-gradient-to-br from-[#121417] to-[#0e0f12] p-8 rounded-2xl border transition-all duration-300 h-full flex flex-col",
                plan.highlighted
                  ? "border-[#FF7A1A] shadow-2xl shadow-orange-500/20 scale-105"
                  : "border-[#8A8F99]/30 hover:border-[#8A8F99]/50"
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-[#FF7A1A] to-[#FF5A00] text-[#F3F3F3] px-4 py-1 rounded-full text-sm font-medium">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#F3F3F3] mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-2">
                  {plan.name === 'Pro' && (
                    <span className="text-lg font-medium text-[#8A8F99]">12x de</span>
                  )}
                  <span className="text-4xl font-bold text-[#F3F3F3]">{plan.price}</span>
                  <span className="text-[#8A8F99]">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#69E36E] flex-shrink-0 mt-0.5" />
                    <span className="text-[#B0B6C1]">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Show button only for free plan */}
              {plan.name === "Gratuito" && plan.link ? (
                <Button
                  className={cn(
                    "w-full rounded-full py-6 text-lg transition-all mt-auto",
                    plan.highlighted
                      ? "bg-gradient-to-r from-[#FF7A1A] to-[#FF5A00] hover:from-[#FF5A00] hover:to-[#FF7A1A] text-[#F3F3F3] shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
                      : "border-2 border-[#8A8F99] text-white hover:bg-[#0e0f12]"
                  )}
                  asChild
                >
                  <a href={plan.link} target="_blank" rel="noopener noreferrer">
                    {plan.cta}
                  </a>
                </Button>
              ) : plan.name === "Gratuito" ? (
                <Button
                  className={cn(
                    "w-full rounded-full py-6 text-lg transition-all mt-auto",
                    plan.highlighted
                      ? "bg-gradient-to-r from-[#FF7A1A] to-[#FF5A00] hover:from-[#FF5A00] hover:to-[#FF7A1A] text-[#F3F3F3] shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
                      : "border-2 border-[#8A8F99] text-white hover:bg-[#0e0f12]"
                  )}
                >
                  {plan.cta}
                </Button>
              ) : null}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Componente FAQ Accordion
const FAQAccordion = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "É pago criar um Plano Gratuito?",
      answer: "Não! O plano gratuito é 100% gratuito e não requer cartão de crédito. Você pode usar todos os recursos básicos sem nenhum custo."
    },
    {
      question: "O Plano Gratuito sofre algum banner?",
      answer: "Não! O plano gratuito não tem nenhum banner ou propaganda. Sua página será limpa e profissional."
    },
    {
      question: "Posso conectar e mensagens do WhatsApp no Plano Gratuito?",
      answer: "Sim! O WhatsApp com mensagem personalizada está disponível no plano gratuito. Você pode configurar número e mensagem automaticamente."
    },
    {
      question: "Como incorporo vídeos do YouTube?",
      answer: "É simples! Basta colar o link do vídeo do YouTube que ele será incorporado automaticamente na sua página."
    },
    {
      question: "O que inclui no Plano Pro?",
      answer: "O Plano Pro inclui links ilimitados, análises detalhadas, carrosséis personalizados, e suporte prioritário."
    },
    {
      question: "Posso mudar de plano a qualquer momento?",
      answer: "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento sem nenhuma complicação."
    }
  ];

  return (
    <section id="faq" className="py-20 bg-[#0e0f12]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#F3F3F3] mb-4">
            <span className="bg-gradient-to-r from-[#FF7A1A] to-[#FF5A00] bg-clip-text text-transparent">
              Perguntas frequentes
            </span>
          </h2>
          <p className="text-lg text-[#B0B6C1] max-w-2xl mx-auto">
            Tire suas dúvidas sobre o mylinks.bio
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-gradient-to-br from-[#121417] to-[#0e0f12] rounded-xl border border-[#8A8F99]/20 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-[#0e0f12]/50 transition-colors"
              >
                <span className="text-[#F3F3F3] font-medium">{faq.question}</span>
                <ArrowRight
                  className={cn(
                    "w-5 h-5 text-[#8A8F99] transition-transform duration-200",
                    openIndex === index && "rotate-90"
                  )}
                />
              </button>

              <motion.div
                initial={false}
                animate={{ height: openIndex === index ? 'auto' : 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6">
                  <p className="text-[#B0B6C1]">{faq.answer}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" className="border-[#8A8F99] text-[#B0B6C1] hover:text-[#F3F3F3] hover:border-[#F3F3F3] rounded-full">
            Ver todas as perguntas
          </Button>
        </div>
      </div>
    </section>
  );
};

// Componente Final CTA
const FinalCTA = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 via-background to-gray-900 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-teal-500/20 rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Não deixe seus links escondidos.
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              Desperte o potencial da sua bio!
            </span>
          </h2>

          <p className="text-lg text-orange-500 mb-8">
            Milhares de criadores já transformaram suas bios em mini-sites de cliques.
            Crie seu mini-site agora mesmo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full px-8 py-6 text-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
            >
              <Link to="/auth?mode=register" className="flex items-center gap-2">
                Crie seu mini site grátis
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-full px-8 py-6 text-lg"
            >
              <Link to="#planos" className="text-orange-500">Assine o Plano Pro</Link>
            </Button>
          </div>

          <p className="text-sm text-orange-500">
            Leva menos de 2 minutos
          </p>
        </motion.div>
      </div>
    </section>
  );
};

// Componente Footer
const Footer = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-primary font-bold text-xl">my</span>
                <span className="text-orange-500 font-bold text-xl">Links</span>
                <span className="text-muted-foreground font-bold text-xl">.bio</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Transforme sua bio em um mini-site profissional que converte.
            </p>
            <div className="text-xs text-gray-500">
              <p>© 2024 mylinks.bio — Todos os direitos reservados</p>
              <p className="mt-1">Feito com ❤️ no Brasil</p>
            </div>
          </div>

          {/* Produto */}
          <div>
            <h4 className="text-white font-semibold mb-4">Produto</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#recursos" className="text-gray-400 hover:text-white transition-colors">Recursos</a></li>
              <li><a href="#planos" className="text-gray-400 hover:text-white transition-colors">Planos</a></li>
              <li><a href="#ajuda" className="text-gray-400 hover:text-white transition-colors">Ajuda</a></li>
              <li><a href="#faq" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Termos de uso</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacidade</a></li>
            </ul>
          </div>

          {/* Redes Sociais */}
          <div>
            <h4 className="text-white font-semibold mb-4">Redes Sociais</h4>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                <ExternalLink className="w-5 h-5 text-gray-400" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                <Video className="w-5 h-5 text-gray-400" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                <MessageCircle className="w-5 h-5 text-gray-400" />
              </a>
            </div>
            <div className="mt-4">
              <span className="text-xs text-gray-500">Status</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Componente Principal
const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeatureCards />
        <PricingSection />
        <FAQAccordion />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
