import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { AnnualWorkPlan, MonthlyMeReport, OutsideWorkPlanActivity } from '../types.js';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Building2,
  Calendar,
  Eye,
  FileCheck,
  Send,
  MessageSquare
} from 'lucide-react';

export const ReviewsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'work-plans' | 'monthly-me' | 'outside-activities'>('work-plans');

  const [pendingWorkPlans, setPendingWorkPlans] = useState<AnnualWorkPlan[]>([]);
  const [pendingMonthlyReports, setPendingMonthlyReports] = useState<MonthlyMeReport[]>([]);
  const [pendingOutsideActivities, setPendingOutsideActivities] = useState<OutsideWorkPlanActivity[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Review Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewType, setReviewType] = useState<'work-plan' | 'monthly-me' | 'outside'>('work-plan');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<'Approved' | 'Returned for Correction'>('Approved');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    loadPendingItems();
  }, []);

  const loadPendingItems = async () => {
    setIsLoading(true);
    try {
      const [wpRes, meRes, outRes] = await Promise.all([
        api.workPlans.getAll(),
        api.meReports.getAll(),
        api.outsideActivities.getAll()
      ]);

      setPendingWorkPlans(wpRes.work_plans.filter(wp => wp.status === 'Submitted'));
      setPendingMonthlyReports(meRes.me_reports.filter(r => r.submission_status === 'Submitted'));
      setPendingOutsideActivities(outRes.outside_activities.filter(a => a.submission_status === 'Submitted'));
    } catch (err: any) {
      setError(err.message || 'Failed to load review items');
    } finally {
      setIsLoading(false);
    }
  };

  const openReviewModal = (type: 'work-plan' | 'monthly-me' | 'outside', item: any) => {
    setReviewType(type);
    setSelectedItem(item);
    setReviewAction('Approved');
    setComments('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (reviewAction === 'Returned for Correction' && !comments.trim()) {
      setModalError('Please provide review comments explaining the corrections required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (reviewType === 'work-plan') {
        await api.workPlans.review(selectedItem.id, {
          status: reviewAction,
          review_comments: comments
        });
      } else if (reviewType === 'monthly-me') {
        await api.meReports.review(selectedItem.id, {
          submission_status: reviewAction,
          review_comments: comments
        });
      } else if (reviewType === 'outside') {
        await api.outsideActivities.review(selectedItem.id, {
          submission_status: reviewAction,
          review_comments: comments
        });
      }
      setIsModalOpen(false);
      await loadPendingItems();
    } catch (err: any) {
      setModalError(err.message || 'Failed to submit review decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const totalPending =
    pendingWorkPlans.length + pendingMonthlyReports.length + pendingOutsideActivities.length;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-[#006B3F]" />
            <h2 className="text-base font-bold text-gray-900">Administrative Reviews & Approvals</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Evaluate departmental submissions, approve statutory work plans, or return for correction.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-900">
          <Clock className="w-4 h-4 text-amber-700" />
          <span>{totalPending} Submission{totalPending === 1 ? '' : 's'} Pending Review</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Sub-tab Switcher */}
      <div className="flex border-b border-gray-200 space-x-2">
        <button
          id="tab-review-workplans"
          onClick={() => setActiveSubTab('work-plans')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeSubTab === 'work-plans'
              ? 'text-[#006B3F] border-b-2 border-[#006B3F]'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Annual Work Plans
          <span
            className={`ml-2 px-1.5 py-0.2 rounded-full text-[10px] ${
              pendingWorkPlans.length > 0 ? 'bg-amber-100 text-amber-900 font-black' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {pendingWorkPlans.length}
          </span>
        </button>

        <button
          id="tab-review-monthly-me"
          onClick={() => setActiveSubTab('monthly-me')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeSubTab === 'monthly-me'
              ? 'text-[#006B3F] border-b-2 border-[#006B3F]'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Monthly M&E Reports
          <span
            className={`ml-2 px-1.5 py-0.2 rounded-full text-[10px] ${
              pendingMonthlyReports.length > 0 ? 'bg-amber-100 text-amber-900 font-black' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {pendingMonthlyReports.length}
          </span>
        </button>

        <button
          id="tab-review-outside"
          onClick={() => setActiveSubTab('outside-activities')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeSubTab === 'outside-activities'
              ? 'text-[#006B3F] border-b-2 border-[#006B3F]'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Outside Plan Submissions
          <span
            className={`ml-2 px-1.5 py-0.2 rounded-full text-[10px] ${
              pendingOutsideActivities.length > 0 ? 'bg-amber-100 text-amber-900 font-black' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {pendingOutsideActivities.length}
          </span>
        </button>
      </div>

      {/* Sub-tab 1: Annual Work Plans Pending Review */}
      {activeSubTab === 'work-plans' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-gray-500">Checking pending submissions...</div>
          ) : pendingWorkPlans.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-gray-700">All Annual Work Plans Reviewed</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">No work plan submissions are currently awaiting approval.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-4">Activity Code</th>
                    <th className="py-2.5 px-4">Project Name & Objective</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Budget</th>
                    <th className="py-2.5 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  {pendingWorkPlans.map(wp => (
                    <tr key={wp.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#006B3F] whitespace-nowrap">
                        <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {wp.activity_code}
                        </span>
                        <div className="text-[10px] text-gray-400 mt-0.5">Year: {wp.work_plan_year}</div>
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-bold text-gray-900">{wp.project_name}</div>
                        <div className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{wp.objective}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Indicator: {wp.annual_performance_indicator || '—'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-800">{wp.department_name}</span>
                        <div className="text-[10px] text-gray-400">Resp: {wp.staff_responsible}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                        {formatCurrency(wp.total_budget)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          id={`btn-review-wp-${wp.id}`}
                          onClick={() => openReviewModal('work-plan', wp)}
                          className="px-3 py-1.5 bg-[#006B3F] hover:bg-[#004D2A] text-white rounded-lg text-xs font-bold shadow-xs inline-flex items-center space-x-1.5"
                        >
                          <CheckSquare className="w-3.5 h-3.5 text-[#F2C94C]" />
                          <span>Review & Decide</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 2: Monthly M&E Reports Pending Review */}
      {activeSubTab === 'monthly-me' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-gray-500">Checking pending submissions...</div>
          ) : pendingMonthlyReports.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-gray-700">All Monthly M&E Reports Reviewed</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">No monthly reports are currently awaiting approval.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-4">Period</th>
                    <th className="py-2.5 px-4">Project & Code</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4 text-center">Completed %</th>
                    <th className="py-2.5 px-4 text-center">KPI Met</th>
                    <th className="py-2.5 px-4">Actual Achievement</th>
                    <th className="py-2.5 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  {pendingMonthlyReports.map(rep => (
                    <tr key={rep.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-gray-900 block">
                          {monthNames[rep.reporting_month - 1]} {rep.reporting_year}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-gray-900 line-clamp-1">{rep.project_name}</div>
                        <span className="font-mono text-[10px] text-[#006B3F] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block mt-0.5">
                          {rep.activity_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800">{rep.department_name}</td>
                      <td className="py-3 px-4 text-center font-bold text-gray-900">{rep.percentage_completed}%</td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          rep.kpi_achieved === 'Yes'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {rep.kpi_achieved === 'Yes' ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="line-clamp-2 text-gray-800 font-normal">{rep.actual_achievement}</div>
                        {rep.outcome && <div className="text-[10px] text-emerald-700 mt-0.5">Outcome: {rep.outcome}</div>}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          id={`btn-review-me-${rep.id}`}
                          onClick={() => openReviewModal('monthly-me', rep)}
                          className="px-3 py-1.5 bg-[#006B3F] hover:bg-[#004D2A] text-white rounded-lg text-xs font-bold shadow-xs inline-flex items-center space-x-1.5"
                        >
                          <CheckSquare className="w-3.5 h-3.5 text-[#F2C94C]" />
                          <span>Review & Decide</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 3: Outside Plan Activities Pending Review */}
      {activeSubTab === 'outside-activities' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-gray-500">Checking pending submissions...</div>
          ) : pendingOutsideActivities.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-gray-700">All Outside Plan Activities Reviewed</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">No outside activity submissions are currently awaiting review.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-4">Period</th>
                    <th className="py-2.5 px-4">Activity Name & Code</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Progress & Output</th>
                    <th className="py-2.5 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  {pendingOutsideActivities.map(act => {
                    const m = act.reporting_month || (act as any).month_conducted || 1;
                    const y = act.reporting_year || (act as any).year || 2026;
                    const reason = act.reason_not_in_approved_plan || (act as any).reason_outside_plan || '';
                    const achievement = act.actual_achievement || (act as any).output_achieved || '';

                    return (
                      <tr key={act.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-gray-900 block">
                            {monthNames[m - 1]} {y}
                          </span>
                          <span className="text-[10px] text-amber-700 font-semibold">Ad-Hoc</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-mono text-[10px] font-bold text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 inline-block mb-0.5">
                            {act.activity_code}
                          </div>
                          <div className="font-bold text-gray-900">{act.activity_name}</div>
                          <div className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">Reason: {reason}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-800">{act.department_name}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900">{act.percentage_completed || 0}% Completed</div>
                          <div className="text-[10px] text-gray-500 truncate max-w-[160px]">{achievement || 'In Progress'}</div>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            id={`btn-review-out-${act.id}`}
                            onClick={() => openReviewModal('outside', act)}
                            className="px-3 py-1.5 bg-[#006B3F] hover:bg-[#004D2A] text-white rounded-lg text-xs font-bold shadow-xs inline-flex items-center space-x-1.5"
                          >
                            <CheckSquare className="w-3.5 h-3.5 text-[#F2C94C]" />
                            <span>Review & Decide</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Review & Decide Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              {reviewType === 'work-plan' && 'Review Annual Work Plan Submission'}
              {reviewType === 'monthly-me' && 'Review Monthly M&E Performance Record'}
              {reviewType === 'outside' && 'Review Outside Work Plan Submission'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Submitted by <strong>{selectedItem.department_name}</strong>. Provide institutional review and approval decision.
            </p>

            {modalError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {modalError}
              </div>
            )}

            {/* Item summary info */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1 mb-4">
              <div className="font-bold text-gray-900">
                {selectedItem.project_name || selectedItem.activity_name}
              </div>
              {selectedItem.activity_code && (
                <div className="font-mono text-[10px] text-[#006B3F]">
                  Code: {selectedItem.activity_code}
                </div>
              )}
              {selectedItem.total_budget && (
                <div className="text-[11px] text-gray-600">
                  Budget: <strong>{formatCurrency(selectedItem.total_budget)}</strong>
                </div>
              )}
              {selectedItem.percentage_completed !== undefined && (
                <div className="text-[11px] text-gray-600">
                  Claimed Progress: <strong>{selectedItem.percentage_completed}%</strong>
                </div>
              )}
              {selectedItem.kpi_achieved && (
                <div className="text-[11px] text-gray-700 flex items-center space-x-1.5">
                  <span>KPI Target Achieved (Quarterly):</span>
                  <span className={`px-2 py-0.2 rounded font-bold text-[10px] border ${
                    selectedItem.kpi_achieved === 'Yes'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}>
                    {selectedItem.kpi_achieved === 'Yes' ? 'Yes (Achieved Completely)' : 'No (Incomplete / Ongoing)'}
                  </span>
                </div>
              )}
              {(selectedItem.reason_not_in_approved_plan || selectedItem.reason_outside_plan) && (
                <div className="text-[11px] text-amber-800">
                  Reason: <strong>{selectedItem.reason_not_in_approved_plan || selectedItem.reason_outside_plan}</strong>
                </div>
              )}
              {(selectedItem.actual_achievement || selectedItem.output_achieved) && (
                <div className="text-[11px] text-gray-700">
                  Output: <strong>{selectedItem.actual_achievement || selectedItem.output_achieved}</strong>
                </div>
              )}
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Administrative Decision *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border-2 flex items-center space-x-2.5 cursor-pointer transition-all ${
                      reviewAction === 'Approved'
                        ? 'bg-emerald-50/80 border-[#006B3F] text-[#006B3F] font-bold shadow-xs'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reviewDec"
                      value="Approved"
                      checked={reviewAction === 'Approved'}
                      onChange={() => setReviewAction('Approved')}
                      className="text-[#006B3F]"
                    />
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs">Approve Submission</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border-2 flex items-center space-x-2.5 cursor-pointer transition-all ${
                      reviewAction === 'Returned for Correction'
                        ? 'bg-red-50/80 border-red-600 text-red-700 font-bold shadow-xs'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reviewDec"
                      value="Returned for Correction"
                      checked={reviewAction === 'Returned for Correction'}
                      onChange={() => setReviewAction('Returned for Correction')}
                      className="text-red-600"
                    />
                    <RotateCcw className="w-4 h-4 text-red-600 shrink-0" />
                    <span className="text-xs">Return for Correction</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reviewer Notes / Instructions {reviewAction === 'Returned for Correction' && '* (Required)'}
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <textarea
                    id="modal-review-comments"
                    rows={3}
                    required={reviewAction === 'Returned for Correction'}
                    placeholder={
                      reviewAction === 'Returned for Correction'
                        ? 'State specific amendments or verification details required before re-submission...'
                        : 'Optional approval notes or recommendations...'
                    }
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-review-action"
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-xs flex items-center space-x-1.5 ${
                    reviewAction === 'Approved'
                      ? 'bg-[#006B3F] hover:bg-[#004D2A]'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isSubmitting ? 'Recording Decision...' : `Confirm ${reviewAction}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
