import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmailStatusBadge } from '../components/Badge';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getSavedHistory, persistHistory } from '../utils/historyStorage';
import {
  Clock,
  Send,
  Trash2,
  Eye,
  Plus,
  RefreshCw,
  Users,
  AlertCircle,
  Paperclip,
  CheckCircle2,
  Inbox,
  Filter,
} from 'lucide-react';

export const OutboxPage = () => {
  const { user } = useAuth();
  const [emails, setEmails] = useState(() => getSavedHistory(user?.email));
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'SCHEDULED' | 'SENT' | 'FAILED'
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { showToast } = useToast();

  // Fetch emails from API and sync with local persistent history
  const fetchOutbox = useCallback(async (tab = activeTab) => {
    try {
      const statusParam = tab === 'ALL' ? '' : `&status=${tab}`;
      const res = await api.get(`/emails?limit=100${statusParam}`);
      if (res.data?.success) {
        const fetchedEmails = res.data.data || [];
        
        // Merge with locally cached history so serverless cold starts never wipe history
        const cachedList = getSavedHistory(user?.email);
        
        const mergedMap = new Map();
        // Add cached items first
        cachedList.forEach((e) => mergedMap.set(e.id, e));
        // Overwrite/update with latest fresh items from server
        fetchedEmails.forEach((e) => mergedMap.set(e.id, e));

        persistHistory(Array.from(mergedMap.values()), user?.email);
        const cleanList = getSavedHistory(user?.email);

        // Filter based on active tab
        if (tab === 'ALL') {
          setEmails(cleanList);
        } else {
          setEmails(cleanList.filter((e) => e.status === tab));
        }
      }
    } catch (err) {
      console.warn('API fetch notice, reading from persistent local cache:', err.message);
      const cachedList = getSavedHistory(user?.email);
      if (tab === 'ALL') {
        setEmails(cachedList);
      } else {
        setEmails(cachedList.filter((e) => e.status === tab));
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, user?.email]);

  useEffect(() => {
    fetchOutbox(activeTab);
    const handleUpdate = () => fetchOutbox(activeTab);
    window.addEventListener('outbox_updated', handleUpdate);
    // Auto-refresh every 15 seconds to catch live status changes
    const timer = setInterval(() => fetchOutbox(activeTab), 15000);
    return () => {
      clearInterval(timer);
      window.removeEventListener('outbox_updated', handleUpdate);
    };
  }, [fetchOutbox, activeTab]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const cachedList = getSavedHistory(user?.email);
    if (newTab === 'ALL') {
      setEmails(cachedList);
    } else {
      setEmails(cachedList.filter((e) => e.status === newTab));
    }
    fetchOutbox(newTab);
  };

  const handleSendNow = async (id) => {
    setActionLoading(true);
    try {
      await api.post(`/emails/${id}/send-now`);
      showToast('Email dispatched immediately!', 'success');
      // Update item in local list and storage
      const updated = emails.map((e) =>
        e.id === id ? { ...e, status: 'SENT', sentAt: new Date().toISOString() } : e
      );
      setEmails(updated);
      persistHistory(updated, user?.email);
      fetchOutbox(activeTab);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to dispatch email', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEmail) return;
    setActionLoading(true);
    try {
      await api.delete(`/emails/${selectedEmail.id}`);
      showToast('Email removed from outbox', 'success');
      setIsDeleteOpen(false);
      setSelectedEmail(null);
      // Remove from state & cache
      const updated = emails.filter((e) => e.id !== selectedEmail.id);
      setEmails(updated);
      const remainingHistory = getSavedHistory(user?.email).filter((e) => e.id !== selectedEmail.id);
      persistHistory(remainingHistory, user?.email);
      fetchOutbox(activeTab);
    } catch (err) {
      showToast('Failed to cancel scheduled email', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openPreview = (email) => {
    setSelectedEmail(email);
    setIsPreviewOpen(true);
  };

  // Helper counts computed directly from full persistent history
  const allCached = getSavedHistory(user?.email);
  const countScheduled = allCached.filter((e) => e.status === 'SCHEDULED').length;
  const countSent = allCached.filter((e) => e.status === 'SENT').length;
  const countFailed = allCached.filter((e) => e.status === 'FAILED').length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Email Outbox & History</h2>
          <p className="text-sm text-slate-500 mt-1">
            Track all scheduled, delivered, and previous email dispatches.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchOutbox(activeTab)}
            className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
            title="Refresh Outbox"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/compose"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-500 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Compose Email</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => handleTabChange('ALL')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All History ({allCached.length})
        </button>
        <button
          onClick={() => handleTabChange('SCHEDULED')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === 'SCHEDULED'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Scheduled Pending ({countScheduled})
        </button>
        <button
          onClick={() => handleTabChange('SENT')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === 'SENT'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Sent & Delivered ({countSent})
        </button>
        <button
          onClick={() => handleTabChange('FAILED')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === 'FAILED'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Failed ({countFailed})
        </button>
      </div>

      {/* Outbox Table */}
      <Card className="!p-0">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <Table
            headers={[
              { label: 'Subject' },
              { label: 'Recipients' },
              { label: 'Time' },
              { label: 'Status' },
              { label: 'Actions', className: 'text-right' },
            ]}
          >
            {emails.length > 0 ? (
              emails.map((item) => {
                const sendTime = item.scheduledAt ? new Date(item.scheduledAt) : new Date(item.createdAt);
                const isPast = sendTime <= new Date();

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{item.subject}</div>
                      <div className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-md">
                        {item.body ? item.body.replace(/<[^>]*>?/gm, '') : '(No content)'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                        <Users className="w-3.5 h-3.5" />
                        {item.recipientCount || (item.recipients ? item.recipients.split(',').length : 1)} recipient(s)
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {sendTime.toLocaleDateString()} at {sendTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {item.status === 'SCHEDULED' && (
                        <span className="text-[11px] font-medium text-amber-600 block mt-0.5">
                          {isPast
                            ? '⏳ Ready for dispatch'
                            : `⏳ Scheduled for ${sendTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                      )}
                      {item.status === 'SENT' && item.sentAt && (
                        <span className="text-[11px] text-emerald-600 block mt-0.5">
                          ✓ Delivered at {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {item.status === 'FAILED' && item.errorMessage && (
                        <span className="text-[11px] text-rose-600 block mt-0.5 truncate max-w-xs" title={item.errorMessage}>
                          Error: {item.errorMessage}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <EmailStatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openPreview(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition"
                          title="Preview Email"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(item.status === 'SCHEDULED' || item.status === 'FAILED') && (
                          <button
                            onClick={() => handleSendNow(item.id)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition"
                            title={item.status === 'FAILED' ? 'Retry Delivery' : 'Send Immediately'}
                          >
                            <Send className="w-3 h-3" />
                            <span>{item.status === 'FAILED' ? 'Retry' : 'Send Now'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedEmail(item);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Remove Email"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                  No {activeTab === 'ALL' ? '' : activeTab.toLowerCase()} emails found in your outbox history.
                </td>
              </tr>
            )}
          </Table>
        )}
      </Card>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Email Details Preview"
        maxWidth="max-w-2xl"
      >
        {selectedEmail && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Status:</span>
              <EmailStatusBadge status={selectedEmail.status} />
            </div>

            <div>
              <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider block mb-1">
                Recipients:
              </span>
              <div className="p-3 bg-slate-50 rounded-xl text-slate-700 font-mono text-xs break-all max-h-32 overflow-y-auto">
                {selectedEmail.recipients}
              </div>
            </div>

            <div>
              <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider block mb-1">
                Subject:
              </span>
              <p className="font-semibold text-slate-800 text-base">{selectedEmail.subject}</p>
            </div>

            <div>
              <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider block mb-1">
                Message Body:
              </span>
              <div
                className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed max-h-60 overflow-y-auto"
                dangerouslySetInnerHTML={{
                  __html: selectedEmail.body || '<span class="text-slate-400 italic">No body content</span>',
                }}
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete / Cancel Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove Email from Outbox"
        message="Are you sure you want to remove this email record from your history? This action cannot be undone."
        confirmText="Remove"
        loading={actionLoading}
      />
    </div>
  );
};

export default OutboxPage;
