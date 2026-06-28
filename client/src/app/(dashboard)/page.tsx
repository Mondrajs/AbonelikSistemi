"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { 
  Wallet, CreditCard, Activity, Plus, MoreVertical, 
  Calendar, Sparkles, ChevronRight, X
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/lib/translations';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useUserStore } from '@/store/useUserStore';
import { convertToTry, getCurrencySymbol } from '@/utils/currency';
import { AlertTriangle } from 'lucide-react';

// Initial Mock Data
const initialSubscriptions = [
  { id: 'spotify', name: 'Spotify Premium', price: 9.99, status: 'Active', nextBilling: '2026-10-24', logo: 'S', color: 'bg-emerald-500 text-white', category: 'Entertainment', features: ['Offline Play', 'Unlimited Skips', 'High Quality Audio'] },
  { id: 'netflix', name: 'Netflix 4K', price: 19.99, status: 'Active', nextBilling: '2026-10-28', logo: 'N', color: 'bg-red-600 text-white', category: 'Entertainment', features: ['4K Streaming', '4 Devices', 'HDR Enabled'] },
  { id: 'adobe', name: 'Adobe Creative Cloud', price: 52.99, status: 'Past Due', nextBilling: '2026-10-15', logo: 'A', color: 'bg-indigo-600 text-white', category: 'Productivity', features: ['Photoshop', 'Illustrator', '100GB Cloud Storage'] },
  { id: 'youtube', name: 'YouTube Premium', price: 13.99, status: 'Active', nextBilling: '2026-11-02', logo: 'Y', color: 'bg-rose-500 text-white', category: 'Entertainment', features: ['Ad-free video', 'Background play', 'YT Music Premium'] },
];

