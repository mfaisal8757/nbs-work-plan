/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { LoginView } from './components/LoginView.js';
import { Header } from './components/Header.js';
import { Sidebar, ActiveTab } from './components/Sidebar.js';
import { DashboardView } from './components/DashboardView.js';
import { DepartmentsView } from './components/DepartmentsView.js';
import { UsersView } from './components/UsersView.js';
import { WorkPlanView } from './components/WorkPlanView.js';
import { MonthlyMeView } from './components/MonthlyMeView.js';
import { OutsideActivitiesView } from './components/OutsideActivitiesView.js';
import { BudgetView } from './components/BudgetView.js';
import { ReviewsView } from './components/ReviewsView.js';
import { ReportsView } from './components/ReportsView.js';
import { SettingsView } from './components/SettingsView.js';
import { AuditTrailView } from './components/AuditTrailView.js';
import { NbsLogo } from './components/NbsLogo.js';
import { api } from './api/client.js';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user, isAdmin, isDeskOfficer } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0);

  // Sync initial and allowed active tab whenever user/role resolves
  useEffect(() => {
    if (user) {
      if (!isAdmin) {
        // Departmental Desk Officers only report work plan and monthly M&E
        if (activeTab !== 'work-plans' && activeTab !== 'monthly-me') {
          setActiveTab('work-plans');
        }
      }
    }
  }, [user?.id, user?.role]);

  // Poll or refresh pending reviews count for Administrator
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadPendingCount();
    }
  }, [isAuthenticated, isAdmin, activeTab]);

  const loadPendingCount = async () => {
    try {
      const [wpRes, meRes, outRes] = await Promise.all([
        api.workPlans.getAll(),
        api.meReports.getAll(),
        api.outsideActivities.getAll()
      ]);
      const wpCount = wpRes.work_plans.filter(w => w.status === 'Submitted').length;
      const meCount = meRes.me_reports.filter(r => r.submission_status === 'Submitted').length;
      const outCount = outRes.outside_activities.filter(a => a.submission_status === 'Submitted').length;
      setPendingReviewsCount(wpCount + meCount + outCount);
    } catch {
      // Non-blocking
    }
  };

  // If session is resolving, show a clean institutional loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F8F5] flex flex-col items-center justify-center p-4">
        <div className="mb-4">
          <NbsLogo variant="emblem" className="w-20 h-14 drop-shadow-sm" />
        </div>
        <div className="w-6 h-6 border-2 border-[#006B3F] border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="text-xs font-semibold text-gray-700">Connecting to NBS Secure Portal...</p>
      </div>
    );
  }

  // Section 1 Constraint: When app opens, show Login Page first. No dashboard accessible before login!
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Strict RBAC Guard:
  // Dashboard, Budget Performance, Reporting & Export are Admin only.
  // Departmental desk officers only report work plan and monthly M&E.
  const adminOnlyTabs: ActiveTab[] = [
    'dashboard',
    'budget',
    'reports',
    'outside-activities',
    'departments',
    'users',
    'reviews',
    'settings',
    'audit-logs'
  ];
  if (!isAdmin && adminOnlyTabs.includes(activeTab)) {
    setActiveTab('work-plans');
  }

  const effectiveTab: ActiveTab = !isAdmin && adminOnlyTabs.includes(activeTab) ? 'work-plans' : activeTab;

  return (
    <div className="min-h-screen bg-[#F4F8F5] flex flex-col text-gray-800">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={effectiveTab}
          setActiveTab={setActiveTab}
          pendingReviewsCount={pendingReviewsCount}
        />

        <main className="flex-1 overflow-y-auto min-h-[calc(100vh-80px)] bg-[#F4F8F5] pb-12">
          {effectiveTab === 'dashboard' && (
            <DashboardView onNavigateTab={tab => setActiveTab(tab)} />
          )}
          {effectiveTab === 'departments' && <DepartmentsView />}
          {effectiveTab === 'users' && <UsersView />}
          {effectiveTab === 'work-plans' && <WorkPlanView />}
          {effectiveTab === 'monthly-me' && <MonthlyMeView />}
          {effectiveTab === 'outside-activities' && <OutsideActivitiesView />}
          {effectiveTab === 'budget' && <BudgetView />}
          {effectiveTab === 'reviews' && <ReviewsView />}
          {effectiveTab === 'reports' && <ReportsView />}
          {effectiveTab === 'settings' && <SettingsView />}
          {effectiveTab === 'audit-logs' && <AuditTrailView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
