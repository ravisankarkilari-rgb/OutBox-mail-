import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Send,
  Clock,
  CheckCircle2,
  Settings,
  Mail,
} from 'lucide-react';

export const Sidebar = () => {
  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/compose', label: 'Compose & Schedule', icon: Send, badge: 'New' },
    { to: '/outbox', label: 'Outbox (Scheduled)', icon: Clock },
    { to: '/sent', label: 'Sent History', icon: CheckCircle2 },
    { to: '/settings', label: 'SMTP Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 min-h-screen flex flex-col flex-shrink-0">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-base text-white tracking-wide">Outbox Mail</h1>
          <p className="text-[10px] text-sky-400 font-medium tracking-wider uppercase">Auto Scheduler</p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Email Automation
        </p>
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-sky-500/20 text-sky-300">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        Outbox Mail Scheduler v1.0
      </div>
    </aside>
  );
};
