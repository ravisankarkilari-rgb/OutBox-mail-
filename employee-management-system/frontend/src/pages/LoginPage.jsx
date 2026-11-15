import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      showToast('Welcome back to Outbox Mail!', 'success');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('admin@company.com');
    setPassword('Admin@123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Outbox Mail</h2>
          <p className="text-sm text-slate-500 mt-1">Automated Scheduled Email Dispatcher</p>
        </div>

        {/* Primary Recommended: Sign in with Google (Direct Gmail Dispatch) */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-sky-50 via-indigo-50/50 to-white border border-sky-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-sky-600 text-white rounded-lg shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Direct Gmail Dispatch (0 Passwords)</p>
              <p className="text-[11px] text-slate-500">Sign in with Google to send directly from your personal Gmail</p>
            </div>
          </div>
          <GoogleSignInButton text="Sign in with Google" />
        </div>

        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-xs uppercase text-slate-400 font-semibold tracking-wider">
            Or with email & password
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        {/* Demo Fast Login */}
        <div className="mb-6 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={fillDemo}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold bg-white text-indigo-700 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Click to Fill Demo Account (admin@company.com)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5 tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm text-slate-800 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5 tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm text-slate-800 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 mt-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <span>{loading ? 'Signing in...' : 'Sign In to Outbox'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-sky-600 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};
