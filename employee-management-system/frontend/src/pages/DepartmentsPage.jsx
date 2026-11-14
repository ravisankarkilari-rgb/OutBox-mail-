import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { Building2, Plus, Edit2, Trash2, Users } from 'lucide-react';

export const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({ name: '', description: '' });
  const { showToast } = useToast();

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      if (res.data?.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/departments', formData);
      showToast('Department created successfully', 'success');
      setIsAddOpen(false);
      setFormData({ name: '', description: '' });
      fetchDepartments();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create department', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/departments/${selectedDept.id}`, formData);
      showToast('Department updated successfully', 'success');
      setIsEditOpen(false);
      fetchDepartments();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update department', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDept) return;
    setSubmitting(true);
    try {
      await api.delete(`/departments/${selectedDept.id}`);
      showToast('Department deleted successfully', 'success');
      setIsDeleteOpen(false);
      setSelectedDept(null);
      fetchDepartments();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete department', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (dept) => {
    setSelectedDept(dept);
    setFormData({ name: dept.name, description: dept.description || '' });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Departments</h2>
          <p className="text-sm text-slate-500 mt-1">
            Organize divisions, departments and manage headcount distribution.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', description: '' });
            setIsAddOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-500 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Departments Table */}
      <Card className="!p-0">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <Table
            headers={[
              { label: 'Department Name' },
              { label: 'Description' },
              { label: 'Assigned Employees' },
              { label: 'Actions', className: 'text-right' },
            ]}
          >
            {departments.length > 0 ? (
              departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-800">{dept.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 max-w-md truncate">
                    {dept.description || 'No description provided'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      {dept._count?.employees || 0} employees
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEdit(dept)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                        title="Edit Department"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDept(dept);
                          setIsDeleteOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Department"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                  No departments created yet.
                </td>
              </tr>
            )}
          </Table>
        )}
      </Card>

      {/* Add Department Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Department">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Department Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Product Engineering"
              className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Responsibilities, scope, team focus..."
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
              {submitting ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Department Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Department">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Department Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div className="pt-4 flex justify-end space-x-3 border-t">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Update Department'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
        message={`Are you sure you want to delete "${selectedDept?.name}"? You can only delete departments that have 0 assigned employees.`}
        confirmText="Confirm Delete"
        loading={submitting}
      />
    </div>
  );
};

