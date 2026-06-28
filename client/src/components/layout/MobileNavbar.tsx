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

  const navItems = [
    { label: language === 'tr' ? 'Özet' : 'Dashboard', iconName: 'dashboard', href: '/' },
    { label: language === 'tr' ? 'Abonelik' : 'Subs', iconName: 'subscriptions', href: '/subscriptions' },
    { label: language === 'tr' ? 'Aile' : 'Family', iconName: 'group', href: '/family-plan' },
    { label: language === 'tr' ? 'Raporlar' : 'Reports', iconName: 'assessment', href: '/analytics' },
    { label: language === 'tr' ? 'Ayarlar' : 'Settings', iconName: 'settings', href: '/settings' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800/80 z-50 flex items-center justify-around px-2 shadow-lg transition-colors duration-300">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href.split('/').slice(0, 2).join('/')));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl transition-all active:scale-90 duration-150 ${
              isActive
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs scale-102 font-black'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'
            }`}
          >
            <span 
              className="material-symbols-outlined text-[20px] select-none"
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {item.iconName}
            </span>
            <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5 select-none line-clamp-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
