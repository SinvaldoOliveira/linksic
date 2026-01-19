import { PageConfig } from '@/types/auth';
import { User } from 'lucide-react';

interface PhonePreviewProps {
  config: PageConfig;
  userName: string;
  publicUrl?: string;
  slug?: string;
}

export function PhonePreview({ config, userName, publicUrl, slug }: PhonePreviewProps) {
  const enabledLinks = config.links.filter(link => link.enabled);

  return (
    <div className="relative mx-auto" style={{ width: '280px' }}>
      {/* URL Bar Simulation */}
      {publicUrl && (
        <div className="mb-4 bg-card p-3 rounded-xl border border-border shadow-md flex items-center justify-between text-xs text-muted-foreground font-mono relative z-20">
           <div className="flex items-center gap-2 flex-1 min-w-0">
             <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
             <span className="truncate w-full">{publicUrl}</span>
           </div>
           <div className="flex gap-1 ml-2">
             <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"></div>
           </div>
        </div>
      )}

      {/* Phone Frame */}
      <div className="relative rounded-[40px] border-4 border-foreground/20 bg-background shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground/20 rounded-b-xl z-10" />
        
        {/* Screen Content */}
        <div 
          className="min-h-[500px] pt-8 pb-6 px-4 overflow-y-auto"
          style={{ backgroundColor: config.colorPalette.background }}
        >
          {/* Header Image */}
          {config.headerImage && (
            <div className="w-full h-20 rounded-lg overflow-hidden mb-4 -mt-2">
              <img 
                src={config.headerImage} 
                alt="Header" 
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          )}

          {/* Profile Section */}
          <div className="flex flex-col items-center mb-6">
            {/* Profile Photo */}
            <div className="relative mb-3">
              {config.profilePhoto ? (
                <img 
                  src={config.profilePhoto} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover border-4"
                  style={{ borderColor: config.colorPalette.primary ?? '#000' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center border-4"
                  style={{ 
                    backgroundColor: (config.colorPalette.secondary ?? '#000') + '40',
                    borderColor: config.colorPalette.primary ?? '#000'
                  }}
                >
                  <User className="w-10 h-10" style={{ color: config.colorPalette.text }} />
                </div>
              )}
            </div>
            
            {/* Username */}
            <h2 
              className="text-lg font-bold"
              style={{ color: config.colorPalette.text }}
            >
              {userName}
            </h2>
            
            {/* Bio */}
            {config.bio && (
              <p 
                className="text-sm mt-1 px-4 text-center opacity-80 mb-1"
                style={{ color: config.colorPalette.text }}
              >
                {config.bio}
              </p>
            )}

            {/* Slug */}
            {slug && (
              <p 
                className="text-xs opacity-60 font-medium"
                style={{ color: config.colorPalette.text }}
              >
                @{slug}
              </p>
            )}
          </div>

          {/* Links */}
          <div className="space-y-3">
            {enabledLinks.length > 0 ? (
              enabledLinks.map((link) => {
                if (link.type === 'banner') {
                  if (link.imageUrl) {
                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full rounded-lg overflow-hidden transition-all hover:scale-[1.02] cursor-pointer"
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
                  return null;
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
                      className="w-full py-3 px-4 rounded-lg text-center font-medium transition-all hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: config.colorPalette.primary ?? '#000',
                        color: config.colorPalette.text
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.031-.967-.273-.099-.472-.149-.671.15-.198.297-.769.966-.941 1.164-.173.199-.347.224-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.373-.025-.522-.075-.149-.671-1.618-.918-2.218-.242-.58-.487-.502-.671-.511l-.571-.01c-.198 0-.522.075-.796.373-.273.297-1.045 1.02-1.045 2.479 0 1.458 1.07 2.867 1.219 3.066.149.198 2.109 3.223 5.111 4.515.715.308 1.27.492 1.705.63.716.227 1.368.195 1.884.118.575-.086 1.758-.718 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 6.403h-.004a8.71 8.71 0 01-4.695-1.295l-.335-.199-3.493.915.935-3.405-.218-.35a8.765 8.765 0 01-1.343-4.722 8.822 8.822 0 018.82-8.817h.004a8.78 8.78 0 018.79 8.818 8.83 8.83 0 01-8.851 8.855m7.59-16.41A10.62 10.62 0 0012.05 1.9h-.005C6.339 1.9 1.9 6.336 1.902 12.04c0 1.957.528 3.873 1.532 5.554L2.3 22.1l4.686-1.23a10.595 10.595 0 005.06 1.288h.005c5.707 0 10.144-4.438 10.143-10.138 0-2.713-1.057-5.262-2.97-7.175" />
                      </svg>
                      {link.label || 'Falar no WhatsApp'}
                    </a>
                  );
                }
                if (link.type === 'youtube' && link.videoId) {
                  return (
                    <div key={link.id} className="w-full rounded-lg overflow-hidden border">
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
                  <div
                    key={link.id}
                    className="w-full py-3 px-4 rounded-lg text-center font-medium transition-all hover:scale-[1.02] cursor-pointer"
                    style={{
                      backgroundColor: config.colorPalette.primary ?? '#000',
                      color: config.colorPalette.text
                    }}
                  >
                    {link.label}
                  </div>
                );
              })
            ) : (
              <div
                className="text-center py-6 opacity-60"
                style={{ color: config.colorPalette.text }}
              >
                <p className="text-sm">Adicione links para aparecerem aqui</p>
              </div>
            )}
          </div>

          {/* Branding */}
          <div className="mt-8 text-center">
            <p 
              className="text-xs opacity-50"
              style={{ color: config.colorPalette.text }}
            >
              ✦ minisite
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
