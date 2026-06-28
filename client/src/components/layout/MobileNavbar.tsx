"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CreditCard, BarChart2, Settings } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/lib/translations';

export const MobileNavbar = () => {
  const pathname = usePathname();
  const { language } = useLanguageStore();
  const t = translations[language as 'tr' | 'en'] || translations['tr'];

  const navItems = [
    { label: t.dashboard, icon: LayoutDashboard, href: '/' },
    { label: t.subscriptions, icon: CreditCard, href: '/subscriptions' },
    { label: t.familyPlan, icon: Users, href: '/family-plan' },
    { label: t.analytics, icon: BarChart2, href: '/analytics' },
    { label: t.settings, icon: Settings, href: '/settings' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-t border-slate-100 dark:border-slate-900 z-50 flex items-center justify-around px-2 shadow-lg transition-colors duration-300">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href.split('/').slice(0, 2).join('/')));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[9px] font-bold transition-all relative ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 scale-105'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : ''}`}>
              <Icon size={18} />
            </div>
            <span className="mt-0.5 tracking-tight font-semibold line-clamp-1">{item.label}</span>
            {isActive && (
              <span className="absolute top-0 w-8 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse"></span>
            )}
          </Link>
        );
      })}
    </div>
  );
};
