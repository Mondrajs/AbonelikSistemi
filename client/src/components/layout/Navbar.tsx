"use client";
import React from 'react';
import { Bell, Search, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/lib/translations';
import { useUserStore } from '@/store/useUserStore';

export const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguageStore();
  const user = useUserStore((state) => state.user);
  const t = translations[language];

  return (
    <header className="h-20 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-100 dark:border-slate-900 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40 transition-colors duration-300">
      {/* Search Bar */}
      <div className="hidden md:flex items-center bg-slate-50 dark:bg-slate-900/60 rounded-xl px-4 py-2 border border-slate-100 dark:border-slate-900 w-64 lg:w-96 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-200">
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
  );
};
