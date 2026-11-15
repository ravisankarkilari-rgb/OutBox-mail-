import React, { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSavedHistory, saveEmailToHistory } from '../utils/historyStorage';
import api from '../services/api';

export const MainLayout = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isDispatchingRef = useRef(new Set());

  // Autonomous background scheduler: checks every 3 seconds for scheduled emails whose time has arrived
  useEffect(() => {
    const checkAndDispatchDueEmails = async () => {
      const history = getSavedHistory(user?.email);
      const now = Date.now();

      // Find all scheduled emails whose time has arrived
      const dueEmails = history.filter(
        (e) =>
          e.status === 'SCHEDULED' &&
          e.scheduledAt &&
          new Date(e.scheduledAt).getTime() <= now &&
          !isDispatchingRef.current.has(e.id)
      );

      for (const item of dueEmails) {
        isDispatchingRef.current.add(item.id);
        console.log(`⏱️ Scheduled send time arrived for "${item.subject}". Dispatching now...`);

        try {
          await api.post(`/emails/${item.id}/send-now`, {
            emailData: item,
          });

          const deliveredItem = {
            ...item,
            status: 'SENT',
            sentAt: new Date().toISOString(),
            errorMessage: null,
          };
          saveEmailToHistory(deliveredItem, user?.email);
          window.dispatchEvent(new Event('outbox_updated'));
          showToast(`⚡ Scheduled email "${item.subject}" delivered successfully!`, 'success');
        } catch (err) {
          console.error('Automated dispatch failed:', err);
          const failedItem = {
            ...item,
            status: 'FAILED',
            errorMessage: err.response?.data?.message || err.message || 'Delivery failed',
          };
          saveEmailToHistory(failedItem, user?.email);
          window.dispatchEvent(new Event('outbox_updated'));
          showToast(`Failed to deliver scheduled email "${item.subject}": ${failedItem.errorMessage}`, 'error');
        } finally {
          isDispatchingRef.current.delete(item.id);
        }
      }
    };

    // Run check immediately and then every 3 seconds
    checkAndDispatchDueEmails();
    const interval = setInterval(checkAndDispatchDueEmails, 3000);
    return () => clearInterval(interval);
  }, [user?.email, showToast]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

