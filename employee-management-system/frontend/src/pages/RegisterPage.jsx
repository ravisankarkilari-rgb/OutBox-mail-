import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Building, Lock, Mail, UserPlus, ArrowRight } from 'lucide-react';

export const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, role);
      showToast('Account registered successfully! Please sign in.', 'success');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 mb-4">
            <UserPlus className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Create Account</h2>
          <p className="text-sm text-slate-500 mt-1">Join the Employee Management System</p>
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
                placeholder="name@company.com"
                required
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm text-slate-800 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5 tracking-wider">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm text-slate-800 transition bg-white"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
            </select>
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
                placeholder="Min. 8 chars, Aa1@..."
                required
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm text-slate-800 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5 tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
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
            <span>{loading ? 'Creating...' : 'Register'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-sky-600 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

