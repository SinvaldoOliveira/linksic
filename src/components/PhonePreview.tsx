import { PageConfig } from '@/types/auth';
import { User } from 'lucide-react';

interface PhonePreviewProps {
  config: PageConfig;
  userName: string;
}

export function PhonePreview({ config, userName }: PhonePreviewProps) {
  const enabledLinks = config.links.filter(link => link.enabled);

  return (
    <div className="relative mx-auto" style={{ width: '280px' }}>
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
                  style={{ borderColor: config.colorPalette.primary }}
                />
              ) : (
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center border-4"
                  style={{ 
                    backgroundColor: config.colorPalette.secondary + '40',
                    borderColor: config.colorPalette.primary 
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
              @{userName}
            </h2>
          </div>

          {/* Links */}
          <div className="space-y-3">
            {enabledLinks.length > 0 ? (
              enabledLinks.map((link) => (
                <div
                  key={link.id}
                  className="w-full py-3 px-4 rounded-lg text-center font-medium transition-all hover:scale-[1.02] cursor-pointer"
                  style={{ 
                    backgroundColor: config.colorPalette.primary,
                    color: config.colorPalette.text
                  }}
                >
                  {link.label}
                </div>
              ))
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
