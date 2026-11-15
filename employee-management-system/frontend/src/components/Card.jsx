import React from 'react';

export const Card = ({ children, className = '', title, subtitle, action }) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden ${className}`}>
      {(title || subtitle || action) && (
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-800">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  color = 'sky',
  trend,
  onClick,
  active = false,
}) => {
  const colorMap = {
    sky: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  const activeRingMap = {
    sky: 'ring-2 ring-sky-500 border-sky-400 bg-sky-50/30 shadow-md scale-[1.01]',
    emerald: 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/30 shadow-md scale-[1.01]',
    amber: 'ring-2 ring-amber-500 border-amber-400 bg-amber-50/30 shadow-md scale-[1.01]',
    rose: 'ring-2 ring-rose-500 border-rose-400 bg-rose-50/30 shadow-md scale-[1.01]',
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`bg-white rounded-2xl border p-6 transition-all duration-300 ease-out select-none transform ${
        onClick
          ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2'
          : 'shadow-sm'
      } ${
        active
          ? activeRingMap[color] || 'ring-2 ring-sky-500 border-sky-400 shadow-md scale-[1.01]'
          : 'border-slate-200/80 hover:border-slate-300 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
          {trend && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span>{trend}</span>
            </p>
          )}
        </div>
        <div className={`p-3.5 rounded-xl ${colorMap[color] || colorMap.sky}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {onClick && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
          <span className={active ? 'text-slate-700 font-bold' : 'text-slate-400 hover:text-slate-600'}>
            {active ? '● Viewing results below' : 'Click to see emails →'}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
            active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {active ? 'Active' : 'Filter'}
          </span>
        </div>
      )}
    </div>
  );
};

