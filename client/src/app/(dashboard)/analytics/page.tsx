"use client";
import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, ArrowUpRight, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/lib/translations';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';

export default function AnalyticsPage() {
  const { language } = useLanguageStore();
  const t = translations[language];

  // Retrieve dynamic subscriptions
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'TRY': return '₺';
      default: return '$';
    }
  };

  // Next 7 days due amount
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const next7DaysDue = subscriptions
    .filter(sub => sub.status === 'Active' && sub.nextBilling && new Date(sub.nextBilling) <= sevenDaysLater)
    .reduce((acc, sub) => acc + sub.price, 0);

  const totalSpent = subscriptions.reduce((acc, sub) => acc + sub.price, 0);
  const budgetLimit = 300.00;
  const percentSpent = Math.round((totalSpent / budgetLimit) * 100);

  const entertainmentSpent = subscriptions.filter(s => s.category === 'Entertainment').reduce((a, b) => a + b.price, 0);
  const productivitySpent = subscriptions.filter(s => s.category === 'Productivity').reduce((a, b) => a + b.price, 0);
  const utilitiesSpent = subscriptions.filter(s => s.category === 'Utilities').reduce((a, b) => a + b.price, 0);

  const categories = [
    { name: 'Entertainment', spent: entertainmentSpent, limit: 120, color: '#6366f1' },
    { name: 'Productivity', spent: productivitySpent, limit: 80, color: '#10b981' },
    { name: 'Utilities', spent: utilitiesSpent, limit: 50, color: '#f59e0b' },
  ];

  const monthlySpending = [
    { name: 'Jan', spend: Math.round(totalSpent * 0.6) },
    { name: 'Feb', spend: Math.round(totalSpent * 0.7) },
    { name: 'Mar', spend: Math.round(totalSpent * 0.8) },
    { name: 'Apr', spend: Math.round(totalSpent * 0.9) },
    { name: 'May', spend: Math.round(totalSpent * 0.75) },
    { name: 'Jun', spend: totalSpent },
  ];

  // Data for the progress circle ring
  const circleData = [
    { name: 'Spent', value: totalSpent, color: '#6366f1' },
    { name: 'Remaining', value: Math.max(0, budgetLimit - totalSpent), color: '#e2e8f0' }
  ];

  const getCategoryName = (name: string) => {
    return t[name as keyof typeof t] || name;
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-150">
      
      {/* DESKTOP VIEW */}
      <div className="hidden lg:block space-y-8">
        {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t.reportsAndAnalytics}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.analyticsDescription}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-xs bg-white dark:bg-slate-900">{t.customDate}</Button>
          <Button variant="primary" className="text-xs">{t.downloadCsv}</Button>
        </div>
      </div>

      {/* Main Analysis Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle Column - Spend Trends */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Area Chart */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.monthlySpendingTrend}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">{t.compareBudget}</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5" /> +12.4% {t.vsLastPeriod}
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySpending} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpendTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} className="dark:stroke-slate-900" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#818cf8' }}
                  />
                  <Area type="monotone" dataKey="spend" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSpendTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Budgets & Spending Progress bars */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">{t.spendLimitsByCategory}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories.map((cat, idx) => {
                const ratio = Math.min((cat.spent / cat.limit) * 100, 100);
                return (
                  <div key={idx} className="p-4 rounded-2xl border border-slate-50 dark:border-slate-900/60 bg-slate-50/20 dark:bg-slate-900/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{getCategoryName(cat.name)}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{Math.round(ratio)}% {t.spent}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${ratio}%`, backgroundColor: cat.color }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                        <span>${cat.spent}</span>
                        <span>limit: ${cat.limit}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column - Circular Budget Gauge & Recommendations */}
        <div className="space-y-8">
          
          {/* circular budget gauge */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm flex flex-col items-center">
            <div className="w-full text-left">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.budgetGauge}</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{t.monthlySpendingCap}</p>
            </div>

            {/* Circular Chart Gauge */}
            <div className="relative w-48 h-48 my-8 flex items-center justify-center">
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-slate-950 dark:text-white">{percentSpent}%</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">{t.spent}</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      circleData[0],
                      { ...circleData[1], color: '#f1f5f9' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={80}
                    startAngle={225}
                    endAngle={-45}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    <Cell fill={circleData[0].color} />
                    <Cell className="fill-slate-100 dark:fill-slate-900" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* budget limits details */}
            <div className="w-full border-t border-slate-50 dark:border-slate-900 pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">{t.monthlySpent}</span>
                <span className="font-bold text-slate-900 dark:text-white">${totalSpent.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">{t.totalLimit}</span>
                <span className="font-bold text-slate-900 dark:text-white">${budgetLimit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">{t.remainingBudget}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">${(budgetLimit - totalSpent).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* savings recommendations / alert card */}
          <div className="bg-gradient-to-br from-indigo-900/10 via-indigo-950/5 to-transparent dark:from-indigo-950/20 border border-indigo-100/50 dark:border-indigo-950 rounded-2xl p-5 relative overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t.smartSavingRec}</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed"
               dangerouslySetInnerHTML={{ __html: t.consolidatingSavingText.replace('{amount}', '<span class="font-bold text-indigo-600 dark:text-indigo-400">$12/mo</span>') }}
            />
            <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 mt-4 flex items-center gap-1">
              {t.applySuggestions} <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
      </div>
      {/* END DESKTOP VIEW */}

      {/* MOBILE VIEW (matching raporlar_mobil/code.html) */}
      <div className="lg:hidden space-y-6 pb-12">
        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans']">
            {language === 'tr' ? 'Finansal Raporlar' : 'Financial Insights'}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {language === 'tr' ? 'Harcama analizleriniz ve limit takibi' : 'Your spending patterns and limits'}
          </p>
        </section>

        {/* Summary Cards Bento-ish Layout */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-xs col-span-2 relative overflow-hidden">
            <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-indigo-500/5 rounded-full blur-xl"></div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.totalMonthlySpend}</p>
            <div className="flex justify-between items-end mt-1">
              <span className="text-3xl font-black text-slate-800 dark:text-white">
                {getCurrencySymbol('USD')}{totalSpent.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">+4.2%</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{language === 'tr' ? 'Aktif' : 'Active'}</p>
            <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">
              {subscriptions.filter((sub: any) => sub.status === 'Active').length}
            </span>
            <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-0.5">{language === 'tr' ? 'Abonelik' : 'Subscriptions'}</p>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{language === 'tr' ? 'Gelecek 7 Gün' : 'Next 7 Days'}</p>
            <span className="text-2xl font-black text-rose-500 dark:text-rose-400 mt-1 block">
              {getCurrencySymbol('USD')}{next7DaysDue.toFixed(2)}
            </span>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{language === 'tr' ? 'Yaklaşan' : 'Upcoming'}</p>
          </div>
        </div>

        {/* Spending Trends Chart */}
        <section className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">{t.monthlySpendingTrend}</h3>
            <div className="flex gap-1.5">
              <button className="px-2 py-0.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-lg text-[9px] font-bold">6M</button>
              <button className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[9px] font-bold">1Y</button>
            </div>
          </div>
          
          <div className="h-44 w-full relative flex items-end justify-between gap-3 px-1 pt-6">
            {monthlySpending.map((item, idx) => {
              const maxSpend = Math.max(...monthlySpending.map(m => m.spend)) || 1;
              const barHeightPct = Math.round((item.spend / maxSpend) * 85);
              const isActiveMonth = idx === monthlySpending.length - 1;
              
              return (
                <div key={idx} className="flex-1 flex flex-col justify-end items-center h-full group relative">
                  {/* Tooltip value */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    ${item.spend}
                  </div>
                  
                  {/* Bar shape */}
                  <div 
                    style={{ height: `${barHeightPct}%` }}
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      isActiveMonth 
                        ? 'bg-indigo-600 dark:bg-indigo-500 shadow-sm shadow-indigo-650/20' 
                        : 'bg-indigo-100 dark:bg-indigo-900/30 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50'
                    }`}
                  ></div>
                  
                  {/* Label */}
                  <span className={`text-[9px] font-bold mt-2 ${
                    isActiveMonth ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {item.name.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Spending by Category */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">{t.spendLimitsByCategory}</h3>
          </div>
          
          <div className="space-y-3">
            {categories.map((cat, idx) => {
              const ratio = Math.min((cat.spent / cat.limit) * 100, 100);
              return (
                <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15` }}>
                    <span className="material-symbols-outlined text-[20px]" style={{ color: cat.color }}>
                      {cat.name === 'Entertainment' ? 'movie' : cat.name === 'Productivity' ? 'terminal' : 'bolt'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1 text-xs font-bold">
                      <span className="text-slate-850 dark:text-white truncate">{getCategoryName(cat.name)}</span>
                      <span className="text-slate-850 dark:text-white shrink-0">${cat.spent.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${ratio}%`, backgroundColor: cat.color }}></div>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                      <span>{Math.round(ratio)}% {t.spent}</span>
                      <span>limit: ${cat.limit}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

    </div>
  );
}
