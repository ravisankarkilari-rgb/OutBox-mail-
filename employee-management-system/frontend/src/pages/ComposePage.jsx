import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/Card';
import { RichTextEditor } from '../components/RichTextEditor';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  Send,
  Clock,
  Users,
  Calendar,
  Sparkles,
  CheckCircle2,
  FileText,
  Paperclip,
  Upload,
  X,
  FileCode,
  FileSpreadsheet,
  FileImage,
  File,
  AlertCircle,
} from 'lucide-react';

export const ComposePage = () => {
  const { user } = useAuth();
  const [recipients, setRecipients] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();
  const attachmentInputRef = useRef(null);
  const recipientFileInputRef = useRef(null);

  // Automatically sync login email when user session resolves
  useEffect(() => {
    if (user?.email && (!recipients || recipients.trim() === '')) {
      setRecipients(user.email);
    }
  }, [user?.email]);

  // Helper to calculate detected recipient count
  const detectedEmails = recipients
    .split(/[\n,;]+/)
    .map((r) => r.trim())
    .filter((r) => r.includes('@'));

  // Presets
  const setPresetTime = (minutesFromNow) => {
    const target = new Date(Date.now() + minutesFromNow * 60 * 1000);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    const hours = String(target.getHours()).padStart(2, '0');
    const mins = String(target.getMinutes()).padStart(2, '0');
    setScheduledAt(`${year}-${month}-${day}T${hours}:${mins}`);
  };

  const fillSample100Recipients = () => {
    const primary = user?.email || 'my-account@gmail.com';
    setRecipients(primary);
    setSubject('Automated Outbox Scheduled Delivery');
    setBody(
      `<p>Hello,</p><p>This email was dynamically scheduled and delivered to your registered login email address (<strong>${primary}</strong>).</p><p>Best regards,<br>The Outbox Team</p>`
    );
    setPresetTime(2); // Schedule 2 minutes from now
    showToast(`Loaded delivery template for your login email (${primary})`, 'info');
  };

  // Handle uploading and attaching files (PDF, images, docs, etc.)
  const handleAttachmentUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const MAX_SIZE = 8 * 1024 * 1024; // 8MB limit per attachment
    files.forEach((file) => {
      if (file.size > MAX_SIZE) {
        showToast(`File "${file.name}" exceeds 8MB limit`, 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            filename: file.name,
            size: file.size,
            contentType: file.type || 'application/octet-stream',
            content: reader.result, // base64 data URL
          },
        ]);
        showToast(`Attached "${file.name}"`, 'success');
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Handle importing recipients from .csv or .txt file
  const handleRecipientsFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size === 0) {
      showToast(
        `The file "${file.name}" is completely empty (0 bytes). Check if your emails are saved in another file like "Mails.txt.txt" on your Desktop.`,
        'error'
      );
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result || '';
      // Global regex to match any email in the file
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
      let matches = content.match(emailRegex) || [];

      // Fallback: split by line and clean angle brackets / quotes
      if (matches.length === 0) {
        matches = content
          .split(/[\r\n,;]+/)
          .map((line) => line.replace(/[<>"']/g, '').trim())
          .filter((line) => line.includes('@') && line.includes('.'));
      }

      const uniqueEmails = Array.from(new Set(matches.map((m) => m.toLowerCase())));

      if (uniqueEmails.length === 0) {
        showToast(`No valid email addresses found in "${file.name}". Please ensure it contains valid emails.`, 'error');
        return;
      }

      setRecipients((prev) => {
        const existing = prev ? prev.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean) : [];
        const merged = Array.from(new Set([...existing, ...uniqueEmails]));
        return merged.join(',\n');
      });

      showToast(`Imported ${uniqueEmails.length} recipient(s) from "${file.name}"!`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i] || 'MB'}`;
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      return <FileImage className="w-5 h-5 text-sky-500" />;
    }
    if (['csv', 'xlsx', 'xls'].includes(ext)) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
      return <FileText className="w-5 h-5 text-indigo-500" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();

    let targetRecipients = recipients.trim();
    if (!targetRecipients && user?.email) {
      targetRecipients = user.email.trim();
    }

    if (!targetRecipients) {
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
      const googleToken = localStorage.getItem('google_access_token') || user?.googleAccessToken;
      const payload = {
        recipients: targetRecipients,
        subject,
        body,
        scheduledAt: new Date(scheduledAt).toISOString(),
      };
      if (googleToken) {
        payload.googleAccessToken = googleToken;
      }
      if (attachments && attachments.length > 0) {
        payload.attachments = attachments;
      }

      const res = await api.post('/emails/schedule', payload);
      const createdItem = res.data?.data;

      // Save to local persistent outbox cache so history is permanently kept
      try {
        const cacheKey = `outbox_history_${user?.email || 'default'}`;
        const existingRaw = localStorage.getItem(cacheKey);
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const newItem = createdItem || {
          id: Math.random().toString(36).substring(2, 9),
          subject,
          body,
          recipients: targetRecipients,
          recipientCount: detectedEmails.length,
          scheduledAt: new Date(scheduledAt).toISOString(),
          status: 'SCHEDULED',
          createdAt: new Date().toISOString(),
        };
        const updated = [newItem, ...existing.filter((e) => e.id !== newItem.id)].slice(0, 100);
        localStorage.setItem(cacheKey, JSON.stringify(updated));
      } catch (_) {}

      showToast(
        `Email successfully scheduled for ${detectedEmails.length} recipient(s)${
          attachments.length > 0 ? ` with ${attachments.length} attachment(s)` : ''
        }!`,
        'success'
      );
      navigate('/outbox');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to schedule email', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Compose & Schedule Email</h2>
          <p className="text-sm text-slate-500 mt-1">
            Send to 1 or up to 100+ recipients with attachments at your chosen date and time.
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
          subtitle="Enter recipient email address(es) or upload a CSV / TXT list"
          action={
            <div className="flex items-center gap-2">
              <input
                ref={recipientFileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleRecipientsFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => recipientFileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition shadow-xs"
                title="Upload CSV or TXT file to extract emails"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload CSV / TXT</span>
              </button>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-sky-100 text-sky-800">
                <Users className="w-3.5 h-3.5" />
                {detectedEmails.length} recipient(s)
              </span>
            </div>
          }
        >
          <div className="space-y-2">
            <textarea
              rows={4}
              required
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="e.g. 23btrcl198@jainuniversity.ac.in"
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-slate-700"
            />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Automatically populated with your login email (<strong>{user?.email}</strong>). You can also enter other emails or upload CSV.</span>
            </div>
          </div>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider">
                  Message Body (Rich Text & Formatting) *
                </label>
                <span className="text-[11px] text-slate-400">
                  Gmail-style rich formatting toolbar enabled
                </span>
              </div>
              <RichTextEditor
                value={body}
                onChange={setBody}
                placeholder="Write your email message here. Use the formatting toolbar above to customize fonts, colors, lists, and styles..."
              />
            </div>
          </div>
        </Card>

        {/* File Attachments Card */}
        <Card
          title="Attachments"
          subtitle="Upload and attach documents, PDFs, images, or spreadsheets to this email"
          action={
            <span className="text-xs font-medium text-slate-500">
              {attachments.length} file{attachments.length === 1 ? '' : 's'} attached
            </span>
          }
        >
          <div className="space-y-4">
            {/* Hidden native file input */}
            <input
              ref={attachmentInputRef}
              type="file"
              multiple
              onChange={handleAttachmentUpload}
              className="hidden"
            />

            {/* Drag & Drop Upload Zone */}
            <div
              onClick={() => attachmentInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 hover:bg-indigo-50/20 group"
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-slate-200 group-hover:border-indigo-200 group-hover:bg-indigo-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition shadow-xs mb-3">
                <Paperclip className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition">
                Click to attach files, or drag and drop
              </p>
              <p className="text-xs text-slate-400 mt-1">
                PDF, Word, Excel, Images, ZIP up to 8MB each
              </p>
            </div>

            {/* Uploaded Files List */}
            {attachments.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Attached Files ({attachments.length}):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-xs group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
                          {getFileIcon(att.filename)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate" title={att.filename}>
                            {att.filename}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatFileSize(att.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition ml-2"
                        title="Remove attachment"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setPresetTime(0);
              setTimeout(() => {
                const btn = document.getElementById('main-schedule-submit-btn');
                if (btn) btn.click();
              }, 50);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
            <span>{loading ? 'Sending Live...' : '⚡ Send Live Now'}</span>
          </button>

          <button
            id="main-schedule-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-sky-600/20 transition disabled:opacity-50"
          >
            <Clock className="w-5 h-5" />
            <span>
              {loading
                ? 'Processing...'
                : attachments.length > 0
                ? `Schedule Send (${attachments.length} file${attachments.length === 1 ? '' : 's'})`
                : 'Schedule Automated Send'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
