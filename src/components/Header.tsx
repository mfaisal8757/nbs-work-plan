import React from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { LogOut, ShieldCheck, Building2, Calendar, UserCheck } from 'lucide-react';
import { NbsLogo } from './NbsLogo.js';

export const Header: React.FC = () => {
  const { user, systemSettings, logout } = useAuth();

  const getStageBadgeColor = (stage?: string) => {
    switch (stage) {
      case 'Work Plan Compilation':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Monthly M&E Reporting':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Closed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'Administrator':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Departmental Desk Officer':
        return 'bg-emerald-50 text-[#006B3F] border-[#006B3F]/30';
      case 'Management Viewer':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      {/* Top institutional strip */}
      <div className="bg-[#004D2A] text-white px-4 py-1.5 text-xs font-medium flex flex-wrap justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#F2C94C]"></span>
          <span className="tracking-wide">FEDERAL REPUBLIC OF NIGERIA &bull; NATIONAL BUREAU OF STATISTICS</span>
        </div>
        <div className="flex items-center space-x-4 text-emerald-100">
          <span className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-[#F2C94C]" />
            <span>Work Plan Year: <strong>{systemSettings?.current_work_plan_year || new Date().getFullYear()}</strong></span>
          </span>
          <span className="hidden sm:inline-block text-emerald-300">&bull;</span>
          <span className="hidden sm:flex items-center space-x-1">
            <span>Reporting Month: <strong>Month {systemSettings?.active_reporting_month || new Date().getMonth() + 1}</strong></span>
          </span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Left: NBS Crest / Brand */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center">
            <NbsLogo variant="emblem" className="h-10 w-16 drop-shadow-xs" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
              NATIONAL BUREAU OF STATISTICS
            </h1>
            <p className="text-xs font-semibold text-[#006B3F] tracking-tight">
              WORK PLAN / MONITORING & EVALUATION MANAGEMENT SYSTEM
            </p>
          </div>
        </div>

        {/* Center/Right: Current Reporting Stage & User Context */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Active Stage Indicator */}
          {systemSettings && (
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Current Stage</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStageBadgeColor(
                  systemSettings.reporting_stage
                )}`}
              >
                {systemSettings.reporting_stage}
              </span>
            </div>
          )}

          {/* User Profile Card */}
          {user && (
            <div className="flex items-center pl-3 border-l border-gray-200 space-x-3">
              <div className="hidden lg:block text-right">
                <div className="text-xs font-bold text-gray-900">{user.name}</div>
                <div className="flex items-center justify-end space-x-1 mt-0.5">
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                  {user.department_name && (
                    <span className="text-[10px] text-gray-600 bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200 font-medium">
                      {user.department_name}
                    </span>
                  )}
                </div>
              </div>

              {/* Logout Button */}
              <button
                id="btn-header-logout"
                onClick={logout}
                title="Sign out from NBS WP/M&E System"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 hover:text-red-700 hover:bg-red-50 border border-gray-300 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
