import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Subscription {
  id: string;
  name: string;
  price: number;
  status: string; // 'Active', 'Past Due', 'Canceled'
  nextBilling: string;
  logo: string;
  color: string;
  category: string;
  features: string[];
  isFamilyPlan?: boolean;
  currency?: string; // 'TRY', 'USD', 'EUR'
}

interface SubscriptionState {
  subscriptions: Subscription[];
  addSubscription: (sub: Subscription) => void;
  updateSubscription: (id: string, updatedFields: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  cancelSubscription: (id: string) => void;
}

const initialSubscriptions: Subscription[] = [
  { id: 'spotify-family', name: 'Spotify Family', price: 90.00, status: 'Active', nextBilling: '2026-10-24', logo: 'S', color: 'bg-emerald-500 text-white', category: 'Entertainment', features: ['6 Accounts', 'Offline Play', 'Kids App Access'], isFamilyPlan: true, currency: 'TRY' },
  { id: 'netflix', name: 'Netflix 4K', price: 220.00, status: 'Active', nextBilling: '2026-10-28', logo: 'N', color: 'bg-red-600 text-white', category: 'Entertainment', features: ['4K Streaming', '4 Devices', 'HDR Enabled'], currency: 'TRY' },
  { id: 'adobe', name: 'Adobe Creative Cloud', price: 52.99, status: 'Past Due', nextBilling: '2026-10-15', logo: 'A', color: 'bg-indigo-600 text-white', category: 'Productivity', features: ['Photoshop', 'Illustrator', '100GB Cloud Storage'], currency: 'USD' },
  { id: 'youtube', name: 'YouTube Premium', price: 79.99, status: 'Active', nextBilling: '2026-11-02', logo: 'Y', color: 'bg-rose-500 text-white', category: 'Entertainment', features: ['Ad-free video', 'Background play', 'YT Music Premium'], currency: 'TRY' },
];

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      subscriptions: initialSubscriptions,
      addSubscription: (sub) => set((state) => ({ subscriptions: [...state.subscriptions, sub] })),
      updateSubscription: (id, updatedFields) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, ...updatedFields } : sub
          ),
        })),
      deleteSubscription: (id) =>
        set((state) => ({
          subscriptions: state.subscriptions.filter((sub) => sub.id !== id),
        })),
      cancelSubscription: (id) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, status: 'Canceled' } : sub
          ),
        })),
    }),
    {
      name: 'subspace-subscription-store',
    }
  )
);
