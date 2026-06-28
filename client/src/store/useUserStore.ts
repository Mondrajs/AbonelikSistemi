import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
}

export interface NotificationSettings {
  notifRenewal: boolean;
  notifWeekly: boolean;
  notifSecurity: boolean;
  telegramActive: boolean;
  telegramToken: string;
  telegramChatId: string;
  emailActive: boolean;
  emailTarget: string;
  emailDaysBefore: number;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  monthlyLimit: number; // Monthly budget limit / cap in TRY
  usdRate: number;      // Exchange rate USD -> TRY
  eurRate: number;      // Exchange rate EUR -> TRY
  baseCurrency: string; // The primary base currency selected by the user (TRY, USD, EUR)
}

interface UserState {
  user: UserProfile;
  notifications: NotificationSettings;
  updateUser: (fields: Partial<UserProfile>) => void;
  updateNotifications: (fields: Partial<NotificationSettings>) => void;
  loginUser: (email: string, fullName: string) => void;
  logoutUser: () => void;
}

const defaultUser: UserProfile = {
  firstName: 'Alex',
  lastName: 'Johnson',
  email: 'alex@example.com',
  avatar: 'https://i.pravatar.cc/150?img=12'
};

const defaultNotifications: NotificationSettings = {
  notifRenewal: true,
  notifWeekly: false,
  notifSecurity: true,
  telegramActive: false,
  telegramToken: '',
  telegramChatId: '',
  emailActive: false,
  emailTarget: '',
  emailDaysBefore: 3,
  smtpHost: '',
  smtpPort: '587',
  smtpUser: '',
  smtpPass: '',
  monthlyLimit: 1000, // Default limit is 1000 TL
  usdRate: 33,        // Default USD rate
  eurRate: 35,        // Default EUR rate
  baseCurrency: 'TRY' // Default base currency is TRY
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: defaultUser,
      notifications: defaultNotifications,
      updateUser: (fields) => set((state) => ({ user: { ...state.user, ...fields } })),
      updateNotifications: (fields) => set((state) => ({ notifications: { ...state.notifications, ...fields } })),
      loginUser: (email, fullName) => {
        const parts = fullName.split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        set({
          user: {
            firstName,
            lastName,
            email,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`
          }
        });
      },
      logoutUser: () => set({ user: defaultUser, notifications: defaultNotifications })
    }),
    {
      name: 'subspace-user-store'
    }
  )
);