export default function Dashboard() {
  const language = useLanguageStore((state) => state.language);
  const t = translations[language as 'tr' | 'en'];
  const user = useUserStore((state) => state.user);

  // React States & Zustand store selectors
  const allSubscriptions = useSubscriptionStore((state) => state.subscriptions);
  const subList = allSubscriptions.filter(sub => !sub.isFamilyPlan);
  const addSubscription = useSubscriptionStore((state) => state.addSubscription);
  const deleteSubscription = useSubscriptionStore((state) => state.deleteSubscription);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubPrice, setNewSubPrice] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('Entertainment');
  const [newSubDate, setNewSubDate] = useState('');
  const [newSubStatus, setNewSubStatus] = useState('Active');
  const [newSubFeatures, setNewSubFeatures] = useState('');
  const [newSubCurrency, setNewSubCurrency] = useState('TRY');
  const [isFamily, setIsFamily] = useState(false);

  // Dynamic Calculations (converted to TRY)
  const totalMonthlySpend = allSubscriptions
    .filter(sub => sub.status === 'Active')
    .reduce((acc, sub) => acc + convertToTry(sub.price, sub.currency), 0);
  
  const activeSubsCount = allSubscriptions.filter(sub => sub.status === 'Active').length;
  const notifications = useUserStore((state) => state.notifications);

  // Calculate upcoming payments based on subscription list dates
  const upcomingPayments = allSubscriptions
    .filter(sub => sub.status === 'Active')
    .map(sub => ({
      id: sub.id,
      name: sub.name,
      price: `${getCurrencySymbol(sub.currency)}${sub.price.toFixed(2)}`,
      date: sub.nextBilling ? new Date(sub.nextBilling).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { month: 'short', day: 'numeric' }) : '',
      logo: sub.logo,
      color: sub.color
    }))
    .slice(0, 3); // top 3 upcoming

  // Dynamic Category Breakdown Data
  const categoryCosts = allSubscriptions
    .filter(sub => sub.status === 'Active')
    .reduce((acc, sub) => {
      acc[sub.category] = (acc[sub.category] || 0) + convertToTry(sub.price, sub.currency);
      return acc;
    }, {} as Record<string, number>);

  const totalCatCost = Object.values(categoryCosts).reduce((a, b) => a + b, 0);
  const categoryData = Object.entries(categoryCosts).map(([name, value]) => ({
    name,
    value: totalCatCost > 0 ? Math.round((value / totalCatCost) * 100) : 0,
    color: name === 'Entertainment' ? '#6366f1' : name === 'Productivity' ? '#10b981' : '#f59e0b'
  }));

  // Recharts Spend Data Mock Points scale relative to total spent
  const spendData = [
    { month: 'May', amount: Math.round(totalMonthlySpend * 0.7) },
    { month: 'Jun', amount: Math.round(totalMonthlySpend * 0.8) },
    { month: 'Jul', amount: Math.round(totalMonthlySpend * 0.9) },
    { month: 'Aug', amount: Math.round(totalMonthlySpend * 0.85) },
    { month: 'Sep', amount: Math.round(totalMonthlySpend * 0.95) },
    { month: 'Oct', amount: Math.round(totalMonthlySpend) },
  ];

  // Helper to translate categories
  const getCategoryName = (name: string) => {
    return t[name as keyof typeof t] || name;
  };

  // Handle Form Submission
  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName || !newSubPrice || !newSubDate) return;

    const priceNum = parseFloat(newSubPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    // Generate random background classes for logo
    const colors = [
      'bg-emerald-500 text-white',
      'bg-red-600 text-white',
      'bg-indigo-650 text-white',
      'bg-rose-500 text-white',
      'bg-amber-500 text-white',
      'bg-sky-500 text-white',
    ];

    addSubscription({
      id: newSubName.toLowerCase().replace(/\s+/g, '-'),
      name: newSubName,
      price: priceNum,
      status: newSubStatus,
      nextBilling: newSubDate,
      logo: newSubName.charAt(0).toUpperCase(),
      color: colors[Math.floor(Math.random() * colors.length)],
      category: newSubCategory,
      features: newSubFeatures.split(',').map(f => f.trim()).filter(Boolean),
      isFamilyPlan: isFamily,
      currency: newSubCurrency
    });

    // Reset inputs
    setNewSubName('');
    setNewSubPrice('');
    setNewSubCategory('Entertainment');
    setNewSubDate('');
    setNewSubStatus('Active');
    setNewSubFeatures('');
    setIsFamily(false);
    setIsModalOpen(false);
  };

  // Handle Deletion
  const handleDeleteSub = (id: string) => {
    deleteSubscription(id);
    setActiveDropdown(null);
  };

  const handleExportReport = () => {
    const headers = language === 'tr' 
      ? ['Abonelik Adi', 'Kategori', 'Ucret', 'Durum', 'Sonraki Odeme']
      : ['Subscription Name', 'Category', 'Cost', 'Status', 'Next Billing'];

    const rows = allSubscriptions.map(sub => [
      sub.name,
      sub.category,
      (sub.price * (language === 'tr' ? 6 : 1)).toFixed(2),
      sub.status === 'Active' ? (language === 'tr' ? 'Aktif' : 'Active') : (language === 'tr' ? 'Pasif' : 'Passive'),
      sub.nextBilling || '-'
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `submanager_abonelik_raporu_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-150">
      {/* Budget cap warning banner */}
      {totalMonthlySpend > (notifications.monthlyLimit || 1000) && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 px-4 py-3.5 rounded-2xl flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 animate-bounce" />
            <span className="text-xs font-bold leading-relaxed">
              {language === 'tr' 
                ? `Limit Aşımı! Aylık harcama limitinizi (${notifications.monthlyLimit} TL) aştınız. Toplam harcama: ₺${totalMonthlySpend.toFixed(2)}` 
                : `Limit Exceeded! You have exceeded your monthly spending limit (${notifications.monthlyLimit} TL). Total spending: ₺${totalMonthlySpend.toFixed(2)}`}
            </span>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            {language === 'tr' ? `Tekrar hoş geldin, ${user.firstName}! 👋` : `Welcome back, ${user.firstName}! 👋`}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1"
             dangerouslySetInnerHTML={{ 
               __html: t.activeSubsDescription.replace('{count}', `<span class="font-semibold text-indigo-600 dark:text-indigo-400">${activeSubsCount}</span>`) 
             }}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExportReport}
            variant="outline" 
            className="text-xs bg-white dark:bg-slate-900"
          >
            {t.exportReport}
          </Button>
          <Button 
            onClick={() => setIsModalOpen(true)}
            variant="primary" 
            className="text-xs gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" /> {t.addSubscription}
          </Button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t.totalMonthlySpend} value={`${getCurrencySymbol(notifications.baseCurrency || 'TRY')}${totalMonthlySpend.toFixed(2)}`} icon={Wallet} trend={`4.2% ${t.spent}`} trendUp={false} />
        <StatCard title={t.activeSubscriptions} value={activeSubsCount.toString()} icon={CreditCard} trend={`1 ${t.newTrend}`} trendUp={true} />
        <StatCard title={t.potentialSavings} value={`${getCurrencySymbol(notifications.baseCurrency || 'TRY')}420.00`} icon={Sparkles} trend="12%" trendUp={true} />
        <StatCard title={t.overallLimitStatus} value={`${Math.round(Math.min(100, (totalMonthlySpend / (notifications.monthlyLimit || 1000)) * 100))}%`} icon={Activity} />
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Charts and Active Subs */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Monthly Spend Chart */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{t.subscriptionSpending}</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">{t.spendingTrendDescription}</p>
              </div>
              <select className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs rounded-xl px-3 py-1.5 outline-none text-slate-600 dark:text-slate-300">
                <option>{t.last6Months}</option>
                <option>{t.lastYear}</option>
              </select>
            </div>
            
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} className="dark:stroke-slate-900" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#818cf8' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Subscriptions List */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{t.activeSubscriptions}</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {language === 'tr' ? 'Ödemesi gerçekleştirilen aktif bireysel abonelikleriniz.' : 'Your active individual subscriptions currently being billed.'}
                </p>
              </div>
              <Link href="/subscriptions">
                <Button variant="outline" className="text-xs">{t.viewAll}</Button>
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/20 text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase">
                    <th className="px-6 py-3.5">{t.subscriptions}</th>
                    <th className="px-6 py-3.5">{t.category}</th>
                    <th className="px-6 py-3.5">{t.cost}</th>
                    <th className="px-6 py-3.5">{t.status}</th>
                    <th className="px-6 py-3.5">{t.nextBilling}</th>
                    <th className="px-6 py-3.5 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {subList.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${sub.color}`}>
                            {sub.logo}
                          </div>
                          <div>
                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 block">{sub.name}</span>
                            {sub.features && sub.features.length > 0 && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                                {sub.features.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {getCategoryName(sub.category)}
                      </td>
                      <td className="px-6 py-4 font-bold text-sm text-slate-800 dark:text-slate-100">
                        {getCurrencySymbol(sub.currency)}{sub.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium inline-block ${
                          sub.status === 'Active' 
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {sub.status === 'Active' ? t.active : t.pending}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {sub.nextBilling}
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button 
                          onClick={() => setActiveDropdown(activeDropdown === sub.id ? null : sub.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-950 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeDropdown === sub.id && (
                          <div className="absolute right-6 top-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-lg py-1.5 w-32 z-50 text-left">
                            <a href={`/subscriptions/${sub.id}`} className="block px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                              {t.viewDetails}
                            </a>
                            <button className="block w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                              {t.editSubscription}
                            </button>
                            <button 
                              onClick={() => handleDeleteSub(sub.id)}
                              className="block w-full text-left px-4 py-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                            >
                              {t.delete}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Cards & Schedule Widgets */}
        <div className="space-y-8">
          


          {/* Payment Schedule */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">{t.upcomingSchedule}</h3>
            <div className="space-y-4">
              {upcomingPayments.map((pay, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/20 hover:border-slate-100 dark:hover:border-slate-800 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-sm bg-slate-100 dark:bg-slate-850">
                      <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{pay.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{t.due}: {pay.date}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{pay.price}</span>
                    <button className="p-1 rounded-lg text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Spend Breakdown */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">{t.categoryBreakdown}</h3>
            
            <div className="flex justify-center mb-6">
              <div className="w-[140px] h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-2.5">
              {categoryData.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                    <span className="text-slate-600 dark:text-slate-400">{getCategoryName(cat.name)}</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Add Subscription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl w-full max-w-md border border-slate-100 dark:border-slate-900 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.addSubscription}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Tabs: Kişisel vs Aile Planı */}
            <div className="flex border-b border-slate-100 dark:border-slate-900 mt-2">
              <button
                type="button"
                onClick={() => setIsFamily(false)}
                className={`flex-1 py-2.5 text-xs font-bold transition-all text-center border-b-2 ${
                  !isFamily 
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                    : 'border-transparent text-slate-450 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {language === 'tr' ? 'Kişisel' : 'Personal'}
              </button>
              <button
                type="button"
                onClick={() => setIsFamily(true)}
                className={`flex-1 py-2.5 text-xs font-bold transition-all text-center border-b-2 ${
                  isFamily 
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                    : 'border-transparent text-slate-450 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {language === 'tr' ? 'Aile Planı' : 'Family Plan'}
              </button>
            </div>

            <form onSubmit={handleAddSubscription} className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase">
                  {language === 'tr' ? 'Abonelik Adı' : 'Subscription Name'}
                </label>
                <input 
                  type="text" 
                  required
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g. Xbox Game Pass"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-150 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-455 dark:text-slate-500 uppercase">
                    {language === 'tr' ? 'Aylık Fiyat' : 'Monthly Price'}
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={newSubPrice}
                    onChange={(e) => setNewSubPrice(e.target.value)}
                    placeholder="e.g. 14.99"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-150 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <label className="text-xs font-bold text-slate-455 dark:text-slate-500 uppercase">
                    {language === 'tr' ? 'Para Birimi' : 'Currency'}
                  </label>
                  <select
                    value={newSubCurrency}
                    onChange={(e) => setNewSubCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-150 focus:outline-none"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase">
                  {t.category}
                </label>
                <select 
                  value={newSubCategory}
                  onChange={(e) => setNewSubCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/60 text-slate-850 dark:text-slate-150 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="Entertainment">{t.Entertainment}</option>
                  <option value="Productivity">{t.Productivity}</option>
                  <option value="Utilities">{t.Utilities}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase">
                  {t.nextBilling}
                </label>
                <input 
                  type="date" 
                  required
                  value={newSubDate}
                  onChange={(e) => setNewSubDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-150 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase">
                  {t.status}
                </label>
                <select 
                  value={newSubStatus}
                  onChange={(e) => setNewSubStatus(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/60 text-slate-850 dark:text-slate-150 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="Active">{t.active}</option>
                  <option value="Pending">{t.pending}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase">
                  {language === 'tr' ? 'Özellikler (Virgülle Ayırın)' : 'Features (Comma Separated)'}
                </label>
                <input 
                  type="text" 
                  value={newSubFeatures}
                  onChange={(e) => setNewSubFeatures(e.target.value)}
                  placeholder="e.g. Cloud Play, Free games"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/60 text-slate-850 dark:text-slate-150 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  {language === 'tr' ? 'İptal' : 'Cancel'}
                </button>
                <Button type="submit" variant="primary" className="text-xs px-5 shadow-lg shadow-indigo-600/15">
                  {language === 'tr' ? 'Ekle' : 'Add'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
