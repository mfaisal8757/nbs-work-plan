import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  BadgeCheck,
  AlertCircle,
  Sparkles,
  UserCheck,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { NbsLogo } from './NbsLogo.js';

export const LoginView: React.FC = () => {
  const { login, initAdmin, isInitialSetupNeeded, isLoading } = useAuth();

  // Role selection state: null = role picker, or specific role for credential login
  const [selectedRole, setSelectedRole] = useState<'Administrator' | 'Departmental Desk Officer' | null>(null);

  // Login form state (empty, user must type credentials)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Initial admin setup state (only displayed if database is completely empty)
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminStaffId, setAdminStaffId] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please enter both your official email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password, selectedRole || undefined);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials or inactive account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminName || !adminEmail || !adminPassword) {
      setError('Full Name, Official Email, and Password are required.');
      return;
    }

    if (adminPassword.length < 5) {
      setError('Password must be at least 5 characters long.');
      return;
    }

    if (adminPassword !== adminConfirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      await initAdmin({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        phone: adminPhone,
        staff_id: adminStaffId
      });
    } catch (err: any) {
      setError(err.message || 'Failed to initialize administrator account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F5] flex flex-col justify-center items-center p-4 sm:p-6">
      {/* NBS Official Brand Header */}
      <div className="w-full max-w-md text-center mb-6">
        <div className="flex justify-center mb-3">
          <NbsLogo variant="full" className="max-w-[260px] sm:max-w-[290px] drop-shadow-xs" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-600 mt-1">
          Work Plan & Monitoring & Evaluation Management System
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {isInitialSetupNeeded ? (
          /* Initial Empty Database Setup: Zero mock data exists */
          <div>
            <div className="mb-5 pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2 text-[#006B3F] font-bold text-sm">
                <Sparkles className="w-4 h-4 text-[#F2C94C]" />
                <span>Initial System Setup</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                The database is currently clean and empty. Please register the primary{' '}
                <strong>System Administrator</strong> to initialize the management platform.
              </p>
            </div>

            <form onSubmit={handleInitAdmin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Administrator Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    id="init-admin-name"
                    type="text"
                    required
                    placeholder="e.g. Dr. Aminu Garba"
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-[#006B3F] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Official Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    id="init-admin-email"
                    type="email"
                    required
                    placeholder="admin@nigerianstat.gov.ng"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-[#006B3F] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Staff ID
                  </label>
                  <input
                    id="init-admin-staff-id"
                    type="text"
                    placeholder="NBS-ADMIN-01"
                    value={adminStaffId}
                    onChange={e => setAdminStaffId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-[#006B3F] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="init-admin-phone"
                    type="tel"
                    placeholder="+234..."
                    value={adminPhone}
                    onChange={e => setAdminPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-[#006B3F] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Admin Password (min. 5 chars) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    id="init-admin-password"
                    type="password"
                    required
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-[#006B3F] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    id="init-admin-confirm-password"
                    type="password"
                    required
                    value={adminConfirmPassword}
                    onChange={e => setAdminConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-[#006B3F] focus:border-transparent"
                  />
                </div>
              </div>

              <button
                id="btn-init-admin-submit"
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full mt-4 py-2.5 px-4 bg-[#006B3F] hover:bg-[#004D2A] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2"
              >
                <BadgeCheck className="w-4 h-4 text-[#F2C94C]" />
                <span>{isSubmitting ? 'Initializing Platform...' : 'Initialize & Sign In'}</span>
              </button>
            </form>
          </div>
        ) : selectedRole === null ? (
          /* Step 1: Select Access Role (Login as Admin or Desk Officer) */
          <div>
            <div className="mb-5 pb-3 border-b border-gray-100 text-center">
              <h3 className="text-base font-bold text-gray-900">Select Access Role</h3>
              <p className="text-xs text-gray-500 mt-1">
                Choose your assigned role to proceed to the official login portal.
              </p>
            </div>

            <div className="space-y-3">
              {/* Option 1: Login as Admin */}
              <button
                type="button"
                id="btn-select-admin-role"
                onClick={() => {
                  setError(null);
                  setSelectedRole('Administrator');
                }}
                className="w-full text-left p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 hover:border-[#006B3F] transition-all group cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#006B3F] text-white flex items-center justify-center shadow-xs shrink-0">
                      <ShieldCheck className="w-5 h-5 text-[#F2C94C]" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-gray-900 group-hover:text-[#006B3F]">
                          Login as Admin
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-[#006B3F] border border-emerald-300">
                          Full Control
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 leading-snug">
                        System administration, workflow control &amp; executive approvals
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-emerald-700 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                </div>
              </button>

              {/* Option 2: Login as Desk Officer */}
              <button
                type="button"
                id="btn-select-desk-officer-role"
                onClick={() => {
                  setError(null);
                  setSelectedRole('Departmental Desk Officer');
                }}
                className="w-full text-left p-4 rounded-xl border-2 border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 hover:border-blue-600 transition-all group cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-xs shrink-0">
                      <UserCheck className="w-5 h-5 text-blue-200" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-gray-900 group-hover:text-blue-900">
                          Login as Desk Officer
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          Departmental
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 leading-snug">
                        Department M&amp;E submission, work plan drafting &amp; monthly tracking
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-700 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Credential Login for the Selected Role (No auto-login) */
          <div>
            <div className="mb-4 pb-3 border-b border-gray-100 flex items-center justify-between">
              <button
                type="button"
                id="btn-back-to-roles"
                onClick={() => {
                  setError(null);
                  setSelectedRole(null);
                  setEmail('');
                  setPassword('');
                }}
                className="inline-flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-900 font-semibold py-1 px-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Role</span>
              </button>

              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center space-x-1.5 ${
                  selectedRole === 'Administrator'
                    ? 'bg-emerald-50 text-[#006B3F] border-emerald-300'
                    : 'bg-blue-50 text-blue-800 border-blue-300'
                }`}
              >
                {selectedRole === 'Administrator' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#006B3F]" />
                    <span>Administrator</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                    <span>Desk Officer</span>
                  </>
                )}
              </span>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-900">
                {selectedRole === 'Administrator'
                  ? 'Administrator Sign In'
                  : 'Desk Officer Sign In'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedRole === 'Administrator'
                  ? 'Enter your official Administrator email and password.'
                  : 'Enter your assigned Departmental Desk Officer email and password.'}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    placeholder={
                      selectedRole === 'Administrator'
                        ? 'admin@nigerianstat.gov.ng'
                        : 'officer@nigerianstat.gov.ng'
                    }
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-[#006B3F] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Secure Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-[#006B3F] focus:border-transparent"
                  />
                </div>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                disabled={isSubmitting || isLoading}
                className={`w-full py-2.5 px-4 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2 ${
                  selectedRole === 'Administrator'
                    ? 'bg-[#006B3F] hover:bg-[#004D2A]'
                    : 'bg-blue-700 hover:bg-blue-800'
                }`}
              >
                {selectedRole === 'Administrator' ? (
                  <ShieldCheck className="w-4 h-4 text-[#F2C94C]" />
                ) : (
                  <UserCheck className="w-4 h-4 text-blue-200" />
                )}
                <span>
                  {isSubmitting
                    ? 'Authenticating...'
                    : `Sign In as ${selectedRole === 'Administrator' ? 'Admin' : 'Desk Officer'}`}
                </span>
              </button>
            </form>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <div className="flex items-center justify-center space-x-1.5 text-[11px] text-gray-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#006B3F]" />
            <span>Role-based access enforced at database level</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Departmental Desk Officers automatically access their department records exclusively.
          </p>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="text-center mt-6 text-xs text-gray-500">
        &copy; {new Date().getFullYear()} National Bureau of Statistics (NBS) &bull; Federal Republic of Nigeria
      </div>
    </div>
  );
};
