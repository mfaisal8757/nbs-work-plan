import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Department,
  User,
  SystemSettings,
  AnnualWorkPlan,
  MonthlyMeReport,
  OutsideWorkPlanActivity,
  BudgetRecord,
  AuditLog,
  Role,
  ReportingStage,
  WorkPlanStatus,
  SubmissionStatus,
  DashboardStats
} from '../src/types.js';

interface DatabaseSchema {
  system_settings: SystemSettings;
  departments: Department[];
  users: (User & { password_hash: string; salt: string })[];
  annual_work_plans: AnnualWorkPlan[];
  monthly_me_reports: MonthlyMeReport[];
  outside_work_plan_activities: OutsideWorkPlanActivity[];
  budgets: BudgetRecord[];
  audit_logs: AuditLog[];
  activity_sequences: Record<string, number>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'nbs_database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultSettings: SystemSettings = {
  reporting_stage: 'Work Plan Compilation',
  current_work_plan_year: new Date().getFullYear(),
  active_reporting_month: new Date().getMonth() + 1,
  active_reporting_year: new Date().getFullYear(),
  updated_at: new Date().toISOString(),
  updated_by: 'System'
};

function getInitialEmptyDb(): DatabaseSchema {
  return {
    system_settings: defaultSettings,
    departments: [],
    users: [],
    annual_work_plans: [],
    monthly_me_reports: [],
    outside_work_plan_activities: [],
    budgets: [],
    audit_logs: [],
    activity_sequences: {}
  };
}

let dbInstance: DatabaseSchema | null = null;

function loadDatabase(): DatabaseSchema {
  if (dbInstance) return dbInstance;

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      dbInstance = {
        system_settings: parsed.system_settings || defaultSettings,
        departments: parsed.departments || [],
        users: parsed.users || [],
        annual_work_plans: parsed.annual_work_plans || [],
        monthly_me_reports: parsed.monthly_me_reports || [],
        outside_work_plan_activities: parsed.outside_work_plan_activities || [],
        budgets: parsed.budgets || [],
        audit_logs: parsed.audit_logs || [],
        activity_sequences: parsed.activity_sequences || {}
      };
      return dbInstance!;
    } catch (err) {
      console.error('Error loading database file, initializing clean database:', err);
    }
  }

  dbInstance = getInitialEmptyDb();
  saveDatabase();
  return dbInstance!;
}

export function saveDatabase(): void {
  if (!dbInstance) return;
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(dbInstance, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

// Password hashing
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, generatedSalt, 64).toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
}

// Audit logging helper
export function logAudit(
  user: { id: string; name: string; role: Role; department_id: string | null },
  action: string,
  entity_type: string,
  entity_id: string,
  details: string
): void {
  const db = loadDatabase();
  const log: AuditLog = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    user_id: user.id,
    user_name: user.name,
    role: user.role,
    department_id: user.department_id,
    action,
    entity_type,
    entity_id,
    details
  };
  db.audit_logs.unshift(log);
  // Keep last 2000 logs for clean storage
  if (db.audit_logs.length > 2000) {
    db.audit_logs.pop();
  }
  saveDatabase();
}

// Auto-generate unique permanent activity code: NBS-{DEPT_CODE}-{YEAR}-{001}
export function generateActivityCode(deptCode: string, year: number): string {
  const db = loadDatabase();
  const cleanDept = (deptCode || 'GEN').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const key = `${cleanDept}-${year}`;
  const currentSeq = (db.activity_sequences[key] || 0) + 1;
  db.activity_sequences[key] = currentSeq;
  saveDatabase();

  const paddedSeq = String(currentSeq).padStart(3, '0');
  return `NBS-${cleanDept}-${year}-${paddedSeq}`;
}

// Auto-generate outside activity code: NBS-EXT-{DEPT_CODE}-{YEAR}-{001}
export function generateOutsideActivityCode(deptCode: string, year: number): string {
  const db = loadDatabase();
  const cleanDept = (deptCode || 'GEN').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const key = `EXT-${cleanDept}-${year}`;
  const currentSeq = (db.activity_sequences[key] || 0) + 1;
  db.activity_sequences[key] = currentSeq;
  saveDatabase();

  const paddedSeq = String(currentSeq).padStart(3, '0');
  return `NBS-EXT-${cleanDept}-${year}-${paddedSeq}`;
}

