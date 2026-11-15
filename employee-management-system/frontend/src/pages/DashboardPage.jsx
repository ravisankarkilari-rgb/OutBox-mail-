import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { StatCard, Card } from '../components/Card';
import { EmailStatusBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getSavedHistory, persistHistory, removeEmailFromHistory } from '../utils/historyStorage';
import {
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Users,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  Filter,
  Check,
  Calendar,
  Mail,
  AlertTriangle,
  Paperclip,
  Sparkles,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, updateUserState } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState('ALL'); // Default to ALL campaigns
  const [featureEmails, setFeatureEmails] = useState(() => getSavedHistory(user?.email));
  const [featureLoading, setFeatureLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectingGmail, setConnectingGmail] = useState(false);

  const handleConnectGmail = () => {
    const GOOGLE_CLIENT_ID_DEFAULT = '896070974157-k5hkgaavkpc7d48thlum85cr4rlv4ujg.apps.googleusercontent.com';
    const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID_DEFAULT).replace(/['"]/g, '').trim();
    if (clientId && window.google?.accounts?.oauth2) {
      setConnectingGmail(true);
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              showToast(tokenResponse.error_description || tokenResponse.error || 'Google authorization cancelled', 'error');
              setConnectingGmail(false);
              return;
            }
            try {
              const res = await api.post('/auth/google/connect', {
                accessToken: tokenResponse.access_token,
                expiresIn: tokenResponse.expires_in,
              });
              showToast('Google account connected! Direct Gmail dispatch active (0 passwords).', 'success');
              if (res.data?.data) {
                updateUserState(res.data.data);
              } else {
                updateUserState({ googleAccessToken: tokenResponse.access_token });
              }
            } catch (err) {
              showToast(err.response?.data?.message || err.message || 'Failed to connect Google account', 'error');
            } finally {
              setConnectingGmail(false);
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'consent' });
        return;
      } catch (err) {
        setConnectingGmail(false);
        showToast(`Google OAuth error: ${err.message}`, 'error');
      }
    } else {
      showToast('Google Client ID not configured in frontend/.env', 'error');
    }
  };

  // Modal states
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const resultsRef = useRef(null);



  const fetchStats = async () => {
    try {
      const res = await api.get('/emails/stats');
      const localHistory = getSavedHistory(user?.email);
      const countScheduled = localHistory.filter((e) => e.status === 'SCHEDULED').length;
      const countSent = localHistory.filter((e) => e.status === 'SENT').length;
      const countFailed = localHistory.filter((e) => e.status === 'FAILED').length;
      const countTotal = localHistory.length;

      if (res.data?.success && res.data.data) {
        const s = res.data.data;
        setStats({
          total: Math.max(s.total || 0, countTotal),
          scheduled: Math.max(s.scheduled || 0, countScheduled),
          sent: Math.max(s.sent || 0, countSent),
          failed: Math.max(s.failed || 0, countFailed),
          upcoming: s.upcoming && s.upcoming.length > 0 ? s.upcoming : localHistory.filter((e) => e.status === 'SCHEDULED').slice(0, 5),
          recentSent: s.recentSent && s.recentSent.length > 0 ? s.recentSent : localHistory.filter((e) => e.status === 'SENT').slice(0, 5),
        });
      } else {
        setStats({
          total: countTotal,
          scheduled: countScheduled,
          sent: countSent,
          failed: countFailed,
          upcoming: localHistory.filter((e) => e.status === 'SCHEDULED').slice(0, 5),
          recentSent: localHistory.filter((e) => e.status === 'SENT').slice(0, 5),
        });
      }
    } catch (err) {
      console.warn('Stats fetch notice, using persistent history:', err.message);
      const localHistory = getSavedHistory(user?.email);
      setStats({
        total: localHistory.length,
        scheduled: localHistory.filter((e) => e.status === 'SCHEDULED').length,
        sent: localHistory.filter((e) => e.status === 'SENT').length,
        failed: localHistory.filter((e) => e.status === 'FAILED').length,
        upcoming: localHistory.filter((e) => e.status === 'SCHEDULED').slice(0, 5),
        recentSent: localHistory.filter((e) => e.status === 'SENT').slice(0, 5),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatureEmails = useCallback(async (status) => {
    setFeatureLoading(true);
    try {
      const statusParam = status === 'ALL' ? '' : `status=${status}&`;
      const res = await api.get(`/emails?${statusParam}limit=100`);
      const fetched = res.data?.success && Array.isArray(res.data.data) ? res.data.data : [];

      const localHistory = getSavedHistory(user?.email);
      const mergedMap = new Map();
      localHistory.forEach((e) => mergedMap.set(e.id, e));
      fetched.forEach((e) => mergedMap.set(e.id, e));

      persistHistory(Array.from(mergedMap.values()), user?.email);
      const cleanList = getSavedHistory(user?.email);

      const filtered = status === 'ALL' ? cleanList : cleanList.filter((e) => e.status === status);
      setFeatureEmails(filtered);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      console.warn('Feature emails fetch notice, reading from cache:', err.message);
      const localHistory = getSavedHistory(user?.email);
      const filtered = status === 'ALL' ? localHistory : localHistory.filter((e) => e.status === status);
      setFeatureEmails(filtered);
    } finally {
      setFeatureLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchStats();
    fetchFeatureEmails(selectedFeature);
    const handleUpdate = () => {
      fetchStats();
      fetchFeatureEmails(selectedFeature);
    };
    window.addEventListener('outbox_updated', handleUpdate);
    const interval = setInterval(() => {
      fetchStats();
      fetchFeatureEmails(selectedFeature);
    }, 15000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('outbox_updated', handleUpdate);
    };
  }, [selectedFeature, fetchFeatureEmails]);

  const handleCardClick = (statusKey) => {
    setSelectedFeature(statusKey);
    // Note: setSelectedFeature automatically triggers useEffect(..., [selectedFeature])
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSendNow = async (id, e) => {
    if (e) e.stopPropagation();
    setActionLoadingId(id);
    try {
      await api.post(`/emails/${id}/send-now`);
      showToast('Email dispatched immediately!', 'success');
      fetchStats();
      fetchFeatureEmails(selectedFeature);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to dispatch email';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEmail) return;
    const targetId = selectedEmail.id;
    setActionLoadingId(targetId);
    try {
      await api.delete(`/emails/${targetId}`).catch(() => {});
      removeEmailFromHistory(targetId, user?.email);
      showToast('Email removed successfully', 'success');
      setIsDeleteOpen(false);
      setSelectedEmail(null);
      window.dispatchEvent(new Event('outbox_updated'));
      fetchStats();
      fetchFeatureEmails(selectedFeature);
    } catch (_) {
      removeEmailFromHistory(targetId, user?.email);
      showToast('Email removed successfully', 'success');
      setIsDeleteOpen(false);
      setSelectedEmail(null);
      window.dispatchEvent(new Event('outbox_updated'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const openPreview = (email, e) => {
    if (e) e.stopPropagation();
    setSelectedEmail(email);
    setIsPreviewOpen(true);
  };

  const openDeleteDialog = (email, e) => {
    if (e) e.stopPropagation();
    setSelectedEmail(email);
    setIsDeleteOpen(true);
  };

  // Filtered emails based on search input
  const filteredEmails = featureEmails.filter((email) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (email.subject && email.subject.toLowerCase().includes(query)) ||
      (email.recipients && email.recipients.toLowerCase().includes(query)) ||
      (email.errorMessage && email.errorMessage.toLowerCase().includes(query))
    );
  });

  const getFeatureMeta = () => {
    switch (selectedFeature) {
      case 'FAILED':
        return {
          title: 'Failed Emails & Issues',
          subtitle: 'Emails that encountered delivery errors. Review error logs and click Retry to re-send.',
          color: 'rose',
          count: stats?.failed ?? 0,
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: AlertCircle,
        };
      case 'SCHEDULED':
        return {
          title: 'Scheduled in Outbox',
          subtitle: 'Emails currently queued for autonomous background delivery at their scheduled time.',
          color: 'amber',
          count: stats?.scheduled ?? 0,
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
        };
      case 'SENT':
        return {
          title: 'Sent / Delivered Emails',
          subtitle: 'Emails that were successfully delivered to all recipient inboxes.',
          color: 'emerald',
          count: stats?.sent ?? 0,
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
        };
      case 'ALL':
      default:
        return {
          title: 'Total Processed Campaigns',
          subtitle: 'All emails in your Outbox system across all delivery states.',
          color: 'sky',
          count: stats?.total ?? 0,
          badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: Send,
        };
    }
  };

  const featureMeta = getFeatureMeta();

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Email Outbox Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Automated scheduled delivery status and workforce email queue. Click any card below to view its emails!
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/compose"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 rounded-xl hover:from-sky-500 hover:to-indigo-500 transition shadow-md shadow-sky-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Compose & Schedule Email</span>
          </Link>
        </div>
      </div>

      {/* Google Direct Send Status Banner */}
      <div className="bg-gradient-to-r from-sky-50 via-indigo-50/40 to-white border border-sky-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white border border-sky-200 flex items-center justify-center text-sky-600 shrink-0 shadow-xs">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-800">Direct Gmail API Dispatch</h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                user?.googleAccessToken || user?.googleRefreshToken
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {user?.googleAccessToken || user?.googleRefreshToken ? 'ACTIVE (0 PASSWORDS)' : 'NOT CONNECTED'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user?.googleAccessToken || user?.googleRefreshToken
                ? `All emails are sent directly through Google Gmail API as ${user?.email}. Zero SMTP passwords.`
                : `Connect ${user?.email} with 1-click Google OAuth to send emails directly from your personal Gmail with 0 passwords.`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleConnectGmail}
          disabled={connectingGmail}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl shadow-xs transition shrink-0 disabled:opacity-50 ${
            user?.googleAccessToken || user?.googleRefreshToken
              ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              : 'bg-sky-600 hover:bg-sky-500 text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {connectingGmail
              ? 'Connecting...'
              : user?.googleAccessToken || user?.googleRefreshToken
              ? 'Reconnect Gmail'
              : `Connect ${user?.email || 'Gmail'}`}
          </span>
        </button>
      </div>

      {/* 4 Interactive Feature KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Scheduled in Outbox"
          value={stats?.scheduled ?? 0}
          icon={Clock}
          color="amber"
          trend="Awaiting dispatch"
          onClick={() => handleCardClick('SCHEDULED')}
          active={selectedFeature === 'SCHEDULED'}
        />
        <StatCard
          title="Sent / Delivered"
          value={stats?.sent ?? 0}
          icon={CheckCircle2}
          color="emerald"
          trend="Delivered successfully"
          onClick={() => handleCardClick('SENT')}
          active={selectedFeature === 'SENT'}
        />
        <StatCard
          title="Total Processed"
          value={stats?.total ?? 0}
          icon={Send}
          color="sky"
          trend="Lifetime campaigns"
          onClick={() => handleCardClick('ALL')}
          active={selectedFeature === 'ALL'}
        />
        <StatCard
          title="Failed / Issues"
          value={stats?.failed ?? 0}
          icon={AlertCircle}
          color="rose"
          trend="Requires review"
          onClick={() => handleCardClick('FAILED')}
          active={selectedFeature === 'FAILED'}
        />
      </div>

      {/* Dynamic Results Section for the Clicked Feature Card */}
      <div ref={resultsRef} className="scroll-mt-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Section Header with Tabs & Search */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${featureMeta.badgeBg}`}>
                    <featureMeta.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <span>{featureMeta.title}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${featureMeta.badgeBg}`}>
                        {featureMeta.count} emails
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{featureMeta.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Quick Tab Switcher */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleCardClick('FAILED')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                    selectedFeature === 'FAILED'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Failed ({stats?.failed ?? 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCardClick('SCHEDULED')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                    selectedFeature === 'SCHEDULED'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Scheduled ({stats?.scheduled ?? 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCardClick('SENT')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                    selectedFeature === 'SENT'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sent ({stats?.sent ?? 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCardClick('ALL')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                    selectedFeature === 'ALL'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>All ({stats?.total ?? 0})</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by subject, recipients, or error message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  fetchStats();
                  fetchFeatureEmails(selectedFeature);
                }}
                disabled={featureLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${featureLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Results Table / List */}
          <div className="p-6">
            {featureLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <LoadingSpinner size="md" />
                <p className="text-xs text-slate-400">Loading {featureMeta.title.toLowerCase()}...</p>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="py-16 text-center">
                <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3 ${featureMeta.badgeBg}`}>
                  <featureMeta.icon className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-700">No {featureMeta.title} Found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  {searchQuery
                    ? `No emails match your search query "${searchQuery}".`
                    : `There are currently no emails with status ${selectedFeature}.`}
                </p>
                {selectedFeature === 'FAILED' && stats?.failed === 0 && (
                  <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full font-medium border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Great job! All your emails have been delivered without issues.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEmails.map((email) => {
                  const isFailed = email.status === 'FAILED';
                  const isScheduled = email.status === 'SCHEDULED';
                  const isSent = email.status === 'SENT';

                  return (
                    <div
                      key={email.id}
                      onClick={() => openPreview(email)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                        isFailed
                          ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300'
                          : isScheduled
                          ? 'border-amber-200 bg-amber-50/10 hover:border-amber-300'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          {/* Subject & Status */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <EmailStatusBadge status={email.status} />
                            <h4 className="text-sm font-bold text-slate-800 truncate">
                              {email.subject || '(No Subject)'}
                            </h4>
                            {email.attachments && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                <Paperclip className="w-3 h-3" />
                                <span>Attachment</span>
                              </span>
                            )}
                          </div>

                          {/* Recipients */}
                          <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                            <span className="flex items-center gap-1 text-slate-400 font-medium">
                              <Users className="w-3.5 h-3.5" />
                              To ({email.recipientCount || 1}):
                            </span>
                            <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] truncate max-w-md">
                              {email.recipients}
                            </span>
                          </div>

                          {/* Failure Error Alert Box (Crucial for Failed Mails) */}
                          {isFailed && (
                            <div className="mt-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <div className="space-y-0.5 min-w-0">
                                <span className="font-bold text-rose-900 block">Dispatch Failure Reason:</span>
                                <p className="font-mono text-[11px] break-words text-rose-700">
                                  {email.errorMessage || 'Unknown SMTP error during dispatch. Please verify your SMTP settings.'}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Timing info */}
                          <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                            {email.scheduledAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Scheduled: {new Date(email.scheduledAt).toLocaleString()}
                              </span>
                            )}
                            {email.status === 'SENT' && email.sentAt && (
                              <span className="flex items-center gap-1 text-emerald-600">
                                <Check className="w-3 h-3" />
                                Delivered: {new Date(email.sentAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                          {/* Retry / Send Now (Available for Failed or Scheduled) */}
                          {(isFailed || isScheduled) && (
                            <button
                              type="button"
                              onClick={(e) => handleSendNow(email.id, e)}
                              disabled={actionLoadingId === email.id}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-white shadow-xs transition disabled:opacity-50 ${
                                isFailed
                                  ? 'bg-rose-600 hover:bg-rose-500'
                                  : 'bg-indigo-600 hover:bg-indigo-500'
                              }`}
                              title={isFailed ? 'Retry sending this failed email' : 'Send this email immediately'}
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 ${actionLoadingId === email.id ? 'animate-spin' : ''}`}
                              />
                              <span>{actionLoadingId === email.id ? 'Sending...' : isFailed ? 'Retry Now' : 'Send Now'}</span>
                            </button>
                          )}

                          {/* View Preview Button */}
                          <button
                            type="button"
                            onClick={(e) => openPreview(email, e)}
                            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                            title="View email preview & message"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Delete / Cancel Button */}
                          <button
                            type="button"
                            onClick={(e) => openDeleteDialog(email, e)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                            title="Delete this email"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Upcoming Scheduled & Recently Sent Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Upcoming Scheduled */}
        <Card
          title="Upcoming in Outbox"
          subtitle="Next emails in the automated queue"
          action={
            <Link
              to="/outbox"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {stats?.upcoming?.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.upcoming.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="max-w-xs">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.subject}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      {item.recipientCount} recipient(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                      {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {new Date(item.scheduledAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 text-sm">
              No emails currently scheduled.
            </div>
          )}
        </Card>

        {/* Recently Sent */}
        <Card
          title="Recently Delivered"
          subtitle="Latest successfully dispatched emails"
          action={
            <Link
              to="/sent"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View Sent History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {stats?.recentSent?.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.recentSent.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="max-w-xs">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.subject}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      {item.recipientCount} recipient(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Sent
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {item.sentAt ? new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 text-sm">
              No sent emails yet.
            </div>
          )}
        </Card>
      </div>

      {/* Email Preview Modal */}
      {selectedEmail && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setSelectedEmail(null);
          }}
          title={selectedEmail.subject || '(No Subject)'}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {/* Meta Header */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Delivery Status:</span>
                <EmailStatusBadge status={selectedEmail.status} />
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-1">
                  Recipients ({selectedEmail.recipientCount || 1}):
                </span>
                <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 font-mono text-[11px] max-h-24 overflow-y-auto break-all">
                  {selectedEmail.recipients}
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 text-slate-500">
                <span>Scheduled for: {new Date(selectedEmail.scheduledAt).toLocaleString()}</span>
                {selectedEmail.sentAt && (
                  <span className="text-emerald-600 font-medium">
                    Delivered: {new Date(selectedEmail.sentAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Error Message if Failed */}
            {selectedEmail.status === 'FAILED' && selectedEmail.errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <span className="font-bold block mb-1">❌ Failure Error:</span>
                <p className="font-mono text-[11px]">{selectedEmail.errorMessage}</p>
              </div>
            )}

            {/* Email Body */}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Message Body
              </span>
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap font-sans min-h-[150px] max-h-[300px] overflow-y-auto">
                {selectedEmail.body}
              </div>
            </div>

            {/* Attachments Section if present */}
            {(() => {
              let attList = [];
              try {
                if (selectedEmail.attachments) {
                  attList = typeof selectedEmail.attachments === 'string'
                    ? JSON.parse(selectedEmail.attachments)
                    : selectedEmail.attachments;
                }
              } catch (_) {}

              if (attList && attList.length > 0) {
                return (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                      Attachments ({attList.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {attList.map((att, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{att.filename}</span>
                          {att.size && (
                            <span className="text-[10px] text-slate-400">
                              ({(att.size / 1024).toFixed(0)} KB)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              {(selectedEmail.status === 'FAILED' || selectedEmail.status === 'SCHEDULED') && (
                <button
                  type="button"
                  onClick={() => handleSendNow(selectedEmail.id)}
                  disabled={actionLoadingId === selectedEmail.id}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${actionLoadingId === selectedEmail.id ? 'animate-spin' : ''}`}
                  />
                  <span>{actionLoadingId === selectedEmail.id ? 'Sending...' : 'Send / Retry Now'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsPreviewOpen(false);
                  setSelectedEmail(null);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedEmail(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Email"
        message={`Are you sure you want to remove the email "${selectedEmail?.subject || 'Untitled'}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        loading={actionLoadingId === selectedEmail?.id}
      />
    </div>
  );
};
