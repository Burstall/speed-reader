import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ServiceCredential {
  cookie: string;
  savedAt: number;
  lastUsed?: number;
}

export interface PremiumService {
  id: string;
  name: string;
  domain: string;
  loginUrl: string;
  cookieName: string; // Primary cookie to look for
  icon?: string;
  experimental?: boolean; // Untested services
}

// Supported premium services
export const PREMIUM_SERVICES: PremiumService[] = [
  {
    id: 'substack',
    name: 'Substack',
    domain: 'substack.com',
    loginUrl: 'https://substack.com/sign-in',
    cookieName: 'substack.sid',
  },
  {
    id: 'ft',
    name: 'Financial Times',
    domain: 'ft.com',
    loginUrl: 'https://www.ft.com/login',
    cookieName: 'FTSession_s', // FT uses multiple cookies - Chrome extension recommended
  },
  {
    id: 'spectator',
    name: 'The Spectator',
    domain: 'spectator.co.uk',
    loginUrl: 'https://www.spectator.co.uk/login',
    cookieName: 'spectator_session',
    experimental: true,
  },
  {
    id: 'economist',
    name: 'The Economist',
    domain: 'economist.com',
    loginUrl: 'https://www.economist.com/api/auth/login',
    cookieName: 'ec_session',
    experimental: true,
  },
  {
    id: 'nytimes',
    name: 'NY Times',
    domain: 'nytimes.com',
    loginUrl: 'https://myaccount.nytimes.com/auth/login',
    cookieName: 'NYT-S',
    experimental: true,
  },
  {
    id: 'wsj',
    name: 'Wall Street Journal',
    domain: 'wsj.com',
    loginUrl: 'https://accounts.wsj.com/login',
    cookieName: 'wsjregion',
    experimental: true,
  },
];

// Helper to match domain to a service
export function findServiceForDomain(domain: string, customServices: PremiumService[] = []): PremiumService | null {
  const allServices = [...PREMIUM_SERVICES, ...customServices];
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');

  return allServices.find((s) => {
    const serviceDomain = s.domain.toLowerCase().replace(/^www\./, '');
    return normalizedDomain === serviceDomain ||
           normalizedDomain.endsWith('.' + serviceDomain);
  }) || null;
}

interface AuthState {
  // Credentials by service ID
  credentials: Record<string, ServiceCredential>;

  // Custom services added by user
  customServices: PremiumService[];

  // Hidden services (user doesn't want to see these)
  hiddenServices: string[];

  // Actions
  setCredential: (serviceId: string, cookie: string) => void;
  clearCredential: (serviceId: string) => void;
  getCredentialForDomain: (domain: string) => string | null;
  getServiceForDomain: (domain: string) => PremiumService | null;
  addCustomService: (service: Omit<PremiumService, 'id'>) => void;
  removeCustomService: (serviceId: string) => void;
  hideService: (serviceId: string) => void;
  showService: (serviceId: string) => void;

  // Legacy support (functions instead of getters for persistence compatibility)
  getSubstackCookie: () => string;
  setSubstackCookie: (cookie: string) => void;
  clearSubstackCookie: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      credentials: {},
      customServices: [],
      hiddenServices: [],

      setCredential: (serviceId, cookie) => {
        const cleaned = cookie.trim();
        set((state) => ({
          credentials: {
            ...state.credentials,
            [serviceId]: {
              cookie: cleaned,
              savedAt: Date.now(),
            },
          },
        }));
      },

      clearCredential: (serviceId) => {
        set((state) => {
          const { [serviceId]: _, ...rest } = state.credentials;
          return { credentials: rest };
        });
      },

      getCredentialForDomain: (domain) => {
        const { credentials, customServices } = get();
        const allServices = [...PREMIUM_SERVICES, ...customServices];

        // Normalize domain (remove www. prefix, lowercase)
        const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');

        // Find service matching this domain
        // Check if domain ends with service domain (handles subdomains like example.substack.com)
        const service = allServices.find((s) => {
          const serviceDomain = s.domain.toLowerCase().replace(/^www\./, '');
          return normalizedDomain === serviceDomain ||
                 normalizedDomain.endsWith('.' + serviceDomain);
        });

        if (!service) return null;

        const cred = credentials[service.id];
        if (!cred || !cred.cookie) return null;

        // Update last used
        set((state) => ({
          credentials: {
            ...state.credentials,
            [service.id]: {
              ...cred,
              lastUsed: Date.now(),
            },
          },
        }));

        // Format cookie properly for HTTP header
        // If cookie already looks like a full cookie string (contains cookieName=), return as-is
        // Otherwise, format it as cookieName=value
        const cookieValue = cred.cookie;
        if (cookieValue.includes('=')) {
          // Already a full cookie string (from bookmarklet)
          return cookieValue;
        } else {
          // Just a value (from manual entry), format with cookie name
          return `${service.cookieName}=${cookieValue}`;
        }
      },

      getServiceForDomain: (domain) => {
        const { customServices } = get();
        return findServiceForDomain(domain, customServices);
      },

      addCustomService: (service) => {
        const id = `custom_${Date.now()}`;
        set((state) => ({
          customServices: [
            ...state.customServices,
            { ...service, id },
          ],
        }));
      },

      removeCustomService: (serviceId) => {
        set((state) => ({
          customServices: state.customServices.filter((s) => s.id !== serviceId),
          credentials: (() => {
            const { [serviceId]: _, ...rest } = state.credentials;
            return rest;
          })(),
        }));
      },

      hideService: (serviceId) => {
        set((state) => ({
          hiddenServices: state.hiddenServices.includes(serviceId)
            ? state.hiddenServices
            : [...state.hiddenServices, serviceId],
        }));
      },

      showService: (serviceId) => {
        set((state) => ({
          hiddenServices: state.hiddenServices.filter((id) => id !== serviceId),
        }));
      },

      // Legacy support for existing SubstackSettings component
      getSubstackCookie: () => {
        return get().credentials['substack']?.cookie || '';
      },

      setSubstackCookie: (cookie) => {
        get().setCredential('substack', cookie);
      },

      clearSubstackCookie: () => {
        get().clearCredential('substack');
      },
    }),
    {
      name: 'speed-reader-auth',
      // Explicitly persist credentials, customServices, and hiddenServices
      partialize: (state) => ({
        credentials: state.credentials,
        customServices: state.customServices,
        hiddenServices: state.hiddenServices,
      }),
      // Debug hydration
      onRehydrateStorage: () => {
        console.log('[AuthStore] Hydration starting...');
        return (state, error) => {
          if (error) {
            console.error('[AuthStore] Hydration error:', error);
          } else {
            console.log('[AuthStore] Hydration complete:', {
              credentialCount: state ? Object.keys(state.credentials).length : 0,
              credentials: state ? Object.keys(state.credentials) : [],
            });
          }
        };
      },
    }
  )
);
