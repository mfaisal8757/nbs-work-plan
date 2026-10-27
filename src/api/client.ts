import {
  Department,
  User,
  SystemSettings,
  AnnualWorkPlan,
  MonthlyMeReport,
  OutsideWorkPlanActivity,
  BudgetRecord,
  AuditLog,
  DashboardStats,
  Role,
  ReportingStage
} from '../types.js';

const TOKEN_KEY = 'nbs_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // If not visiting /auth/login or /auth/status, clear token
    if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/status')) {
      setStoredToken(null);
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}: ${response.statusText}`);
  }

  return data as T;
}

export const api = {
  auth: {
    getStatus: () => apiRequest<{ isUninitialized: boolean; activeStage: ReportingStage }>('/api/auth/status'),
    initAdmin: (data: { name: string; email: string; password: string; phone?: string; staff_id?: string }) =>
      apiRequest<{ user: User; token: string }>('/api/auth/init-admin', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    login: (email: string, password: string) =>
      apiRequest<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    logout: () =>
      apiRequest<{ message: string }>('/api/auth/logout', {
        method: 'POST'
      }),
    me: () => apiRequest<{ user: User }>('/api/auth/me')
  },

  settings: {
    get: () => apiRequest<{ settings: SystemSettings }>('/api/settings'),
    update: (data: Partial<SystemSettings>) =>
      apiRequest<{ settings: SystemSettings }>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  },

  departments: {
    getAll: () => apiRequest<{ departments: Department[] }>('/api/departments'),
    create: (data: Partial<Department>) =>
      apiRequest<{ department: Department }>('/api/departments', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: Partial<Department>) =>
      apiRequest<{ department: Department }>(`/api/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  },

  users: {
    getAll: () => apiRequest<{ users: User[] }>('/api/users'),
    create: (data: { name: string; email: string; password: string; role: Role; department_id: string | null; phone?: string; staff_id?: string }) =>
      apiRequest<{ user: User }>('/api/users', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: Partial<User & { password?: string }>) =>
      apiRequest<{ user: User }>(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  },

  workPlans: {
    getAll: (deptId?: string) =>
      apiRequest<{ work_plans: AnnualWorkPlan[] }>(`/api/work-plans${deptId ? `?department_id=${deptId}` : ''}`),
    getById: (id: string) => apiRequest<{ work_plan: AnnualWorkPlan }>(`/api/work-plans/${id}`),
    create: (data: any) =>
      apiRequest<{ work_plan: AnnualWorkPlan }>('/api/work-plans', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: Partial<AnnualWorkPlan>) =>
      apiRequest<{ work_plan: AnnualWorkPlan }>(`/api/work-plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    review: (id: string, data: { status: 'Approved' | 'Returned for Correction'; review_comments?: string }) =>
      apiRequest<{ work_plan: AnnualWorkPlan }>(`/api/work-plans/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  meReports: {
    getAll: (deptId?: string) =>
      apiRequest<{ me_reports: MonthlyMeReport[] }>(`/api/me-reports${deptId ? `?department_id=${deptId}` : ''}`),
    getById: (id: string) => apiRequest<{ me_report: MonthlyMeReport }>(`/api/me-reports/${id}`),
    create: (data: any) =>
      apiRequest<{ me_report: MonthlyMeReport }>('/api/me-reports', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: Partial<MonthlyMeReport>) =>
      apiRequest<{ me_report: MonthlyMeReport }>(`/api/me-reports/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    review: (id: string, data: { submission_status: 'Approved' | 'Returned for Correction'; review_comments?: string }) =>
      apiRequest<{ me_report: MonthlyMeReport }>(`/api/me-reports/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  outsideActivities: {
    getAll: (deptId?: string) =>
      apiRequest<{ outside_activities: OutsideWorkPlanActivity[] }>(`/api/outside-activities${deptId ? `?department_id=${deptId}` : ''}`),
    create: (data: any) =>
      apiRequest<{ outside_activity: OutsideWorkPlanActivity }>('/api/outside-activities', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: Partial<OutsideWorkPlanActivity>) =>
      apiRequest<{ outside_activity: OutsideWorkPlanActivity }>(`/api/outside-activities/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    review: (id: string, data: { submission_status: 'Approved' | 'Returned for Correction'; review_comments?: string }) =>
      apiRequest<{ outside_activity: OutsideWorkPlanActivity }>(`/api/outside-activities/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  budgets: {
    getAll: (deptId?: string) =>
      apiRequest<{ budgets: BudgetRecord[] }>(`/api/budgets${deptId ? `?department_id=${deptId}` : ''}`),
    update: (id: string, data: Partial<BudgetRecord>) =>
      apiRequest<{ budget: BudgetRecord }>(`/api/budgets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  },

  dashboards: {
    getStats: (deptId?: string) =>
      apiRequest<{ stats: DashboardStats }>(`/api/dashboards/stats${deptId ? `?department_id=${deptId}` : ''}`)
  },

  auditLogs: {
    getAll: () => apiRequest<{ audit_logs: AuditLog[] }>('/api/audit-logs')
  }
};
