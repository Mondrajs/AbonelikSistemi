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

const initialSubscriptions: Subscription[] = [];

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
