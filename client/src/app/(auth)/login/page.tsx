"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, BarChart2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useUserStore } from '@/store/useUserStore';

export default function LoginPage() {
  const router = useRouter();
  const user = useUserStore((state: any) => state.user);
  const loginUser = useUserStore((state: any) => state.loginUser);
  const updateNotifications = useUserStore((state: any) => state.updateNotifications);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      // Safe api url clean up to ensure /api suffix is present
      const cleanApiUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl.replace(/\/$/, '')}/api`;

      const response = await fetch(`${cleanApiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // Handle server crash or database down (500+)
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Handle non-ok status codes (e.g. 404, 401)
      if (!response.ok) {
        try {
          const data = await response.json();
          let msg = '';
          if (response.status === 404 || data.message === 'user_not_found') {
            msg = 'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı. Lütfen önce kayıt olun.';
          } else if (response.status === 401 || data.message === 'incorrect_password') {
            msg = 'Girdiğiniz şifre yanlış! Lütfen tekrar deneyin.';
          } else {
            msg = data.message || 'Geçersiz e-posta veya şifre!';
          }
          setError(msg);
          alert(msg);
          setLoading(false);
          return;
        } catch (jsonErr) {
          throw new Error('Non-JSON response from server');
        }
      }

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Geçersiz e-posta veya şifre!');
        setLoading(false);
        return;
      }

      // Save auth token
      localStorage.setItem('subspace_auth_token', data.token);

      const fullName = `${data.user.firstName} ${data.user.lastName}`.trim() || data.user.email.split('@')[0];
      setSuccessMessage('Giriş başarılı! Panelinize yönlendiriliyorsunuz...');
      loginUser(data.user.email, fullName);
      updateNotifications({ rememberMe });
      sessionStorage.setItem('subspace_session_active', 'true');
      
      router.push('/');
    } catch (err) {
      console.error('Backend connection failed:', err);
      const msg = 'Sunucu bağlantısı kurulamadı. Lütfen sunucunun çalıştığından emin olun.';
      setError(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Split Layout: Left Banner Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 to-teal-950 items-center justify-center overflow-hidden p-16">
        {/* Subtle background image/pattern emulation overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center opacity-15 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-teal-900/30 backdrop-blur-xs"></div>

        <div className="relative z-10 w-full max-w-lg flex flex-col h-full justify-between">
          {/* Top blank space or logo placeholder if needed, matching the image height */}
          <div></div>

          {/* Core Content */}
          <div className="space-y-6">
            <span className="inline-block px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[11px] font-bold text-emerald-400 tracking-wider uppercase">
              PREMİUM YÖNETİM
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
              Aboneliklerinizi Tek <br />
              Bir Noktadan Kontrol <br />
              Edin.
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed max-w-md font-medium">
              SubManager ile kurumsal ve kişisel harcamalarınızı optimize edin, gereksiz maliyetleri ortadan kaldırın ve finansal netliğe kavuşun.
            </p>

            {/* Micro Cards */}
            <div className="flex gap-4 pt-4">
              <div className="flex-1 bg-white/10 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Detaylı Raporlar</h3>
                </div>
              </div>

              <div className="flex-1 bg-white/10 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Akıllı Uyarılar</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Footer space to align layout */}
          <div className="text-slate-400 text-xs">
            © 2026 SubManager. Tüm Hakları Saklıdır.
          </div>
        </div>
      </div>

      {/* Right Column: Sign In Sheet Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16 bg-white dark:bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          
          {/* Logo & Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900">
                {/* 4 Square Grid Icon */}
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white">SubManager</span>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Tekrar Hoş Geldiniz</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">Hesabınıza erişmek için bilgilerinizi girin.</p>
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 p-3 py-2 rounded-xl text-xs font-bold leading-relaxed mb-4">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 dark:text-emerald-400 p-3 py-2.5 rounded-xl text-xs font-bold leading-relaxed mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Input form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta Adresi"
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors"
              />
            </div>

            <div className="space-y-1.5 relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifre"
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-500 font-semibold">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-350 text-slate-900 focus:ring-0 dark:border-slate-800 dark:bg-slate-900"
                />
                <span>Beni Hatırla</span>
              </label>
              <a href="#" className="font-extrabold text-slate-900 dark:text-white hover:underline">
                Şifremi Unuttum
              </a>
            </div>

            {/* Login button */}
            <Button type="submit" variant="primary" className="w-full py-3.5 text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:bg-slate-850 dark:hover:bg-slate-100 transition-all shadow-sm">
              Giriş Yap
            </Button>
          </form>

          {/* Social separator */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-150 dark:border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              VEYA ŞUNUNLA DEVAM ET
            </span>
            <div className="flex-grow border-t border-slate-150 dark:border-slate-800"></div>
          </div>

          {/* Social sign in shortcuts */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2.5 py-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-bold text-slate-700 dark:text-slate-200">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Google
            </button>

            <button className="flex items-center justify-center gap-2.5 py-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-bold text-slate-700 dark:text-slate-200">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.64.74-1.2 1.88-1.05 3 .12 0 2.34-.64 3-1.45z" />
              </svg>
              Apple
            </button>
          </div>

          {/* Footer Navigation */}
          <div className="text-center text-xs text-slate-500 font-semibold">
            Hesabınız yok mu?{' '}
            <Link href="/register" className="font-extrabold text-slate-900 dark:text-white hover:underline">
              Kayıt Olun
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
