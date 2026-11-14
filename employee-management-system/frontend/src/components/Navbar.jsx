import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Mail, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-slate-500">Logged in as</span>
        <span className="text-sm font-semibold text-slate-800">{user?.email}</span>
      </div>

      <div className="flex items-center space-x-4">
        <Link
          to="/compose"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Compose Email</span>
        </Link>

        <button
          onClick={logout}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