// Database helper functions
export const db = {
  // Check if system is uninitialized (0 users)
  isUninitialized(): boolean {
    const data = loadDatabase();
    return data.users.length === 0;
  },

  // Settings
  getSettings(): SystemSettings {
    const data = loadDatabase();
    return data.system_settings;
  },

  updateSettings(settings: Partial<SystemSettings>, updatedBy: string): SystemSettings {
    const data = loadDatabase();
    data.system_settings = {
      ...data.system_settings,
      ...settings,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy
    };
    saveDatabase();
    return data.system_settings;
  },

  // Departments
  getDepartments(): Department[] {
    const data = loadDatabase();
    return data.departments;
  },

  getDepartmentById(id: string): Department | undefined {
    const data = loadDatabase();
    return data.departments.find(d => d.id === id);
  },

  getDepartmentByCode(code: string): Department | undefined {
    const data = loadDatabase();
    return data.departments.find(d => d.code.toLowerCase() === code.toLowerCase());
  },

  createDepartment(dept: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Department {
    const data = loadDatabase();
    const existing = data.departments.find(
      d => d.code.toLowerCase() === dept.code.toLowerCase() || d.name.toLowerCase() === dept.name.toLowerCase()
    );
    if (existing) {
      throw new Error(`A department with code '${dept.code}' or name '${dept.name}' already exists.`);
    }

    const newDept: Department = {
      id: crypto.randomUUID(),
      code: dept.code.toUpperCase().trim(),
      name: dept.name.trim(),
      head_of_department: dept.head_of_department?.trim() || '',
      email: dept.email?.trim() || '',
      is_active: dept.is_active !== undefined ? dept.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.departments.push(newDept);
    saveDatabase();
    return newDept;
  },

  updateDepartment(id: string, updates: Partial<Omit<Department, 'id' | 'created_at'>>): Department {
    const data = loadDatabase();
    const idx = data.departments.findIndex(d => d.id === id);
    if (idx === -1) throw new Error('Department not found');

    if (updates.code) {
      const codeTaken = data.departments.find(
        d => d.id !== id && d.code.toLowerCase() === updates.code!.toLowerCase()
      );
      if (codeTaken) throw new Error(`Department code '${updates.code}' is already in use.`);
    }

    data.departments[idx] = {
      ...data.departments[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveDatabase();
    return data.departments[idx];
  },

  // Users
  getUsers(): User[] {
    const data = loadDatabase();
    return data.users.map(({ password_hash, salt, ...user }) => user);
  },

  getUserById(id: string): (User & { password_hash: string; salt: string }) | undefined {
    const data = loadDatabase();
    return data.users.find(u => u.id === id);
  },

  getUserByEmail(email: string): (User & { password_hash: string; salt: string }) | undefined {
    const data = loadDatabase();
    return data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  createUser(
    userData: {
      name: string;
      email: string;
      password: string;
      role: Role;
      department_id: string | null;
      phone?: string;
      staff_id?: string;
    }
  ): User {
    const data = loadDatabase();
    const emailExists = data.users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (emailExists) {
      throw new Error(`Email ${userData.email} is already registered.`);
    }

    let deptName: string | null = null;
    if (userData.role === 'Departmental Desk Officer') {
      if (!userData.department_id) {
        throw new Error('A Departmental Desk Officer must be assigned to an active department.');
      }
      const dept = data.departments.find(d => d.id === userData.department_id);
      if (!dept) {
        throw new Error('Assigned department does not exist.');
      }
      deptName = dept.name;
    } else if (userData.department_id) {
      const dept = data.departments.find(d => d.id === userData.department_id);
      if (dept) deptName = dept.name;
    }

    const { hash, salt } = hashPassword(userData.password);

    const newUser: User & { password_hash: string; salt: string } = {
      id: crypto.randomUUID(),
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password_hash: hash,
      salt: salt,
      role: userData.role,
      department_id: userData.role === 'Departmental Desk Officer' ? userData.department_id : (userData.department_id || null),
      department_name: deptName,
      phone: userData.phone?.trim() || '',
      staff_id: userData.staff_id?.trim() || '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    data.users.push(newUser);
    saveDatabase();

    const { password_hash, salt: s, ...safeUser } = newUser;
    return safeUser;
  },

  updateUser(
    id: string,
    updates: Partial<{
      name: string;
      email: string;
      role: Role;
      department_id: string | null;
      phone: string;
      staff_id: string;
      is_active: boolean;
      password?: string;
    }>
  ): User {
    const data = loadDatabase();
    const idx = data.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');

    const currentUser = data.users[idx];

    if (updates.email && updates.email.toLowerCase() !== currentUser.email.toLowerCase()) {
      const exists = data.users.find(u => u.id !== id && u.email.toLowerCase() === updates.email!.toLowerCase());
      if (exists) throw new Error('Email already registered by another user.');
    }

    let deptName = currentUser.department_name;
    let deptId = currentUser.department_id;

    if (updates.department_id !== undefined || updates.role !== undefined) {
      const targetRole = updates.role || currentUser.role;
      deptId = updates.department_id !== undefined ? updates.department_id : currentUser.department_id;

      if (targetRole === 'Departmental Desk Officer') {
        if (!deptId) throw new Error('A Departmental Desk Officer must be assigned to a department.');
        const dept = data.departments.find(d => d.id === deptId);
        if (!dept) throw new Error('Assigned department does not exist.');
        deptName = dept.name;
      } else {
        if (deptId) {
          const dept = data.departments.find(d => d.id === deptId);
          deptName = dept ? dept.name : null;
        } else {
          deptName = null;
        }
      }
    }

    let newHash = currentUser.password_hash;
    let newSalt = currentUser.salt;
    if (updates.password) {
      const h = hashPassword(updates.password);
      newHash = h.hash;
      newSalt = h.salt;
    }

    data.users[idx] = {
      ...currentUser,
      ...updates,
      department_id: deptId,
      department_name: deptName,
      password_hash: newHash,
      salt: newSalt,
      updated_at: new Date().toISOString()
    };

    saveDatabase();
    const { password_hash, salt, ...safeUser } = data.users[idx];
    return safeUser;
  },

  // Annual Work Plans
  getAnnualWorkPlans(filterDeptId?: string): AnnualWorkPlan[] {
    const data = loadDatabase();
    if (filterDeptId) {
      return data.annual_work_plans.filter(wp => wp.department_id === filterDeptId);
    }
    return data.annual_work_plans;
  },

  getAnnualWorkPlanById(id: string): AnnualWorkPlan | undefined {
    const data = loadDatabase();
    return data.annual_work_plans.find(wp => wp.id === id);
  },

  createAnnualWorkPlan(
    wpData: {
      outcome?: string;
      alignment?: string;
      output?: string;
      project_name?: string;
      objective?: string;
      key_activities?: string;
      activity_description?: string;
      kpi?: string;
      reporting_frequency?: string;
      annual_performance_indicators?: string;
      annual_performance_indicator?: string;
      type_of_activities?: string;
      means_of_verification?: string;
      baseline?: string;
      target?: string;
      annual_target?: string;
      timeline_q1: boolean;
      timeline_q2: boolean;
      timeline_q3: boolean;
      timeline_q4: boolean;
      total_budget: number;
      funding_source?: string;
      responsible_officer?: string;
      staff_responsible?: string;
      division?: string;
      work_plan_year: number;
      status: 'Draft' | 'Submitted';
    },
    department: Department,
    createdByUserId: string
  ): AnnualWorkPlan {
    const data = loadDatabase();
    const activityCode = generateActivityCode(department.code, wpData.work_plan_year);

    const resolvedOutput = (wpData.output || wpData.project_name || '').trim();
    const resolvedActivities = (wpData.key_activities || wpData.activity_description || '').trim();
    const resolvedOutcome = (wpData.outcome || wpData.objective || '').trim();
    const resolvedAlignment = (wpData.alignment || 'National Development Plan').trim();
    const resolvedKpi = (wpData.kpi || wpData.annual_performance_indicator || '').trim();
    const resolvedAnnualIndicators = (wpData.annual_performance_indicators || wpData.annual_performance_indicator || '').trim();
    const resolvedReportingFreq = (wpData.reporting_frequency || 'Quarterly').trim();
    const resolvedTypeOfActivities = (wpData.type_of_activities || 'Survey').trim();
    const resolvedMeansOfVerification = (wpData.means_of_verification || 'Published Statistical Report').trim();
    const resolvedBaseline = (wpData.baseline || '').trim();
    const resolvedTarget = (wpData.target || '').trim();
    const resolvedAnnualTarget = (wpData.annual_target || wpData.target || '').trim();
    const resolvedFundingSource = (wpData.funding_source || 'Appropriation').trim();
    const resolvedOfficer = (wpData.responsible_officer || wpData.staff_responsible || '').trim();
    const resolvedDivision = (wpData.division || '').trim();

    const newWorkPlan: AnnualWorkPlan = {
      id: crypto.randomUUID(),
      activity_code: activityCode,

      // OUTCOME
      outcome: resolvedOutcome,

      // ALIGNMENT
      alignment: resolvedAlignment,

      // OUTPUT
      output: resolvedOutput,
      project_name: resolvedOutput, // Backward compatibility

      // KEY ACTIVITIES
      key_activities: resolvedActivities,
      activity_description: resolvedActivities, // Backward compatibility
      objective: resolvedOutcome || resolvedActivities, // Backward compatibility
      kpi: resolvedKpi,
      reporting_frequency: resolvedReportingFreq,
      annual_performance_indicators: resolvedAnnualIndicators,
      annual_performance_indicator: resolvedAnnualIndicators, // Backward compatibility
      type_of_activities: resolvedTypeOfActivities,
      means_of_verification: resolvedMeansOfVerification,
      baseline: resolvedBaseline,
      target: resolvedTarget,
      annual_target: resolvedAnnualTarget,
      timeline_q1: Boolean(wpData.timeline_q1),
      timeline_q2: Boolean(wpData.timeline_q2),
      timeline_q3: Boolean(wpData.timeline_q3),
      timeline_q4: Boolean(wpData.timeline_q4),

      // INPUT
      total_budget: Number(wpData.total_budget) || 0,
      funding_source: resolvedFundingSource,
      responsible_officer: resolvedOfficer,
      staff_responsible: resolvedOfficer, // Backward compatibility
      division: resolvedDivision,

      // Administrative / Metadata
      work_plan_year: wpData.work_plan_year,
      department_id: department.id,
      department_name: department.name,
      status: wpData.status,
      submission_date: wpData.status === 'Submitted' ? new Date().toISOString() : null,
      review_comments: null,
      reviewed_by: null,
      reviewed_at: null,
      created_by_user_id: createdByUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    data.annual_work_plans.push(newWorkPlan);

    // Also auto-initialize a linked budget record
    const isDonor = resolvedFundingSource === 'Donor';
    const newBudget: BudgetRecord = {
      id: crypto.randomUUID(),
      work_plan_id: newWorkPlan.id,
      project_name: newWorkPlan.project_name,
      activity_code: newWorkPlan.activity_code,
      department_id: department.id,
      department_name: department.name,
      year: newWorkPlan.work_plan_year,
      total_budget: newWorkPlan.total_budget,
      appropriation: isDonor ? 0 : newWorkPlan.total_budget,
      donor: isDonor ? String(newWorkPlan.total_budget) : 0,
      released: 0,
      utilized: 0,
      balance: newWorkPlan.total_budget,
      more_fund: 0,
      budget_utilization_pct: 0,
      updated_at: new Date().toISOString(),
      updated_by: 'System Initializer'
    } as any;
    data.budgets.push(newBudget);

    saveDatabase();
    return newWorkPlan;
  },

  updateAnnualWorkPlan(
    id: string,
    updates: Partial<AnnualWorkPlan>,
    allowedDeptId?: string
  ): AnnualWorkPlan {
    const data = loadDatabase();
    const idx = data.annual_work_plans.findIndex(wp => wp.id === id);
    if (idx === -1) throw new Error('Annual Work Plan record not found.');

    const current = data.annual_work_plans[idx];
    if (allowedDeptId && current.department_id !== allowedDeptId) {
      throw new Error('Access denied: Record does not belong to your assigned department.');
    }

    // Protect permanent activity_code, department_id, department_name from being changed
    const safeUpdates = { ...updates };
    delete (safeUpdates as any).activity_code;
    delete (safeUpdates as any).department_id;
    delete (safeUpdates as any).department_name;

    // Cross-sync aliases for safety
    if (safeUpdates.output && !safeUpdates.project_name) safeUpdates.project_name = safeUpdates.output;
    if (safeUpdates.project_name && !safeUpdates.output) safeUpdates.output = safeUpdates.project_name;
    if (safeUpdates.key_activities && !safeUpdates.activity_description) safeUpdates.activity_description = safeUpdates.key_activities;
    if (safeUpdates.activity_description && !safeUpdates.key_activities) safeUpdates.key_activities = safeUpdates.activity_description;
    if (safeUpdates.annual_performance_indicators && !safeUpdates.annual_performance_indicator) safeUpdates.annual_performance_indicator = safeUpdates.annual_performance_indicators;
    if (safeUpdates.annual_performance_indicator && !safeUpdates.annual_performance_indicators) safeUpdates.annual_performance_indicators = safeUpdates.annual_performance_indicator;
    if (safeUpdates.responsible_officer && !safeUpdates.staff_responsible) safeUpdates.staff_responsible = safeUpdates.responsible_officer;
    if (safeUpdates.staff_responsible && !safeUpdates.responsible_officer) safeUpdates.responsible_officer = safeUpdates.staff_responsible;

    if (safeUpdates.status === 'Submitted' && current.status !== 'Submitted') {
      safeUpdates.submission_date = new Date().toISOString();
    }

    data.annual_work_plans[idx] = {
      ...current,
      ...safeUpdates,
      updated_at: new Date().toISOString()
    };

    // Update project_name & budget in linked budget record if modified
    const budgetIdx = data.budgets.findIndex(b => b.work_plan_id === id);
    if (budgetIdx !== -1) {
      if (safeUpdates.project_name || safeUpdates.output) {
        data.budgets[budgetIdx].project_name = safeUpdates.output || safeUpdates.project_name || data.budgets[budgetIdx].project_name;
      }
      if (safeUpdates.total_budget !== undefined) {
        data.budgets[budgetIdx].total_budget = Number(safeUpdates.total_budget);
        const rel = data.budgets[budgetIdx].released || 0;
        const ut = data.budgets[budgetIdx].utilized || 0;
        data.budgets[budgetIdx].balance = rel - ut;
      }
    }

    saveDatabase();
    return data.annual_work_plans[idx];
  },

  // Monthly M&E Reports
  getMonthlyMeReports(filterDeptId?: string): MonthlyMeReport[] {
    const data = loadDatabase();
    if (filterDeptId) {
      return data.monthly_me_reports.filter(r => r.department_id === filterDeptId);
    }
    return data.monthly_me_reports;
  },

  getMonthlyMeReportById(id: string): MonthlyMeReport | undefined {
    const data = loadDatabase();
    return data.monthly_me_reports.find(r => r.id === id);
  },

  createMonthlyMeReport(
    reportData: {
      work_plan_id: string;
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
      kpi_achieved?: 'Yes' | 'No' | string;
      submission_status: SubmissionStatus;
    },
    allowedDeptId: string,
    createdByUserId: string
  ): MonthlyMeReport {
    const data = loadDatabase();

    // 1. Verify approved work plan exists and belongs to the department
    const workPlan = data.annual_work_plans.find(wp => wp.id === reportData.work_plan_id);
    if (!workPlan) {
      throw new Error('Selected Work Plan project does not exist.');
    }
    if (workPlan.department_id !== allowedDeptId) {
      throw new Error('Access denied: Work Plan does not belong to your department.');
    }
    if (workPlan.status !== 'Approved') {
      throw new Error('Only approved work-plan projects can be used for monthly M&E reporting.');
    }

    // 2. Prevent duplicate reports for the same project and reporting month/year
    const duplicate = data.monthly_me_reports.find(
      r =>
        r.work_plan_id === reportData.work_plan_id &&
        Number(r.reporting_month) === Number(reportData.reporting_month) &&
        Number(r.reporting_year) === Number(reportData.reporting_year)
    );
    if (duplicate) {
      throw new Error(
        `A Monthly M&E report already exists for this project for month ${reportData.reporting_month}/${reportData.reporting_year}. Duplicate submissions are prevented.`
      );
    }

    const newReport: MonthlyMeReport = {
      id: crypto.randomUUID(),
      work_plan_id: workPlan.id,
      activity_code: workPlan.activity_code,
      project_name: workPlan.project_name,
      department_id: workPlan.department_id,
      department_name: workPlan.department_name,
      reporting_month: Number(reportData.reporting_month),
      reporting_year: Number(reportData.reporting_year),
      actual_start: reportData.actual_start?.trim() || '',
      actual_duration: reportData.actual_duration?.trim() || '',
      actual_end: reportData.actual_end?.trim() || '',
      actual_achievement: reportData.actual_achievement?.trim() || '',
      percentage_completed: Math.min(100, Math.max(0, Number(reportData.percentage_completed) || 0)),
      outcome: reportData.outcome?.trim() || '',
      milestone_achieved: reportData.milestone_achieved?.trim() || '',
      challenges: reportData.challenges?.trim() || '',
      remarks: reportData.remarks?.trim() || '',
      evidence: reportData.evidence?.trim() || '',
      kpi_achieved: reportData.kpi_achieved === 'Yes' ? 'Yes' : 'No',
      submission_status: reportData.submission_status || 'Draft',
      review_comments: null,
      reviewed_by: null,
      reviewed_at: null,
      created_by_user_id: createdByUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    data.monthly_me_reports.push(newReport);
    saveDatabase();
    return newReport;
  },

  updateMonthlyMeReport(
    id: string,
    updates: Partial<MonthlyMeReport>,
    allowedDeptId?: string
  ): MonthlyMeReport {
    const data = loadDatabase();
    const idx = data.monthly_me_reports.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Monthly M&E Report not found.');

    const current = data.monthly_me_reports[idx];
    if (allowedDeptId && current.department_id !== allowedDeptId) {
      throw new Error('Access denied: Record does not belong to your assigned department.');
    }

    // Cannot change work_plan_id, department_id, or activity_code
    const safeUpdates = { ...updates };
    delete (safeUpdates as any).work_plan_id;
    delete (safeUpdates as any).department_id;
    delete (safeUpdates as any).department_name;
    delete (safeUpdates as any).activity_code;

    if (safeUpdates.percentage_completed !== undefined) {
      safeUpdates.percentage_completed = Math.min(100, Math.max(0, Number(safeUpdates.percentage_completed)));
    }

    data.monthly_me_reports[idx] = {
      ...current,
      ...safeUpdates,
      updated_at: new Date().toISOString()
    };

    saveDatabase();
    return data.monthly_me_reports[idx];
  },

  // Activities Outside Approved Work Plan
  getOutsideActivities(filterDeptId?: string): OutsideWorkPlanActivity[] {
    const data = loadDatabase();
    if (filterDeptId) {
      return data.outside_work_plan_activities.filter(a => a.department_id === filterDeptId);
    }
    return data.outside_work_plan_activities;
  },

  getOutsideActivityById(id: string): OutsideWorkPlanActivity | undefined {
    const data = loadDatabase();
    return data.outside_work_plan_activities.find(a => a.id === id);
  },

  createOutsideActivity(
    actData: {
      activity_name: string;
      description: string;
      reason_not_in_approved_plan: string;
      reporting_month: number;
      reporting_year: number;
      target: string;
      actual_achievement: string;
      percentage_completed: number;
      outcome: string;
      challenges: string;
      remarks: string;
      evidence: string;
      kpi_achieved?: 'Yes' | 'No' | string;
      submission_status: SubmissionStatus;
    },
    department: Department,
    createdByUserId: string
  ): OutsideWorkPlanActivity {
    const data = loadDatabase();
    const activityCode = generateOutsideActivityCode(department.code, actData.reporting_year);

    const newActivity: OutsideWorkPlanActivity = {
      id: crypto.randomUUID(),
      activity_code: activityCode,
      activity_name: actData.activity_name.trim(),
      description: actData.description.trim(),
      reason_not_in_approved_plan: actData.reason_not_in_approved_plan.trim(),
      department_id: department.id,
      department_name: department.name,
      reporting_month: Number(actData.reporting_month),
      reporting_year: Number(actData.reporting_year),
      target: actData.target?.trim() || '',
      actual_achievement: actData.actual_achievement?.trim() || '',
      percentage_completed: Math.min(100, Math.max(0, Number(actData.percentage_completed) || 0)),
      outcome: actData.outcome?.trim() || '',
      challenges: actData.challenges?.trim() || '',
      remarks: actData.remarks?.trim() || '',
      evidence: actData.evidence?.trim() || '',
      kpi_achieved: actData.kpi_achieved === 'Yes' ? 'Yes' : 'No',
      work_plan_compliance: 'NO', // Strictly immutable
      submission_status: actData.submission_status || 'Draft',
      review_comments: null,
      reviewed_by: null,
      reviewed_at: null,
      created_by_user_id: createdByUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    data.outside_work_plan_activities.push(newActivity);
    saveDatabase();
    return newActivity;
  },

  updateOutsideActivity(
    id: string,
    updates: Partial<OutsideWorkPlanActivity>,
    allowedDeptId?: string
  ): OutsideWorkPlanActivity {
    const data = loadDatabase();
    const idx = data.outside_work_plan_activities.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Outside Activity record not found.');

    const current = data.outside_work_plan_activities[idx];
    if (allowedDeptId && current.department_id !== allowedDeptId) {
      throw new Error('Access denied: Record does not belong to your department.');
    }

    const safeUpdates = { ...updates };
    delete (safeUpdates as any).work_plan_compliance; // Cannot be changed
    delete (safeUpdates as any).department_id;
    delete (safeUpdates as any).department_name;
    delete (safeUpdates as any).activity_code;

    if (safeUpdates.percentage_completed !== undefined) {
      safeUpdates.percentage_completed = Math.min(100, Math.max(0, Number(safeUpdates.percentage_completed)));
    }

    data.outside_work_plan_activities[idx] = {
      ...current,
      ...safeUpdates,
      work_plan_compliance: 'NO', // Enforce NO
      updated_at: new Date().toISOString()
    };

    saveDatabase();
    return data.outside_work_plan_activities[idx];
  },

  // Budgets
  getBudgets(filterDeptId?: string): BudgetRecord[] {
    const data = loadDatabase();
    if (filterDeptId) {
      return data.budgets.filter(b => b.department_id === filterDeptId);
    }
    return data.budgets;
  },

  updateBudget(
    id: string,
    updates: Partial<BudgetRecord>,
    updatedBy: string,
    allowedDeptId?: string
  ): BudgetRecord {
    const data = loadDatabase();
    const idx = data.budgets.findIndex(b => b.id === id);
    if (idx === -1) throw new Error('Budget record not found.');

    const current = data.budgets[idx];
    if (allowedDeptId && current.department_id !== allowedDeptId) {
      throw new Error('Access denied: Budget record does not belong to your department.');
    }

    const appropriation = updates.appropriation !== undefined ? Number(updates.appropriation) : current.appropriation;
    const donor = updates.donor !== undefined ? String(updates.donor) : current.donor;
    const released = updates.released !== undefined ? Number(updates.released) : current.released;
    const utilized = updates.utilized !== undefined ? Number(updates.utilized) : current.utilized;
    const moreFund = updates.more_fund !== undefined ? Number(updates.more_fund) : current.more_fund;

    // Calculate balance: Released - Utilized (if released > 0), else Appropriation - Utilized
    const balance = released > 0 ? released - utilized : appropriation - utilized;
    const baseAmount = released > 0 ? released : appropriation;
    const utilizationPct = baseAmount > 0 ? Math.round((utilized / baseAmount) * 1000) / 10 : 0;

    data.budgets[idx] = {
      ...current,
      appropriation,
      donor,
      released,
      utilized,
      more_fund: moreFund,
      balance,
      budget_utilization_pct: utilizationPct,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy
    };

    saveDatabase();
    return data.budgets[idx];
  },

  // Audit Logs
  getAuditLogs(filterDeptId?: string): AuditLog[] {
    const data = loadDatabase();
    if (filterDeptId) {
      return data.audit_logs.filter(l => l.department_id === filterDeptId);
    }
    return data.audit_logs;
  },

  // Real Database Statistics (NO fake figures)
  getDashboardStats(filterDeptId?: string): DashboardStats {
    const data = loadDatabase();

    const depts = filterDeptId ? data.departments.filter(d => d.id === filterDeptId) : data.departments;
    const activeDeptsCount = depts.filter(d => d.is_active).length;

    const workPlans = filterDeptId
      ? data.annual_work_plans.filter(wp => wp.department_id === filterDeptId)
      : data.annual_work_plans;

    const approvedWorkPlans = workPlans.filter(wp => wp.status === 'Approved');

    const meReports = filterDeptId
      ? data.monthly_me_reports.filter(r => r.department_id === filterDeptId)
      : data.monthly_me_reports;

    const outsideActivities = filterDeptId
      ? data.outside_work_plan_activities.filter(a => a.department_id === filterDeptId)
      : data.outside_work_plan_activities;

    const budgets = filterDeptId
      ? data.budgets.filter(b => b.department_id === filterDeptId)
      : data.budgets;

    // Pending reviews across all modules
    const pendingWorkPlans = workPlans.filter(wp => wp.status === 'Submitted').length;
    const pendingMe = meReports.filter(r => r.submission_status === 'Submitted').length;
    const pendingOutside = outsideActivities.filter(a => a.submission_status === 'Submitted').length;
    const pendingReviewsCount = pendingWorkPlans + pendingMe + pendingOutside;

    const returnedReportsCount =
      workPlans.filter(wp => wp.status === 'Returned for Correction').length +
      meReports.filter(r => r.submission_status === 'Returned for Correction').length +
      outsideActivities.filter(a => a.submission_status === 'Returned for Correction').length;

    // 1. Reporting Compliance:
    // Ratio of submitted/approved monthly reports to expected monthly reports for approved projects
    // If no approved projects or reports, cleanly returns 0
    let reportingCompliance = 0;
    if (approvedWorkPlans.length > 0) {
      const activeMonth = data.system_settings.active_reporting_month || 1;
      const expectedReports = approvedWorkPlans.length * activeMonth;
      const submittedReportsCount = meReports.filter(
        r => r.submission_status === 'Submitted' || r.submission_status === 'Approved'
      ).length;
      reportingCompliance = expectedReports > 0 ? Math.min(100, Math.round((submittedReportsCount / expectedReports) * 100)) : 0;
    }

    // 2. Work Plan Compliance:
    // Ratio of approved work plan activities vs (approved work plans + outside unapproved activities)
    // Outside activities are explicitly non-compliant!
    const totalActivities = approvedWorkPlans.length + outsideActivities.length;
    let workPlanCompliance = 0;
    if (totalActivities > 0) {
      workPlanCompliance = Math.round((approvedWorkPlans.length / totalActivities) * 100);
    }

    // 3. Average Achievement:
    // Average percentage completed across submitted/approved monthly M&E reports
    let averageAchievement = 0;
    if (meReports.length > 0) {
      const sum = meReports.reduce((acc, r) => acc + (r.percentage_completed || 0), 0);
      averageAchievement = Math.round((sum / meReports.length) * 10) / 10;
    }

    // 4. Budget Performance
    let totalBudget = 0;
    let totalAppropriation = 0;
    let totalReleased = 0;
    let totalUtilized = 0;
    let totalBalance = 0;
    let totalMoreFund = 0;

    for (const b of budgets) {
      totalBudget += Number(b.total_budget || 0);
      totalAppropriation += Number(b.appropriation || 0);
      totalReleased += Number(b.released || 0);
      totalUtilized += Number(b.utilized || 0);
      totalBalance += Number(b.balance || 0);
      totalMoreFund += Number(b.more_fund || 0);
    }

    const budgetBase = totalReleased > 0 ? totalReleased : totalAppropriation;
    const utilizationRate = budgetBase > 0 ? Math.round((totalUtilized / budgetBase) * 1000) / 10 : 0;

    // 5. Quarterly KPI Target Completion Rate (Yes vs No)
    const kpiYesCount = meReports.filter(r => r.kpi_achieved === 'Yes').length;
    const kpiNoCount = meReports.filter(r => r.kpi_achieved === 'No').length;
    const kpiTotalEvaluated = kpiYesCount + kpiNoCount;
    const kpiAchievementRate = kpiTotalEvaluated > 0
      ? Math.round((kpiYesCount / kpiTotalEvaluated) * 100)
      : (meReports.length > 0 ? Math.round((kpiYesCount / meReports.length) * 100) : 0);

    // 6. Overall System Performance Average % across active operational pillars
    const activePerformancePillars = [averageAchievement, reportingCompliance, workPlanCompliance];
    if (utilizationRate > 0) activePerformancePillars.push(utilizationRate);
    if (kpiTotalEvaluated > 0) activePerformancePillars.push(kpiAchievementRate);
    const overallSystemAverage = activePerformancePillars.length > 0
      ? Math.round((activePerformancePillars.reduce((acc, val) => acc + val, 0) / activePerformancePillars.length) * 10) / 10
      : averageAchievement;

    // Monthly Trends (12 months)
    const activeReportingMonth = data.system_settings.active_reporting_month || 1;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrends = monthNames.map((name, i) => {
      const monthNum = i + 1;
      const monthMe = meReports.filter(r => r.reporting_month === monthNum);
      const avgAch = monthMe.length > 0
        ? Math.round((monthMe.reduce((acc, r) => acc + (r.percentage_completed || 0), 0) / monthMe.length) * 10) / 10
        : 0;
      const outsideInMonth = outsideActivities.filter(a => a.reporting_month === monthNum).length;

      // Department breakdown for this month
      const byDept: Record<string, {
        department_code: string;
        department_name: string;
        reports_count: number;
        avg_achievement: number;
        outside_count: number;
        reported: boolean;
      }> = {};

      for (const d of depts) {
        const dMonthMe = monthMe.filter(r => r.department_id === d.id);
        const dMonthOut = outsideActivities.filter(a => a.department_id === d.id && a.reporting_month === monthNum);
        const dAvgAch = dMonthMe.length > 0
          ? Math.round((dMonthMe.reduce((acc, r) => acc + (r.percentage_completed || 0), 0) / dMonthMe.length) * 10) / 10
          : 0;
        byDept[d.id] = {
          department_code: d.code,
          department_name: d.name,
          reports_count: dMonthMe.length,
          avg_achievement: dAvgAch,
          outside_count: dMonthOut.length,
          reported: dMonthMe.length > 0
        };
      }

      return {
        month_name: name,
        month_num: monthNum,
        reports_count: monthMe.length,
        avg_achievement: avgAch,
        outside_count: outsideInMonth,
        by_department: byDept
      };
    });

    // Departmental Summaries
    const deptSummaries = depts.map(dept => {
      const deptWp = data.annual_work_plans.filter(wp => wp.department_id === dept.id);
      const deptAppWp = deptWp.filter(wp => wp.status === 'Approved');
      const deptMe = data.monthly_me_reports.filter(r => r.department_id === dept.id);
      const deptOut = data.outside_work_plan_activities.filter(a => a.department_id === dept.id);
      const deptBudgets = data.budgets.filter(b => b.department_id === dept.id);

      const expRep = deptAppWp.length * (activeReportingMonth || 1);
      const repComp = expRep > 0 ? Math.min(100, Math.round((deptMe.length / expRep) * 100)) : 0;

      const totalActs = deptAppWp.length + deptOut.length;
      const wpComp = totalActs > 0 ? Math.round((deptAppWp.length / totalActs) * 100) : 0;

      const avgAch = deptMe.length > 0
        ? Math.round((deptMe.reduce((acc, r) => acc + (r.percentage_completed || 0), 0) / deptMe.length) * 10) / 10
        : 0;

      // Determine months reported
      const reportedMonthNums = Array.from(new Set(deptMe.map(r => r.reporting_month))).sort((a, b) => a - b);
      
      // Calculate consecutive streak ending at activeReportingMonth or latest reported
      let consecutive = 0;
      for (let m = activeReportingMonth; m >= 1; m--) {
        if (reportedMonthNums.includes(m)) {
          consecutive++;
        } else {
          break;
        }
      }

      // Active months count up to active reporting month (min 1)
      const activeMonthsCount = Math.max(1, activeReportingMonth);
      const reportedInActiveMonths = reportedMonthNums.filter(m => m <= activeMonthsCount).length;
      const consistencyRate = Math.round((reportedInActiveMonths / activeMonthsCount) * 100);
      const isConsistent = consistencyRate >= 100 && deptMe.length > 0;

      let consistencyStatus: 'Consistent' | 'Regular' | 'Inconsistent' | 'Non-Reporting' = 'Non-Reporting';
      if (deptMe.length === 0) {
        consistencyStatus = 'Non-Reporting';
      } else if (consistencyRate >= 90) {
        consistencyStatus = 'Consistent';
      } else if (consistencyRate >= 65) {
        consistencyStatus = 'Regular';
      } else {
        consistencyStatus = 'Inconsistent';
      }

      // Performance Level determination
      let perfTier: 'High' | 'Moderate' | 'Low' | 'Critical' = 'Critical';
      let perfLabel = 'Critical Lag (<40%)';
      let perfColor = '#DC2626';
      if (deptMe.length === 0) {
        perfTier = 'Critical';
        perfLabel = 'No Data (0%)';
        perfColor = '#9CA3AF';
      } else if (avgAch >= 80) {
        perfTier = 'High';
        perfLabel = `High Performer (${avgAch}%)`;
        perfColor = '#006B3F';
      } else if (avgAch >= 60) {
        perfTier = 'Moderate';
        perfLabel = `Moderate Performer (${avgAch}%)`;
        perfColor = '#2563EB';
      } else if (avgAch >= 40) {
        perfTier = 'Low';
        perfLabel = `Low Performer (${avgAch}%)`;
        perfColor = '#D97706';
      }

      // Month-by-month timeline for 12 months
      const timeline: any[] = monthNames.map((name, i) => {
        const mNum = i + 1;
        const mReports = deptMe.filter(r => r.reporting_month === mNum);
        const hasReported = mReports.length > 0;
        let status: 'reported' | 'missed' | 'upcoming' = 'upcoming';
        if (mNum <= activeReportingMonth) {
          status = hasReported ? 'reported' : 'missed';
        }
        const mAvgAch = hasReported
          ? Math.round((mReports.reduce((acc, r) => acc + (r.percentage_completed || 0), 0) / mReports.length) * 10) / 10
          : 0;
        return {
          month_num: mNum,
          month_name: name,
          has_reported: hasReported,
          reports_count: mReports.length,
          avg_achievement: mAvgAch,
          status
        };
      });

      let bRel = 0;
      let bUt = 0;
      let bApp = 0;
      for (const b of deptBudgets) {
        bRel += Number(b.released || 0);
        bUt += Number(b.utilized || 0);
        bApp += Number(b.appropriation || 0);
      }
      const bBase = bRel > 0 ? bRel : bApp;
      const bUtil = bBase > 0 ? Math.round((bUt / bBase) * 1000) / 10 : 0;

      return {
        department_id: dept.id,
        department_code: dept.code,
        department_name: dept.name,
        total_projects: deptWp.length,
        approved_projects: deptAppWp.length,
        monthly_reports: deptMe.length,
        reporting_compliance: repComp,
        work_plan_compliance: wpComp,
        achievement_rate: avgAch,
        budget_utilization: bUtil,
        reporting_consistency: {
          months_reported: reportedMonthNums,
          active_months_count: activeMonthsCount,
          expected_months_count: activeMonthsCount,
          consecutive_months: consecutive,
          consistency_rate: consistencyRate,
          is_consistent: isConsistent,
          status: consistencyStatus
        },
        performance_level: {
          tier: perfTier,
          label: perfLabel,
          score: avgAch,
          color: perfColor
        },
        timeline
      };
    });

    // Consistency Comparison Overview
    const consistentCount = deptSummaries.filter(d => d.reporting_consistency?.status === 'Consistent').length;
    const regularCount = deptSummaries.filter(d => d.reporting_consistency?.status === 'Regular').length;
    const inconsistentCount = deptSummaries.filter(d => d.reporting_consistency?.status === 'Inconsistent').length;
    const nonReportingCount = deptSummaries.filter(d => d.reporting_consistency?.status === 'Non-Reporting').length;
    const consistencyPct = depts.length > 0 ? Math.round((consistentCount / depts.length) * 100) : 0;

    const sortedByAch = [...deptSummaries].filter(d => d.monthly_reports > 0).sort((a, b) => b.achievement_rate - a.achievement_rate);
    const topPerforming = sortedByAch.length > 0 ? {
      code: sortedByAch[0].department_code,
      name: sortedByAch[0].department_name,
      rate: sortedByAch[0].achievement_rate
    } : null;

    const sortedByCons = [...deptSummaries].sort((a, b) => (b.reporting_consistency?.consistency_rate || 0) - (a.reporting_consistency?.consistency_rate || 0));
    const mostConsistent = sortedByCons.length > 0 && (sortedByCons[0].reporting_consistency?.consistency_rate || 0) > 0 ? {
      code: sortedByCons[0].department_code,
      name: sortedByCons[0].department_name,
      rate: sortedByCons[0].reporting_consistency!.consistency_rate
    } : null;

    const consistencyComparison = {
      total_departments: depts.length,
      consistent_departments_count: consistentCount,
      regular_departments_count: regularCount,
      inconsistent_departments_count: inconsistentCount,
      non_reporting_departments_count: nonReportingCount,
      consistency_percentage: consistencyPct,
      top_performing_department: topPerforming,
      most_consistent_department: mostConsistent
    };

    // Total activities across departments
    const activitiesByDepartment = depts.map(dept => {
      const deptWp = data.annual_work_plans.filter(wp => wp.department_id === dept.id);
      const deptOut = data.outside_work_plan_activities.filter(a => a.department_id === dept.id);
      return {
        department_id: dept.id,
        department_code: dept.code,
        department_name: dept.name,
        work_plan_activities: deptWp.length,
        outside_activities: deptOut.length,
        total_activities: deptWp.length + deptOut.length
      };
    });
    const totalActivitiesCount = workPlans.length + outsideActivities.length;

    return {
      departments_count: data.departments.length,
      users_count: data.users.length,
      work_plan_projects_count: workPlans.length,
      approved_projects_count: approvedWorkPlans.length,
      monthly_reports_count: meReports.length,
      pending_reviews_count: pendingReviewsCount,
      pending_me_reports_count: pendingMe,
      pending_work_plans_count: pendingWorkPlans,
      pending_outside_activities_count: pendingOutside,
      outside_activities_count: outsideActivities.length,
      returned_reports_count: returnedReportsCount,

      total_activities_count: totalActivitiesCount,
      activities_by_department: activitiesByDepartment,

      current_reporting_month: activeReportingMonth,
      current_reporting_month_name: monthNames[(activeReportingMonth || 1) - 1],
      current_monthly_budget_utilization_pct: utilizationRate,

      reporting_compliance_pct: reportingCompliance,
      work_plan_compliance_pct: workPlanCompliance,
      average_achievement_pct: averageAchievement,
      overall_system_average_pct: overallSystemAverage,

      kpi_stats: {
        achievement_rate: kpiAchievementRate,
        achieved_count: kpiYesCount,
        not_achieved_count: kpiNoCount,
        total_count: meReports.length
      },

      budget_performance: {
        total_budget: totalBudget,
        total_appropriation: totalAppropriation,
        total_donor: 0,
        total_released: totalReleased,
        total_utilized: totalUtilized,
        total_balance: totalBalance,
        total_more_fund: totalMoreFund,
        utilization_pct: utilizationRate
      },

      monthly_trends: monthlyTrends,
      department_summaries: deptSummaries,
      consistency_comparison: consistencyComparison
    };
  }
};
