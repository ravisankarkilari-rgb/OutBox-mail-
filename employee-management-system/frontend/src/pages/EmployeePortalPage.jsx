import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { StatusBadge, RatingBadge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Building2,
  Calendar,
  DollarSign,
  Phone,
  MapPin,
  Save,
  Award,
  Clock,
  Shield,
} from 'lucide-react';

export const EmployeePortalPage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Permitted self-update fields
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const { showToast } = useToast();
  const { user } = useAuth();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees/me');
      if (res.data?.success) {
        const emp = res.data.data;
        setProfile(emp);
        setPhone(emp.phone || '');
        setAddress(emp.address || '');
      }
    } catch (err) {
      showToast('Failed to load employee portal profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateContact = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/employees/me', { phone, address });
      showToast('Contact information updated successfully', 'success');
      fetchProfile();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl p-8 border">
        <p className="text-slate-500">
          No employee profile record is currently linked to your user account ({user?.email}).
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Please contact the HR administrator to link your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-sky-600/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-bold">
            {profile.firstName[0]}
            {profile.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {profile.firstName} {profile.lastName}
              </h1>
              <StatusBadge status={profile.status} />
            </div>
            <p className="text-sky-100 text-sm mt-0.5">{profile.designation}</p>
            <p className="text-xs font-mono text-sky-200 mt-1">Employee ID: {profile.employeeId}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
          <div>
            <span className="text-sky-200 block uppercase font-medium">Department</span>
            <span className="font-semibold flex items-center gap-1 mt-0.5">
              <Building2 className="w-3.5 h-3.5" />
              {profile.department?.name || 'Unassigned'}
            </span>
          </div>
          <div className="border-l border-white/20 pl-4">
            <span className="text-sky-200 block uppercase font-medium">Annual Salary</span>
            <span className="font-semibold flex items-center gap-1 mt-0.5">
              <DollarSign className="w-3.5 h-3.5" />$
              {Number(profile.salary).toLocaleString()}
            </span>
          </div>
          <div className="border-l border-white/20 pl-4">
            <span className="text-sky-200 block uppercase font-medium">Joining Date</span>
            <span className="font-semibold flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(profile.joiningDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Job Details & Edit Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employment Info Card */}
        <Card title="Employment Information" subtitle="Official corporate record">
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="py-3 flex justify-between">
              <dt className="text-slate-500">Employee ID</dt>
              <dd className="font-mono font-medium text-slate-800">{profile.employeeId}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-slate-500">Department</dt>
              <dd className="font-medium text-slate-800">{profile.department?.name}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-slate-500">Designation</dt>
              <dd className="font-medium text-slate-800">{profile.designation}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-slate-500">Corporate Email</dt>
              <dd className="font-medium text-slate-800">{profile.email}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd>
                <StatusBadge status={profile.status} />
              </dd>
            </div>
          </dl>
        </Card>

        {/* Update Permitted Contact Information */}
        <Card
          title="Personal Contact Information"
          subtitle="You may update your personal contact phone and home address"
        >
          <form onSubmit={handleUpdateContact} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1-555-0100"
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Home Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, Postal Code"
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-sm disabled:opacity-50 transition"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Updates'}</span>
              </button>
            </div>
          </form>
        </Card>
      </div>

      {/* Performance Evaluations Section */}
      <Card
        title="My Performance Reviews"
        subtitle="Appraisal ratings and feedback shared by your manager"
      >
        <Table
          headers={[
            { label: 'Review Date' },
            { label: 'Rating' },
            { label: 'Score' },
            { label: 'Feedback' },
            { label: 'Future Goals' },
            { label: 'Evaluator' },
          ]}
        >
          {profile.evaluations?.length > 0 ? (
            profile.evaluations.map((ev) => (
              <tr key={ev.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                  {new Date(ev.evaluationDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <RatingBadge rating={ev.rating} />
                </td>
                <td className="px-6 py-4 font-bold text-slate-800 text-sm">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                      ev.score >= 80
                        ? 'bg-emerald-100 text-emerald-800'
                        : ev.score >= 60
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {ev.score} / 100
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-600 max-w-xs">{ev.comments || '—'}</td>
                <td className="px-6 py-4 text-xs text-slate-600 max-w-xs">{ev.goals || '—'}</td>
                <td className="px-6 py-4 text-xs font-medium text-slate-500">{ev.evaluatorName}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">
                No performance evaluations logged yet.
              </td>
            </tr>
          )}
        </Table>
      </Card>
    </div>
  );
};
