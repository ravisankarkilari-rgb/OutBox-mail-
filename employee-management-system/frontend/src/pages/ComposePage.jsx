import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/Card';
import { useToast } from '../context/ToastContext';
import {
  Send,
  Clock,
  Users,
  Calendar,
  Sparkles,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export const ComposePage = () => {
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  // Helper to calculate detected recipient count
  const detectedEmails = recipients
    .split(/[\n,;]+/)
    .map((r) => r.trim())
    .filter((r) => r.includes('@'));

  // Presets
  const setPresetTime = (minutesFromNow) => {
    const target = new Date(Date.now() + minutesFromNow * 60 * 1000);
    // Format YYYY-MM-DDTHH:mm for datetime-local
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    const hours = String(target.getHours()).padStart(2, '0');
    const mins = String(target.getMinutes()).padStart(2, '0');
    setScheduledAt(`${year}-${month}-${day}T${hours}:${mins}`);
  };

  const fillSample100Recipients = () => {
    const sample = Array.from({ length: 25 }, (_, i) => `subscriber_${i + 1}@sample-domain.com`).join(',\n');
    setRecipients(sample);
    setSubject('Exclusive Monthly Product Announcement & Updates');
    setBody(
      `<p>Hello,</p><p>We are delighted to share our scheduled product updates with you.</p><p>This email was automatically scheduled and dispatched at the exact requested time.</p><p>Best regards,<br>The Outbox Team</p>`
    );
    setPresetTime(2); // Schedule 2 minutes from now
    showToast('Loaded sample recipients and message', 'info');
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();

    if (detectedEmails.length === 0) {
      showToast('Please enter at least one valid recipient email address', 'error');
      return;
    }
    if (!subject.trim()) {
      showToast('Please enter an email subject', 'error');
      return;
    }
    if (!body.trim()) {
      showToast('Please enter email body content', 'error');
      return;
    }
    if (!scheduledAt) {
      showToast('Please pick a date and time to send the email', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/emails/schedule', {
        recipients,
        subject,
        body,
        scheduledAt: new Date(scheduledAt).toISOString(),
      });

      showToast(`Email successfully scheduled for ${detectedEmails.length} recipient(s)!`, 'success');
      navigate('/outbox');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to schedule email', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Compose & Schedule Email</h2>
          <p className="text-sm text-slate-500 mt-1">
            Send to 1 or up to 100+ recipients automatically at your chosen date and time.
          </p>
        </div>
        <button
          type="button"
          onClick={fillSample100Recipients}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Quick Demo Fill (25 Recipients)</span>
        </button>
      </div>

      <form onSubmit={handleScheduleSubmit} className="space-y-6">
        {/* Recipients Card */}
        <Card
          title="Recipients"
          subtitle="Enter one or multiple email addresses (comma, semicolon, or newline separated)"
          action={
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800">
              <Users className="w-3.5 h-3.5" />
              {detectedEmails.length} recipient{detectedEmails.length === 1 ? '' : 's'} detected
            </span>
          }
        >
          <textarea
            rows={4}
            required
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="john@example.com, sarah@company.com, team@partner.org..."
            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-slate-700"
          />
          <p className="text-xs text-slate-400 mt-2">
            💡 Tip: You can paste a list of 100+ email addresses directly from Excel or a text file.
          </p>
        </Card>

        {/* Message Content Card */}
        <Card title="Email Content" subtitle="Craft your email subject line and message body">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1 tracking-wider">
                Subject Line *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Important Project Update & Scheduled Action Items"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1 tracking-wider">
                Message Body (Supports Plain Text & HTML) *
              </label>
              <textarea
                rows={8}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email message here. HTML tags like <p>, <b>, <a href='...'> are supported."
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
              />
            </div>
          </div>
        </Card>

        {/* Schedule Timing Card */}
        <Card title="Scheduling & Delivery Time" subtitle="Pick exactly when the application should dispatch this email">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5 tracking-wider">
                Date & Time to Send *
              </label>
              <div className="relative max-w-sm">
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 bg-white"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Quick Presets:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPresetTime(2)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                >
                  ⚡ In 2 Minutes (Quick Test)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetTime(15)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                >
                  In 15 Minutes
                </button>
                <button
                  type="button"
                  onClick={() => setPresetTime(60)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                >
                  In 1 Hour
                </button>
                <button
                  type="button"
                  onClick={() => setPresetTime(24 * 60)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                >
                  Tomorrow
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-sky-600/20 transition disabled:opacity-50"
          >
            <Clock className="w-5 h-5" />
            <span>{loading ? 'Scheduling...' : 'Schedule Automated Send'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
