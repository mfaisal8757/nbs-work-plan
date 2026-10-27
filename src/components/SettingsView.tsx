import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { api } from '../api/client.js';
import { ReportingStage } from '../types.js';
import {
  Sliders,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Lock,
  FileCheck,
  ClipboardCheck,
  Eye,
  ShieldCheck
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { systemSettings, refreshSystemSettings } = useAuth();

  const [stage, setStage] = useState<ReportingStage>(systemSettings?.reporting_stage || 'Work Plan Compilation');
  const [activeMonth, setActiveMonth] = useState<number>(systemSettings?.active_reporting_month || new Date().getMonth() + 1);
  const [activeYear, setActiveYear] = useState<number>(systemSettings?.active_reporting_year || new Date().getFullYear());
  const [workPlanYear, setWorkPlanYear] = useState<number>(systemSettings?.current_work_plan_year || new Date().getFullYear());
  const [allowOutsidePlan, setAllowOutsidePlan] = useState<boolean>(systemSettings?.allow_desk_officer_outside_plan_entry ?? true);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      await api.settings.update({
        reporting_stage: stage,
        active_reporting_month: Number(activeMonth),
        active_reporting_year: Number(activeYear),
        current_work_plan_year: Number(workPlanYear),
        allow_desk_officer_outside_plan_entry: allowOutsidePlan
      });
      await refreshSystemSettings();
      setMessage('System reporting stages and statutory cycles updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update system settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const stageDescriptions: Record<ReportingStage, { title: string; desc: string; icon: any }> = {
    'Work Plan Compilation': {
      title: 'Work Plan Compilation',
      desc: 'Departmental Desk Officers can create and edit Annual Work Plans. Monthly M&E reporting is suspended.',
      icon: FileCheck
    },
    'Monthly M&E Reporting': {
      title: 'Monthly M&E Reporting',
      desc: 'Desk Officers log monthly milestones and progress against Approved Work Plans. Annual Work Plan edits are locked.',
      icon: ClipboardCheck
    },
    'Review Stage': {
      title: 'Review Stage',
      desc: 'All officer submissions are placed under administrative audit and verification. Desk Officers can view status.',
      icon: Eye
    },
    'Closed': {
      title: 'Closed / Read-Only Cycle',
      desc: 'Reporting cycle is completely frozen for statutory audit and publication. All Desk Officers have read-only access.',
      icon: Lock
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-[#006B3F]" />
          <h2 className="text-base font-bold text-gray-900">Reporting Periods & Stage Control</h2>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          As Administrator, govern the institutional reporting cycle, active M&E month, and write permissions for Desk Officers.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Stage Selector Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">1. Active System Reporting Stage</h3>
            <p className="text-xs text-gray-500">
              Select the active operational stage. This automatically locks or enables Desk Officer permissions across the agency.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(stageDescriptions) as ReportingStage[]).map(key => {
              const item = stageDescriptions[key];
              const Icon = item.icon;
              const isSelected = stage === key;

              return (
                <label
                  key={key}
                  className={`p-4 rounded-xl border-2 flex items-start space-x-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50/70 border-[#006B3F] shadow-xs'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="stageOption"
                    value={key}
                    checked={isSelected}
                    onChange={() => setStage(key)}
                    className="mt-1 text-[#006B3F] focus:ring-[#006B3F]"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-[#006B3F]' : 'text-gray-500'}`} />
                      <span className={`text-xs font-bold ${isSelected ? 'text-[#006B3F]' : 'text-gray-900'}`}>
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Reporting Calendar & Fiscal Year Controls */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">2. Active Calendar & Evaluation Year</h3>
            <p className="text-xs text-gray-500">
              Configure current evaluation month and annual work plan baseline year.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Current Work Plan Year
              </label>
              <input
                id="setting-work-plan-year"
                type="number"
                required
                value={workPlanYear}
                onChange={e => setWorkPlanYear(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden font-bold text-gray-900"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Default year for new annual plans</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Active M&E Evaluation Month
              </label>
              <select
                id="setting-active-month"
                value={activeMonth}
                onChange={e => setActiveMonth(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white font-medium"
              >
                {monthNames.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    Month {idx + 1} - {m}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-gray-400 mt-1 block">Target month for current monthly reports</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Active M&E Reporting Year
              </label>
              <input
                id="setting-active-year"
                type="number"
                required
                value={activeYear}
                onChange={e => setActiveYear(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden font-bold text-gray-900"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Fiscal year for active monthly reports</span>
            </div>
          </div>
        </div>

        {/* Supplementary Governance Policy */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-gray-900">3. Policy Controls</h3>
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <input
              id="setting-allow-outside"
              type="checkbox"
              checked={allowOutsidePlan}
              onChange={e => setAllowOutsidePlan(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-[#006B3F] rounded border-gray-300 focus:ring-[#006B3F]"
            />
            <div>
              <label htmlFor="setting-allow-outside" className="text-xs font-bold text-gray-900 block">
                Allow Desk Officers to Record Activities Outside Approved Work Plan
              </label>
              <p className="text-[11px] text-gray-500 mt-0.5">
                When enabled, Desk Officers can record emergency/ad-hoc activities. All records remain permanently flagged with Work Plan Compliance = NO.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            id="btn-save-system-settings"
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-[#006B3F] hover:bg-[#004D2A] text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-2 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-[#F2C94C]" />
            <span>{isSaving ? 'Applying System Configuration...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
