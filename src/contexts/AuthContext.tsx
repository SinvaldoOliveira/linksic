import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, UserPage, PageConfig, DEFAULT_PAGE_CONFIG } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'admin@sistema.com';
const ADMIN_PASSWORD = 'Admin@123';

const generateUserId = () => {
  return 'user_' + Math.random().toString(36).substr(2, 9);
};

const generateSlug = (name: string, id: string) => {
  return name.toLowerCase().replace(/\s+/g, '-') + '-' + id.slice(-4);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const getUsers = (): Record<string, { user: User; password: string }> => {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : {};
  };

  const saveUsers = (users: Record<string, { user: User; password: string }>) => {
    localStorage.setItem('users', JSON.stringify(users));
  };

  const getPages = (): Record<string, UserPage> => {
    const pages = localStorage.getItem('userPages');
    return pages ? JSON.parse(pages) : {};
  };

  const savePages = (pages: Record<string, UserPage>) => {
    localStorage.setItem('userPages', JSON.stringify(pages));
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Check admin
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser: User = {
        id: 'admin_001',
        name: 'Administrador',
        email: ADMIN_EMAIL,
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        pageSlug: ''
      };
      setUser(adminUser);
      localStorage.setItem('currentUser', JSON.stringify(adminUser));
      return { success: true };
    }

    // Check regular users
    const users = getUsers();
    const userEntry = Object.values(users).find(u => u.user.email === email);
    
    if (!userEntry) {
      return { success: false, error: 'Email não encontrado' };
    }

    if (userEntry.password !== password) {
      return { success: false, error: 'Senha incorreta' };
    }

    if (userEntry.user.status === 'blocked') {
      return { success: false, error: 'Conta bloqueada. Entre em contato com o suporte.' };
    }

    setUser(userEntry.user);
    localStorage.setItem('currentUser', JSON.stringify(userEntry.user));
    return { success: true };
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (email === ADMIN_EMAIL) {
      return { success: false, error: 'Este email não pode ser usado' };
    }

    const users = getUsers();
    const existingUser = Object.values(users).find(u => u.user.email === email);
    
    if (existingUser) {
      return { success: false, error: 'Email já cadastrado' };
    }

    const userId = generateUserId();
    const pageSlug = generateSlug(name, userId);
    
    const newUser: User = {
      id: userId,
      name,
      email,
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      pageSlug
    };

    // Save user
    users[userId] = { user: newUser, password };
    saveUsers(users);

    // Create user page with default config
    const pages = getPages();
    pages[userId] = {
      userId,
      userName: name,
      createdAt: new Date().toISOString(),
      config: DEFAULT_PAGE_CONFIG
    };
    savePages(pages);

    // Auto login
    setUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper to get all users (for admin)
export function getAllUsers(): User[] {
  const users = localStorage.getItem('users');
  if (!users) return [];
  const parsed = JSON.parse(users);
  return Object.values(parsed).map((u: any) => u.user);
}

// Helper to update user status (for admin)
export function updateUserStatus(userId: string, status: 'active' | 'blocked') {
  const users = localStorage.getItem('users');
  if (!users) return;
  const parsed = JSON.parse(users);
  if (parsed[userId]) {
    parsed[userId].user.status = status;
    localStorage.setItem('users', JSON.stringify(parsed));
  }
}

// Helper to get user page
export function getUserPage(userId: string): UserPage | null {
  const pages = localStorage.getItem('userPages');
  if (!pages) return null;
  const parsed = JSON.parse(pages);
  return parsed[userId] || null;
}
