import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Card, StatCard } from '../components/Card';
import { Table } from '../components/Table';
import { RatingBadge } from '../components/Badge';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { Award, Plus, Trash2, Calendar, Star, TrendingUp } from 'lucide-react';

export const PerformancePage = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filter
  const [selectedEmp, setSelectedEmp] = useState('');

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEval, setSelectedEval] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    employeeId: '',
    evaluationDate: new Date().toISOString().split('T')[0],
    rating: 'GOOD',
    score: 85,
    comments: '',
    goals: '',
    achievements: '',
    evaluatorName: 'Admin',
  };
  const [formData, setFormData] = useState(initialForm);

  const { showToast } = useToast();

  const fetchEvaluations = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (selectedEmp) params.employeeId = selectedEmp;
        const res = await api.get('/evaluations', { params });
        if (res.data?.success) {
          setEvaluations(res.data.data);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        showToast('Failed to load performance evaluations', 'error');
      } finally {
        setLoading(false);
      }
    },
    [selectedEmp, showToast]
  );

  const fetchEmployeesList = async () => {
    try {
      const res = await api.get('/employees?limit=100');
      if (res.data?.success) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployeesList();
  }, []);

  useEffect(() => {
    fetchEvaluations(1);
  }, [fetchEvaluations]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        score: parseInt(formData.score, 10),
        evaluationDate: new Date(formData.evaluationDate).toISOString(),
      };
      await api.post('/evaluations', payload);
      showToast('Evaluation recorded successfully', 'success');
      setIsAddOpen(false);
      setFormData(initialForm);
      fetchEvaluations(1);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to record evaluation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEval) return;
    setSubmitting(true);
    try {
      await api.delete(`/evaluations/${selectedEval.id}`);
      showToast('Evaluation removed', 'success');
      setIsDeleteOpen(false);
      setSelectedEval(null);
      fetchEvaluations(pagination.page);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete evaluation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick stats calculation
  const averageScore = evaluations.length
    ? Math.round(evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Performance Tracking</h2>
          <p className="text-sm text-slate-500 mt-1">
            Maintain employee appraisal records, ratings and target achievement benchmarks.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData(initialForm);
            setIsAddOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-500 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Evaluation</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Evaluations"
          value={pagination.total}
          icon={Award}
          color="violet"
          trend="Appraisal records"
        />
        <StatCard
          title="Average Score"
          value={`${averageScore} / 100`}
          icon={TrendingUp}
          color="emerald"
          trend="Overall workforce average"
        />
        <StatCard
          title="Top Rating Tier"
          value="Excellent"
          icon={Star}
          color="amber"
          trend="Score >= 90"
        />
      </div>

      {/* Filter Bar */}
      <Card className="!p-4">
        <div className="max-w-xs">
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
            Filter by Employee
          </label>
          <select
            value={selectedEmp}
            onChange={(e) => setSelectedEmp(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-xl bg-white focus:ring-2 focus:ring-sky-500 text-slate-700"
          >
            <option value="">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName} ({e.employeeId})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Evaluations Table */}
      <Card className="!p-0">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <Table
              headers={[
                { label: 'Employee' },
                { label: 'Evaluation Date' },
                { label: 'Rating' },
                { label: 'Score' },
                { label: 'Comments' },
                { label: 'Evaluator' },
                { label: 'Actions', className: 'text-right' },
              ]}
            >
              {evaluations.length > 0 ? (
                evaluations.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {ev.employee?.firstName} {ev.employee?.lastName}
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        {ev.employee?.employeeId} • {ev.employee?.designation}
                      </div>
                    </td>
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
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                      {ev.comments || '—'}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {ev.evaluatorName}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedEval(ev);
                          setIsDeleteOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Evaluation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No performance evaluations recorded yet.
                  </td>
                </tr>
              )}
            </Table>
            <Pagination
              pagination={pagination}
              onPageChange={(page) => fetchEvaluations(page)}
            />
          </>
        )}
      </Card>

      {/* New Evaluation Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record Performance Review">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Select Employee *
            </label>
            <select
              required
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Choose Employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeId} — {e.designation})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Evaluation Date *
              </label>
              <input
                type="date"
                required
                value={formData.evaluationDate}
                onChange={(e) => setFormData({ ...formData, evaluationDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Performance Rating *
              </label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-sky-500"
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
                Score (0-100) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Evaluator Name *
              </label>
              <input
                type="text"
                required
                value={formData.evaluatorName}
                onChange={(e) => setFormData({ ...formData, evaluatorName: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Feedback / Appraisal Comments
            </label>
            <textarea
              rows={3}
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              placeholder="Strengths, areas for growth..."
              className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Save Evaluation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Evaluation Record"
        message="Are you sure you want to remove this evaluation record? This will alter historical performance metrics."
        confirmText="Delete Record"
        loading={submitting}
      />
    </div>
  );
};

