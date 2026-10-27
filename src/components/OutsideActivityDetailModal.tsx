import React from 'react';
import { OutsideWorkPlanActivity } from '../types.js';
import { X, AlertOctagon, ShieldAlert, CheckCircle2, Clock, AlertTriangle, Check } from 'lucide-react';

interface OutsideActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: OutsideWorkPlanActivity | null;
  onEdit?: () => void;
  canEdit?: boolean;
}

export const OutsideActivityDetailModal: React.FC<OutsideActivityDetailModalProps> = ({
  isOpen,
  onClose,
  activity,
  onEdit,
  canEdit
}) => {
  if (!isOpen || !activity) return null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthNum = activity.reporting_month || (activity as any).month_conducted || 1;
  const yearNum = activity.reporting_year || (activity as any).year || 2026;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                Ad-Hoc / Outside Work Plan
              </span>
              <span className="text-[11px] font-black text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-300">
                Work Plan Compliance: NO
              </span>
              <span className="text-xs font-mono font-bold text-gray-500">
                {activity.activity_code}
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-900 mt-1">{activity.activity_name}</h3>
            <p className="text-xs text-gray-500">
              {monthNames[monthNum - 1]} {yearNum} &bull; Dept: <strong>{activity.department_name}</strong>
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

        {/* Returned for Correction Warning Banner */}
        {activity.submission_status === 'Returned for Correction' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
            <div className="flex items-center space-x-2 font-bold text-red-900 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Returned for Correction by M&E Reviewer</span>
            </div>
            <p className="mt-0.5 text-red-700 leading-relaxed font-medium">
              Review Comments: "{activity.review_comments || 'Please revise justification and target deliverables.'}"
            </p>
            {activity.reviewed_by && (
              <p className="text-[10px] text-red-500 mt-1">
                Reviewed by {activity.reviewed_by} on {activity.reviewed_at ? new Date(activity.reviewed_at).toLocaleDateString() : 'N/A'}
              </p>
            )}
          </div>
        )}

        {/* Content Details */}
        <div className="space-y-4 text-xs">
          {/* Statutory Compliance Explanation */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start space-x-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-900 leading-relaxed">
              <strong>Statutory Compliance Classification:</strong> Because this activity was not approved in the Annual Work Plan, it is flagged as <strong>Compliance: NO</strong>. The rationale below justifies its execution.
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-1">Reason / Justification for Execution:</h4>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-800 leading-relaxed font-medium">
              {activity.reason_not_in_approved_plan || (activity as any).reason_outside_plan || 'N/A'}
            </div>
          </div>

          {activity.description && (
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Scope & Description:</h4>
              <p className="text-gray-700 leading-relaxed">{activity.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-gray-500 block mb-0.5 font-semibold">Target / Expected Deliverable:</span>
              <span className="font-bold text-gray-900">{activity.target || 'N/A'}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-gray-500 block mb-0.5 font-semibold">Actual Achievement (This Month):</span>
              <span className="font-bold text-gray-900">{activity.actual_achievement || (activity as any).output_achieved || 'N/A'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-gray-500 block mb-0.5 font-semibold">Cumulative Progress:</span>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#006B3F] h-full rounded-full"
                    style={{ width: `${activity.percentage_completed || 0}%` }}
                  ></div>
                </div>
                <span className="font-mono font-bold text-gray-900">{activity.percentage_completed || 0}%</span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 sm:col-span-2">
              <span className="text-gray-500 block mb-0.5 font-semibold">Outcome / Deliverable:</span>
              <span className="font-semibold text-gray-800">{activity.outcome || 'N/A'}</span>
            </div>
          </div>

          {/* KPI Achievement Status */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              activity.kpi_achieved === 'Yes'
                ? 'bg-emerald-50/80 border-emerald-300'
                : 'bg-amber-50/70 border-amber-200'
            }`}
          >
            <div>
              <span className="text-xs font-bold text-gray-800 block">
                Quarterly KPI Status: Target Achieved Completely
              </span>
              <span className="text-[11px] text-gray-500">
                Indicates if quarterly target was achieved completely
              </span>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center space-x-1 ${
                activity.kpi_achieved === 'Yes'
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              {activity.kpi_achieved === 'Yes' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Yes — Achieved</span>
                </>
              ) : (
                <span>No — Incomplete / Pending</span>
              )}
            </span>
          </div>

          {(activity.challenges || activity.remarks) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activity.challenges && (
                <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/60">
                  <span className="text-amber-800 block mb-0.5 font-bold">Challenges Encountered:</span>
                  <span className="text-gray-700">{activity.challenges}</span>
                </div>
              )}
              {activity.remarks && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-gray-600 block mb-0.5 font-bold">Remarks & Recommendations:</span>
                  <span className="text-gray-700">{activity.remarks}</span>
                </div>
              )}
            </div>
          )}

          {activity.evidence && (
            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200">
              <span className="text-blue-900 block mb-0.5 font-bold">Evidence / Verification Reference:</span>
              <span className="text-blue-800 font-mono text-[11px]">{activity.evidence}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
            <div>
              Status:{' '}
              <span
                className={`font-bold px-2 py-0.5 rounded-full ${
                  activity.submission_status === 'Approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : activity.submission_status === 'Submitted'
                    ? 'bg-blue-100 text-blue-800'
                    : activity.submission_status === 'Returned for Correction'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {activity.submission_status}
              </span>
            </div>
            <div>
              Created on: {new Date(activity.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Close
          </button>
          {canEdit && onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#006B3F] hover:bg-[#004D2A] rounded-lg shadow-xs"
            >
              Edit & Submit Activity
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
