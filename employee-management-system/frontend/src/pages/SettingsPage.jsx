import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card } from '../components/Card';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Settings, Save, ShieldCheck, Mail, Info, Key, Server, CheckCircle } from 'lucide-react';

export const SettingsPage = () => {
  const { user, connectGoogle } = useAuth();
  const [host, setHost] = useState('smtp.gmail.com');
  const [port, setPort] = useState(465);
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fromName, setFromName] = useState('');
  const [saving, setSaving] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  const { showToast } = useToast();

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
            setConnectingGoogle(true);
            try {
              await connectGoogle({
                accessToken: tokenResponse.access_token,
                expiresIn: tokenResponse.expires_in,
              });
              showToast(`Connected! Emails will now send directly from your personal Gmail (${user?.email}) with zero passwords.`, 'success');
            } catch (err) {
              showToast(err.response?.data?.message || err.message || 'Failed to connect Google account', 'error');
            } finally {
              setConnectingGoogle(false);
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'consent' });
        return;
      } catch (err) {
        showToast('Google OAuth error: ' + err.message, 'error');
      }
    } else {
      showToast('Google OAuth service is still loading. Please try again in a few seconds.', 'error');
    }
  };

  useEffect(() => {
    if (user?.smtpConfig) {
      setHost(user.smtpConfig.host || 'smtp.gmail.com');
      setPort(user.smtpConfig.port || 465);
      setUserEmail(user.smtpConfig.userEmail || '');
      setFromName(user.smtpConfig.fromName || '');
    } else if (user?.email) {
      setUserEmail(user.email);
      setFromName(user.email.split('@')[0]);
    }
  }, [user]);

  const setGmailPreset = () => {
    setHost('smtp.gmail.com');
    setPort(465);
    showToast('Loaded Gmail SMTP settings (Port 465 SSL)', 'info');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/emails/smtp-config', {
        host,
        port: parseInt(port, 10),
        userEmail,
        password,
        fromName,
      });
      showToast('SMTP configuration saved successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save SMTP settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">SMTP Server Settings</h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure the email server used by the automated scheduler to dispatch live emails.
        </p>
      </div>

      {/* Live Dispatch Active Alert */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start space-x-4">
        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
        </div>
        <div className="text-xs text-emerald-900 space-y-1">
          <p className="font-semibold text-sm">System Live Dispatch Relay Active</p>
          <p>
            Scheduled emails are automatically dispatched live to recipients from your logged-in email address.
            <strong> No user needs to enter an SMTP password!</strong> The fields below are completely optional if you ever want to override and use a custom private SMTP server.
          </p>
        </div>
      </div>

      {/* Direct Gmail API (Zero Passwords) Card */}
      <Card
        title="Direct Gmail Dispatch (0 Passwords)"
        subtitle="Authorize Outbox Mail to send emails directly from your personal Gmail address"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">
              Logged in as: <span className="text-sky-600 font-bold">{user?.email}</span>
            </p>
            <p className="text-xs text-slate-500">
              {user?.googleAccessToken
                ? '✅ Direct Gmail sending is active for your account (0 passwords required).'
                : 'Connect with Google to send all outbox emails directly from your personal email without entering passwords.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleConnectGmail}
            disabled={connectingGoogle}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition shadow-sm disabled:opacity-50 whitespace-nowrap"
          >
            {connectingGoogle ? 'Connecting...' : user?.googleAccessToken ? 'Re-authorize Gmail Access' : 'Authorize Gmail (0 Passwords)'}
          </button>
        </div>
      </Card>

      {/* SMTP Form */}
      <Card
        title="Email Delivery Credentials"
        subtitle="Supports Gmail, Outlook, Amazon SES, or custom SMTP"
        action={
          <button
            type="button"
            onClick={setGmailPreset}
            className="px-3 py-1 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition"
          >
            Use Gmail Defaults (Port 465)
          </button>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                SMTP Host Server *
              </label>
              <div className="relative">
                <Server className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Port *
              </label>
              <input
                type="number"
                required
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="587"
                className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Sender Email (Username) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="your-email@gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Sender Display Name
              </label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Your Name or Company"
                className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              SMTP Password or App Password *
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              For Gmail accounts, generate a 16-character <b>App Password</b> under Google Account → Security → 2-Step Verification → App passwords.
            </p>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

