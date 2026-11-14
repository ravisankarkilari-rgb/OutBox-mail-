import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Award,
  FileBarChart2,
  UserCircle,
  Building,
} from 'lucide-react';

export const Sidebar = () => {
  const { isAdmin } = useAuth();

  const adminNav = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/employees', label: 'Employees', icon: Users },
    { to: '/admin/departments', label: 'Departments', icon: Building2 },
    { to: '/admin/performance', label: 'Performance', icon: Award },
    { to: '/admin/reports', label: 'Reports', icon: FileBarChart2 },
  ];

  const employeeNav = [
    { to: '/employee/dashboard', label: 'My Portal', icon: LayoutDashboard },
    { to: '/employee/profile', label: 'My Profile', icon: UserCircle },
  ];

  const navLinks = isAdmin ? adminNav : employeeNav;

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 min-h-screen flex flex-col flex-shrink-0">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
          <Building className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-base text-white tracking-wide">WorkPulse</h1>
          <p className="text-[10px] text-sky-400 font-medium tracking-wider uppercase">EMS Portal</p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          {isAdmin ? 'Administration' : 'Employee Workspace'}
        </p>
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        Enterprise EMS v1.0.0
      </div>
    </aside>
  );
};

