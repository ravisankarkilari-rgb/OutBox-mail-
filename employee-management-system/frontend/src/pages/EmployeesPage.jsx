import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { StatusBadge } from '../components/Badge';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import {
  Search,
  Plus,
  Download,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Building2,
  Mail,
  Phone,
} from 'lucide-react';

export const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add/Edit Form State
  const initialFormState = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    designation: '',
    joiningDate: new Date().toISOString().split('T')[0],
    salary: '',
    status: 'ACTIVE',
    password: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const { showToast } = useToast();

  const fetchEmployees = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (search) params.search = search;
        if (selectedDept) params.departmentId = selectedDept;
        if (selectedStatus) params.status = selectedStatus;

        const res = await api.get('/employees', { params });
        if (res.data?.success) {
          setEmployees(res.data.data);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        showToast('Failed to load employees', 'error');
      } finally {
        setLoading(false);
      }
    },
    [search, selectedDept, selectedStatus, showToast]
  );

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.data?.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchEmployees]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        salary: parseFloat(formData.salary),
        joiningDate: new Date(formData.joiningDate).toISOString(),
      };
      await api.post('/employees', payload);
      showToast('Employee created successfully', 'success');
      setIsAddModalOpen(false);
      setFormData(initialFormState);
      fetchEmployees(1);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create employee', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        departmentId: formData.departmentId,
        designation: formData.designation,
        salary: parseFloat(formData.salary),
        status: formData.status,
      };
      await api.put(`/employees/${selectedEmployee.id}`, payload);
      showToast('Employee updated successfully', 'success');
      setIsEditModalOpen(false);
      fetchEmployees(pagination.page);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update employee', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEmployee) return;
    setSubmitting(true);
    try {
      await api.delete(`/employees/${selectedEmployee.id}`);
      showToast('Employee deleted successfully', 'success');
      setIsDeleteOpen(false);
      setSelectedEmployee(null);
      fetchEmployees(pagination.page);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete employee', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone || '',
      departmentId: emp.departmentId,
      designation: emp.designation,
      joiningDate: emp.joiningDate.split('T')[0],
      salary: emp.salary,
      status: emp.status,
      password: '',
    });
    setIsEditModalOpen(true);
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/reports/employees/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('CSV exported successfully', 'success');
    } catch (err) {
      showToast('Failed to export CSV', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Employees Directory</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage your workforce, roles, salaries, and credentials.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setFormData(initialFormState);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-500 transition shadow-sm shadow-sky-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="!p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, employee ID..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-700"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Employees Table */}
      <Card className="!p-0">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <Table
              headers={[
                { label: 'Employee ID' },
                { label: 'Name' },
                { label: 'Department' },
                { label: 'Designation' },
                { label: 'Salary' },
                { label: 'Status' },
                { label: 'Actions', className: 'text-right' },
              ]}
            >
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-mono font-medium text-slate-700 text-xs">
                      {emp.employeeId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span>{emp.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-100 px-2 py-1 rounded-md text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        {emp.department?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium text-xs">
                      {emp.designation}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-700 text-xs">
                      ${Number(emp.salary).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/admin/employees/${emp.id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                          title="Edit Employee"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No employees matching the current filters.
                  </td>
                </tr>
              )}
            </Table>
            <Pagination
              pagination={pagination}
              onPageChange={(page) => fetchEmployees(page)}
            />
          </>
        )}
      </Card>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Employee"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1-555-0100"
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Department *
              </label>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Designation *
              </label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Salary ($/yr) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="75000"
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Joining Date *
              </label>
              <input
                type="date"
                required
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-sky-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Initial Login Password *
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Min. 8 chars with uppercase, number & symbol"
              className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Employee — ${selectedEmployee?.employeeId}`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Department
              </label>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Designation
              </label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Salary ($/yr)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Details'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Employee"
        message={`Are you sure you want to permanently delete ${selectedEmployee?.firstName} ${selectedEmployee?.lastName} (${selectedEmployee?.employeeId})? This action will remove their credentials and evaluation records.`}
        confirmText="Confirm Delete"
        loading={submitting}
      />
    </div>
  );
};

