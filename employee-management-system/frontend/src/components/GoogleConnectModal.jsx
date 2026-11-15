import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Mail, Sparkles, CheckCircle2, ShieldCheck, X } from 'lucide-react';

export const GoogleConnectModal = () => {
  const { user, updateUserState } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If user already connected Google OAuth or dismissed for this session, don't show
  const isConnected = Boolean(user?.googleAccessToken || user?.googleRefreshToken);
  if (isConnected || dismissed) {
    return null;
  }

  const handleConnect = () => {
    const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').replace(/['"]/g, '').trim();

    if (clientId && window.google?.accounts?.oauth2) {
      setLoading(true);
      try {
        const codeClient = window.google.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
          ux_mode: 'popup',
          callback: async (codeResponse) => {
            if (codeResponse.error) {
              showToast(codeResponse.error_description || 'Authorization was cancelled', 'error');
              setLoading(false);
              return;
            }
            try {
              await api.post('/auth/google/connect', { code: codeResponse.code });
              showToast('Google account connected! Direct Gmail dispatch active (0 passwords).', 'success');
              const meRes = await api.get('/auth/me');
              if (meRes.data?.data) updateUserState(meRes.data.data);
            } catch (err) {
              showToast(err.response?.data?.message || err.message || 'Failed to connect Google account', 'error');
            } finally {
              setLoading(false);
            }
          },
        });
        codeClient.requestCode();
        return;
      } catch (err) {
        setLoading(false);
        showToast(`Google OAuth error: ${err.message}`, 'error');
      }
    } else {
      showToast('Google Client ID not configured', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-100 relative">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 mb-5">
          <Mail className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-bold text-slate-900">
          Connect Your Google Account
        </h3>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          Before entering the dashboard, authorize your account to send emails directly from your personal address (<strong>{user?.email}</strong>) with <strong>zero passwords</strong>.
        </p>

        <div className="my-5 p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Benefits of 1-Click Connection</span>
          </div>
          <ul className="text-xs text-emerald-800 space-y-1.5 list-disc list-inside">
            <li>Emails sent directly from <strong>{user?.email}</strong></li>
            <li>No 16-digit SMTP App Password needed</li>
            <li>Zero third-party email involvement</li>
          </ul>
        </div>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleConnect}
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Authorizing with Google...' : `Authorize ${user?.email || 'Google Account'}`}</span>
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-full py-2.5 px-4 text-xs font-medium text-slate-500 hover:text-slate-800 transition text-center"
          >
            Skip for now (use default server relay)
          </button>
        </div>
      </div>
    </div>
  );
};

