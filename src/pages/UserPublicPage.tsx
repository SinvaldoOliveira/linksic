import { useParams } from 'react-router-dom';
import { User as UserIcon, Loader2 } from 'lucide-react';
import { UserPage, DEFAULT_PAGE_CONFIG } from '@/types/auth';
import { useEffect, useState } from 'react';
import { getUserPage } from '@/contexts/AuthContext';
import { PhonePreview } from '@/components/PhonePreview';

export default function UserPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [pageData, setPageData] = useState<UserPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      getUserPage(slug).then(data => {
        setPageData(data);
        setIsLoading(false);
      });
    }
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <div className="text-center">
          <UserIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h1 className="text-2xl font-bold">Página não encontrada</h1>
          <p className="text-muted-foreground mt-2">Esta página não existe ou foi removida.</p>
        </div>
      </div>
    );
  }

  const config = pageData.config || DEFAULT_PAGE_CONFIG;
  const enabledLinks = config.links.filter(link => link.enabled);

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: config.colorPalette.background }}
    >
      {/* Header Image */}
      {config.headerImage && (
        <div className="w-full h-48 md:h-64 overflow-hidden">
          <img 
            src={config.headerImage} 
            alt="Header" 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <main className={`flex-1 container max-w-2xl mx-auto px-4 pb-12 ${config.headerImage ? '-mt-16' : 'pt-12'}`}>
        <div className="flex flex-col items-center">
          {/* Profile Photo */}
          <div className="relative mb-6">
            {config.profilePhoto ? (
              <img 
                src={config.profilePhoto} 
                alt={pageData.userName} 
                className="w-32 h-32 rounded-full object-cover border-4 shadow-xl"
                style={{ borderColor: config.colorPalette.background }}
              />
            ) : (
              <div 
                className="w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-xl"
                style={{ 
                  backgroundColor: config.colorPalette.primary,
                  borderColor: config.colorPalette.background,
                  color: config.colorPalette.text
                }}
              >
                <span className="text-4xl font-bold">
                  {pageData.userName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* User Name & Bio */}
          <div className="text-center mb-8 w-full">
            <h1 
              className="text-2xl font-bold mb-2"
              style={{ color: config.colorPalette.text }}
            >
              {pageData.userName}
            </h1>

            {config.bio && (
              <p 
                className="opacity-90 max-w-lg mx-auto px-4 whitespace-pre-wrap mb-2"
                style={{ color: config.colorPalette.text }}
              >
                {config.bio}
              </p>
            )}

            <p 
              className="text-sm opacity-80"
              style={{ color: config.colorPalette.text }}
            >
              @{slug}
            </p>
          </div>

          {/* Links */}
          <div className="w-full space-y-4">
            {enabledLinks.map((link) => {
                if (link.type === 'banner') {
                    if (link.imageUrl) {
                        return (
                            <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full rounded-xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                            >
                                <img
                                  src={link.imageUrl}
                                  alt={link.label || 'Banner'}
                                  className="w-full h-auto object-cover"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            </a>
                        );
                    }
                    return null; // Don't render broken banners on public page
                }
                if (link.type === 'whatsapp') {
                    const phone = (link.whatsappPhone || '').replace(/[^0-9]/g, '');
                    if (!phone) return null;
                    const msg = link.whatsappMessage ? encodeURIComponent(link.whatsappMessage) : '';
                    const href = `https://wa.me/${phone}${msg ? `?text=${msg}` : ''}`;
                    return (
                      <a
                        key={link.id}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full p-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-center font-medium shadow-lg flex items-center justify-center gap-2"
                        style={{ 
                          backgroundColor: config.colorPalette.primary,
                          color: config.colorPalette.text
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.031-.967-.273-.099-.472-.149-.671.15-.198.297-.769.966-.941 1.164-.173.199-.347.224-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.373-.025-.522-.075-.149-.671-1.618-.918-2.218-.242-.58-.487-.502-.671-.511l-.571-.01c-.198 0-.522.075-.796.373-.273.297-1.045 1.02-1.045 2.479 0 1.458 1.07 2.867 1.219 3.066.149.198 2.109 3.223 5.111 4.515.715.308 1.27.492 1.705.63.716.227 1.368.195 1.884.118.575-.086 1.758-.718 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 6.403h-.004a8.71 8.71 0 01-4.695-1.295l-.335-.199-3.493.915.935-3.405-.218-.35a8.765 8.765 0 01-1.343-4.722 8.822 8.822 0 018.82-8.817h.004a8.78 8.78 0 018.79 8.818 8.83 8.83 0 01-8.851 8.855m7.59-16.41A10.62 10.62 0 0012.05 1.9h-.005C6.339 1.9 1.9 6.336 1.902 12.04c0 1.957.528 3.873 1.532 5.554L2.3 22.1l4.686-1.23a10.595 10.595 0 005.06 1.288h.005c5.707 0 10.144-4.438 10.143-10.138 0-2.713-1.057-5.262-2.97-7.175" />
                        </svg>
                        {link.label || 'Falar no WhatsApp'}
                      </a>
                    );
                }
                if (link.type === 'youtube' && link.videoId) {
                    return (
                      <div key={link.id} className="w-full rounded-xl overflow-hidden shadow-lg">
                        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                          <iframe
                            title={link.label || 'YouTube'}
                            src={`https://www.youtube-nocookie.com/embed/${link.videoId}?rel=0`}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            sandbox="allow-scripts allow-same-origin allow-presentation"
                          />
                        </div>
                      </div>
                    );
                }

                return (
                    <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full p-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-center font-medium shadow-lg"
                        style={{ 
                          backgroundColor: config.colorPalette.primary,
                          color: config.colorPalette.text
                        }}
                    >
                        {link.label}
                    </a>
                );
            })}

            {enabledLinks.length === 0 && (
              <div 
                className="text-center p-8 rounded-xl bg-black/10 backdrop-blur-sm"
                style={{ color: config.colorPalette.text }}
              >
                <p>Nenhum link disponível no momento.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm opacity-60" style={{ color: config.colorPalette.text }}>
        <p>Criado com LinkSic</p>
      </footer>
    </div>
  );
}
