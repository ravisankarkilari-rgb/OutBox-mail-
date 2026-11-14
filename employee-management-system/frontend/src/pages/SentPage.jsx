import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, Eye, Users, Calendar, Clock, RefreshCw } from 'lucide-react';

export const SentPage = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { showToast } = useToast();

  const fetchSentEmails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/emails?status=SENT&limit=50');
      if (res.data?.success) {
        setEmails(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load sent emails', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSentEmails();
  }, [fetchSentEmails]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sent Emails History</h2>
          <p className="text-sm text-slate-500 mt-1">
            Log of all successfully dispatched and delivered automated emails.
          </p>
        </div>
        <button
          onClick={fetchSentEmails}
          className="p-2 border rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
          title="Refresh History"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Sent Table */}
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
              { label: 'Delivered At' },
              { label: 'Status' },
              { label: 'Actions', className: 'text-right' },
            ]}
          >
            {emails.length > 0 ? (
              emails.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{item.subject}</div>
                    <div className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-md">
                      {item.body.replace(/<[^>]*>?/gm, '')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <Users className="w-3.5 h-3.5" />
                      {item.recipientCount} recipient{item.recipientCount === 1 ? '' : 's'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.sentAt ? new Date(item.sentAt).toLocaleString() : 'Just now'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Delivered
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedEmail(item);
                        setIsPreviewOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition"
                      title="Inspect Email"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                  No sent emails in history yet.
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
        title="Sent Email Delivery Record"
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
                Delivered At
              </span>
              <p className="text-emerald-700 font-medium mt-0.5">
                {selectedEmail.sentAt ? new Date(selectedEmail.sentAt).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Delivered Recipients ({selectedEmail.recipientCount})
              </span>
              <div className="p-3 bg-slate-50 border rounded-xl font-mono text-xs text-slate-700 mt-1 max-h-32 overflow-y-auto">
                {selectedEmail.recipients}
              </div>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Message Content
              </span>
              <div
                className="p-4 bg-slate-50 border rounded-xl text-slate-800 mt-1 max-h-60 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
