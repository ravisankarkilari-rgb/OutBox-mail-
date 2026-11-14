import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card, StatCard } from '../components/Card';
import { Table } from '../components/Table';
import { StatusBadge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  Users,
  UserCheck,
  UserX,
  Building2,
  TrendingUp,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data?.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Admin Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time workforce overview and department analytics.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/employees"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-500 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manage Employees</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Employees"
          value={stats?.summary?.totalEmployees ?? 0}
          icon={Users}
          color="sky"
          trend="Overall workforce"
        />
        <StatCard
          title="Active Employees"
          value={stats?.summary?.activeEmployees ?? 0}
          icon={UserCheck}
          color="emerald"
          trend="Currently on duty"
        />
        <StatCard
          title="Inactive / On Leave"
          value={(stats?.summary?.inactiveEmployees ?? 0) + (stats?.summary?.onLeaveEmployees ?? 0)}
          icon={UserX}
          color="amber"
          trend="Requires review"
        />
        <StatCard
          title="Total Departments"
          value={stats?.summary?.totalDepartments ?? 0}
          icon={Building2}
          color="violet"
          trend="Operational units"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution Bar Chart */}
        <div className="lg:col-span-2">
          <Card title="Employees by Department" subtitle="Headcount per organizational division">
            <div className="h-72 w-full">
              {stats?.departmentStats?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.departmentStats}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="employeeCount" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="Headcount" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">
                  No department data available
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Status Breakdown Pie Chart */}
        <div>
          <Card title="Employment Status" subtitle="Active vs Inactive breakdown">
            <div className="h-72 w-full flex items-center justify-center">
              {stats?.statusDistribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.statusDistribution}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {stats.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-400">No status data available</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Employees Table */}
      <Card
        title="Recent Employees"
        subtitle="Latest additions to the workforce"
        action={
          <Link
            to="/admin/employees"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <Table
          headers={[
            { label: 'Employee ID' },
            { label: 'Name' },
            { label: 'Department' },
            { label: 'Designation' },
            { label: 'Status' },
            { label: 'Joined' },
          ]}
        >
          {stats?.recentEmployees?.length > 0 ? (
            stats.recentEmployees.map((emp) => (
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
                <td className="px-6 py-4 text-slate-600">{emp.designation}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={emp.status} />
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {new Date(emp.joiningDate).toLocaleDateString()}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">
                No employees registered yet.
              </td>
            </tr>
          )}
        </Table>
      </Card>
    </div>
  );
};

