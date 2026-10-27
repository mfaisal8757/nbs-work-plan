import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { api } from '../api/client.js';
import { OutsideWorkPlanActivity, Department, SubmissionStatus } from '../types.js';
import { OutsideActivityModal } from './OutsideActivityModal.js';
import { OutsideActivityDetailModal } from './OutsideActivityDetailModal.js';
import {
  AlertOctagon,
  Plus,
  Eye,
  Edit2,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  Search,
  ShieldAlert,
  Send,
  Calendar
} from 'lucide-react';

export const OutsideActivitiesView: React.FC = () => {
  const { user, isAdmin, isDeskOfficer, isManagement, systemSettings } = useAuth();

  const [activities, setActivities] = useState<OutsideWorkPlanActivity[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<OutsideWorkPlanActivity | null>(null);
  const [viewingActivity, setViewingActivity] = useState<OutsideWorkPlanActivity | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedDeptFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [actRes, dRes] = await Promise.all([
        api.outsideActivities.getAll(selectedDeptFilter || undefined),
        api.departments.getAll()
      ]);
      setActivities(actRes.outside_activities);
      setDepartments(dRes.departments);
    } catch (err: any) {
      setError(err.message || 'Failed to load outside work plan activities');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingActivity(null);
    setIsModalOpen(true);
  };

  const openEditModal = (act: OutsideWorkPlanActivity) => {
    setEditingActivity(act);
    setIsModalOpen(true);
  };

  const openDetailModal = (act: OutsideWorkPlanActivity) => {
    setViewingActivity(act);
    setIsDetailModalOpen(true);
  };

  const handleQuickSubmit = async (act: OutsideWorkPlanActivity) => {
    try {
      await api.outsideActivities.update(act.id, { submission_status: 'Submitted' });
      setSuccessMessage(`Ad-Hoc activity ${act.activity_code} submitted successfully for review.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit outside activity.');
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const filtered = activities.filter(a => {
    const reason = a.reason_not_in_approved_plan || (a as any).reason_outside_plan || '';
    const achievement = a.actual_achievement || (a as any).output_achieved || '';
    const matchesSearch =
      a.activity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.activity_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.department_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.toLowerCase().includes(searchQuery.toLowerCase());

    const m = a.reporting_month || (a as any).month_conducted || 1;
    const matchesMonth = selectedMonthFilter === 'all' || String(m) === selectedMonthFilter;
    return matchesSearch && matchesMonth;
  });

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-gray-900">Activities Outside Approved Work Plan / Ad-Hoc</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Ad-hoc, emergency, or donor interventions conducted outside the approved annual work plan framework.
          </p>
        </div>

        {isDeskOfficer && systemSettings?.reporting_stage === 'Monthly M&E Reporting' && (
          <button
            id="btn-add-outside-activity"
            onClick={openCreateModal}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Record Ad-Hoc / Outside Plan Activity</span>
          </button>
        )}

        {isAdmin && (
          <div className="text-xs text-[#006B3F] bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-[#006B3F]" />
            <span>Control &amp; Review Mode &bull; Approvals in Reviews module</span>
          </div>
        )}
      </div>

      {/* Mandatory Statutory Compliance Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-900">Statutory M&E Accounting Rule</h4>
          <p className="mt-0.5 text-amber-800 leading-relaxed">
            All activities recorded in this module are permanently designated as{' '}
            <strong className="text-red-700 font-extrabold bg-red-100 px-1.5 py-0.5 rounded border border-red-300">
              Work Plan Compliance = NO
            </strong>
            . They are evaluated in institutional audits and departmental compliance metrics.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              id="input-search-outside"
              type="text"
              placeholder="Search ad-hoc activity, reason, code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400 ml-1" />
            <select
              id="select-filter-outside-month"
              value={selectedMonthFilter}
              onChange={e => setSelectedMonthFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="all">All Months</option>
              {monthNames.map((m, i) => (
                <option key={m} value={String(i + 1)}>
                  Month {i + 1}: {m}
                </option>
              ))}
            </select>
          </div>

          {!isDeskOfficer && (
            <select
              id="select-filter-outside-dept"
              value={selectedDeptFilter}
              onChange={e => setSelectedDeptFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Total Ad-hoc Activities: <strong className="text-gray-900">{activities.length}</strong>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading outside activities...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <AlertOctagon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-gray-700">No outside plan activities recorded</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Zero ad-hoc activities represents 100% adherence to the approved annual work plan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4">Period</th>
                  <th className="py-2.5 px-4">Activity Name & Code</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Progress %</th>
                  <th className="py-2.5 px-4 text-center">Work Plan Compliance</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {filtered.map(act => {
                  const m = act.reporting_month || (act as any).month_conducted || 1;
                  const y = act.reporting_year || (act as any).year || 2026;
                  const reason = act.reason_not_in_approved_plan || (act as any).reason_outside_plan || 'Ad-hoc intervention';
                  const isDraftOrReturned =
                    act.submission_status === 'Draft' || act.submission_status === 'Returned for Correction';
                  const canEditRow = isDeskOfficer && isDraftOrReturned;

                  return (
                    <tr key={act.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-gray-900 block">
                          {monthNames[m - 1]} {y}
                        </span>
                        <span className="text-[10px] text-amber-700 font-semibold">Ad-Hoc</span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mb-0.5">
                          {act.activity_code}
                        </div>
                        <div className="font-bold text-gray-900 truncate" title={act.activity_name}>
                          {act.activity_name}
                        </div>
                        <div className="text-[11px] text-gray-500 line-clamp-1 mt-0.5" title={reason}>
                          Reason: {reason}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-800">{act.department_name}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-600 h-full rounded-full"
                              style={{ width: `${act.percentage_completed || 0}%` }}
                            ></div>
                          </div>
                          <span className="font-mono font-bold text-gray-900">{act.percentage_completed || 0}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-red-100 text-red-700 border border-red-300">
                          NO (Ad-hoc)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            act.submission_status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : act.submission_status === 'Submitted'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : act.submission_status === 'Returned for Correction'
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : 'bg-gray-50 text-gray-700 border-gray-300'
                          }`}
                        >
                          {act.submission_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            id={`btn-view-outside-${act.id}`}
                            onClick={() => openDetailModal(act)}
                            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canEditRow && (
                            <button
                              id={`btn-edit-outside-${act.id}`}
                              onClick={() => openEditModal(act)}
                              className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-md border border-amber-200 transition-colors"
                              title="Edit Ad-Hoc Activity"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isDeskOfficer && act.submission_status === 'Draft' && (
                            <button
                              id={`btn-submit-outside-${act.id}`}
                              onClick={() => handleQuickSubmit(act)}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[11px] font-bold shadow-xs inline-flex items-center space-x-1"
                              title="Submit for M&E Review"
                            >
                              <Send className="w-3 h-3" />
                              <span>Submit</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Shared Modals */}
      <OutsideActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadData}
        activityToEdit={editingActivity}
        departments={departments}
      />

      <OutsideActivityDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        activity={viewingActivity}
        canEdit={
          isAdmin ||
          (isDeskOfficer &&
            (viewingActivity?.submission_status === 'Draft' ||
              viewingActivity?.submission_status === 'Returned for Correction'))
        }
        onEdit={() => {
          if (viewingActivity) {
            openEditModal(viewingActivity);
          }
        }}
      />
    </div>
  );
};
