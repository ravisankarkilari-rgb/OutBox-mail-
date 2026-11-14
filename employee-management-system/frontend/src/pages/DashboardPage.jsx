import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { StatCard, Card } from '../components/Card';
import { Table } from '../components/Table';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Users,
} from 'lucide-react';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/emails/stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Email Outbox Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Automated scheduled delivery status and workforce email queue.
          </p>
        </div>
        <Link
          to="/compose"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 rounded-xl hover:from-sky-500 hover:to-indigo-500 transition shadow-md shadow-sky-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Compose & Schedule Email</span>
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Scheduled in Outbox"
          value={stats?.scheduled ?? 0}
          icon={Clock}
          color="amber"
          trend="Awaiting dispatch"
        />
        <StatCard
          title="Sent / Delivered"
          value={stats?.sent ?? 0}
          icon={CheckCircle2}
          color="emerald"
          trend="Delivered successfully"
        />
        <StatCard
          title="Total Processed"
          value={stats?.total ?? 0}
          icon={Send}
          color="sky"
          trend="Lifetime campaigns"
        />
        <StatCard
          title="Failed / Issues"
          value={stats?.failed ?? 0}
          icon={AlertCircle}
          color="rose"
          trend="Requires review"
        />
      </div>

      {/* Grid: Upcoming Scheduled & Recently Sent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>View All</span>
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
    </div>
  );
};

