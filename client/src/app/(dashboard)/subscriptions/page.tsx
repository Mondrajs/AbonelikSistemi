"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, Calendar, Sparkles, CheckCircle2, ChevronRight, List, Grid, Bell, Home,
  Search, Filter, ArrowUpDown, Eye, Trash2, X, AlertCircle, Download
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/lib/translations';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useUserStore } from '@/store/useUserStore';
import { convertToTry, getCurrencySymbol } from '@/utils/currency';
import { AlertTriangle } from 'lucide-react';

export default function SubscriptionsListPage() {
  const { language } = useLanguageStore();
  const t = translations[language];
  const router = useRouter();

  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const addSubscription = useSubscriptionStore((state) => state.addSubscription);
  const deleteSubscription = useSubscriptionStore((state) => state.deleteSubscription);
  const user = useUserStore((state) => state.user);

  // Layout View States
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Filter & Search States
  const [filterTab, setFilterTab] = useState<'all' | 'personal' | 'family'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Add Subscription Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubPrice, setNewSubPrice] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('Entertainment');
  const [newSubDate, setNewSubDate] = useState('');
  const [newSubStatus, setNewSubStatus] = useState('Active');
  const [newSubFeatures, setNewSubFeatures] = useState('');
  const [newSubCurrency, setNewSubCurrency] = useState('TRY');
  const [isFamily, setIsFamily] = useState(false);

  // Calculations
  const currency = language === 'tr' ? '₺' : '$';
  const activeSubs = subscriptions.filter(sub => sub.status === 'Active');
  const passiveSubs = subscriptions.filter(sub => sub.status !== 'Active');
  
  const activeCount = activeSubs.length;
  const passiveCount = passiveSubs.length;
  
  const totalMonthlySpend = activeSubs.reduce((acc, sub) => {
    return acc + convertToTry(sub.price, sub.currency);
  }, 0);
  const notifications = useUserStore((state) => state.notifications);

  // Find next upcoming payment
  const upcomingSorted = [...activeSubs].sort((a, b) => {
    return new Date(a.nextBilling).getTime() - new Date(b.nextBilling).getTime();
  });
  
  const nextPaymentSub = upcomingSorted[0];
  const nextPaymentDateStr = nextPaymentSub
    ? new Date(nextPaymentSub.nextBilling).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
        day: 'numeric',
        month: 'long'
      })
    : '-';

  const formatSubPrice = (price: number, subCurrency: string = 'TRY') => {
    return `${getCurrencySymbol(subCurrency)}${price.toFixed(2)}`;
  };

  const getPlanDescription = (name: string, category: string) => {
    if (name.toLowerCase().includes('spotify')) {
      return language === 'tr' ? 'Premium Bireysel' : 'Premium Individual';
    }
    if (name.toLowerCase().includes('netflix')) {
      return language === 'tr' ? 'Aile Planı (Ultra HD)' : 'Family Plan (Ultra HD)';
    }
    if (name.toLowerCase().includes('adobe')) {
      return language === 'tr' ? '20+ Yaratıcı Uygulama' : '20+ Creative Apps';
    }
    if (name.toLowerCase().includes('youtube')) {
      return language === 'tr' ? 'Bireysel Üyelik' : 'Individual Membership';
    }
    return language === 'tr' ? `${category} Paketi` : `${category} Package`;
  };

  const getFormattedDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Filter & Sort Logic
  const filteredSubs = subscriptions
    .filter((sub) => {
      if (filterTab === 'personal' && sub.isFamilyPlan) return false;
      if (filterTab === 'family' && !sub.isFamilyPlan) return false;
      return true;
    })
    .filter((sub) => {
      return sub.name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .filter((sub) => {
      if (selectedCategory === 'All') return true;
      return sub.category === selectedCategory;
    })
    .sort((a, b) => {
      let compareA: any = a[sortBy === 'date' ? 'nextBilling' : sortBy];
      let compareB: any = b[sortBy === 'date' ? 'nextBilling' : sortBy];

      if (sortBy === 'price') {
        return sortOrder === 'asc' ? compareA - compareB : compareB - compareA;
      }

      compareA = String(compareA).toLowerCase();
      compareB = String(compareB).toLowerCase();

      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (field: 'name' | 'price' | 'date') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Export Report to CSV Function
  const handleExportReport = () => {
    const headers = language === 'tr' 
      ? ['Abonelik Adi', 'Kategori', 'Ucret', 'Durum', 'Sonraki Odeme', 'Tur']
      : ['Subscription Name', 'Category', 'Cost', 'Status', 'Next Billing', 'Type'];

    const rows = subscriptions.map(sub => [
      sub.name,
      sub.category,
      (sub.price * (language === 'tr' ? 6 : 1)).toFixed(2),
      sub.status === 'Active' ? (language === 'tr' ? 'Aktif' : 'Active') : (language === 'tr' ? 'Pasif' : 'Passive'),
      sub.nextBilling || '-',
      sub.isFamilyPlan ? (language === 'tr' ? 'Aile Plani' : 'Family Plan') : (language === 'tr' ? 'Kisisel' : 'Personal')
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

  // Add Subscription Handler
  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName || !newSubPrice || !newSubDate) return;

    const priceNum = parseFloat(newSubPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    const colors = [
      'bg-emerald-500 text-white',
      'bg-indigo-600 text-white',
      'bg-rose-500 text-white',
      'bg-sky-500 text-white',
      'bg-amber-500 text-white',
      'bg-purple-600 text-white'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const featuresArray = newSubFeatures
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    const newSubObj = {
      id: newSubName.toLowerCase().replace(/\s+/g, '-'),
      name: newSubName,
      price: priceNum,
      status: newSubStatus,
      nextBilling: newSubDate,
      logo: newSubName.charAt(0).toUpperCase(),
      color: randomColor,
      category: newSubCategory,
      features: featuresArray,
      isFamilyPlan: isFamily,
      currency: newSubCurrency
    };

    addSubscription(newSubObj);
    setIsModalOpen(false);

    // Reset inputs
    setNewSubName('');
    setNewSubPrice('');
    setNewSubCategory('Entertainment');
    setNewSubDate('');
    setNewSubStatus('Active');
    setNewSubFeatures('');
    setIsFamily(false);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-150">
      
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
      
      {/* Top Breadcrumbs & Header Bar */}
      <div className="hidden lg:flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-900/60">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
          <Home className="w-3.5 h-3.5" />
          <span>/</span>
          <span className="text-slate-600 dark:text-slate-350">
            {language === 'tr' ? 'Panel / Aboneliklerim' : 'Panel / Subscriptions'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExportReport}
            variant="outline" 
            className="text-xs bg-white dark:bg-slate-900 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>{language === 'tr' ? 'Raporu Aktar' : 'Export Report'}</span>
          </Button>

          <Button 
            onClick={() => setIsModalOpen(true)}
            variant="primary" 
            className="text-xs bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold px-4 py-1.8 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'tr' ? 'Yeni Abonelik Ekle' : 'Add New Subscription'}</span>
          </Button>
        </div>
      </div>

      {/* Title & View Toggle Controls */}
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {language === 'tr' ? 'Tüm Aboneliklerim' : 'All My Subscriptions'}
          </h1>
          <p className="text-xs text-slate-455 dark:text-slate-500 mt-1 font-medium">
            {language === 'tr' ? 'Aktif ve pasif tüm hizmetlerinizin özeti' : 'Summary of all your active and passive services'}
          </p>
        </div>

        {/* View Mode Toggle buttons */}
        <div className="flex bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/80">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>{language === 'tr' ? 'Liste' : 'List'}</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>{language === 'tr' ? 'Izgara' : 'Grid'}</span>
          </button>
        </div>
      </div>

      {/* Advanced filters */}
      <div className="hidden lg:block bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-100 dark:border-slate-800/80 w-full md:w-auto">
            <button
              onClick={() => setFilterTab('all')}
              className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterTab === 'all'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200'
              }`}
            >
              {language === 'tr' ? 'Tüm Abonelikler' : 'All Subscriptions'}
            </button>
            <button
              onClick={() => setFilterTab('personal')}
              className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterTab === 'personal'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200'
              }`}
            >
              {language === 'tr' ? 'Kişisel' : 'Personal'}
            </button>
            <button
              onClick={() => setFilterTab('family')}
              className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterTab === 'family'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200'
              }`}
            >
              {language === 'tr' ? 'Aile Planları' : 'Family Plans'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
            <div className="relative flex items-center bg-slate-50 dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-100 dark:border-slate-850">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'tr' ? 'İsme göre ara...' : 'Search by name...'}
                className="bg-transparent text-xs outline-none text-slate-800 dark:text-slate-255 w-full sm:w-44 placeholder-slate-400 font-medium"
              />
            </div>

            <div className="flex items-center bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-850 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-2" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent outline-none font-semibold text-slate-700 dark:text-slate-350 cursor-pointer"
              >
                <option value="All">{language === 'tr' ? 'Tüm Kategoriler' : 'All Categories'}</option>
                <option value="Entertainment">{t.Entertainment}</option>
                <option value="Productivity">{t.Productivity}</option>
                <option value="Utilities">{t.Utilities}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Only Search & Stats Overview Header (Visible below lg) */}
      <div className="lg:hidden space-y-4">
        {/* Search input matching template style */}
        <div className="relative flex items-center group">
          <span className="material-symbols-outlined absolute left-4 text-slate-400">search</span>
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'tr' ? 'Aboneliklerde ara...' : 'Search subscriptions...'}
            className="w-full bg-slate-100 dark:bg-[#131c35] border border-transparent dark:border-[#232f4e] rounded-xl py-3.5 pl-12 pr-4 text-xs font-semibold focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all shadow-sm text-slate-800 dark:text-slate-200" 
            type="text"
          />
        </div>

        {/* Stats Overview slider matching template */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {/* Card 1: Total Monthly */}
          <div className="bg-[#0f172a] dark:bg-[#dbeafe] text-white dark:text-[#090d1a] p-4 rounded-xl flex-shrink-0 min-w-[170px] shadow-sm">
            <p className="text-[9px] font-bold tracking-widest opacity-80 mb-1">
              {language === 'tr' ? 'AYLIK TOPLAM' : 'TOTAL MONTHLY'}
            </p>
            <p className="text-xl font-black">{currency}{totalMonthlySpend.toFixed(2)}</p>
          </div>
          
          {/* Card 2: Renewing Soon */}
          <div className="bg-white dark:bg-[#131c35] border border-slate-200/50 dark:border-[#232f4e] p-4 rounded-xl flex-shrink-0 min-w-[150px] shadow-xs text-slate-900 dark:text-white">
            <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-1">
              {language === 'tr' ? 'YAKLAŞANLAR' : 'RENEWING SOON'}
            </p>
            <p className="text-xl font-black">3</p>
          </div>
        </div>
      </div>

      {/* Grid Headers (Visible in list view on desktop only) */}
      {viewMode === 'list' && filteredSubs.length > 0 && (
        <div className="hidden lg:grid grid-cols-12 px-6 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase select-none">
          <div className="col-span-5">{language === 'tr' ? 'HİZMET / PLAN' : 'SERVICE / PLAN'}</div>
          <div className="col-span-2 text-center">{language === 'tr' ? 'DURUM' : 'STATUS'}</div>
          <div className="col-span-3 text-center">{language === 'tr' ? 'SIRADAKİ ÖDEME' : 'NEXT BILLING'}</div>
          <div className="col-span-2 text-right">{language === 'tr' ? 'AYLIK ÜCRET' : 'MONTHLY COST'}</div>
        </div>
      )}

      {/* Desktop List/Grid View Container (Visible on lg and above) */}
      <div className="hidden lg:block">
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'}>
          {filteredSubs.length === 0 ? (
            <div className="p-16 text-center space-y-4 bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-900">
              <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold">
                {language === 'tr' ? 'Aradığınız kriterlere uygun abonelik bulunamadı.' : 'No subscriptions match your filter criteria.'}
              </p>
            </div>
          ) : (
            filteredSubs.map((sub: any) => {
              const isPlanActive = sub.status === 'Active';
              return (
                <div 
                  key={sub.id}
                  className={`bg-white dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-xs transition-all hover:border-slate-200 dark:hover:border-slate-800 cursor-pointer flex ${
                    viewMode === 'grid' 
                      ? 'flex-col justify-between h-48 gap-4' 
                      : 'flex-row items-center justify-between gap-4'
                  }`}
                >
                  {/* Left Panel / Top Section: Logo & Name */}
                  <div onClick={() => router.push(`/subscriptions/${sub.id}`)} className={`flex items-center gap-3.5 ${viewMode === 'list' ? 'w-full sm:w-[40%]' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${sub.color}`}>
                      {sub.logo}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs font-black text-slate-850 dark:text-white truncate">{sub.name}</h3>
                        {sub.isFamilyPlan && (
                          <span className="text-[8px] font-extrabold bg-indigo-650/10 text-indigo-600 dark:text-indigo-400 px-1 py-0.2 rounded uppercase tracking-wider shrink-0">
                            {language === 'tr' ? 'Aile' : 'Family'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                        {getPlanDescription(sub.name, sub.category)}
                      </p>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <div className={`flex justify-center ${viewMode === 'list' ? 'hidden sm:flex sm:w-[15%]' : ''}`}>
                    <span className={`text-[9px] font-black px-2.5 py-0.8 rounded-lg tracking-wider uppercase border ${
                      isPlanActive 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                        : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                    }`}>
                      {isPlanActive ? (language === 'tr' ? 'AKTİF' : 'ACTIVE') : (language === 'tr' ? 'PASİF' : 'PASSIVE')}
                    </span>
                  </div>

                  {/* Next Billing Date */}
                  <div className={`flex items-center justify-center gap-1.5 text-xs font-bold ${
                    isPlanActive ? 'text-slate-650 dark:text-slate-350' : 'text-slate-400 dark:text-slate-500'
                  } ${viewMode === 'list' ? 'hidden sm:flex sm:w-[25%]' : ''}`}>
                    {isPlanActive ? (
                      <>
                        <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-550" />
                        <span className="text-[11px] font-semibold">{getFormattedDate(sub.nextBilling)}</span>
                      </>
                    ) : (
                      <span className="text-[11px] font-semibold">{language === 'tr' ? 'İptal Edildi' : 'Canceled'}</span>
                    )}
                  </div>

                  {/* Cost & Chevron Option */}
                  <div className={`flex items-center justify-end gap-4 ${viewMode === 'list' ? 'w-auto sm:w-[20%]' : ''}`}>
                    <span className={`text-sm font-black text-slate-850 dark:text-white ${viewMode === 'list' ? 'hidden sm:inline' : ''}`}>
                      {formatSubPrice(sub.price, sub.currency)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/subscriptions/${sub.id}`);
                        }}
                        className="p-1 text-slate-450 hover:text-slate-900 dark:hover:text-white"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSubscription(sub.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        title={t.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Mobile-Only List View (Visible below lg) */}
      <div className="lg:hidden space-y-3">
        <h2 className="text-sm font-black text-slate-900 dark:text-white mb-2.5">
          {language === 'tr' ? 'Aktif Abonelikler' : 'Active Subscriptions'}
        </h2>
        {filteredSubs.length === 0 ? (
          <div className="p-12 text-center space-y-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900">
            <AlertCircle className="w-8 h-8 text-slate-350 dark:text-slate-700 mx-auto" />
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
              {language === 'tr' ? 'Abonelik bulunamadı.' : 'No subscriptions found.'}
            </p>
          </div>
        ) : (
          filteredSubs.map((sub: any) => {
            const isPlanActive = sub.status === 'Active';
            // Custom brand colors matching the mobile template design
            const bgClass = sub.name.toLowerCase().includes('netflix') 
              ? 'bg-[#E50914]' 
              : sub.name.toLowerCase().includes('spotify') 
              ? 'bg-[#1DB954]' 
              : sub.name.toLowerCase().includes('adobe') 
              ? 'bg-[#FA0F00]' 
              : sub.name.toLowerCase().includes('youtube') 
              ? 'bg-[#FF0000]' 
              : sub.name.toLowerCase().includes('notion') 
              ? 'bg-black' 
              : sub.color || 'bg-slate-900';

            return (
              <div 
                key={sub.id} 
                onClick={() => router.push(`/subscriptions/${sub.id}`)}
                className="subscription-card bg-white dark:bg-[#131c35] border border-slate-150/60 dark:border-[#232f4e] p-4 rounded-xl flex items-center justify-between shadow-xs active:scale-[0.98] transition-transform duration-100 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center p-2 text-white font-extrabold text-sm shrink-0 ${bgClass}`}>
                    {sub.logo || sub.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white leading-tight">{sub.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="px-2 py-0.5 bg-slate-50 dark:bg-[#1d294d] text-slate-500 dark:text-slate-350 text-[8px] font-black rounded-full uppercase tracking-wider">
                        {t[sub.category as keyof typeof t] || sub.category}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-none">
                        • {sub.isFamilyPlan ? (language === 'tr' ? 'Aile' : 'Family') : (language === 'tr' ? 'Kişisel' : 'Individual')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    {formatSubPrice(sub.price, sub.currency)}
                  </p>
                  <p className={`text-[10px] mt-0.5 font-bold ${isPlanActive ? 'text-slate-400 dark:text-slate-500' : 'text-rose-500'}`}>
                    {isPlanActive 
                      ? (language === 'tr' ? `Kalan: ${getFormattedDate(sub.nextBilling)}` : `Due: ${getFormattedDate(sub.nextBilling)}`) 
                      : (language === 'tr' ? 'Süresi Doldu' : 'Expired')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mobile Floating Action Button */}
      <div className="lg:hidden fixed bottom-20 right-6 z-40">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Desktop-Only Bottom Summary Boxes */}
      <div className="hidden lg:grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-900">
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-xs flex flex-col justify-between gap-3 relative overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] w-20 h-20 bg-indigo-500/5 rounded-full blur-xl"></div>
          <span className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
            {language === 'tr' ? 'TOPLAM AKTİF' : 'TOTAL ACTIVE'}
          </span>
          <div>
            <p className="text-lg font-black text-slate-850 dark:text-white">
              {activeCount} {language === 'tr' ? 'Abonelik' : 'Subscriptions'}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-1 font-semibold">
              +{passiveCount} {language === 'tr' ? 'Pasif üyelik' : 'Passive memberships'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-xs flex flex-col justify-between gap-3 relative overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] w-20 h-20 bg-emerald-500/5 rounded-full blur-xl"></div>
          <span className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
            {language === 'tr' ? 'AYLIK HARCAMA' : 'MONTHLY SPEND'}
          </span>
          <div>
            <p className="text-lg font-black text-slate-850 dark:text-white">
              {currency}{totalMonthlySpend.toFixed(2)}
            </p>
            <p className="text-[10px] text-emerald-500 mt-1 font-extrabold flex items-center gap-1">
              <span>~</span>
              <span>{language === 'tr' ? 'Geçen aya göre %12 azaldı' : 'Decreased by 12% from last month'}</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-xs flex flex-col justify-between gap-3 relative overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] w-20 h-20 bg-amber-500/5 rounded-full blur-xl"></div>
          <span className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
            {language === 'tr' ? 'SIRADAKİ ÖDEME' : 'NEXT PAYMENT'}
          </span>
          <div>
            <p className="text-lg font-black text-slate-850 dark:text-white truncate">
              {nextPaymentDateStr}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-1 font-semibold truncate">
              {nextPaymentSub ? nextPaymentSub.name : (language === 'tr' ? 'Yaklaşan ödeme yok' : 'No upcoming payments')}
            </p>
          </div>
        </div>
      </div>

      {/* Add Subscription Modal Dialog */}
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
                  placeholder="e.g. Spotify, Netflix"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase">
                    {language === 'tr' ? 'Ücret (Aylık)' : 'Cost (Monthly)'}
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={newSubPrice}
                    onChange={(e) => setNewSubPrice(e.target.value)}
                    placeholder="e.g. 14.99"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <label className="text-xs font-bold text-slate-455 dark:text-slate-500 uppercase">
                    {language === 'tr' ? 'Para Birimi' : 'Currency'}
                  </label>
                  <select
                    value={newSubCurrency}
                    onChange={(e) => setNewSubCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/60 text-slate-855 dark:text-slate-100 focus:outline-none dark:bg-slate-950"
                  >
                    <option className="dark:bg-slate-950 dark:text-white" value="TRY">TRY (₺)</option>
                    <option className="dark:bg-slate-950 dark:text-white" value="USD">USD ($)</option>
                    <option className="dark:bg-slate-950 dark:text-white" value="EUR">EUR (€)</option>
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
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/60 text-slate-855 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors dark:bg-slate-950"
                >
                  <option className="dark:bg-slate-950 dark:text-white" value="Entertainment">{t.Entertainment}</option>
                  <option className="dark:bg-slate-950 dark:text-white" value="Productivity">{t.Productivity}</option>
                  <option className="dark:bg-slate-950 dark:text-white" value="Utilities">{t.Utilities}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase flex items-center gap-1">
                  <span>{language === 'tr' ? 'Başlangıç / Fatura Tarihi' : 'Start / Billing Date'}</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <input 
                  type="date" 
                  required
                  value={newSubDate}
                  onChange={(e) => setNewSubDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-455 dark:text-slate-550 uppercase">
                  {t.status}
                </label>
                <select 
                  value={newSubStatus}
                  onChange={(e) => setNewSubStatus(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/60 text-slate-855 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors dark:bg-slate-950"
                >
                  <option className="dark:bg-slate-950 dark:text-white" value="Active">{t.active}</option>
                  <option className="dark:bg-slate-950 dark:text-white" value="Pending">{t.pending}</option>
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
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/60 text-slate-855 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
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
