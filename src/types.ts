export type Role = 'Administrator' | 'Departmental Desk Officer' | 'Management Viewer';

export type ReportingStage = 'Work Plan Compilation' | 'Monthly M&E Reporting' | 'Review Stage' | 'Closed';

export type WorkPlanStatus = 'Draft' | 'Submitted' | 'Returned for Correction' | 'Approved';

export type SubmissionStatus = 'Draft' | 'Submitted' | 'Returned for Correction' | 'Approved';

export interface Department {
  id: string;
  code: string;
  name: string;
  head_of_department: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department_id: string | null;
  department_name: string | null;
  phone: string;
  staff_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  reporting_stage: ReportingStage;
  current_work_plan_year: number;
  active_reporting_month: number;
  active_reporting_year: number;
  allow_desk_officer_outside_plan_entry?: boolean;
  updated_at: string;
  updated_by: string;
}

export type AlignmentOption =
  | 'National Development Plan'
  | 'Renewed Hope Agenda'
  | 'NSDS/Statistical Master Plan'
  | 'SDGs Indicator Framework'
  | 'Africa Agenda 2063'
  | 'Ministerial Deliverables'
  | 'Statistics Act Mandate';

export type ReportingFrequencyOption =
  | 'Daily'
  | 'Once-Off'
  | 'Monthly'
  | 'Quarterly'
  | 'Annually'
  | 'Bi-Annually';

export type FundingSourceOption =
  | 'Appropriation'
  | 'Donor'
  | 'Others';

export type ActivityTypeOption =
  | 'Survey'
  | 'Administrative'
  | 'Capital Project'
  | 'Regulatory'
  | 'Ad-hoc';

export interface AnnualWorkPlan {
  id: string;
  activity_code: string; // Permanent auto-generated e.g. NBS-ESD-2026-001
  
  // OUTCOME
  outcome: string;

  // ALIGNMENT
  alignment: AlignmentOption | string;

  // OUTPUT
  output: string;
  project_name: string; // Synced with output for backwards compatibility

  // KEY ACTIVITIES
  key_activities: string;
  activity_description: string; // Synced with key_activities
  objective?: string; // Statistical/project objective
  kpi: string; // Key Performance Indicators
  reporting_frequency: ReportingFrequencyOption | string;
  annual_performance_indicators: string;
  annual_performance_indicator?: string; // Synced with annual_performance_indicators
  type_of_activities: ActivityTypeOption | string;
  means_of_verification: string;
  baseline: string;
  target: string;
  annual_target: string;
  timeline_q1: boolean;
  timeline_q2: boolean;
  timeline_q3: boolean;
  timeline_q4: boolean;

  // INPUT
  total_budget: number;
  funding_source: FundingSourceOption | string;
  responsible_officer: string;
  staff_responsible: string; // Synced with responsible_officer
  division?: string; // Division within department

