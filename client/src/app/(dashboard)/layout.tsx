"use client";
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNavbar } from '@/components/layout/MobileNavbar';
import { useUserStore } from '@/store/useUserStore';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const user = useUserStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const sessionActive = sessionStorage.getItem('subspace_session_active');
      const rememberMe = useUserStore.getState().notifications.rememberMe;

      if (user.email) {
        if (!rememberMe && !sessionActive) {
          useUserStore.getState().logoutUser();
          router.push('/login');
        } else {
          sessionStorage.setItem('subspace_session_active', 'true');
        }
      } else {
        router.push('/login');
      }
    }
  }, [mounted, user, router]);

  if (!mounted || !user.email) {
    return (
      <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden items-center justify-center">
        {/* Sleek premium spinner / skeleton placeholder */}
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-8">
          {children}
        </main>
        <MobileNavbar />
      </div>
    </div>
  );
}
