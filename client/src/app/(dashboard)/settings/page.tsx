"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  User, Bell, Shield, Camera, 
  CheckCircle2, Mail, Lock,
  Send, AlertCircle, Sparkles, Sun, Moon, Upload, Trash2, Wallet
} from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/lib/translations';
import { useUserStore } from '@/store/useUserStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { language } = useLanguageStore();
  const t = translations[language];
  const { theme, setTheme } = useTheme();

  // User store actions and states
  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);
  const notifications = useUserStore((state) => state.notifications);
  const updateNotifications = useUserStore((state) => state.updateNotifications);
  
  // Subscription store to check upcoming alerts
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);

  const [activeTab, setActiveTab] = useState('profile');
  const [activeMobileTab, setActiveMobileTab] = useState<string | null>(null);
  
  // Local profile inputs
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar);
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync inputs if store user changes
  useEffect(() => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setAvatarUrl(user.avatar);
  }, [user]);

  // Handle local File Upload and convert to Base64 data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAvatar = () => {
    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName + ' ' + lastName)}`;
    setAvatarUrl(defaultAvatar);
  };

  // Telegram test status
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  // Email test status & preview states
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [emailPreviewUrl, setEmailPreviewUrl] = useState<string | null>(null);

  // Automation Check States
  const [checkStatus, setCheckStatus] = useState<'idle' | 'checking' | 'completed' | 'error'>('idle');
  const [checkLogs, setCheckLogs] = useState<string[]>([]);
  const [checkPreviewLink, setCheckPreviewLink] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ firstName, lastName, email, avatar: avatarUrl });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTestTelegram = async () => {
    if (!notifications.telegramToken || !notifications.telegramChatId) {
      setTelegramStatus('error');
      return;
    }
    setTelegramStatus('sending');
    try {
      const res = await fetch(`https://api.telegram.org/bot${notifications.telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: notifications.telegramChatId,
          text: language === 'tr' 
            ? "🔔 SubManager Test Bildirimi: Telegram entegrasyonu başarıyla kuruldu! 🚀" 
            : "🔔 SubManager Test Alert: Telegram integration configured successfully! 🚀"
        })
      });
      if (res.ok) {
        setTelegramStatus('success');
      } else {
        setTelegramStatus('error');
      }
    } catch (e) {
      setTelegramStatus('error');
    }
    setTimeout(() => setTelegramStatus('idle'), 4000);
  };

  // Single test mail dispatch
  const handleTestEmail = async () => {
    const target = notifications.emailTarget || user.email;
    if (!target) {
      setEmailStatus('error');
      return;
    }
    setEmailStatus('sending');
    setEmailPreviewUrl(null);

    try {
      const response = await fetch('http://localhost:5000/api/email/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: target,
          subName: 'Spotify Premium',
          daysRemaining: notifications.emailDaysBefore || 3,
          price: language === 'tr' ? '₺59.99' : '$9.99',
          smtpConfig: {
            host: notifications.smtpHost,
            port: notifications.smtpPort,
            user: notifications.smtpUser,
            pass: notifications.smtpPass
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEmailStatus('success');
        if (data.previewUrl) {
          setEmailPreviewUrl(data.previewUrl);
        }
      } else {
        setEmailStatus('error');
      }
    } catch (e) {
      setEmailStatus('error');
    }
    
    setTimeout(() => {
      if (!emailPreviewUrl) {
        setEmailStatus('idle');
      }
    }, 6000);
  };

  // Automated Alert Check over all active subscriptions (Cron simulation)
  const handleRunAlertsCheck = async () => {
    setCheckStatus('checking');
    setCheckLogs([]);
    setCheckPreviewLink(null);

    const target = notifications.emailTarget || user.email;
    if (!target) {
      setCheckStatus('error');
      setCheckLogs([language === 'tr' ? 'Hata: Alıcı e-posta adresi belirlenmemiş!' : 'Error: No recipient email address specified!']);
      return;
    }

    const activeSubs = subscriptions.filter(sub => sub.status === 'Active' && !sub.isFamilyPlan);
    if (activeSubs.length === 0) {
      setCheckStatus('completed');
      setCheckLogs([language === 'tr' ? 'Kontrol tamamlandı: Aktif bireysel abonelik bulunamadı.' : 'Check complete: No active individual subscriptions found.']);
      return;
    }

    const logs: string[] = [];
    let alertsSent = 0;
    let etherealUrl: string | null = null;

    for (const sub of activeSubs) {
      const diffTime = new Date(sub.nextBilling).getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      logs.push(
        language === 'tr'
          ? `${sub.name}: Yenilemeye ${diffDays} gün kaldı (Bildirim eşiği: ${notifications.emailDaysBefore} gün)`
          : `${sub.name}: ${diffDays} days remaining (Notification threshold: ${notifications.emailDaysBefore} days)`
      );

      // Trigger reminder if remaining days are equal or closer to the configured days offset
      if (diffDays > 0 && diffDays <= notifications.emailDaysBefore) {
        logs.push(language === 'tr' ? `↳ 🔔 ${sub.name} için fatura uyarısı gönderiliyor...` : `↳ 🔔 Dispatching billing alert for ${sub.name}...`);
        
        try {
          const res = await fetch('http://localhost:5000/api/email/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: target,
              subName: sub.name,
              daysRemaining: diffDays,
              price: language === 'tr' ? `₺${(sub.price * 6).toFixed(2)}` : `$${sub.price.toFixed(2)}`,
              smtpConfig: {
                host: notifications.smtpHost,
                port: notifications.smtpPort,
                user: notifications.smtpUser,
                pass: notifications.smtpPass
              }
            })
          });

          if (res.ok) {
            const data = await res.json();
            alertsSent++;
            if (data.previewUrl) {
              etherealUrl = data.previewUrl;
            }
            logs.push(language === 'tr' ? `   ✓ E-posta başarıyla gönderildi!` : `   ✓ Email sent successfully!`);
          } else {
            logs.push(language === 'tr' ? `   ⚠ Gönderim başarısız oldu.` : `   ⚠ Dispatch failed.`);
          }
        } catch (e) {
          logs.push(language === 'tr' ? `   ⚠ Bağlantı hatası.` : `   ⚠ Connection error.`);
        }
      }
    }

    setCheckLogs(logs);
    setCheckStatus('completed');
    if (etherealUrl) {
      setCheckPreviewLink(etherealUrl);
    }
  };

  const tabs = [
    { id: 'profile', label: t.profileSettings, icon: User },
    { id: 'notifications', label: t.notifications, icon: Bell },
    { id: 'currency', label: language === 'tr' ? 'Bütçe & Para Birimi' : 'Budget & Currency', icon: Wallet },
    { id: 'security', label: t.securityAndAccess, icon: Shield },
  ];

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="hidden lg:block">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t.settingsAndPreferences}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.settingsDescription}</p>
      </div>

      {/* Main Container Grid */}
      <div className="hidden lg:grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Left Side: Tabs Menu */}
        <div className="md:col-span-1 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isTabActive 
                    ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100/10' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-55 dark:hover:bg-slate-900/60 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Tab Contents Panel */}
        <div className="md:col-span-3">
          
          {activeTab === 'profile' && (
            <div className="space-y-8">
              {/* Profile Card details */}
              <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm space-y-8">
                
                {/* Profile Avatar Card with Real Base64 uploader */}
                <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-50 dark:border-slate-900">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-slate-100 dark:ring-slate-900 shrink-0 bg-slate-105">
                    <img src={avatarUrl} alt="User avatar profile" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={triggerFileInput}
                      className="absolute inset-0 bg-black/45 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity" 
                      title={language === 'tr' ? 'Fotoğraf Yükle' : 'Upload Photo'}
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Hidden File Input */}
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="text-center sm:text-left space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {language === 'tr' ? 'Profil Fotoğrafınızı Yükleyin' : 'Upload Your Profile Photo'}
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-sm leading-relaxed">
                      {language === 'tr' 
                        ? 'Yerel cihazınızdan kendi resminizi yükleyin. Yüklenen görsel tüm sayfalarda aktif olur.' 
                        : 'Upload your own image from your local device. The uploaded avatar syncs across all pages.'}
                    </p>
                    <div className="flex gap-2 mt-2 justify-center sm:justify-start">
                      <Button 
                        type="button" 
                        onClick={triggerFileInput} 
                        variant="outline" 
                        className="text-[9px] py-1 px-3.5 border-slate-200 dark:border-slate-800 flex items-center gap-1 font-bold"
                      >
                        <Upload className="w-3 h-3 text-slate-400" />
                        {language === 'tr' ? 'Yeni Resim Seç' : 'Choose Image'}
                      </Button>
                      <button 
                        type="button" 
                        onClick={handleRemoveAvatar}
                        className="text-[9px] text-slate-400 hover:text-rose-500 font-extrabold px-2 py-1 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        {language === 'tr' ? 'Temizle' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">{t.firstName}</label>
                      <input 
                        type="text" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-150 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">{t.lastName}</label>
                      <input 
                        type="text" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-150 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">{t.emailAddress}</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-150 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <Button type="submit" variant="primary" className="text-xs shadow-lg shadow-indigo-600/15 px-6">
                      {t.saveDetails}
                    </Button>
                    {saved && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> {t.changesSaved}
                      </span>
                    )}
                  </div>
                </form>
              </div>

              {/* Appearance / Theme Settings Panel */}
              <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm space-y-4">
                <div>
                  <h3 className="text-xs font-black text-slate-455 dark:text-slate-400 uppercase tracking-widest">
                    {language === 'tr' ? 'Görünüm ve Tema Ayarları' : 'Appearance & Theme Settings'}
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {language === 'tr' ? 'Uygulamanın renk temasını değiştirin.' : 'Switch between light and dark theme mode.'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex-1 py-3.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      theme === 'light'
                        ? 'border-indigo-650 bg-indigo-50/20 text-indigo-650 dark:text-indigo-400 dark:bg-indigo-500/10'
                        : 'border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>{language === 'tr' ? 'Açık Tema' : 'Light Mode'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex-1 py-3.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      theme === 'dark'
                        ? 'border-indigo-650 bg-indigo-50/20 text-indigo-650 dark:text-indigo-400 dark:bg-indigo-500/10'
                        : 'border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>{language === 'tr' ? 'Karanlık Tema' : 'Dark Mode'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm space-y-6 animate-in fade-in duration-150">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.notificationSettings}</h3>
              
              <div className="divide-y divide-slate-100 dark:divide-slate-900 space-y-4">
                
                {/* Switch row 1 */}
                <div className="flex items-center justify-between pt-4">
                  <div className="max-w-md">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.renewalReminders}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{t.renewalRemindersDesc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.notifRenewal} 
                      onChange={() => updateNotifications({ notifRenewal: !notifications.notifRenewal })}
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Switch row 2 */}
                <div className="flex items-center justify-between pt-4">
                  <div className="max-w-md">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.weeklyReports}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{t.weeklyReportsDesc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.notifWeekly} 
                      onChange={() => updateNotifications({ notifWeekly: !notifications.notifWeekly })}
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-850 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Switch row 3 */}
                <div className="flex items-center justify-between pt-4">
                  <div className="max-w-md">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.securityAlerts}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{t.securityAlertsDesc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.notifSecurity} 
                      onChange={() => updateNotifications({ notifSecurity: !notifications.notifSecurity })}
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Telegram Notifications Section */}
                <div className="pt-6 space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="max-w-md">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {language === 'tr' ? 'Telegram Bildirimleri' : 'Telegram Notifications'}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {language === 'tr' ? 'Önemli fatura tarihleri yaklaştığında Telegram botu üzerinden anlık mesaj alın.' : 'Receive instant alerts via Telegram bot when important renewal dates approach.'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.telegramActive} 
                        onChange={() => updateNotifications({ telegramActive: !notifications.telegramActive })}
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {notifications.telegramActive && (
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 items-end animate-in fade-in duration-200">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">BOT TOKEN</label>
                        <input 
                          type="password" 
                          value={notifications.telegramToken}
                          onChange={(e) => updateNotifications({ telegramToken: e.target.value })}
                          placeholder="123456789:ABCdefGhI..."
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">CHAT ID</label>
                        <input 
                          type="text" 
                          value={notifications.telegramChatId}
                          onChange={(e) => updateNotifications({ telegramChatId: e.target.value })}
                          placeholder="987654321"
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2 pt-2 flex items-center gap-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleTestTelegram}
                          disabled={telegramStatus === 'sending'}
                          className="text-[10px] py-1.5 px-4 font-bold border-slate-200 dark:border-slate-800"
                        >
                          {telegramStatus === 'sending' ? (language === 'tr' ? 'Gönderiliyor...' : 'Sending...') : (language === 'tr' ? 'Telegram Bildirimini Test Et' : 'Test Telegram Notification')}
                        </Button>
                        
                        {telegramStatus === 'success' && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            ✓ {language === 'tr' ? 'Test mesajı başarıyla gönderildi!' : 'Test message sent successfully!'}
                          </span>
                        )}
                        {telegramStatus === 'error' && (
                          <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">
                            ⚠ {language === 'tr' ? 'Hata! Lütfen bilgileri kontrol edin.' : 'Error! Please check credentials.'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {activeTab === 'currency' && (
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm space-y-8">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'tr' ? 'Bütçe & Para Birimi Ayarları' : 'Budget & Currency Settings'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {language === 'tr' ? 'Abonelik harcamalarınız için bütçe sınırı belirleyin ve varsayılan para birimini değiştirin.' : 'Set spending limits and select the primary currency of your account.'}
                </p>
              </div>

              <div className="space-y-6">
                {/* Budget Cap / Limit Section */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'tr' ? 'Aylık Harcama Limiti (Budget Cap)' : 'Monthly Spending Limit (Budget Cap)'}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {language === 'tr' ? 'Abonelik harcamalarınız bu sınırı aştığında kontrol panelinde uyarı alırsınız.' : 'You will receive warnings on the dashboard when subscription spending exceeds this limit.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 max-w-xs">
                    <input 
                      type="number"
                      min="0"
                      value={notifications.monthlyLimit || 1000}
                      onChange={(e) => updateNotifications({ monthlyLimit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                      placeholder="1000"
                    />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {notifications.baseCurrency === 'TRY' ? 'TL (₺)' : notifications.baseCurrency === 'USD' ? 'USD ($)' : 'EUR (€)'}
                    </span>
                  </div>
                </div>

                {/* Base Currency selection */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-900 space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'tr' ? 'Varsayılan Para Birimi' : 'Primary Currency'}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {language === 'tr' 
                        ? 'Uygulama genelinde harcamalarınızın gösterileceği varsayılan para birimini seçin.' 
                        : 'Select the default currency to display all subscription expenses across the platform.'}
                    </p>
                  </div>
                  <div className="flex gap-2 max-w-xs">
                    {['TRY', 'USD', 'EUR'].map((cur) => (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => updateNotifications({ baseCurrency: cur })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                          (notifications.baseCurrency || 'TRY') === cur
                            ? 'border-indigo-650 bg-indigo-50/20 text-indigo-650 dark:text-indigo-400 dark:bg-indigo-500/10'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        }`}
                      >
                        {cur === 'TRY' ? 'TL (₺)' : cur === 'USD' ? 'USD ($)' : 'EUR (€)'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.securityAndPassword}</h3>
              
              <form className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">{t.currentPassword}</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-150 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 dark:text-slate-500">{t.newPassword}</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      placeholder="Minimum 8 characters" 
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-150 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  </div>
                </div>

                <div className="pt-4">
                  <Button variant="primary" className="text-xs px-6">{t.updatePassword}</Button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* Mobile View Container (Visible below lg) */}
      <div className="lg:hidden space-y-6">
        
        {/* Settings Detail View Overlay */}
        {activeMobileTab !== null ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveMobileTab(null)}
                className="text-slate-900 dark:text-white p-1 flex items-center justify-center bg-slate-100 dark:bg-[#131c35] rounded-xl border border-transparent dark:border-[#232f4e] active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {activeMobileTab === 'profile' ? (language === 'tr' ? 'Profil Ayarları' : 'Profile Settings')
                 : activeMobileTab === 'notifications' ? (language === 'tr' ? 'Bildirimler' : 'Notifications')
                 : activeMobileTab === 'security' ? (language === 'tr' ? 'Şifre & Güvenlik' : 'Security')
                 : (language === 'tr' ? 'Dil ve Para Birimi' : 'Language & Currency')}
              </h2>
            </div>

            {/* Profile Tab Details */}
            {activeMobileTab === 'profile' && (
              <form onSubmit={handleSave} className="bg-white dark:bg-[#131c35] border border-slate-150/60 dark:border-[#232f4e] p-5 rounded-2xl space-y-4 shadow-xs">
                <div className="flex flex-col items-center gap-3 mb-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-500">
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <button 
                      type="button" 
                      onClick={triggerFileInput}
                      className="absolute bottom-0 right-0 bg-slate-900 text-white dark:bg-white dark:text-slate-900 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white dark:border-[#131c35]"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleRemoveAvatar} className="text-[10px] text-rose-500 font-bold border border-rose-500/20 px-2.5 py-1 rounded-lg">
                      {language === 'tr' ? 'Resmi Kaldır' : 'Remove Logo'}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t.firstName}</label>
                  <input 
                    type="text" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t.lastName}</label>
                  <input 
                    type="text" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t.emailAddress}</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" variant="primary" className="w-full text-xs py-3.5 shadow-md shadow-indigo-650/15">
                    {t.saveDetails}
                  </Button>
                </div>
              </form>
            )}

            {/* Notifications Tab Details */}
            {activeMobileTab === 'notifications' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="bg-white dark:bg-[#131c35] border border-slate-150/60 dark:border-[#232f4e] p-5 rounded-2xl space-y-4 shadow-xs divide-y divide-slate-100 dark:divide-slate-900/50">
                  
                  {/* Renewal Reminders Toggle */}
                  <div className="flex items-center justify-between pb-3.5 pt-1">
                    <div className="max-w-[75%]">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.renewalReminders}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-400/80 mt-0.5">{t.renewalRemindersDesc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.notifRenewal} 
                        onChange={() => updateNotifications({ notifRenewal: !notifications.notifRenewal })}
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-650"></div>
                    </label>
                  </div>

                  {/* Weekly Reports Toggle */}
                  <div className="flex items-center justify-between py-3.5">
                    <div className="max-w-[75%]">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.weeklyReports}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-400/80 mt-0.5">{t.weeklyReportsDesc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.notifWeekly} 
                        onChange={() => updateNotifications({ notifWeekly: !notifications.notifWeekly })}
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-650"></div>
                    </label>
                  </div>

                  {/* Security Alerts Toggle */}
                  <div className="flex items-center justify-between py-3.5">
                    <div className="max-w-[75%]">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.securityAlerts}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-400/80 mt-0.5">{t.securityAlertsDesc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.notifSecurity} 
                        onChange={() => updateNotifications({ notifSecurity: !notifications.notifSecurity })}
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-650"></div>
                    </label>
                  </div>

                  {/* Telegram Notifications Toggle */}
                  <div className="flex items-center justify-between py-3.5">
                    <div className="max-w-[75%]">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{language === 'tr' ? 'Telegram Bildirimleri' : 'Telegram Notifications'}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-400/80 mt-0.5">
                        {language === 'tr' ? 'Fatura bildirimlerini Telegram ile alın.' : 'Receive renew alerts via Telegram.'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.telegramActive} 
                        onChange={() => updateNotifications({ telegramActive: !notifications.telegramActive })}
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-650"></div>
                    </label>
                  </div>

                  {/* Telegram Credentials Forms */}
                  {notifications.telegramActive && (
                    <div className="pt-4 space-y-3 animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Bot Token</label>
                        <input 
                          type="text" 
                          value={notifications.telegramToken || ''} 
                          onChange={(e) => updateNotifications({ telegramToken: e.target.value })}
                          className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none"
                          placeholder="123456:ABC-DEF"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Chat ID</label>
                        <input 
                          type="text" 
                          value={notifications.telegramChatId || ''} 
                          onChange={(e) => updateNotifications({ telegramChatId: e.target.value })}
                          className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none"
                          placeholder="987654321"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={handleTestTelegram}
                        disabled={telegramStatus === 'sending'}
                        className="w-full text-xs font-bold text-indigo-650 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 py-2.5 rounded-xl transition-all"
                      >
                        {telegramStatus === 'sending' ? (language === 'tr' ? 'Gönderiliyor...' : 'Sending...') : (language === 'tr' ? 'Telegram Test Mesajı Gönder' : 'Test Telegram Alert')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security Tab Details */}
            {activeMobileTab === 'security' && (
              <form className="bg-white dark:bg-[#131c35] border border-slate-150/60 dark:border-[#232f4e] p-5 rounded-2xl space-y-4 shadow-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t.currentPassword}</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t.newPassword}</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none" />
                </div>
                <div className="pt-2">
                  <Button variant="primary" className="w-full text-xs py-3.5 shadow-md shadow-indigo-650/15">{t.updatePassword}</Button>
                </div>
              </form>
            )}

            {/* Language and Currency Details */}
            {activeMobileTab === 'language' && (
              <div className="bg-white dark:bg-[#131c35] border border-slate-150/60 dark:border-[#232f4e] p-5 rounded-2xl space-y-5 shadow-xs">
                
                {/* Language Select */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{language === 'tr' ? 'Dil Seçimi' : 'Language Select'}</label>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => { useLanguageStore.setState({ language: 'tr' }) }}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border ${language === 'tr' ? 'border-indigo-650 text-indigo-650 bg-indigo-50/20 dark:text-indigo-400 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-800 text-slate-500'}`}
                    >
                      Türkçe (TR)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { useLanguageStore.setState({ language: 'en' }) }}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border ${language === 'en' ? 'border-indigo-650 text-indigo-650 bg-indigo-50/20 dark:text-indigo-400 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-800 text-slate-500'}`}
                    >
                      English (EN)
                    </button>
                  </div>
                </div>

                {/* Appearance Theme Switcher / Night shade */}
                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    {language === 'tr' ? 'Görünüm Teması' : 'Appearance Theme'}
                  </label>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${theme === 'light' ? 'border-indigo-650 text-indigo-650 bg-indigo-50/20 dark:text-indigo-400 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-800 text-slate-500'}`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>{language === 'tr' ? 'Açık' : 'Light'}</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${theme === 'dark' ? 'border-indigo-650 text-indigo-650 bg-indigo-50/20 dark:text-indigo-400 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-800 text-slate-505'}`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>{language === 'tr' ? 'Koyu' : 'Dark'}</span>
                    </button>
                  </div>
                </div>

                {/* Currency Select */}
                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase">{language === 'tr' ? 'Para Birimi' : 'Currency'}</label>
                  <div className="flex gap-2">
                    {['TRY', 'USD', 'EUR'].map((cur) => (
                      <button
                        key={cur}
                        type="button" 
                        onClick={() => updateNotifications({ baseCurrency: cur })}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border ${
                          (notifications.baseCurrency || 'TRY') === cur
                            ? 'border-indigo-650 text-indigo-650 bg-indigo-50/20 dark:text-indigo-400 dark:bg-indigo-500/10'
                            : 'border-slate-200 dark:border-slate-800 text-slate-550'
                        }`}
                      >
                        {cur === 'TRY' ? 'TL (₺)' : cur === 'USD' ? 'USD ($)' : 'EUR (€)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Monthly Spending Limit (Budget Cap) */}
                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase">
                    {language === 'tr' ? 'Aylık Harcama Limiti' : 'Monthly Spending Limit'}
                  </label>
                  <div className="relative flex items-center">
                    <input 
                      type="number"
                      min="0"
                      value={notifications.monthlyLimit || 1000}
                      onChange={(e) => updateNotifications({ monthlyLimit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-150 dark:border-slate-900 bg-slate-55/30 dark:bg-slate-900/60 text-slate-800 dark:text-slate-150 focus:outline-none"
                      placeholder="1000"
                    />
                    <span className="absolute right-4 text-xs font-bold text-slate-400 dark:text-slate-500">
                      {notifications.baseCurrency === 'TRY' ? 'TL' : notifications.baseCurrency === 'USD' ? 'USD' : 'EUR'}
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* Settings List View */
          <div className="space-y-6">
            {/* Profile Header Box */}
            <div className="bg-white dark:bg-[#131c35] rounded-2xl p-5 border border-slate-150/60 dark:border-[#232f4e] shadow-xs">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-500">
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <button 
                    onClick={() => setActiveMobileTab('profile')}
                    className="absolute bottom-0 right-0 bg-slate-900 text-white dark:bg-white dark:text-slate-900 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white dark:border-[#131c35] active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                </div>
                <h2 className="font-headline-md text-base font-black text-slate-900 dark:text-white leading-tight">
                  {user.firstName ? user.firstName.split(' ')[0] : ''}
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">{user.email}</p>
                
                <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  <span>Premium Plan</span>
                </div>
              </div>
            </div>

            {/* List Menu Section */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                {language === 'tr' ? 'Hesap Ayarları' : 'Account Settings'}
              </h3>
              
              <div className="bg-white dark:bg-[#131c35] rounded-2xl border border-slate-150/60 dark:border-[#232f4e] overflow-hidden divide-y divide-slate-100 dark:divide-slate-900">
                {/* Profile Edit button */}
                <button 
                  onClick={() => setActiveMobileTab('profile')}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-55 dark:hover:bg-slate-900/40 text-left active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-[#1d294d] flex items-center justify-center text-slate-700 dark:text-slate-350">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{language === 'tr' ? 'Profil Ayarları' : 'Profile Settings'}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{language === 'tr' ? 'Ad, soyad ve e-posta güncelle' : 'Manage your name and email'}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                </button>

                {/* Notifications button */}
                <button 
                  onClick={() => setActiveMobileTab('notifications')}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-55 dark:hover:bg-slate-900/40 text-left active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-[#1d294d] flex items-center justify-center text-slate-700 dark:text-slate-350">
                      <span className="material-symbols-outlined text-[20px]">notifications_active</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{language === 'tr' ? 'Bildirimler' : 'Notifications'}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{language === 'tr' ? 'Telegram ve hatırlatıcı ayarları' : 'Alerts and billing updates'}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                </button>

                {/* Security button */}
                <button 
                  onClick={() => setActiveMobileTab('security')}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-55 dark:hover:bg-slate-900/40 text-left active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-[#1d294d] flex items-center justify-center text-slate-700 dark:text-slate-350">
                      <span className="material-symbols-outlined text-[20px]">security</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{language === 'tr' ? 'Şifre & Güvenlik' : 'Security'}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{language === 'tr' ? 'Parola güncelle ve koruma' : 'Password and 2FA settings'}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                </button>

                {/* Language, Theme & Currency button */}
                <button 
                  onClick={() => setActiveMobileTab('language')}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-55 dark:hover:bg-slate-900/40 text-left active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-[#1d294d] flex items-center justify-center text-slate-700 dark:text-slate-350">
                      <span className="material-symbols-outlined text-[20px]">language</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {language === 'tr' ? 'Bütçe, Dil, Tema ve Para Birimi' : 'Budget, Language, Theme & Currency'}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {language === 'tr' ? 'Bütçe limiti, tema (Açık/Koyu), dil ve para birimi tercihi' : 'Set budget limit, theme, language and currency'}
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Logout Action */}
            <div className="pt-4">
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    useUserStore.getState().logoutUser();
                    sessionStorage.removeItem('subspace_session_active');
                    localStorage.removeItem('subspace_auth_token');
                    window.location.href = '/login';
                  }
                }}
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/10 font-bold active:scale-[0.98] transition-all text-xs"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>{language === 'tr' ? 'Çıkış Yap' : 'Logout'}</span>
              </button>
              <p className="mt-4 text-center text-[10px] text-slate-400 dark:text-slate-500 font-bold opacity-60">Version 2.4.12 • Subly Secure Mobile</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
