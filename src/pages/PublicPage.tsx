import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUserPage } from '@/contexts/AuthContext';
import { UserPage } from '@/types/auth';
import { ExternalLink } from 'lucide-react';

export default function PublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [pageData, setPageData] = useState<UserPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadPage() {
      if (!slug) return;
      
      try {
        setLoading(true);
        const data = await getUserPage(slug);
        
        if (data) {
          setPageData(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Página não encontrada</h2>
          <p className="text-gray-500 mb-8">O link que você tentou acessar não existe ou foi removido.</p>
          <a href="/" className="text-blue-600 hover:underline">Criar minha própria página</a>
        </div>
      </div>
    );
  }

  const { config, userName } = pageData;
  const { colorPalette, links, profilePhoto, headerImage } = config;

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center"
      style={{ 
        backgroundColor: colorPalette.background,
        color: colorPalette.text
      }}
    >
      <div className="w-full max-w-md min-h-screen flex flex-col relative shadow-2xl">
        {/* Header Image */}
        <div className="h-48 w-full bg-black/10 relative overflow-hidden">
          {headerImage ? (
            <img src={headerImage} alt="Capa" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full" style={{ backgroundColor: colorPalette.primary, opacity: 0.3 }} />
          )}
        </div>

        {/* Profile Section */}
        <div className="px-6 -mt-16 flex flex-col items-center relative z-10">
          <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
            {profilePhoto ? (
              <img src={profilePhoto} alt={userName} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400 bg-gray-100">
                {userName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <h1 className="mt-4 text-2xl font-bold text-center">{userName}</h1>
          
          {config.bio && (
            <p className="mt-2 text-center opacity-90 px-4 whitespace-pre-wrap text-sm">
              {config.bio}
            </p>
          )}

          <p className="mt-1 text-sm opacity-80 text-center">@{slug}</p>
        </div>

        {/* Links Section */}
        <div className="flex-1 px-6 py-8 space-y-4">
          {links.filter(l => l.enabled).map((link) => {
             // Banner Logic
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
                              loading="lazy"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        </a>
                    );
                }
                // Placeholder for broken banner (optional, or render nothing)
                return null; 
             }
             // WhatsApp
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
                   className="block w-full p-4 rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-sm relative group"
                   style={{ 
                     backgroundColor: colorPalette.primary,
                     color: '#FFFFFF'
                   }}
                 >
                   <div className="flex items-center justify-center font-medium relative z-10 gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                       <path d="M17.472 14.382c-.297-.149-1.758-.867-2.031-.967-.273-.099-.472-.149-.671.15-.198.297-.769.966-.941 1.164-.173.199-.347.224-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.373-.025-.522-.075-.149-.671-1.618-.918-2.218-.242-.58-.487-.502-.671-.511l-.571-.01c-.198 0-.522.075-.796.373-.273.297-1.045 1.02-1.045 2.479 0 1.458 1.07 2.867 1.219 3.066.149.198 2.109 3.223 5.111 4.515.715.308 1.27.492 1.705.63.716.227 1.368.195 1.884.118.575-.086 1.758-.718 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 6.403h-.004a8.71 8.71 0 01-4.695-1.295l-.335-.199-3.493.915.935-3.405-.218-.35a8.765 8.765 0 01-1.343-4.722 8.822 8.822 0 018.82-8.817h.004a8.78 8.78 0 018.79 8.818 8.83 8.83 0 01-8.851 8.855m7.59-16.41A10.62 10.62 0 0012.05 1.9h-.005C6.339 1.9 1.9 6.336 1.902 12.04c0 1.957.528 3.873 1.532 5.554L2.3 22.1l4.686-1.23a10.595 10.595 0 005.06 1.288h.005c5.707 0 10.144-4.438 10.143-10.138 0-2.713-1.057-5.262-2.97-7.175" />
                     </svg>
                     {link.label || 'Falar no WhatsApp'}
                   </div>
                   <div className="absolute inset-0 bg-black/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                 </a>
               );
             }
             // YouTube
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

             // Button Logic
             return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full p-4 rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-sm relative group"
                  style={{ 
                    backgroundColor: colorPalette.primary,
                    color: '#FFFFFF' // Botões sempre com texto branco ou adaptativo
                  }}
                >
                  <div className="flex items-center justify-center font-medium relative z-10">
                    {link.label}
                  </div>
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-black/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
             );
          })}

          {links.filter(l => l.enabled).length === 0 && (
            <div className="text-center opacity-50 py-8">
              Nenhum link disponível no momento
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="py-6 text-center text-xs opacity-50">
          <a href="/" className="hover:underline flex items-center justify-center gap-1">
            Criado com LinkSic <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
}
