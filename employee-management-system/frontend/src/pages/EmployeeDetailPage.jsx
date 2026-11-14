import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { StatusBadge, RatingBadge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  Award,
  Plus,
  Star,
} from 'lucide-react';

export const EmployeeDetailPage = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddEvalOpen, setIsAddEvalOpen] = useState(false);
  const [evalSubmitting, setEvalSubmitting] = useState(false);

  const initialEvalState = {
    evaluationDate: new Date().toISOString().split('T')[0],
    rating: 'GOOD',
    score: 85,
    comments: '',
    goals: '',
    achievements: '',
    evaluatorName: 'Admin',
  };
  const [evalForm, setEvalForm] = useState(initialEvalState);

  const { showToast } = useToast();
  const { isAdmin } = useAuth();

  const fetchEmployee = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/employees/${id}`);
      if (res.data?.success) {
        setEmployee(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load employee details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const handleAddEvalSubmit = async (e) => {
    e.preventDefault();
    setEvalSubmitting(true);
    try {
      const payload = {
        employeeId: employee.id,
        evaluationDate: new Date(evalForm.evaluationDate).toISOString(),
        rating: evalForm.rating,
        score: parseInt(evalForm.score, 10),
        comments: evalForm.comments,
        goals: evalForm.goals,
        achievements: evalForm.achievements,
        evaluatorName: evalForm.evaluatorName,
      };
      await api.post('/evaluations', payload);
      showToast('Performance evaluation added', 'success');
      setIsAddEvalOpen(false);
      setEvalForm(initialEvalState);
      fetchEmployee();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add evaluation', 'error');
    } finally {
      setEvalSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Employee not found.</p>
        <Link to="/admin/employees" className="mt-4 inline-block text-sky-600 font-semibold">
          ← Back to Employees
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/employees"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </Link>
        {isAdmin && (
          <button
            onClick={() => setIsAddEvalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-500 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Performance Review</span>
          </button>
        )}
      </div>

      {/* Hero Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-sky-500/20">
            {employee.firstName[0]}
            {employee.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">
                {employee.firstName} {employee.lastName}
              </h1>
              <StatusBadge status={employee.status} />
            </div>
            <p className="text-sm font-medium text-slate-500 mt-0.5">{employee.designation}</p>
            <p className="text-xs font-mono font-medium text-sky-600 mt-1">ID: {employee.employeeId}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <span className="text-slate-400 block uppercase font-medium">Department</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {employee.department?.name || 'Unassigned'}
            </span>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <span className="text-slate-400 block uppercase font-medium">Annual Salary</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />$
              {Number(employee.salary).toLocaleString()}
            </span>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <span className="text-slate-400 block uppercase font-medium">Joined</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {new Date(employee.joiningDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Contact & Personal Information">
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="py-3 flex justify-between">
              <dt className="text-slate-500">Email Address</dt>
              <dd className="font-medium text-slate-800">{employee.email}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-slate-500">Phone Number</dt>
              <dd className="font-medium text-slate-800">{employee.phone || 'Not provided'}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-slate-500">Home Address</dt>
              <dd className="font-medium text-slate-800">{employee.address || 'Not provided'}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-slate-500">Account Role</dt>
              <dd className="font-medium text-slate-800">{employee.user?.role || 'EMPLOYEE'}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Employment Overview">
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="py-3 flex justify-between">
              <dt className="text-slate-500">Department</dt>
              <dd className="font-medium text-slate-800">{employee.department?.name}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-slate-500">Designation</dt>
              <dd className="font-medium text-slate-800">{employee.designation}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-slate-500">System ID</dt>
              <dd className="font-mono text-xs text-slate-600">{employee.id}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-slate-500">User Status</dt>
              <dd className="font-medium text-slate-800">
                {employee.user?.isActive ? 'Active Login' : 'Disabled'}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Performance Evaluations History */}
      <Card
        title="Performance Evaluation History"
        subtitle="Historical reviews, appraisal ratings and scores"
      >
        <Table
          headers={[
            { label: 'Date' },
            { label: 'Rating' },
            { label: 'Score' },
            { label: 'Comments' },
            { label: 'Goals' },
            { label: 'Evaluator' },
          ]}
        >
          {employee.evaluations?.length > 0 ? (
            employee.evaluations.map((ev) => (
              <tr key={ev.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                  {new Date(ev.evaluationDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <RatingBadge rating={ev.rating} />
                </td>
                <td className="px-6 py-4 font-bold text-slate-800 text-sm">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md ${
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
                <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                  {ev.comments || '—'}
                </td>
                <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                  {ev.goals || '—'}
                </td>
                <td className="px-6 py-4 text-xs font-medium text-slate-500">
                  {ev.evaluatorName}
                </td>
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

      {/* Add Evaluation Modal */}
      <Modal
        isOpen={isAddEvalOpen}
        onClose={() => setIsAddEvalOpen(false)}
        title={`New Performance Review for ${employee.firstName} ${employee.lastName}`}
      >
        <form onSubmit={handleAddEvalSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Review Date
              </label>
              <input
                type="date"
                required
                value={evalForm.evaluationDate}
                onChange={(e) => setEvalForm({ ...evalForm, evaluationDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Rating
              </label>
              <select
                value={evalForm.rating}
                onChange={(e) => setEvalForm({ ...evalForm, rating: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
              >
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="AVERAGE">Average</option>
                <option value="BELOW_AVERAGE">Below Average</option>
                <option value="POOR">Poor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Score (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={evalForm.score}
                onChange={(e) => setEvalForm({ ...evalForm, score: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Evaluator Name
              </label>
              <input
                type="text"
                required
                value={evalForm.evaluatorName}
                onChange={(e) => setEvalForm({ ...evalForm, evaluatorName: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Feedback / Comments
            </label>
            <textarea
              rows={3}
              value={evalForm.comments}
              onChange={(e) => setEvalForm({ ...evalForm, comments: e.target.value })}
              placeholder="Highlight strengths, performance highlights..."
              className="w-full px-3 py-2 border rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Goals for Next Period
            </label>
            <textarea
              rows={2}
              value={evalForm.goals}
              onChange={(e) => setEvalForm({ ...evalForm, goals: e.target.value })}
              placeholder="Key objectives to achieve..."
              className="w-full px-3 py-2 border rounded-xl text-sm"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t">
            <button
              type="button"
              onClick={() => setIsAddEvalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={evalSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-sm disabled:opacity-50"
            >
              {evalSubmitting ? 'Saving...' : 'Record Review'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
