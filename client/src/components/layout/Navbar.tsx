"use client";
import React from 'react';
import { Bell, Search, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/lib/translations';
import { useUserStore } from '@/store/useUserStore';
import { usePathname, useRouter } from 'next/navigation';

export const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguageStore();
  const user = useUserStore((state: any) => state.user);
  const t = translations[language as 'tr' | 'en'] || translations['tr'];
  const pathname = usePathname();
  const router = useRouter();

  const getMobileHeader = () => {
    const isHome = pathname === '/';
    let title = 'Subly';
    if (pathname.startsWith('/subscriptions')) {
      title = language === 'tr' ? 'Aboneliklerim' : 'Subscriptions';
    } else if (pathname.startsWith('/family-plan')) {
      title = language === 'tr' ? 'Aile Planı' : 'Family Plan';
    } else if (pathname.startsWith('/analytics')) {
      title = language === 'tr' ? 'Raporlar' : 'Reports';
    } else if (pathname.startsWith('/settings')) {
      title = language === 'tr' ? 'Ayarlar' : 'Settings';
    }

    return (
      <div className="flex items-center gap-3">
        {!isHome && (
          <button onClick={() => router.back()} className="text-slate-900 dark:text-white mr-1 flex items-center justify-center active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
        )}
        {isHome && (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
            <img className="w-full h-full object-cover" src={user.avatar || "https://api.dicebear.com/7.x/initials/svg?seed=User"} alt="Profile" />
          </div>
        )}
        <h1 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h1>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="lg:hidden h-16 bg-white dark:bg-[#090d1a] w-full sticky top-0 z-40 flex items-center justify-between px-4 border-b border-slate-100 dark:border-[#232f4e] transition-colors duration-300">
        {getMobileHeader()}
        {pathname !== '/' && (
          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/50 dark:border-slate-800">
            <img className="w-full h-full object-cover" src={user.avatar || "https://api.dicebear.com/7.x/initials/svg?seed=User"} alt="Profile" />
          </div>
        )}
        {pathname === '/' && (
          <div className="flex items-center gap-2">
            {/* Quick theme toggle for better UX */}
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} />}
            </button>
            <button className="p-2 text-slate-900 dark:text-white active:scale-95 transition-transform duration-200" aria-label="Notifications">
              <span className="material-symbols-outlined text-[24px]">notifications</span>
            </button>
          </div>
        )}
      </header>

      {/* Desktop Top Bar */}
      <header className="hidden lg:flex h-20 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-100 dark:border-slate-900 items-center justify-between px-8 sticky top-0 z-40 transition-colors duration-300">
        {/* Search Bar */}
        <div className="flex items-center bg-slate-50 dark:bg-slate-900/60 rounded-xl px-4 py-2 border border-slate-100 dark:border-slate-900 w-64 lg:w-96 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-200">
          <Search size={18} className="text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder={t.searchPlaceholder} 
            className="bg-transparent border-none outline-none ml-3 w-full text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>
        
        {/* Action Controls */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <button 
            onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')} 
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-450 transition-colors"
            aria-label="Toggle Language"
          >
            <span className="text-sm">🌐</span>
            <span className="uppercase">{language}</span>
          </button>

          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-450 transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} />}
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-450 transition-colors" aria-label="Notifications">
            <Bell size={18} />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>
          </button>

          {/* Profile Avatar */}
          <div className="pl-2 border-l border-slate-100 dark:border-slate-900">
            <button className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden hover:ring-2 hover:ring-indigo-500/30 transition-all">
              <img src={user.avatar} alt="User profile" className="w-full h-full object-cover" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
