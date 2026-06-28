import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, trendUp }) => {
  return (
    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
          <Icon size={24} />
        </div>
        {trend && (
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${trendUp ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
            {trendUp ? '+' : '-'}{trend}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-text-primary dark:text-text-darkPrimary">{value}</p>
      </div>
    </div>
  );
};
