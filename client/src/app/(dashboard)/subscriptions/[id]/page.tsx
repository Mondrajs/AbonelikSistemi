"use client";
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { 
  Calendar, CreditCard, ExternalLink, AlertCircle, 
  Trash2, Sliders, CheckCircle2, Receipt, Activity, X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/lib/translations';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';

// Mock Usage Data
const usageData = [
  { day: 'Mon', hours: 2.5 },
  { day: 'Tue', hours: 4.0 },
  { day: 'Wed', hours: 1.8 },
  { day: 'Thu', hours: 3.2 },
  { day: 'Fri', hours: 5.0 },
  { day: 'Sat', hours: 6.2 },
  { day: 'Sun', hours: 4.5 },
];

export default function SubscriptionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { language } = useLanguageStore();
  const t = translations[language];

  // Store Selectors
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const updateSubscription = useSubscriptionStore((state) => state.updateSubscription);
  const cancelSubscription = useSubscriptionStore((state) => state.cancelSubscription);
  const deleteSubscription = useSubscriptionStore((state) => state.deleteSubscription);

  // Find subscription
  const sub = subscriptions.find((item) => item.id === id);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editFeatures, setEditFeatures] = useState('');

  if (!sub) {
    return (
      <div className="space-y-6 text-center py-16">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {language === 'tr' ? 'Abonelik Bulunamadı' : 'Subscription Not Found'}
        </h2>
        <Button variant="primary" onClick={() => router.push('/')} className="text-xs">
          {language === 'tr' ? 'Dashboard\'a Dön' : 'Return to Dashboard'}
        </Button>
      </div>
    );
  }

  // Open Edit Modal and prefill data
  const handleOpenEditModal = () => {
    setEditName(sub.name);
    setEditPrice(sub.price.toString());
    setEditCategory(sub.category);
    setEditDate(sub.nextBilling);
    setEditStatus(sub.status);
    setEditFeatures(sub.features.join(', '));
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    updateSubscription(sub.id, {
      name: editName,
      price: priceNum,
      category: editCategory,
      nextBilling: editDate,
      status: editStatus,
      features: editFeatures.split(',').map(f => f.trim()).filter(f => f.length > 0)
    });
    setIsEditModalOpen(false);
  };

  const handleCancelClick = () => {
    cancelSubscription(sub.id);
  };

  const handleDeleteClick = () => {
    deleteSubscription(sub.id);
    router.push('/');
  };

  // Mock Invoice history dynamic price matching
  const invoices = [
    { id: 'INV-0294', date: 'Sep 24, 2026', amount: `$${sub.price.toFixed(2)}`, status: sub.status === 'Past Due' ? 'Unpaid' : 'Paid' },
    { id: 'INV-0182', date: 'Aug 24, 2026', amount: `$${sub.price.toFixed(2)}`, status: 'Paid' },
    { id: 'INV-0074', date: 'Jul 24, 2026', amount: `$${sub.price.toFixed(2)}`, status: 'Paid' },
  ];

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-150">
      
      {/* Banner / Header Card */}
      <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-900 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-extrabold shadow-lg ${sub.color} select-none shrink-0`}>
            {sub.logo}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white">{sub.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                sub.status === 'Active' 
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : sub.status === 'Past Due'
                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> 
                {sub.status === 'Active' ? t.active : sub.status === 'Past Due' ? t.pending : (language === 'tr' ? 'İptal Edildi' : 'Canceled')}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
              Category: {t[sub.category as keyof typeof t] || sub.category} • <span className="text-indigo-600 font-medium">SubManager Premium Plan</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {sub.status !== 'Canceled' && (
            <Button 
              variant="secondary" 
              onClick={handleCancelClick}
              className="text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> {t.cancelPlan}
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={handleDeleteClick}
            className="text-xs border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-500 hover:border-rose-200"
          >
            {language === 'tr' ? 'Aboneliği Sil' : 'Delete Subscription'}
          </Button>
          <Button 
            variant="primary" 
            onClick={handleOpenEditModal}
            className="text-xs gap-1.5 shadow-lg shadow-indigo-600/15"
          >
            <Sliders className="w-4 h-4" /> {t.editPlan}
          </Button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Billing Details & Invoice Logs */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Billing info cards */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">{t.paymentSource}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-100 dark:border-slate-800 shrink-0">
                  <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">{t.paymentSource}</p>
                  <p className="text-sm font-bold text-slate-850 dark:text-slate-200 mt-1">{t.visaGoldCard}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{t.expires}: 12/28</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-100 dark:border-slate-800 shrink-0">
                  <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">{t.billingHistory}</p>
                  <p className="text-sm font-bold text-slate-850 dark:text-slate-200 mt-1">${sub.price.toFixed(2)} / month</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{t.nextBilling}: {sub.nextBilling}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Plan features / specifications */}
          {sub.features && sub.features.length > 0 && (
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'tr' ? 'Paket Özellikleri ve Limitler' : 'Plan Features & Limits'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sub.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-900 text-xs font-semibold text-slate-750 dark:text-slate-350">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoice Receipt list */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.billingHistory}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">{t.invoicesAndReceipts}</p>
              </div>
              <Button variant="outline" className="text-xs">{t.exportAll}</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/20 text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase">
                    <th className="px-6 py-3.5">{t.invoiceId}</th>
                    <th className="px-6 py-3.5">{t.billingDate}</th>
                    <th className="px-6 py-3.5">{t.amount}</th>
                    <th className="px-6 py-3.5">{t.status}</th>
                    <th className="px-6 py-3.5 text-right">{t.receipt}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">
                        {inv.id}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {inv.date}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-850 dark:text-slate-200">
                        {inv.amount}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600'
                        }`}>
                          {inv.status === 'Paid' ? t.active : (language === 'tr' ? 'Ödenmedi' : 'Unpaid')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Download invoice pdf">
                          <Receipt className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column - Usage stats Activity */}
        <div className="space-y-8">
          
          {/* usage chart card */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.activityOverview}</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{t.avgUsageThisWeek}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-100 dark:border-slate-900">
                <Activity className="w-4 h-4" />
              </div>
            </div>

            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageData} margin={{ top: 10, right: 0, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} className="dark:stroke-slate-900" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#f8fafc', fontSize: '11px' }}
                  />
                  <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* info banner */}
          <div className="bg-gradient-to-br from-indigo-900/10 via-indigo-950/5 to-transparent border border-indigo-100/50 dark:border-indigo-950 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t.autorenewOption}</h4>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.autorenewDescription}
            </p>
          </div>

        </div>

      </div>

      {/* Edit Plan Modal Dialog */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-6 top-6 p-1.5 rounded-xl text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                {language === 'tr' ? 'Plan Detaylarını Düzenle' : 'Edit Plan Details'}
              </h3>
              <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">
                {language === 'tr' ? 'Abonelik planının parametrelerini ve özelliklerini güncelleyin.' : 'Update parameters and feature configurations for this subscription.'}
              </p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">{t.subscriptionName}</label>
                  <input 
                    type="text" 
                    required 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-150 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">{t.price}</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-150 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">{t.category}</label>
                  <select 
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-150 focus:outline-none"
                  >
                    <option value="Entertainment">{t.Entertainment}</option>
                    <option value="Productivity">{t.Productivity}</option>
                    <option value="Utilities">{t.Utilities}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">{language === 'tr' ? 'Durum' : 'Status'}</label>
                  <select 
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-150 focus:outline-none"
                  >
                    <option value="Active">{t.active}</option>
                    <option value="Past Due">{t.pending}</option>
                    <option value="Canceled">{language === 'tr' ? 'İptal Edildi' : 'Canceled'}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">{t.nextBilling}</label>
                <input 
                  type="date" 
                  required 
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-150 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {language === 'tr' ? 'Paket Özellikleri (Virgülle Ayırın)' : 'Plan Features (Comma Separated)'}
                </label>
                <textarea 
                  value={editFeatures}
                  onChange={(e) => setEditFeatures(e.target.value)}
                  placeholder="e.g. 4K Streaming, 4 Devices, Offline Mode"
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-150 focus:outline-none min-h-[60px]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3.5">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-xs"
                >
                  {language === 'tr' ? 'İptal' : 'Cancel'}
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="text-xs shadow-lg shadow-indigo-600/10 px-5"
                >
                  {language === 'tr' ? 'Değişiklikleri Kaydet' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
