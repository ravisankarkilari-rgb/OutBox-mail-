import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card } from '../components/Card';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Settings, Save, ShieldCheck, Mail, Info, Key, Server } from 'lucide-react';

export const SettingsPage = () => {
  const { user } = useAuth();
  const [host, setHost] = useState('smtp.gmail.com');
  const [port, setPort] = useState(465);
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fromName, setFromName] = useState('');
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

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

      {/* Simulator Mode Alert */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 flex items-start space-x-4">
        <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
          <Info className="w-5 h-5 flex-shrink-0" />
        </div>
        <div className="text-xs text-sky-900 space-y-1">
          <p className="font-semibold text-sm">Built-in Dispatch Simulator Active</p>
          <p>
            By default, all scheduled emails are automatically dispatched and recorded in your
            Outbox/Sent history. To send actual real-world emails to inboxes, enter your SMTP details
            below.
          </p>
        </div>
      </div>

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

