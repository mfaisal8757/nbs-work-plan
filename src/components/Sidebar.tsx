import React from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarRange,
  ClipboardCheck,
  AlertOctagon,
  WalletCards,
  CheckSquare,
  FileSpreadsheet,
  Sliders,
  History,
  Info
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'departments'
  | 'users'
  | 'work-plans'
  | 'monthly-me'
  | 'outside-activities'
  | 'budget'
  | 'reviews'
  | 'reports'
  | 'settings'
  | 'audit-logs';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingReviewsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, pendingReviewsCount = 0 }) => {
  const { user, isAdmin, isDeskOfficer, isManagement, systemSettings } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['Administrator']
    },
    {
      id: 'departments' as ActiveTab,
      label: 'Departments',
      icon: Building2,
      roles: ['Administrator']
    },
    {
      id: 'users' as ActiveTab,
      label: 'Users Management',
      icon: Users,
      roles: ['Administrator']
    },
    {
      id: 'work-plans' as ActiveTab,
      label: 'Annual Work Plan',
      icon: CalendarRange,
      roles: ['Administrator', 'Departmental Desk Officer', 'Management Viewer']
    },
    {
      id: 'monthly-me' as ActiveTab,
      label: 'Monthly M&E',
      icon: ClipboardCheck,
      roles: ['Administrator', 'Departmental Desk Officer', 'Management Viewer']
    },
    {
      id: 'outside-activities' as ActiveTab,
      label: 'Outside Approved Plan',
      icon: AlertOctagon,
      roles: ['Administrator']
    },
    {
      id: 'budget' as ActiveTab,
      label: 'Budget Performance',
      icon: WalletCards,
      roles: ['Administrator']
    },
    {
      id: 'reviews' as ActiveTab,
      label: 'Reviews & Approvals',
      icon: CheckSquare,
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined,
      roles: ['Administrator']
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Reports & Exports',
      icon: FileSpreadsheet,
      roles: ['Administrator']
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Reporting Settings',
      icon: Sliders,
      roles: ['Administrator']
    },
    {
      id: 'audit-logs' as ActiveTab,
      label: 'System Audit Trail',
      icon: History,
      roles: ['Administrator']
    }
  ];

  const visibleItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 shadow-xs min-h-[calc(100vh-80px)]">
      {/* Navigation List */}
      <div className="py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Core Modules
        </div>
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#006B3F] text-white shadow-xs'
                  : 'text-gray-700 hover:bg-emerald-50/70 hover:text-[#006B3F]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#F2C94C]' : 'text-gray-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-amber-400 text-amber-950' : 'bg-red-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Role and Department Information Card at bottom */}
      <div className="p-3 border-t border-gray-200 bg-gray-50/80 m-3 rounded-lg text-xs">
        <div className="flex items-center space-x-2 text-gray-600 mb-1.5 font-medium">
          <Info className="w-3.5 h-3.5 text-[#006B3F]" />
          <span className="font-semibold text-gray-800">Security Scope</span>
        </div>
        {isDeskOfficer && (
          <div className="text-[11px] text-gray-600 space-y-1">
            <div>
              Department: <strong className="text-gray-900">{user?.department_name || 'Assigned'}</strong>
            </div>
            <div className="text-[#006B3F] text-[10px] font-semibold">
              Authorized: Work Plan Submission & Monthly M&E Reporting
            </div>
          </div>
        )}
        {isAdmin && (
          <div className="text-[11px] text-gray-600">
            Role: <strong className="text-amber-800">Administrator</strong>
            <p className="text-[10px] text-gray-500 mt-0.5">Full administrative and approval rights across all departments.</p>
          </div>
        )}
        {isManagement && (
          <div className="text-[11px] text-gray-600">
            Role: <strong className="text-sky-800">Management Viewer</strong>
            <p className="text-[10px] text-gray-500 mt-0.5">Read-only institutional analytics & cross-department reports.</p>
          </div>
        )}
      </div>
    </aside>
  );
};
