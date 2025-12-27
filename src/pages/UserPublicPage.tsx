import { useParams } from 'react-router-dom';
import { User, ExternalLink } from 'lucide-react';
import { UserPage, DEFAULT_PAGE_CONFIG } from '@/types/auth';

export default function UserPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  
  // Find user by slug
  const users = localStorage.getItem('users');
  const pages = localStorage.getItem('userPages');
  let userData = null;
  let pageData: UserPage | null = null;
  
  if (users) {
    const parsedUsers = JSON.parse(users);
    const userEntry = Object.values(parsedUsers).find((u: any) => u.user.pageSlug === slug);
    if (userEntry) {
      userData = (userEntry as any).user;
      
      // Get page config
      if (pages) {
        const parsedPages = JSON.parse(pages);
        pageData = parsedPages[userData.id] || null;
      }
    }
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <div className="text-center">
          <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h1 className="text-2xl font-bold">Página não encontrada</h1>
          <p className="text-muted-foreground mt-2">Esta página não existe ou foi removida.</p>
        </div>
      </div>
    );
  }

  const config = pageData?.config || DEFAULT_PAGE_CONFIG;
  const enabledLinks = config.links.filter(link => link.enabled);

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: config.colorPalette.background }}
    >
      {/* Header Image */}
      {config.headerImage && (
        <div className="w-full h-40 md:h-56 overflow-hidden">
          <img 
            src={config.headerImage} 
            alt="Header" 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-start justify-center p-4">
        <div className="w-full max-w-md text-center -mt-12 relative">
          {/* Profile Photo */}
          <div 
            className="w-28 h-28 rounded-full mx-auto mb-4 border-4 overflow-hidden"
            style={{ 
              borderColor: config.colorPalette.primary,
              backgroundColor: config.colorPalette.secondary 
            }}
          >
            {config.profilePhoto ? (
              <img 
                src={config.profilePhoto} 
                alt={userData.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span 
                  className="text-4xl font-bold"
                  style={{ color: config.colorPalette.text }}
                >
                  {userData.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Name & Handle */}
          <h1 
            className="text-2xl font-bold"
            style={{ color: config.colorPalette.text }}
          >
            {pageData?.userName || userData.name}
          </h1>
          <p 
            className="mt-1 opacity-70"
            style={{ color: config.colorPalette.text }}
          >
            @{userData.pageSlug}
          </p>
          
          {/* Links */}
          <div className="mt-8 space-y-3">
            {enabledLinks.length > 0 ? (
              enabledLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 h-14 rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ 
                    backgroundColor: config.colorPalette.primary,
                    color: config.colorPalette.text
                  }}
                >
                  {link.label}
                  <ExternalLink className="h-4 w-4 opacity-50" />
                </a>
              ))
            ) : (
              <div 
                className="h-14 rounded-xl flex items-center justify-center opacity-50"
                style={{ 
                  backgroundColor: `${config.colorPalette.primary}20`,
                  color: config.colorPalette.text
                }}
              >
                Em breve...
              </div>
            )}
          </div>
          
          {/* Footer */}
          <p 
            className="text-xs mt-12 opacity-50"
            style={{ color: config.colorPalette.text }}
          >
            Criado com PageBuilder
          </p>
        </div>
      </div>
    </div>
  );
}
