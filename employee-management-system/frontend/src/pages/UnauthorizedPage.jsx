import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-sm text-slate-500 mt-2">
          You do not have permission to access this page. Please return to your authorized portal.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
};

