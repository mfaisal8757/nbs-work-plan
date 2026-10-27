import express, { Router, Response } from 'express';
import { db, verifyPassword, logAudit } from './db.js';
import { authenticate, requireRole, enforceDepartmentAccess, createToken, revokeToken, AuthenticatedRequest } from './auth.js';
import { Role } from '../src/types.js';

export const apiRouter = Router();

// -------------------------------------------------------------
// AUTHENTICATION & SETUP ROUTES
// -------------------------------------------------------------

// System setup status (tells login screen if initial admin needs creation)
apiRouter.get('/auth/status', (req, res) => {
  const isUninitialized = db.isUninitialized();
  res.json({
    isUninitialized,
    activeStage: db.getSettings().reporting_stage
  });
});

// Initial Setup: Register First System Administrator (ONLY when database has 0 users)
apiRouter.post('/auth/init-admin', (req, res) => {
  if (!db.isUninitialized()) {
    return res.status(400).json({ error: 'System has already been initialized with an administrator account.' });
  }

  const { name, email, password, phone, staff_id } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  if (password.length < 5) {
    return res.status(400).json({ error: 'Password must be at least 5 characters.' });
  }

  try {
    const adminUser = db.createUser({
      name,
      email,
      password,
      role: 'Administrator',
      department_id: null,
      phone,
      staff_id
    });

    logAudit(
      { id: adminUser.id, name: adminUser.name, role: adminUser.role, department_id: null },
      'SYSTEM_INITIALIZED',
      'user',
      adminUser.id,
      `Primary System Administrator registered: ${adminUser.email}`
    );

    const token = createToken(adminUser.id);
    res.status(201).json({ user: adminUser, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to initialize administrator.' });
  }
});

// Login
apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const userWithSecrets = db.getUserByEmail(email);
  if (!userWithSecrets || !userWithSecrets.is_active) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const isValid = verifyPassword(password, userWithSecrets.password_hash, userWithSecrets.salt);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const { password_hash, salt, ...safeUser } = userWithSecrets;
  const token = createToken(safeUser.id);

  logAudit(
    { id: safeUser.id, name: safeUser.name, role: safeUser.role, department_id: safeUser.department_id },
    'USER_LOGIN',
    'user',
    safeUser.id,
    `User signed in successfully from ${req.ip}`
  );

  res.json({ user: safeUser, token });
});

// Logout
apiRouter.post('/auth/logout', authenticate, (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    revokeToken(authHeader.split(' ')[1]);
  }
  if (req.user) {
    logAudit(
      { id: req.user.id, name: req.user.name, role: req.user.role, department_id: req.user.department_id },
      'USER_LOGOUT',
      'user',
      req.user.id,
      'User signed out'
    );
  }
  res.json({ message: 'Signed out successfully' });
});

