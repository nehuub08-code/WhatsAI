import React from 'react';

const StatsCard = ({ title, value, subtitle, icon: Icon, trend, trendPositive, color = 'blue' }) => {
  const colorMap = {
    blue: {
      iconBg: 'bg-blue-500/10 text-blue-400',
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 text-emerald-400',
    },
    cyan: {
      iconBg: 'bg-cyan-500/10 text-cyan-400',
    },
    purple: {
      iconBg: 'bg-indigo-500/10 text-indigo-400',
    },
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-400',
    }
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/90 p-4 hover:border-slate-700/80 transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${scheme.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-2.5">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
          {trend && (
            <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
              trendPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {trendPositive ? '↑' : '↓'} {trend}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-[11px] text-slate-400 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
