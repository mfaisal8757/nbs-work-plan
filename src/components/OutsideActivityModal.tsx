import React, { useState, useEffect } from 'react';
import { OutsideWorkPlanActivity, Department, SubmissionStatus } from '../types.js';
import { useAuth } from '../contexts/AuthContext.js';
import { api } from '../api/client.js';
import { AlertOctagon, ShieldAlert, CheckCircle2, Clock, X, HelpCircle } from 'lucide-react';

interface OutsideActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  activityToEdit?: OutsideWorkPlanActivity | null;
  departments: Department[];
}

const COMMON_REASONS = [
  'Urgent Presidential / National Mandate',
  'Special Ministerial / Executive Directive',
  'Emergency Statistical Response / Survey',
  'Unforeseen Inter-Agency Joint Task',
  'Donor / Development Partner Ad-Hoc Request',
  'Critical Data Verification / Re-benchmarking'
];

export const OutsideActivityModal: React.FC<OutsideActivityModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  activityToEdit,
  departments
}) => {
  const { user, isAdmin, systemSettings } = useAuth();

  const [activityName, setActivityName] = useState('');
  const [description, setDescription] = useState('');
  const [reasonNotInApprovedPlan, setReasonNotInApprovedPlan] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [reportingMonth, setReportingMonth] = useState<number>(
    systemSettings?.active_reporting_month || new Date().getMonth() + 1
  );
  const [reportingYear, setReportingYear] = useState<number>(
    systemSettings?.active_reporting_year || new Date().getFullYear()
  );
  const [target, setTarget] = useState('');
  const [actualAchievement, setActualAchievement] = useState('');
  const [percentageCompleted, setPercentageCompleted] = useState<number>(0);
  const [outcome, setOutcome] = useState('');
  const [challenges, setChallenges] = useState('');
  const [remarks, setRemarks] = useState('');
  const [evidence, setEvidence] = useState('');
  const [kpiAchieved, setKpiAchieved] = useState<'Yes' | 'No'>('No');
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('Submitted');

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activityToEdit) {
      setActivityName(activityToEdit.activity_name || '');
      setDescription(activityToEdit.description || '');
      setReasonNotInApprovedPlan(activityToEdit.reason_not_in_approved_plan || '');
      setDepartmentId(activityToEdit.department_id || '');
      setReportingMonth(activityToEdit.reporting_month || systemSettings?.active_reporting_month || new Date().getMonth() + 1);
      setReportingYear(activityToEdit.reporting_year || systemSettings?.active_reporting_year || new Date().getFullYear());
      setTarget(activityToEdit.target || '');
      setActualAchievement(activityToEdit.actual_achievement || '');
      setPercentageCompleted(activityToEdit.percentage_completed || 0);
      setOutcome(activityToEdit.outcome || '');
      setChallenges(activityToEdit.challenges || '');
      setRemarks(activityToEdit.remarks || '');
      setEvidence(activityToEdit.evidence || '');
      setKpiAchieved(activityToEdit.kpi_achieved || (activityToEdit.percentage_completed >= 100 ? 'Yes' : 'No'));
      setSubmissionStatus(
        activityToEdit.submission_status === 'Returned for Correction' ? 'Submitted' : activityToEdit.submission_status
      );
    } else {
      setActivityName('');
      setDescription('');
      setReasonNotInApprovedPlan('');
      setDepartmentId(isAdmin ? (departments[0]?.id || '') : (user?.department_id || ''));
      setReportingMonth(systemSettings?.active_reporting_month || new Date().getMonth() + 1);
      setReportingYear(systemSettings?.active_reporting_year || new Date().getFullYear());
      setTarget('');
      setActualAchievement('');
      setPercentageCompleted(0);
      setOutcome('');
      setChallenges('');
      setRemarks('');
      setEvidence('');
      setKpiAchieved('No');
      setSubmissionStatus('Submitted');
    }
    setError(null);
  }, [activityToEdit, isOpen, user, isAdmin, departments, systemSettings]);

  if (!isOpen) return null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!activityName.trim()) {
      setError('Please enter the Activity Name.');
      return;
    }

    if (!reasonNotInApprovedPlan.trim()) {
      setError('Please provide the justification/reason why this activity is not in the approved annual work plan.');
      return;
    }

    if (!actualAchievement.trim()) {
      setError('Actual Achievement for the reporting month is required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        activity_name: activityName.trim(),
        description: description.trim() || activityName.trim(),
        reason_not_in_approved_plan: reasonNotInApprovedPlan.trim(),
        department_id: isAdmin ? departmentId : user?.department_id,
        reporting_month: Number(reportingMonth),
        reporting_year: Number(reportingYear),
        target: target.trim(),
        actual_achievement: actualAchievement.trim(),
        percentage_completed: Math.min(100, Math.max(0, Number(percentageCompleted) || 0)),
        outcome: outcome.trim(),
        challenges: challenges.trim(),
        remarks: remarks.trim(),
        evidence: evidence.trim(),
        kpi_achieved: kpiAchieved,
        submission_status: submissionStatus
      };

      if (activityToEdit) {
        await api.outsideActivities.update(activityToEdit.id, payload);
      } else {
        await api.outsideActivities.create(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save Activity Outside Approved Plan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                Ad-Hoc / Outside Work Plan
              </span>
              <span className="text-[11px] font-black text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-300">
                Compliance: NO
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 mt-1">
              {activityToEdit ? 'Edit Ad-Hoc / Outside Plan Activity' : 'Log Activity Outside Approved Work Plan'}
            </h3>
            <p className="text-xs text-gray-500">
              Departmental Monthly M&E Reporting for emergency, donor, or ministerial activities not in the approved plan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Institutional Statutory Notice */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5 mb-3">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-amber-900">
            <strong>Statutory Rule:</strong> Activities recorded here are officially audited under{' '}
            <span className="font-bold underline">Work Plan Compliance = NO</span>. Full justification, achievements, and verification evidence are required for M&E review.
          </div>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Activity Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Activity Name / Ad-Hoc Intervention Title *
            </label>
            <input
              id="modal-out-activity-name"
              type="text"
              required
              placeholder="e.g. Emergency National Food Security Assessment Survey"
              value={activityName}
              onChange={e => setActivityName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
            />
          </div>

          {/* Department (Admin only) & Reporting Period */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {isAdmin ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  id="modal-out-dept"
                  value={departmentId}
                  onChange={e => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.department_name || 'My Department'}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 bg-gray-100 text-gray-600 font-semibold"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reporting Month *
              </label>
              <select
                id="modal-out-month"
                required
                value={reportingMonth}
                onChange={e => setReportingMonth(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white"
              >
                {monthNames.map((m, i) => (
                  <option key={m} value={i + 1}>
                    Month {i + 1}: {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reporting Year *
              </label>
              <input
                id="modal-out-year"
                type="number"
                required
                value={reportingYear}
                onChange={e => setReportingYear(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description of the Intervention / Scope
            </label>
            <textarea
              id="modal-out-desc"
              rows={2}
              placeholder="Brief summary of what this ad-hoc activity entails, methodology, and target respondents..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
            ></textarea>
          </div>

          {/* Reason Not in Approved Plan */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                Reason / Justification for Outside Approved Work Plan Execution *
              </label>
              <span className="text-[10px] text-gray-500">Select template or enter custom justification</span>
            </div>
            
            {/* Quick Reason Suggestions */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_REASONS.map(reason => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setReasonNotInApprovedPlan(reason)}
                  className="px-2 py-0.5 text-[10px] rounded-md bg-gray-100 hover:bg-emerald-50 hover:text-[#006B3F] hover:border-emerald-300 border border-gray-200 transition-colors text-gray-700"
                >
                  + {reason}
                </button>
              ))}
            </div>

            <textarea
              id="modal-out-reason"
              required
              rows={2}
              placeholder="Explicit justification: state why this activity could not be foreseen during annual work plan approval, citing authorizing memo or urgent mandate..."
              value={reasonNotInApprovedPlan}
              onChange={e => setReasonNotInApprovedPlan(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
            ></textarea>
          </div>

          {/* Target & Output / Actual Achievement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Target Deliverable / Expected Benchmark
              </label>
              <input
                id="modal-out-target"
                type="text"
                placeholder="e.g. 1,200 Households surveyed across 6 zones"
                value={target}
                onChange={e => setTarget(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Actual Achievement for the Month *
              </label>
              <input
                id="modal-out-achievement"
                type="text"
                required
                placeholder="e.g. Field enumeration completed in 1,185 households"
                value={actualAchievement}
                onChange={e => setActualAchievement(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Progress % & Outcome */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Cumulative Progress (0 - 100%) *
              </label>
              <input
                id="modal-out-pct"
                type="number"
                min="0"
                max="100"
                required
                value={percentageCompleted}
                onChange={e => setPercentageCompleted(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Statistical Outcome / Impact
              </label>
              <input
                id="modal-out-outcome"
                type="text"
                placeholder="e.g. Emergency Flash Report submitted to National Economic Council"
                value={outcome}
                onChange={e => setOutcome(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
              />
            </div>
          </div>

          {/* KPI Field - Dropdown with Yes or No */}
          <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-200">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="modal-out-kpi" className="block text-xs font-bold text-gray-800">
                KPI Achieved Completely in this Quarter? *
              </label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                kpiAchieved === 'Yes'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {kpiAchieved === 'Yes' ? 'Target Achieved (Yes)' : 'Target Incomplete (No)'}
              </span>
            </div>
            <select
              id="modal-out-kpi"
              required
              value={kpiAchieved}
              onChange={e => setKpiAchieved(e.target.value as 'Yes' | 'No')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white font-medium"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            <p className="text-[11px] text-gray-500 mt-1">
              Select <strong>Yes</strong> if this activity target was achieved completely in this quarter, or <strong>No</strong> if ongoing or partially met.
            </p>
          </div>

          {/* Challenges & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Challenges Encountered
              </label>
              <input
                id="modal-out-challenges"
                type="text"
                placeholder="e.g. Short turnaround timeframe, logistics"
                value={challenges}
                onChange={e => setChallenges(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Remarks & Corrective Measures
              </label>
              <input
                id="modal-out-remarks"
                type="text"
                placeholder="e.g. Redeployed additional statistical officers"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Evidence / Verification Reference */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Evidence / Verification Document Reference
            </label>
            <input
              id="modal-out-evidence"
              type="text"
              placeholder="e.g. SG-Directive-Ref-2026/09/NBS, Survey Dataset link, Memo ref..."
              value={evidence}
              onChange={e => setEvidence(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
            />
          </div>

          {/* Submission Status */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Action & Submission Mode
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="outSubStatus"
                  value="Draft"
                  checked={submissionStatus === 'Draft'}
                  onChange={() => setSubmissionStatus('Draft')}
                  className="text-[#006B3F]"
                />
                <span>Save as Draft (Edit later before submission)</span>
              </label>
              <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="outSubStatus"
                  value="Submitted"
                  checked={submissionStatus === 'Submitted'}
                  onChange={() => setSubmissionStatus('Submitted')}
                  className="text-[#006B3F]"
                />
                <span className="font-bold text-blue-800">Submit for Administrative M&E Review</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              id="btn-save-outside-activity"
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold text-white bg-[#006B3F] hover:bg-[#004D2A] rounded-lg shadow-xs disabled:opacity-50"
            >
              {isSaving
                ? 'Saving...'
                : activityToEdit
                ? submissionStatus === 'Submitted'
                  ? 'Submit Revised Activity'
                  : 'Save Changes'
                : submissionStatus === 'Submitted'
                ? 'Submit Ad-Hoc Report'
                : 'Save as Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
