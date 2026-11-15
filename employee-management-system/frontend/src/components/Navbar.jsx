import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LogOut, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar = () => {
  const { user, connectGoogle, logout } = useAuth();
  const { showToast } = useToast();
  const [connecting, setConnecting] = useState(false);

  const GOOGLE_CLIENT_ID_DEFAULT = '896070974157-k5hkgaavkpc7d48thlum85cr4rlv4ujg.apps.googleusercontent.com';
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID_DEFAULT).replace(/['"]/g, '').trim();

  const handleConnectGmail = () => {
    if (clientId && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              showToast(tokenResponse.error_description || tokenResponse.error || 'Google authorization cancelled', 'error');
              return;
            }
            setConnecting(true);
            try {
              await connectGoogle({
                accessToken: tokenResponse.access_token,
                expiresIn: tokenResponse.expires_in,
              });
              showToast(`Connected! Emails will now send directly from your personal Gmail (${user?.email}) with zero passwords.`, 'success');
            } catch (err) {
              showToast(err.response?.data?.message || err.message || 'Failed to connect Google account', 'error');
            } finally {
              setConnecting(false);
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'consent' });
        return;
      } catch (err) {
        showToast('Google OAuth error: ' + err.message, 'error');
      }
    } else {
      showToast('Google Services initializing. Please try again.', 'error');
    }
  };

  const isConnected = !!user?.googleAccessToken;

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-slate-500">Logged in as</span>
        <span className="text-sm font-semibold text-slate-800">{user?.email}</span>

        {isConnected ? (
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Emails send directly from your personal Gmail">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Direct Gmail Active</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleConnectGmail}
            disabled={connecting}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition shadow-xs"
            title="Click to authorize sending directly from your personal Gmail address with 0 passwords"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>{connecting ? 'Connecting...' : `Connect Gmail to Send as ${user?.email?.split('@')[0] || 'You'}`}</span>
          </button>
        )}
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