// Current User Profile
apiRouter.get('/auth/me', authenticate, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// -------------------------------------------------------------
// SYSTEM SETTINGS (Reporting Stage & Periods)
// -------------------------------------------------------------
apiRouter.get('/settings', authenticate, (req, res) => {
  res.json({ settings: db.getSettings() });
});

apiRouter.put('/settings', authenticate, requireRole('Administrator'), (req: AuthenticatedRequest, res) => {
  const { reporting_stage, current_work_plan_year, active_reporting_month, active_reporting_year } = req.body;
  try {
    const updated = db.updateSettings(
      {
        ...(reporting_stage && { reporting_stage }),
        ...(current_work_plan_year && { current_work_plan_year: Number(current_work_plan_year) }),
        ...(active_reporting_month && { active_reporting_month: Number(active_reporting_month) }),
        ...(active_reporting_year && { active_reporting_year: Number(active_reporting_year) })
      },
      req.user!.name
    );

    logAudit(
      { id: req.user!.id, name: req.user!.name, role: req.user!.role, department_id: null },
      'STAGE_CHANGED',
      'settings',
      'default',
      `Reporting stage updated to: ${updated.reporting_stage}, Year: ${updated.current_work_plan_year}, Active Month: ${updated.active_reporting_month}`
    );

    res.json({ settings: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update settings.' });
  }
});

// -------------------------------------------------------------
// DEPARTMENTS MANAGEMENT
// -------------------------------------------------------------
apiRouter.get('/departments', authenticate, (req: AuthenticatedRequest, res) => {
  const depts = db.getDepartments();
  res.json({ departments: depts });
});

apiRouter.post('/departments', authenticate, requireRole('Administrator'), (req: AuthenticatedRequest, res) => {
  const { code, name, head_of_department, email, is_active } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'Department Code and Name are required.' });
  }

  try {
    const newDept = db.createDepartment({
      code,
      name,
      head_of_department: head_of_department || '',
      email: email || '',
      is_active: is_active !== undefined ? is_active : true
    });

    logAudit(
      { id: req.user!.id, name: req.user!.name, role: req.user!.role, department_id: null },
      'DEPARTMENT_CREATED',
      'department',
      newDept.id,
      `Created department: ${newDept.name} (${newDept.code})`
    );

    res.status(201).json({ department: newDept });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/departments/:id', authenticate, requireRole('Administrator'), (req: AuthenticatedRequest, res) => {
  const { code, name, head_of_department, email, is_active } = req.body;
  try {
    const updated = db.updateDepartment(req.params.id, {
      ...(code && { code }),
      ...(name && { name }),
      ...(head_of_department !== undefined && { head_of_department }),
      ...(email !== undefined && { email }),
      ...(is_active !== undefined && { is_active })
    });

    logAudit(
      { id: req.user!.id, name: req.user!.name, role: req.user!.role, department_id: null },
      'DEPARTMENT_UPDATED',
      'department',
      updated.id,
      `Updated department: ${updated.name} (${updated.code})`
    );

    res.json({ department: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// USER MANAGEMENT
// -------------------------------------------------------------
apiRouter.get('/users', authenticate, requireRole('Administrator'), (req, res) => {
  res.json({ users: db.getUsers() });
});

apiRouter.post('/users', authenticate, requireRole('Administrator'), (req: AuthenticatedRequest, res) => {
  const { name, email, password, role, department_id, phone, staff_id } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }

  if (role === 'Departmental Desk Officer' && !department_id) {
    return res.status(400).json({ error: 'Departmental Desk Officer must be assigned to an active department.' });
  }

  try {
    const newUser = db.createUser({
      name,
      email,
      password,
      role,
      department_id: role === 'Departmental Desk Officer' ? department_id : (department_id || null),
      phone,
      staff_id
    });

    logAudit(
      { id: req.user!.id, name: req.user!.name, role: req.user!.role, department_id: null },
      'USER_CREATED',
      'user',
      newUser.id,
      `Created user ${newUser.name} with role ${newUser.role}` +
        (newUser.department_name ? ` in ${newUser.department_name}` : '')
    );

    res.status(201).json({ user: newUser });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/users/:id', authenticate, requireRole('Administrator'), (req: AuthenticatedRequest, res) => {
  const { name, email, role, department_id, phone, staff_id, is_active, password } = req.body;
  try {
    const updated = db.updateUser(req.params.id, {
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
      ...(department_id !== undefined && { department_id }),
      ...(phone !== undefined && { phone }),
      ...(staff_id !== undefined && { staff_id }),
      ...(is_active !== undefined && { is_active }),
      ...(password && { password })
    });

    logAudit(
      { id: req.user!.id, name: req.user!.name, role: req.user!.role, department_id: null },
      'USER_UPDATED',
      'user',
      updated.id,
      `Updated user profile: ${updated.name}`
    );

    res.json({ user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ANNUAL WORK PLAN
// -------------------------------------------------------------
apiRouter.get('/work-plans', authenticate, enforceDepartmentAccess, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  // Strict departmental isolation:
  // Desk officers can ONLY ever receive their assigned department records!
  const filterDeptId = user.role === 'Departmental Desk Officer' ? user.department_id! : (req.query.department_id as string | undefined);
  const plans = db.getAnnualWorkPlans(filterDeptId);
  res.json({ work_plans: plans });
});

apiRouter.get('/work-plans/:id', authenticate, enforceDepartmentAccess, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const plan = db.getAnnualWorkPlanById(req.params.id);
  if (!plan) return res.status(404).json({ error: 'Annual Work Plan not found.' });

  // Security check:
  if (user.role === 'Departmental Desk Officer' && plan.department_id !== user.department_id) {
    return res.status(403).json({ error: 'Access denied. You cannot access another department records.' });
  }

  res.json({ work_plan: plan });
});

apiRouter.post('/work-plans', authenticate, requireRole('Departmental Desk Officer'), (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const settings = db.getSettings();

  // Check stage: Desk officers can only submit when stage is 'Work Plan Compilation'
  if (settings.reporting_stage !== 'Work Plan Compilation') {
    return res.status(403).json({
      error: `Work plan creation is closed. Current reporting stage is '${settings.reporting_stage}'.`
    });
  }

  // Desk officer department is automatic from profile!
  const departmentId = user.department_id;
  if (!departmentId) {
    return res.status(400).json({ error: 'Department assignment is missing from desk officer profile.' });
  }

  const dept = db.getDepartmentById(departmentId);
  if (!dept) {
    return res.status(400).json({ error: 'Department not found.' });
  }

  const {
    outcome,
    alignment,
    output,
    project_name,
    objective,
    key_activities,
    activity_description,
    kpi,
    reporting_frequency,
    annual_performance_indicators,
    annual_performance_indicator,
    type_of_activities,
    means_of_verification,
    baseline,
    target,
    annual_target,
    timeline_q1,
    timeline_q2,
    timeline_q3,
    timeline_q4,
    total_budget,
    funding_source,
    responsible_officer,
    staff_responsible,
    division,
    work_plan_year,
    status
  } = req.body;

  const resolvedOutput = (output || project_name || '').trim();
  const resolvedActivities = (key_activities || activity_description || '').trim();

  if (!resolvedOutput || !resolvedActivities) {
    return res.status(400).json({ error: 'Output (or Project Name) and Key Activities are required.' });
  }

  try {
    const newPlan = db.createAnnualWorkPlan(
      {
        outcome: outcome || objective || '',
        alignment: alignment || 'National Development Plan',
        output: resolvedOutput,
        project_name: resolvedOutput,
        objective: objective || outcome || resolvedActivities,
        key_activities: resolvedActivities,
        activity_description: resolvedActivities,
        kpi: kpi || annual_performance_indicator || '',
        reporting_frequency: reporting_frequency || 'Quarterly',
        annual_performance_indicators: annual_performance_indicators || annual_performance_indicator || '',
        annual_performance_indicator: annual_performance_indicators || annual_performance_indicator || '',
        type_of_activities: type_of_activities || 'Survey',
        means_of_verification: means_of_verification || 'Published Statistical Report',
        baseline: baseline || '',
        target: target || '',
        annual_target: annual_target || target || '',
        timeline_q1: Boolean(timeline_q1),
        timeline_q2: Boolean(timeline_q2),
        timeline_q3: Boolean(timeline_q3),
        timeline_q4: Boolean(timeline_q4),
        total_budget: Number(total_budget) || 0,
        funding_source: funding_source || 'Appropriation',
        responsible_officer: responsible_officer || staff_responsible || user.name,
        staff_responsible: responsible_officer || staff_responsible || user.name,
        division: division || '',
        work_plan_year: Number(work_plan_year) || settings.current_work_plan_year,
        status: status === 'Submitted' ? 'Submitted' : 'Draft'
      },
      dept,
      user.id
    );

    logAudit(
      { id: user.id, name: user.name, role: user.role, department_id: user.department_id },
      newPlan.status === 'Submitted' ? 'WORK_PLAN_SUBMITTED' : 'WORK_PLAN_CREATED',
      'work_plan',
      newPlan.id,
      `Created work plan: ${newPlan.activity_code} - ${newPlan.output || newPlan.project_name}`
    );

    res.status(201).json({ work_plan: newPlan });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/work-plans/:id', authenticate, requireRole('Departmental Desk Officer'), (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const current = db.getAnnualWorkPlanById(req.params.id);
  if (!current) return res.status(404).json({ error: 'Work Plan not found.' });

  if (current.department_id !== user.department_id) {
    return res.status(403).json({ error: 'Access denied: You cannot edit another department plan.' });
  }
  // Only allow editing if Draft or Returned for Correction
  if (current.status !== 'Draft' && current.status !== 'Returned for Correction') {
    return res.status(400).json({
      error: `Cannot modify a work plan that is in '${current.status}' status.`
    });
  }

  try {
    const updated = db.updateAnnualWorkPlan(
      req.params.id,
      req.body,
      user.role === 'Departmental Desk Officer' ? user.department_id! : undefined
    );

    logAudit(
      { id: user.id, name: user.name, role: user.role, department_id: user.department_id },
      updated.status === 'Submitted' ? 'WORK_PLAN_SUBMITTED' : 'WORK_PLAN_UPDATED',
      'work_plan',
      updated.id,
      `Updated work plan: ${updated.activity_code} (Status: ${updated.status})`
    );

    res.json({ work_plan: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Review Work Plan (Admin only: Approve or Return)
apiRouter.post('/work-plans/:id/review', authenticate, requireRole('Administrator'), (req: AuthenticatedRequest, res) => {
  const { status, review_comments } = req.body;
  if (status !== 'Approved' && status !== 'Returned for Correction') {
    return res.status(400).json({ error: "Review status must be either 'Approved' or 'Returned for Correction'." });
  }

  try {
    const updated = db.updateAnnualWorkPlan(req.params.id, {
      status,
      review_comments: review_comments || null,
      reviewed_by: req.user!.name,
      reviewed_at: new Date().toISOString()
    });

    logAudit(
      { id: req.user!.id, name: req.user!.name, role: req.user!.role, department_id: null },
      status === 'Approved' ? 'WORK_PLAN_APPROVED' : 'WORK_PLAN_RETURNED',
      'work_plan',
      updated.id,
      `Work plan ${updated.activity_code} was ${status} by ${req.user!.name}`
    );

    res.json({ work_plan: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// MONTHLY MONITORING & EVALUATION (M&E)
// -------------------------------------------------------------
apiRouter.get('/me-reports', authenticate, enforceDepartmentAccess, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const filterDeptId = user.role === 'Departmental Desk Officer' ? user.department_id! : (req.query.department_id as string | undefined);
  const reports = db.getMonthlyMeReports(filterDeptId);
  res.json({ me_reports: reports });
});

apiRouter.get('/me-reports/:id', authenticate, enforceDepartmentAccess, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const report = db.getMonthlyMeReportById(req.params.id);
  if (!report) return res.status(404).json({ error: 'Monthly M&E Report not found.' });

  if (user.role === 'Departmental Desk Officer' && report.department_id !== user.department_id) {
    return res.status(403).json({ error: 'Access denied. You cannot view another department report.' });
  }

  res.json({ me_report: report });
});

apiRouter.post('/me-reports', authenticate, requireRole('Departmental Desk Officer'), (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const settings = db.getSettings();

  // Desk officer can only submit when stage is 'Monthly M&E Reporting'
  if (settings.reporting_stage !== 'Monthly M&E Reporting') {
    return res.status(403).json({
      error: `Monthly reporting is closed. Current reporting stage is '${settings.reporting_stage}'.`
    });
  }

  const {
    work_plan_id,
    reporting_month,
    reporting_year,
    actual_start,
    actual_duration,
    actual_end,
    actual_achievement,
    percentage_completed,
    outcome,
    milestone_achieved,
    challenges,
    remarks,
    evidence,
    kpi_achieved,
    submission_status
  } = req.body;

  if (!work_plan_id || !reporting_month || !reporting_year) {
    return res.status(400).json({ error: 'Approved Work Plan, Reporting Month, and Year are required.' });
  }

  // Desk officer department
  const deptId = user.department_id;
  if (!deptId) {
    return res.status(400).json({ error: 'Department assignment required in desk officer profile.' });
  }

  try {
    const newReport = db.createMonthlyMeReport(
      {
        work_plan_id,
        reporting_month: Number(reporting_month),
        reporting_year: Number(reporting_year),
        actual_start,
        actual_duration,
        actual_end,
        actual_achievement,
        percentage_completed: Number(percentage_completed) || 0,
        outcome,
        milestone_achieved,
        challenges,
        remarks,
        evidence,
        kpi_achieved,
        submission_status: submission_status || 'Submitted'
      },
      deptId,
      user.id
    );

    logAudit(
      { id: user.id, name: user.name, role: user.role, department_id: user.department_id },
      newReport.submission_status === 'Submitted' ? 'ME_REPORT_SUBMITTED' : 'ME_REPORT_CREATED',
      'me_report',
      newReport.id,
      `Submitted M&E report for ${newReport.activity_code} (Month ${newReport.reporting_month}/${newReport.reporting_year})`
    );

    res.status(201).json({ me_report: newReport });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/me-reports/:id', authenticate, requireRole('Departmental Desk Officer'), (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const current = db.getMonthlyMeReportById(req.params.id);
  if (!current) return res.status(404).json({ error: 'Monthly report not found.' });

  if (current.department_id !== user.department_id) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  if (current.submission_status !== 'Draft' && current.submission_status !== 'Returned for Correction') {
    return res.status(400).json({ error: `Cannot edit report in '${current.submission_status}' status.` });
  }

  try {
    const updated = db.updateMonthlyMeReport(
      req.params.id,
      req.body,
      user.role === 'Departmental Desk Officer' ? user.department_id! : undefined
    );

    logAudit(
      { id: user.id, name: user.name, role: user.role, department_id: user.department_id },
      'ME_REPORT_UPDATED',
      'me_report',
      updated.id,
      `Updated M&E report for ${updated.activity_code} (${updated.reporting_month}/${updated.reporting_year})`
    );

    res.json({ me_report: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Review Monthly M&E Report (Admin only)
apiRouter.post('/me-reports/:id/review', authenticate, requireRole('Administrator'), (req: AuthenticatedRequest, res) => {
  const { submission_status, review_comments } = req.body;
  if (submission_status !== 'Approved' && submission_status !== 'Returned for Correction') {
    return res.status(400).json({ error: "Review status must be either 'Approved' or 'Returned for Correction'." });
  }

  try {
    const updated = db.updateMonthlyMeReport(req.params.id, {
      submission_status,
      review_comments: review_comments || null,
      reviewed_by: req.user!.name,
      reviewed_at: new Date().toISOString()
    });

    logAudit(
      { id: req.user!.id, name: req.user!.name, role: req.user!.role, department_id: null },
      submission_status === 'Approved' ? 'ME_REPORT_APPROVED' : 'ME_REPORT_RETURNED',
      'me_report',
      updated.id,
      `M&E Report ${updated.activity_code} (${updated.reporting_month}/${updated.reporting_year}) was ${submission_status} by ${req.user!.name}`
    );

    res.json({ me_report: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ACTIVITIES OUTSIDE APPROVED WORK PLAN
// -------------------------------------------------------------
apiRouter.get('/outside-activities', authenticate, enforceDepartmentAccess, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const filterDeptId = user.role === 'Departmental Desk Officer' ? user.department_id! : (req.query.department_id as string | undefined);
  const acts = db.getOutsideActivities(filterDeptId);
  res.json({ outside_activities: acts });
});

apiRouter.post('/outside-activities', authenticate, requireRole('Departmental Desk Officer'), (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const settings = db.getSettings();

  if (settings.reporting_stage !== 'Monthly M&E Reporting') {
    return res.status(403).json({
      error: `Reporting is closed. Current reporting stage is '${settings.reporting_stage}'.`
    });
  }

  const deptId = user.department_id;
  if (!deptId) return res.status(400).json({ error: 'Department assignment required in profile.' });

  const dept = db.getDepartmentById(deptId);
  if (!dept) return res.status(400).json({ error: 'Department not found.' });

  const activity_name = req.body.activity_name?.trim();
  const reason_not_in_approved_plan = (req.body.reason_not_in_approved_plan || req.body.reason_outside_plan)?.trim();
  const description = (req.body.description || req.body.activity_name || reason_not_in_approved_plan)?.trim();
  const reporting_month = Number(req.body.reporting_month || req.body.month_conducted) || settings.active_reporting_month;
  const reporting_year = Number(req.body.reporting_year || req.body.year) || settings.active_reporting_year;
  const target = req.body.target?.trim() || '';
  const actual_achievement = (req.body.actual_achievement || req.body.output_achieved)?.trim() || '';
  const percentage_completed = Number(req.body.percentage_completed) || 0;
  const outcome = req.body.outcome?.trim() || '';
  const challenges = req.body.challenges?.trim() || '';
  const remarks = req.body.remarks?.trim() || '';
  const evidence = req.body.evidence?.trim() || '';
  const kpi_achieved = req.body.kpi_achieved;
  const submission_status = req.body.submission_status === 'Draft' ? 'Draft' : 'Submitted';

  if (!activity_name || !reason_not_in_approved_plan) {
    return res.status(400).json({ error: 'Activity Name and Reason Not in Approved Plan are required.' });
  }

  try {
    const newAct = db.createOutsideActivity(
      {
        activity_name,
        description,
        reason_not_in_approved_plan,
        reporting_month,
        reporting_year,
        target,
        actual_achievement,
        percentage_completed,
        outcome,
        challenges,
        remarks,
        evidence,
        kpi_achieved,
        submission_status
      },
      dept,
      user.id
    );

    logAudit(
      { id: user.id, name: user.name, role: user.role, department_id: user.department_id },
      submission_status === 'Draft' ? 'OUTSIDE_ACTIVITY_SAVED_DRAFT' : 'OUTSIDE_ACTIVITY_SUBMITTED',
      'outside_activity',
      newAct.id,
      `${submission_status === 'Draft' ? 'Saved draft of' : 'Submitted'} outside-work-plan activity: ${newAct.activity_code} (Compliance: NO)`
    );

    res.status(201).json({ outside_activity: newAct });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/outside-activities/:id', authenticate, requireRole('Departmental Desk Officer'), (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  try {
    const current = db.getOutsideActivityById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Outside Activity record not found.' });

    if (current.department_id !== user.department_id) {
      return res.status(403).json({ error: 'Access denied: Record does not belong to your department.' });
    }
    if (current.submission_status !== 'Draft' && current.submission_status !== 'Returned for Correction') {
      return res.status(400).json({ error: `Cannot edit record in '${current.submission_status}' status.` });
    }

    const updated = db.updateOutsideActivity(
      req.params.id,
      req.body,
      user.role === 'Departmental Desk Officer' ? user.department_id! : undefined
    );

    logAudit(
      { id: user.id, name: user.name, role: user.role, department_id: user.department_id },
      'OUTSIDE_ACTIVITY_UPDATED',
      'outside_activity',
      updated.id,
      `Updated outside activity: ${updated.activity_code} (Status: ${updated.submission_status})`
    );

    res.json({ outside_activity: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/outside-activities/:id/review', authenticate, requireRole('Administrator'), (req: AuthenticatedRequest, res) => {
  const { submission_status, review_comments } = req.body;
  if (submission_status !== 'Approved' && submission_status !== 'Returned for Correction') {
    return res.status(400).json({ error: "Review status must be either 'Approved' or 'Returned for Correction'." });
  }

  try {
    const updated = db.updateOutsideActivity(req.params.id, {
      submission_status,
      review_comments: review_comments || null,
      reviewed_by: req.user!.name,
      reviewed_at: new Date().toISOString()
    });

    logAudit(
      { id: req.user!.id, name: req.user!.name, role: req.user!.role, department_id: null },
      submission_status === 'Approved' ? 'OUTSIDE_ACTIVITY_APPROVED' : 'OUTSIDE_ACTIVITY_RETURNED',
      'outside_activity',
      updated.id,
      `Outside activity ${updated.activity_code} was ${submission_status} by ${req.user!.name}`
    );

    res.json({ outside_activity: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// BUDGET MANAGEMENT (Admin Only)
// -------------------------------------------------------------
apiRouter.get('/budgets', authenticate, requireRole('Administrator'), (req: AuthenticatedRequest, res) => {
  const filterDeptId = req.query.department_id as string | undefined;
  const budgets = db.getBudgets(filterDeptId);
  res.json({ budgets });
});

apiRouter.put('/budgets/:id', authenticate, requireRole('Administrator'), (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  try {
    const updated = db.updateBudget(
      req.params.id,
      req.body,
      user.name,
      undefined
    );

    logAudit(
      { id: user.id, name: user.name, role: user.role, department_id: user.department_id },
      'BUDGET_UPDATED',
      'budget',
      updated.id,
      `Updated budget for ${updated.project_name}: Utilized ${updated.utilized}, Balance ${updated.balance}`
    );

    res.json({ budget: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// DASHBOARDS & REAL DATABASE STATISTICS (Admin Only)
// -------------------------------------------------------------
apiRouter.get('/dashboards/stats', authenticate, requireRole('Administrator'), (req: AuthenticatedRequest, res) => {
  const filterDeptId = req.query.department_id as string | undefined;
  const stats = db.getDashboardStats(filterDeptId);
  res.json({ stats });
});

// -------------------------------------------------------------
// AUDIT LOGS
// -------------------------------------------------------------
apiRouter.get('/audit-logs', authenticate, requireRole('Administrator'), (req, res) => {
  const logs = db.getAuditLogs();
  res.json({ audit_logs: logs });
});
