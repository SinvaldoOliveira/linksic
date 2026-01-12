import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Zap, Smartphone, Globe, ShieldCheck, Layout, MessageCircle, Image as ImageIcon, Video } from 'lucide-react';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Navbar */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            SicPage
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" asChild className="hidden md:inline-flex">
              <Link to="/auth?mode=login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link to="/auth?mode=register">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <AuroraBackground>
        <motion.div
          initial={{ opacity: 0.0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="relative flex flex-col gap-4 items-center justify-center px-4"
        >
          <div className="text-3xl md:text-7xl font-bold dark:text-white text-center">
            Todos os seus links importantes em um único mini site profissional
          </div>
          <div className="font-extralight text-base md:text-4xl dark:text-neutral-200 py-4">
            Organize links, botões, cards, WhatsApp com mensagem personalizada e vídeos do YouTube em uma única página simples, bonita e fácil de compartilhar.
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-in fade-in zoom-in duration-700 delay-300">
            <Button size="lg" className="rounded-full text-lg px-8 py-6 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all" asChild>
              <Link to="/auth?mode=register">Criar minha página grátis</Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full text-lg px-8 py-6" asChild>
              <a href="#planos">Ver planos</a>
            </Button>
          </div>
        </motion.div>
      </AuroraBackground>

      {/* Dor do Usuário */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-600 text-sm font-medium">❌ A Dor</div>
                <h2 className="text-3xl md:text-4xl font-bold">Seus links estão espalhados e isso confunde quem quer te encontrar</h2>
                <p className="text-lg text-muted-foreground">Você posta um link no Instagram, outro no WhatsApp, outro no TikTok… No final, seu público não sabe onde clicar — e você perde oportunidades.</p>
              </div>
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-600 text-sm font-medium">✅ A Solução SicPage</div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full text-primary"><Layout size={20} /></div>
                    <div>
                      <h3 className="font-semibold text-lg">Um único link. Todas as possibilidades.</h3>
                      <p className="text-muted-foreground">Crie um mini site personalizado e concentre tudo que importa.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full text-primary"><ImageIcon size={20} /></div>
                    <div>
                      <h3 className="font-semibold text-lg">Cards com imagem</h3>
                      <p className="text-muted-foreground">Destaque promoções e conteúdos com banners visuais.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full text-primary"><MessageCircle size={20} /></div>
                    <div>
                      <h3 className="font-semibold text-lg">WhatsApp com mensagem automática</h3>
                      <p className="text-muted-foreground">Botão profissional com número e mensagem pré-definida.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full text-primary"><Video size={20} /></div>
                    <div>
                      <h3 className="font-semibold text-lg">Vídeos do YouTube incorporados</h3>
                      <p className="text-muted-foreground">Apresente conteúdos direto na página, sem sair do ambiente.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div className="bg-card p-8 rounded-2xl shadow-xl border border-border/50">
              {/* Illustration or Image placeholder */}
              <div className="aspect-video overflow-hidden rounded-xl">
                <img 
                  src="/dashboard-preview.png" 
                  alt="Painel de controle da SicPage mostrando a organização de links" 
                  className="w-full h-full object-cover transition-all duration-300 ease-in-out hover:opacity-80 hover:scale-105 hover:shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-16">Como Funciona</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: '1️⃣', title: 'Crie sua conta grátis', desc: 'Comece em minutos, sem cartão de crédito.' },
              { icon: '2️⃣', title: 'Escolha o tipo de link', desc: 'Botão, card com imagem, WhatsApp ou vídeo.' },
              { icon: '3️⃣', title: 'Personalize sua página', desc: 'Defina cores, fotos e ordem dos links.' },
              { icon: '4️⃣', title: 'Compartilhe um único link', desc: 'Divulgue no Instagram, TikTok e WhatsApp.' }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center space-y-4 p-6 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="text-4xl mb-2">{step.icon}</div>
                <h3 className="font-bold text-xl">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <Button size="lg" className="rounded-full px-8" asChild>
              <Link to="/auth?mode=register">Começar agora <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos simples e sem confusão</h2>
            <p className="text-xl text-muted-foreground">Comece grátis e evolua para o Pró quando precisar</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Plano Gratuito */}
            <div className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col">
              <div className="mb-4">
                <h3 className="font-bold text-xl text-emerald-500">Plano Gratuito</h3>
                <div className="text-3xl font-bold mt-2">R$ 0</div>
                <div className="text-sm text-muted-foreground">Para sempre</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> Até 3 links</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> Página pública personalizada</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> Ideal para começar</li>
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/auth?mode=register">Criar Grátis</Link>
              </Button>
            </div>

            {/* Plano Pró */}
            <div className="bg-card p-6 rounded-2xl border-2 border-primary shadow-xl relative flex flex-col scale-105 z-10">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                MAIS POPULAR
              </div>
              <div className="mb-4">
                <h3 className="font-bold text-xl text-primary">Plano Pró</h3>
                <div className="text-3xl font-bold mt-2">R$ 9,99</div>
                <div className="text-sm text-muted-foreground">/mês</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> Links ilimitados</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> Botões, cards e vídeos</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> WhatsApp com mensagem personalizada</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> Página profissional completa</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> Ideal para quem quer crescer</li>
              </ul>
              <Button className="w-full" asChild>
                <Link to="/auth?mode=register">Quero o Plano Pró</Link>
              </Button>
              <div className="text-xs text-muted-foreground mt-2 text-center">Sem contrato • Cancele quando quiser</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quebra de Objeções */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Isso é só mais um link na bio?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-xl hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4"><Layout size={24} /></div>
              <h3 className="font-bold text-xl mb-2">Não é só link → é um mini site</h3>
              <p className="text-muted-foreground">Estrutura profissional para apresentar seus conteúdos com organização.</p>
            </div>
            <div className="p-6 border rounded-xl hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4"><Smartphone size={24} /></div>
              <h3 className="font-bold text-xl mb-2">Funciona perfeitamente no mobile</h3>
              <p className="text-muted-foreground">Experiência fluida em celulares, com design responsivo.</p>
            </div>
            <div className="p-6 border rounded-xl hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-bold text-xl mb-2">Plataforma simples, rápida e segura</h3>
              <p className="text-muted-foreground">Sem complicações, com performance e segurança para crescer.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Prova Social / Uso Ideal */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-8">Perfeito para quem vive online</h2>
          <div className="flex flex-wrap justify-center gap-8 opacity-80">
            <div className="font-medium">Criadores de conteúdo</div>
            <div className="font-medium">Profissionais autônomos</div>
            <div className="font-medium">Pequenos negócios</div>
            <div className="font-medium">Lojas, agências e freelancers</div>
          </div>
          <p className="mt-8 text-muted-foreground">Organize tudo em um só lugar, com um link fácil de compartilhar.</p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-primary text-primary-foreground text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Transforme seus links em uma experiência profissional</h2>
          <p className="text-xl mb-10 text-primary-foreground/90">Sem cartão de crédito</p>
          <Button size="lg" variant="secondary" className="text-primary rounded-full px-12 py-8 text-xl" asChild>
            <Link to="/auth?mode=register">Criar minha página grátis agora</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t">
        <div className="container mx-auto px-4 text-center md:text-left">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-4">
                SicPage
              </div>
              <p className="text-muted-foreground max-w-sm">
                Mini site profissional para organizar links, cards, WhatsApp e vídeos em um único lugar.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#planos" className="hover:text-primary">Planos</a></li>
                <li><Link to="/auth?mode=login" className="hover:text-primary">Login</Link></li>
                <li><Link to="/auth?mode=register" className="hover:text-primary">Cadastro</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-primary">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-primary">Suporte</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t text-sm text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} SicPage. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
