"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Mail, UserMinus, Settings,
  Send, Sparkles, CheckCircle2, Clock, RefreshCw, X, AlertCircle, BellRing
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/lib/translations';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useUserStore } from '@/store/useUserStore';
import { useFamilyStore } from '@/store/useFamilyStore';

// Initial Mock Members Data for default Spotify Family
const initialMembersMap: Record<string, { id: number; name: string; email: string; role: string; status: string; avatar: string }[]> = {
  'spotify-family': [
    { id: 1, name: 'Alex Johnson', email: 'alex@example.com', role: 'Owner', status: 'Active', avatar: 'https://i.pravatar.cc/150?img=12' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', role: 'Admin', status: 'Active', avatar: 'https://i.pravatar.cc/150?img=47' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'Member', status: 'Pending', avatar: '' },
  ],
  'default': [
    { id: 1, name: 'Alex Johnson', email: 'alex@example.com', role: 'Owner', status: 'Active', avatar: 'https://i.pravatar.cc/150?img=12' }
  ]
};

export default function FamilyPlanPage() {
  const { language } = useLanguageStore();
  const t = translations[language];
  const currency = language === 'tr' ? '₺' : '$';

  // Fetch family subscriptions from store
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const familySubs = subscriptions.filter(sub => sub.isFamilyPlan);

  // Selected Family Subscription State
  const [selectedSubId, setSelectedSubId] = useState<string>(familySubs[0]?.id || '');
  
  // Track members per family plan persistently
  const membersMap = useFamilyStore((state) => state.membersMap);
  const addMember = useFamilyStore((state) => state.addMember);
  const removeMember = useFamilyStore((state) => state.removeMember);
  const togglePayment = useFamilyStore((state) => state.togglePayment);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [invitePaidAmount, setInvitePaidAmount] = useState('');

  // Rolling last 4 months dynamically
  const getRollingMonths = () => {
    const months = [];
    const date = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const label = d.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { month: 'short' });
      months.push(label);
    }
    return months;
  };
  const rollingMonths = getRollingMonths();
  
  // Loader & Toast states
  const [inviteLoading, setInviteLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [invitePreviewUrl, setInvitePreviewUrl] = useState<string | null>(null);
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  const user = useUserStore((state) => state.user);
  const notifications = useUserStore((state) => state.notifications);

  const handleSendReminder = async (member: any) => {
    const shareCost = (activeSub?.price || 0) / Math.max(1, members.length);
    const costText = `${currency}${(shareCost * (language === 'tr' ? 6 : 1)).toFixed(2)}`;
    const message = language === 'tr'
      ? `Merhaba ${member.name}, ${activeSub?.name || 'Shared'} Aile Planı ödemenizi (${costText}) henüz yapmadınız. Bilginize.`
      : `Hi ${member.name}, you haven't made your payment (${costText}) for the ${activeSub?.name || 'Shared'} Family Plan yet. Thank you.`;

    try {
      await navigator.clipboard.writeText(message);
    } catch (err) {
      console.error('Clipboard copy error:', err);
    }

    let telegramSent = false;
    if (notifications.telegramActive && notifications.telegramToken && notifications.telegramChatId) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        await fetch(`${baseUrl}/api/telegram/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `🔔 *ÖDEME HATIRLATMASI*\n\n${message}`,
            botToken: notifications.telegramToken,
            chatId: notifications.telegramChatId
          })
        });
        telegramSent = true;
      } catch (tgErr) {
        console.error('Telegram notification error:', tgErr);
      }
    }

    const toastMsg = language === 'tr'
      ? `Hatırlatma kopyalandı!${telegramSent ? ' (Telegram ile botunuza iletildi)' : ''}`
      : `Reminder copied!${telegramSent ? ' (Also sent to Telegram)' : ''}`;
    
    setReminderToast(toastMsg);
    setTimeout(() => setReminderToast(null), 4000);
  };

  // If selected sub was deleted, reset selected sub ID
  const activeSub = familySubs.find(sub => sub.id === selectedSubId) || familySubs[0];
  const currentSubId = activeSub?.id || 'default';
  const members = membersMap[currentSubId] || initialMembersMap['default'];

  const totalSeats = 6;
  const occupiedSeats = members.length;
  const freeSeats = Math.max(0, totalSeats - occupiedSeats);

  // Seat occupancy data for Recharts Pie
  const seatData = [
    { name: 'Occupied', value: occupiedSeats, color: '#6366f1' },
    { name: 'Available', value: freeSeats, color: '#e2e8f0' }
  ];

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    const amount = parseFloat(invitePaidAmount) || 0;
    const namePart = inviteEmail.split('@')[0];
    const newMemberName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    
    // Save member persistently to useFamilyStore with empty payments object
    addMember(currentSubId, {
      name: newMemberName,
      email: inviteEmail,
      role: inviteRole,
      status: 'Active',
      avatar: '',
      payments: {}
    });

    setInviteEmail('');
    setInvitePaidAmount('');
    setShowToast(true);
    
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const handleRemove = (id: number) => {
    removeMember(currentSubId, id);
    setActiveMenu(null);
  };

  const getRoleLabel = (role: string) => {
    if (role === 'Owner') return t.owner;
    if (role === 'Admin') return t.admin;
    return t.member;
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t.familyPlanDetails}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.familyPlanDescription}</p>
        </div>

        {/* Family Plan Selector if multiple family plans exist */}
        {familySubs.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              {language === 'tr' ? 'Aktif Plan Seçin:' : 'Select Active Plan:'}
            </span>
            <select
              value={selectedSubId}
              onChange={(e) => setSelectedSubId(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              {familySubs.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {familySubs.length === 0 ? (
        /* Empty State when no family plans are registered */
        <div className="bg-white dark:bg-slate-950 p-12 rounded-3xl border border-slate-100 dark:border-slate-900 shadow-sm text-center max-w-xl mx-auto space-y-5 animate-in fade-in duration-200">
          <AlertCircle className="w-12 h-12 text-indigo-500 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {language === 'tr' ? 'Kayıtlı Aile Planı Bulunmamaktadır' : 'No Family Plan Subscriptions Found'}
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 leading-relaxed">
              {language === 'tr' 
                ? 'Aile Planı üyelerini yönetmek için öncelikle Kontrol Paneli üzerinden "Aile Planı Aboneliği" seçeneğini işaretleyerek bir abonelik eklemelisiniz.' 
                : 'To manage family members, first add a subscription from the Dashboard and check the "Family Plan Subscription" option.'}
            </p>
          </div>
        </div>
      ) : (
        /* Main Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Member List & Invite Form */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Members Card list */}
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t.sharedPlanMembers}</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{t.currentlyOccupying}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  {activeSub?.name || 'Shared Family Plan'}
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-900">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between px-3 sm:px-6 py-4 hover:bg-slate-55/30 dark:hover:bg-slate-900/10 transition-colors gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
                      {/* Profile avatar / initials */}
                      {member.avatar ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-slate-100 dark:ring-slate-900 shrink-0">
                          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center font-bold text-sm text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shrink-0">
                          {member.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{member.name}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            member.role === 'Owner' 
                              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600' 
                              : member.role === 'Admin'
                              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                          }`}>
                            {getRoleLabel(member.role)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                          <Mail size={12} className="shrink-0" /> <span className="truncate">{member.email}</span>
                        </p>
                        <p className="text-[10px] text-indigo-650 dark:text-indigo-400 font-bold mt-1.5 flex items-center gap-1 flex-wrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0"></span>
                          <span>{language === 'tr' ? 'Payı:' : 'Share:'} {currency}{( (activeSub?.price || 0) / Math.max(1, members.length) * (language === 'tr' ? 6 : 1) ).toFixed(2)}</span>
                        </p>

                        {/* Monthly Payment Checklist Tracker */}
                        <div className="flex flex-wrap items-center gap-1 mt-2 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-100 dark:border-slate-800/60 w-fit">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 mr-0.5 hidden xs:inline">
                            {language === 'tr' ? 'Takip:' : 'Track:'}
                          </span>
                          {rollingMonths.map((month) => {
                            const isPaid = member.payments?.[month] ?? false;
                            return (
                              <button
                                key={month}
                                onClick={() => togglePayment(currentSubId, member.id, month)}
                                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded transition-all ${
                                  isPaid 
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-100 dark:border-emerald-500/20' 
                                    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-450 border-rose-100/50 dark:border-rose-500/25'
                                }`}
                              >
                                {month.slice(0, 3)} {isPaid ? '✓' : '✗'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-6 relative shrink-0">
                      {/* Remind button */}
                      {member.role !== 'Owner' && (
                        <button
                          onClick={() => handleSendReminder(member)}
                          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/40 text-indigo-650 dark:text-indigo-400 rounded-lg border border-indigo-100/50 dark:border-indigo-800/60 transition-all active:scale-95 shrink-0"
                          title={language === 'tr' ? 'Ödeme Hatırlatması Gönder' : 'Send Payment Reminder'}
                        >
                          <BellRing className="w-3.5 h-3.5" />
                          <span className="hidden xs:inline">{language === 'tr' ? 'Hatırlat' : 'Remind'}</span>
                        </button>
                      )}
                      
                      {/* Status badge */}
                      <div className="flex items-center gap-1">
                        <span className={`sm:hidden w-2.5 h-2.5 rounded-full shrink-0 ${member.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} title={member.status}></span>
                        <div className="hidden sm:flex items-center gap-1">
                          {member.status === 'Active' ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {t.active}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-lg">
                              <Clock className="w-3.5 h-3.5" /> {t.pending}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action dropdown */}
                      {member.role !== 'Owner' && (
                        <div>
                          <button 
                            onClick={() => setActiveMenu(activeMenu === member.id ? null : member.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          {activeMenu === member.id && (
                            <div className="absolute right-0 top-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-lg py-1.5 w-32 z-50 text-left">
                              <button className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                                {t.changeRole}
                              </button>
                              <button 
                                onClick={() => handleRemove(member.id)}
                                className="w-full text-left px-4 py-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/20 flex items-center gap-1.5"
                              >
                                <UserMinus className="w-3.5 h-3.5" /> {t.remove}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Member Form */}
            <div className="bg-white dark:bg-slate-955 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                {language === 'tr' ? 'Yeni Üye Ekle' : 'Add New Member'}
              </h3>
              <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-1.5 w-full">
                  <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {language === 'tr' ? 'E-posta Adresi / Kullanıcı Adı' : 'Email Address / Username'}
                  </label>
                  <input 
                    type="text" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="name@family.com" 
                    className="w-full px-4 py-2 text-sm rounded-xl border border-slate-155 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5 w-full md:w-48">
                  <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">{t.role}</label>
                  <select 
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2.2 text-sm rounded-xl border border-slate-155 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="Member">{t.member}</option>
                    <option value="Admin">{t.admin}</option>
                  </select>
                </div>
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="text-xs px-6 py-2.5 h-10 w-full md:w-auto shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  {language === 'tr' ? 'Üye Ekle' : 'Add Member'}
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column: Seat Capacity & Billing Details */}
          <div className="space-y-8 col-span-1">
            
            {/* Seat Capacity Card */}
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm flex flex-col items-center text-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{t.planCapacity}</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-6">{t.slotsDescription}</p>
              
              <div className="w-40 h-40 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={seatData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {seatData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-slate-900 dark:text-white">{occupiedSeats}/{totalSeats}</span>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{t.occupied}</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex gap-6 mt-6 text-xs w-full justify-center">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-350">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-600"></span>
                  <span>{occupiedSeats} {t.occupied}</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-slate-400 dark:text-slate-500">
                  <span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-slate-800"></span>
                  <span>{freeSeats} {t.available}</span>
                </div>
              </div>
            </div>

            {/* Dynamic billing details */}
            <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
              {/* background vector highlights */}
              <div className="absolute top-[-30px] right-[-30px] w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span className="text-[10px] font-extrabold tracking-widest uppercase text-indigo-200">{t.billingPeriod}</span>
                </div>
                <div>
                  <p className="text-2xl font-black">{currency}{(activeSub?.price * (language === 'tr' ? 6 : 1)).toFixed(2) || '0.00'}</p>
                  <p className="text-[10px] text-indigo-200 mt-1">
                    {language === 'tr' ? 'Sonraki yenileme tarihi:' : 'Next renewal date:'} <span className="font-bold">{activeSub?.nextBilling ? new Date(activeSub.nextBilling).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span>
                  </p>
                </div>
                <div className="pt-2 border-t border-white/20 space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-indigo-100">
                    <span>{language === 'tr' ? 'Kişi Başına Düşen Pay:' : 'Per Person Share:'}</span>
                    <span>{currency}{( ((activeSub?.price || 0) / Math.max(1, members.length)) * (language === 'tr' ? 6 : 1) ).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-indigo-100">
                    <span>{language === 'tr' ? 'Ortakların Toplam Payı:' : 'Partners Total Share:'}</span>
                    <span>{currency}{( (((activeSub?.price || 0) / Math.max(1, members.length)) * (members.length - 1)) * (language === 'tr' ? 6 : 1) ).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-indigo-100">
                    <span>{language === 'tr' ? 'Sizin Kalan Payınız:' : 'Your Remaining Share:'}</span>
                    <span>{currency}{( ((activeSub?.price || 0) / Math.max(1, members.length)) * (language === 'tr' ? 6 : 1) ).toFixed(2)}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <span className="inline-block text-[10px] font-bold bg-white/10 px-3 py-1 rounded-lg border border-white/15">
                    {activeSub?.status === 'Active' ? t.active : activeSub?.status === 'Past Due' ? t.pastDue : t.canceled}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Success Toast Alert */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-955 bg-white dark:bg-slate-950 text-white p-4 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-800 animate-in slide-in-from-bottom duration-300 z-50 max-w-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="text-xs flex-1">
            <p className="font-bold">{language === 'tr' ? 'Üye Başarıyla Eklendi!' : 'Member Added Successfully!'}</p>
            <p className="opacity-80 mt-0.5">{language === 'tr' ? 'Yeni üye ödeme payı ile birlikte listeye kaydedildi.' : 'New member has been saved to the list with their payment share.'}</p>
          </div>
        </div>
      )}

      {/* Reminder Toast Alert */}
      {reminderToast && (
        <div className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-bottom duration-300 z-50 max-w-sm font-semibold border border-indigo-500">
          <BellRing className="w-5 h-5 text-indigo-200 shrink-0 animate-bounce" />
          <span className="text-xs">{reminderToast}</span>
        </div>
      )}

    </div>
  );
}
