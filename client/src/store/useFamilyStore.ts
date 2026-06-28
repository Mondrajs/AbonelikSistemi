import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FamilyMember {
  id: number;
  name: string;
  email: string;
  role: string; // 'Owner' | 'Admin' | 'Member'
  status: string; // 'Active' | 'Pending'
  avatar: string;
  paidAmount?: number; // Kept for backward compatibility
  payments?: Record<string, boolean>; // e.g. { "Haz": true, "Tem": false }
}

interface FamilyState {
  membersMap: Record<string, FamilyMember[]>;
  addMember: (subId: string, member: Omit<FamilyMember, 'id'>) => void;
  removeMember: (subId: string, id: number) => void;
  togglePayment: (subId: string, memberId: number, monthKey: string) => void;
}

const initialMembersMap: Record<string, FamilyMember[]> = {
  'spotify-family': [
    { 
      id: 1, 
      name: 'Alex Johnson', 
      email: 'alex@example.com', 
      role: 'Owner', 
      status: 'Active', 
      avatar: 'https://i.pravatar.cc/150?img=12',
      payments: { 'Haz': true, 'Tem': true, 'Ağu': false }
    },
    { 
      id: 2, 
      name: 'Sarah Johnson', 
      email: 'sarah@example.com', 
      role: 'Admin', 
      status: 'Active', 
      avatar: 'https://i.pravatar.cc/150?img=47',
      payments: { 'Haz': true, 'Tem': false, 'Ağu': false }
    },
    { 
      id: 3, 
      name: 'Mike Johnson', 
      email: 'mike@example.com', 
      role: 'Member', 
      status: 'Active', 
      avatar: '',
      payments: { 'Haz': false, 'Tem': false, 'Ağu': false }
    },
  ],
  'default': [
    { 
      id: 1, 
      name: 'Alex Johnson', 
      email: 'alex@example.com', 
      role: 'Owner', 
      status: 'Active', 
      avatar: 'https://i.pravatar.cc/150?img=12',
      payments: { 'Haz': true }
    }
  ]
};

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set) => ({
      membersMap: initialMembersMap,
      addMember: (subId, member) => set((state) => {
        const currentList = state.membersMap[subId] || [];
        const newMember = { 
          ...member, 
          id: Date.now(),
          payments: member.payments || {}
        };
        return {
          membersMap: {
            ...state.membersMap,
            [subId]: [...currentList, newMember]
          }
        };
      }),
      removeMember: (subId, id) => set((state) => {
        const currentList = state.membersMap[subId] || [];
        return {
          membersMap: {
            ...state.membersMap,
            [subId]: currentList.filter(m => m.id !== id)
          }
        };
      }),
      togglePayment: (subId, memberId, monthKey) => set((state) => {
        const currentList = state.membersMap[subId] || [];
        const updatedList = currentList.map((m) => {
          if (m.id === memberId) {
            const currentPayments = m.payments || {};
            return {
              ...m,
              payments: {
                ...currentPayments,
                [monthKey]: !currentPayments[monthKey]
              }
            };
          }
          return m;
        });
        return {
          membersMap: {
            ...state.membersMap,
            [subId]: updatedList
          }
        };
      })
    }),
    {
      name: 'subspace-family-store'
    }
  )
);
