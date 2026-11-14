import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { StatusBadge, RatingBadge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { Download, Filter, FileSpreadsheet, Building2, Calendar } from 'lucide-react';

export const ReportsPage = () => {
  const [reportData, setReportData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { showToast } = useToast();

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.data?.success) setDepartments(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDept) params.departmentId = selectedDept;
      if (selectedStatus) params.status = selectedStatus;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/reports/employees', { params });
      if (res.data?.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load employee report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [selectedDept, selectedStatus, startDate, endDate]);

  const handleExportCSV = async () => {
    try {
      const params = {};
      if (selectedDept) params.departmentId = selectedDept;
      if (selectedStatus) params.status = selectedStatus;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/reports/employees/export', {
        params,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `workforce_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Report CSV downloaded successfully', 'success');
    } catch (err) {
      showToast('Failed to download CSV', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reports & Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">
            Generate customized workforce reports and export CSV summaries.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 transition shadow-sm shadow-emerald-600/20"
        >
          <Download className="w-4 h-4" />
          <span>Export Filtered CSV</span>
        </button>
      </div>

      {/* Filter Card */}
      <Card title="Report Criteria & Filters" subtitle="Tailor the report parameters below">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-xl bg-white focus:ring-2 focus:ring-sky-500 text-slate-700"
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
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Employment Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-xl bg-white focus:ring-2 focus:ring-sky-500 text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Joined After
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Joined Before
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </Card>

      {/* Report Table */}
      <Card
        title={`Generated Workforce Report (${reportData.length} records)`}
        subtitle="Live dataset preview ready for audit and export"
        className="!p-0"
      >
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <Table
            headers={[
              { label: 'Employee ID' },
              { label: 'Full Name' },
              { label: 'Department' },
              { label: 'Designation' },
              { label: 'Salary' },
              { label: 'Status' },
              { label: 'Latest Evaluation' },
            ]}
          >
            {reportData.length > 0 ? (
              reportData.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-mono font-medium text-slate-700 text-xs">
                    {emp.employeeId}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {emp.firstName} {emp.lastName}
                    <span className="block text-xs font-normal text-slate-400">{emp.email}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {emp.department?.name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs font-medium">
                    {emp.designation}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-700 text-xs">
                    ${Number(emp.salary).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={emp.status} />
                  </td>
                  <td className="px-6 py-4">
                    {emp.evaluations?.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <RatingBadge rating={emp.evaluations[0].rating} />
                        <span className="text-xs font-bold text-slate-700">
                          {emp.evaluations[0].score}/100
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">None yet</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                  No records found matching the chosen parameters.
                </td>
              </tr>
            )}
          </Table>
        )}
      </Card>
    </div>
  );
};
