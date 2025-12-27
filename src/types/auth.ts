export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'blocked';
  createdAt: string;
  pageSlug: string;
}

export interface PageLink {
  id: string;
  label: string;
  url: string;
  enabled: boolean;
}

export interface PageConfig {
  profilePhoto: string;
  headerImage: string;
  links: PageLink[];
  colorPalette: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
}

export interface UserPage {
  userId: string;
  userName: string;
  createdAt: string;
  config: PageConfig;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export const DEFAULT_PAGE_CONFIG: PageConfig = {
  profilePhoto: '',
  headerImage: '',
  links: [],
  colorPalette: {
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    background: '#1A1A2E',
    text: '#FFFFFF'
  }
};
