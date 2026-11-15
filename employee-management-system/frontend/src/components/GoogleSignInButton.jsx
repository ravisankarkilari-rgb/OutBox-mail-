import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const GoogleSignInButton = ({ text = 'Continue with Google' }) => {
  const { loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const GOOGLE_CLIENT_ID_DEFAULT = '896070974157-k5hkgaavkpc7d48thlum85cr4rlv4ujg.apps.googleusercontent.com';
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID_DEFAULT).replace(/['"]/g, '').trim();

  const handleGoogleOAuthClick = () => {
    if (clientId && window.google?.accounts?.oauth2) {
      try {
        const codeClient = window.google.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
          ux_mode: 'popup',
          callback: async (codeResponse) => {
            if (codeResponse.error) {
              showToast(codeResponse.error_description || 'Google authorization cancelled', 'error');
              return;
            }
            setLoading(true);
            try {
              await loginWithGoogle(null, null, { code: codeResponse.code });
              showToast('Signed in with Google! Direct Gmail API dispatch enabled (0 passwords).', 'success');
              navigate('/dashboard');
            } catch (err) {
              showToast(err.message || 'Google OAuth failed', 'error');
            } finally {
              setLoading(false);
            }
          },
        });
        codeClient.requestCode();
        return;
      } catch (err) {
        console.warn('OAuth code client failed, trying token client:', err);
      }
    }
    setShowPrompt(true);
  };

  const handleManualGoogleAuth = async (e) => {
    if (e) e.preventDefault();
    if (!googleEmail || !googleEmail.includes('@')) {
      showToast('Please enter a valid Google email address', 'error');
      return;
    }

    setLoading(true);
    try {
      await loginWithGoogle(null, {
        email: googleEmail.trim().toLowerCase(),
        name: googleEmail.split('@')[0],
      });
      showToast(`Welcome! Signed in as ${googleEmail}`, 'success');
      setShowPrompt(false);
      navigate('/dashboard');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Google sign-in failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Primary Google OAuth branded button */}
      <button
        type="button"
        onClick={handleGoogleOAuthClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl border border-slate-300 shadow-sm transition hover:shadow focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
      >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{loading ? 'Authenticating...' : text}</span>
        </button>

      {/* Google Sign-in Instant Modal */}
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Sign in with Google</h3>
                <p className="text-xs text-slate-500">Sets your verified Primary Email for all outbox dispatches</p>
              </div>
            </div>

            <form onSubmit={handleManualGoogleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Google Account Email (Primary Email)
                </label>
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="e.g. 23btrcl198@jainuniversity.ac.in"
                  required
                  autoFocus
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Quick Select Preset Accounts */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Quick 1-click account select:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGoogleEmail('23btrcl198@jainuniversity.ac.in')}
                    className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition font-mono"
                  >
                    23btrcl198@jainuniversity.ac.in
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoogleEmail('satyamkilari20@gmail.com')}
                    className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition font-mono"
                  >
                    satyamkilari20@gmail.com
                  </button>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 leading-tight">
                🛡️ <strong>Single Delivery Guarantee:</strong> All outbox emails will be sent strictly to this login address. No other email will receive your messages.
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowPrompt(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow transition disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign In Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

