import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 mb-4">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Page Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">
          The page you requested does not exist or may have been moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-500 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

