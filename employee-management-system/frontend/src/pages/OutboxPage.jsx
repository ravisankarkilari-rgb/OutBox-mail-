import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import {
  Clock,
  Send,
  Trash2,
  Eye,
  Plus,
  RefreshCw,
  Users,
  AlertCircle,
} from 'lucide-react';

export const OutboxPage = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { showToast } = useToast();

  const fetchOutbox = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/emails?status=SCHEDULED&limit=50');
      if (res.data?.success) {
        setEmails(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load outbox emails', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOutbox();
    // Auto-refresh every 15 seconds to catch live status changes
    const timer = setInterval(fetchOutbox, 15000);
    return () => clearInterval(timer);
  }, [fetchOutbox]);

  const handleSendNow = async (id) => {
    setActionLoading(true);
    try {
      await api.post(`/emails/${id}/send-now`);
      showToast('Email dispatched immediately!', 'success');
      fetchOutbox();
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
      showToast('Scheduled email cancelled and removed', 'success');
      setIsDeleteOpen(false);
      setSelectedEmail(null);
      fetchOutbox();
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Scheduled Outbox</h2>
          <p className="text-sm text-slate-500 mt-1">
            Emails queued for automated delivery at their scheduled time.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchOutbox}
            className="p-2 border rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
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
              { label: 'Scheduled Send Time' },
              { label: 'Status' },
              { label: 'Actions', className: 'text-right' },
            ]}
          >
            {emails.length > 0 ? (
              emails.map((item) => {
                const sendTime = new Date(item.scheduledAt);
                const isPast = sendTime <= new Date();

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{item.subject}</div>
                      <div className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-md">
                        {item.body.replace(/<[^>]*>?/gm, '')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                        <Users className="w-3.5 h-3.5" />
                        {item.recipientCount} recipient{item.recipientCount === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        {sendTime.toLocaleDateString()} at {sendTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {isPast ? (
                        <span className="text-[11px] font-medium text-amber-600 block mt-0.5 animate-pulse">
                          ⏳ Worker dispatching now...
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          In {Math.round((sendTime - new Date()) / 60000)} minute(s)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        Scheduled
                      </span>
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
                        <button
                          onClick={() => handleSendNow(item.id)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition"
                          title="Send Immediately"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send Now</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEmail(item);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Cancel Scheduled Email"
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
                  No emails currently scheduled. Click <b>Compose Email</b> to schedule one!
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
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Subject
              </span>
              <p className="font-semibold text-slate-800 text-base mt-0.5">{selectedEmail.subject}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Scheduled For
              </span>
              <p className="text-slate-700 mt-0.5">
                {new Date(selectedEmail.scheduledAt).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Recipients ({selectedEmail.recipientCount})
              </span>
              <div className="p-3 bg-slate-50 border rounded-xl font-mono text-xs text-slate-700 mt-1 max-h-32 overflow-y-auto">
                {selectedEmail.recipients}
              </div>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Message Body
              </span>
              <div
                className="p-4 bg-slate-50 border rounded-xl text-slate-800 mt-1 max-h-60 overflow-y-auto prose prose-sm"
                dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Cancel Scheduled Email"
        message={`Are you sure you want to cancel the scheduled email "${selectedEmail?.subject}"? It will not be sent.`}
        confirmText="Cancel Email"
        loading={actionLoading}
      />
    </div>
  );
};

