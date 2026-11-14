import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Shield, Briefcase } from 'lucide-react';
import { Badge } from './Badge';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-slate-500">Welcome,</span>
        <span className="text-sm font-semibold text-slate-800">
          {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.email}
        </span>
        <Badge variant={user?.role === 'ADMIN' ? 'purple' : 'blue'}>
          {user?.role}
        </Badge>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 pr-3 border-r border-slate-200">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
            {user?.employee ? user.employee.firstName[0] : user?.email[0].toUpperCase()}
          </div>
          <div className="hidden sm:block text-left text-xs">
            <p className="font-semibold text-slate-700 truncate max-w-[150px]">{user?.email}</p>
            <p className="text-slate-400 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