  // Administrative / System metadata
  work_plan_year: number;
  department_id: string;
  department_name: string;
  status: WorkPlanStatus;
  submission_date: string | null;
  review_comments: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyMeReport {
  id: string;
  work_plan_id: string;
  activity_code: string;
  project_name: string;
  department_id: string;
  department_name: string;
  reporting_month: number;
  reporting_year: number;
  actual_start: string;
  actual_duration: string;
  actual_end: string;
  actual_achievement: string;
  percentage_completed: number;
  outcome: string;
  milestone_achieved: string;
  challenges: string;
  remarks: string;
  evidence: string;
  kpi_achieved?: 'Yes' | 'No'; // Indicates if target achieved completely in a particular quarter or not
  submission_status: SubmissionStatus;
  review_comments: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface OutsideWorkPlanActivity {
  id: string;
  activity_code: string;
  activity_name: string;
  description: string;
  reason_not_in_approved_plan: string;
  department_id: string;
  department_name: string;
  reporting_month: number;
  reporting_year: number;
  target: string;
  actual_achievement: string;
  percentage_completed: number;
  outcome: string;
  challenges: string;
  remarks: string;
  evidence: string;
  kpi_achieved?: 'Yes' | 'No'; // Indicates if target achieved completely in a particular quarter or not
  work_plan_compliance: 'NO'; // Fixed permanently
  submission_status: SubmissionStatus;
  review_comments: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetRecord {
  id: string;
  work_plan_id: string;
  project_name: string;
  activity_code: string;
  department_id: string;
  department_name: string;
  year: number;
  total_budget: number;
  appropriation: number;
  donor: string;
  released: number;
  utilized: number;
  balance: number;
  more_fund: number;
  budget_utilization_pct: number;
  updated_at: string;
  updated_by: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  role: Role;
  department_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
}

export interface DepartmentMonthlyTimeline {
  month_num: number;
  month_name: string;
  has_reported: boolean;
  reports_count: number;
  avg_achievement: number;
  status: 'reported' | 'missed' | 'upcoming';
}

export interface DepartmentSummaryItem {
  department_id: string;
  department_code: string;
  department_name: string;
  total_projects: number;
  approved_projects: number;
  monthly_reports: number;
  reporting_compliance: number;
  work_plan_compliance: number;
  achievement_rate: number;
  budget_utilization: number;

  // Monthly reporting consistency metrics
  reporting_consistency?: {
    months_reported: number[];
    active_months_count: number;
    expected_months_count: number;
    consecutive_months: number;
    consistency_rate: number;
    is_consistent: boolean;
    status: 'Consistent' | 'Regular' | 'Inconsistent' | 'Non-Reporting';
  };

  // Performance level metrics
  performance_level?: {
    tier: 'High' | 'Moderate' | 'Low' | 'Critical';
    label: string;
    score: number;
    color: string;
  };

  timeline?: DepartmentMonthlyTimeline[];
}

export interface MonthlyTrendItem {
  month_name: string;
  month_num: number;
  reports_count: number;
  avg_achievement: number;
  outside_count: number;
  by_department?: Record<string, {
    department_code: string;
    department_name: string;
    reports_count: number;
    avg_achievement: number;
    outside_count: number;
    reported: boolean;
  }>;
}

export interface ConsistencyComparisonOverview {
  total_departments: number;
  consistent_departments_count: number;
  regular_departments_count: number;
  inconsistent_departments_count: number;
  non_reporting_departments_count: number;
  consistency_percentage: number;
  top_performing_department?: {
    code: string;
    name: string;
    rate: number;
  } | null;
  most_consistent_department?: {
    code: string;
    name: string;
    rate: number;
  } | null;
}

export interface DepartmentActivityCount {
  department_id: string;
  department_code: string;
  department_name: string;
  work_plan_activities: number;
  outside_activities: number;
  total_activities: number;
}

export interface DashboardStats {
  departments_count: number;
  users_count: number;
  work_plan_projects_count: number;
  approved_projects_count: number;
  monthly_reports_count: number;
  pending_reviews_count: number;
  pending_me_reports_count: number;
  pending_work_plans_count: number;
  pending_outside_activities_count: number;
  outside_activities_count: number;
  returned_reports_count: number;
  
  // Total activities and departmental breakdown
  total_activities_count: number;
  activities_by_department: DepartmentActivityCount[];
  
  // Monthly budget utilization metrics
  current_reporting_month: number;
  current_reporting_month_name: string;
  current_monthly_budget_utilization_pct: number;
  
  reporting_compliance_pct: number;
  work_plan_compliance_pct: number;
  average_achievement_pct: number;
  overall_system_average_pct?: number;
  
  kpi_stats?: {
    achievement_rate: number;
    achieved_count: number;
    not_achieved_count: number;
    total_count: number;
  };
  
  budget_performance: {
    total_budget: number;
    total_appropriation: number;
    total_donor: number;
    total_released: number;
    total_utilized: number;
    total_balance: number;
    total_more_fund: number;
    utilization_pct: number;
  };
  
  monthly_trends: MonthlyTrendItem[];
  department_summaries: DepartmentSummaryItem[];
  consistency_comparison?: ConsistencyComparisonOverview;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isInitialSetupNeeded: boolean;
  isLoading: boolean;
}
