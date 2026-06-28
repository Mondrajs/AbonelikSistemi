"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, CreditCard, BarChart2, Settings, LogOut, HelpCircle, Sparkles } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/lib/translations';
import { useUserStore } from '@/store/useUserStore';

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguageStore();
  const user = useUserStore((state) => state.user);
  const t = translations[language];

  const navItems = [
    { label: t.dashboard, icon: LayoutDashboard, href: '/' },
    { label: t.subscriptions, icon: CreditCard, href: '/subscriptions' },
    { label: t.familyPlan, icon: Users, href: '/family-plan' },
    { label: t.analytics, icon: BarChart2, href: '/analytics' },
    { label: t.settings, icon: Settings, href: '/settings' },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-900 flex flex-col h-screen transition-colors duration-300">
      {/* Logo Section */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            SubSpace
          </h1>
          <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 block -mt-1">
            {t.premiumManagement}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase px-3 mb-2">
          {t.overview}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href.split('/').slice(0, 2).join('/')));
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/10 font-semibold' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info / User Card */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-900 space-y-4">
        {/* Support Link */}
        <Link 
          href="/support"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-950 dark:hover:text-white transition-all text-sm"
        >
          <HelpCircle className="w-5 h-5 text-slate-400" />
          <span>{t.supportHelp}</span>
        </Link>

        {/* User Card */}
        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-3 flex items-center justify-between border border-slate-100/50 dark:border-slate-900/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden ring-2 ring-slate-100 dark:ring-slate-900 shrink-0">
              <img src={user.avatar} alt="User Avatar" className="w-full h-full object-cover" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full"></span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/login')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            title={t.logout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
