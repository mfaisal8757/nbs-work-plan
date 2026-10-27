import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { User, Department, Role } from '../types.js';
import { Users, Plus, Edit2, Shield, Search, AlertCircle, CheckCircle2, XCircle, KeyRound } from 'lucide-react';

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Departmental Desk Officer');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [staffId, setStaffId] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [uRes, dRes] = await Promise.all([
        api.users.getAll(),
        api.departments.getAll()
      ]);
      setUsers(uRes.users);
      setDepartments(dRes.departments);
    } catch (err: any) {
      setError(err.message || 'Failed to load user management data');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('Departmental Desk Officer');
    setDepartmentId(departments.length > 0 ? departments[0].id : '');
    setPhone('');
    setStaffId('');
    setIsActive(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // blank means do not update
    setRole(user.role);
    setDepartmentId(user.department_id || (departments.length > 0 ? departments[0].id : ''));
    setPhone(user.phone || '');
    setStaffId(user.staff_id || '');
    setIsActive(user.is_active);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!name || !email) {
      setModalError('Name and Email are required.');
      return;
    }

    if (!editingUser && !password) {
      setModalError('Password is required for new accounts.');
      return;
    }

    if (role === 'Departmental Desk Officer' && !departmentId) {
      setModalError('Departmental Desk Officers must be assigned to an active department.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingUser) {
        await api.users.update(editingUser.id, {
          name,
          email,
          role,
          department_id: role === 'Departmental Desk Officer' ? departmentId : null,
          phone,
          staff_id: staffId,
          is_active: isActive,
          ...(password ? { password } : {})
        });
      } else {
        await api.users.create({
          name,
          email,
          password,
          role,
          department_id: role === 'Departmental Desk Officer' ? departmentId : null,
          phone,
          staff_id: staffId
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save user.');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.department_name && u.department_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#006B3F]" />
            <h2 className="text-base font-bold text-gray-900">User Access Management</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Provision roles and assign Desk Officers to specific departments for strictly partitioned reporting.
          </p>
        </div>

        <button
          id="btn-add-user"
          onClick={openCreateModal}
          className="px-3.5 py-2 bg-[#006B3F] hover:bg-[#004D2A] text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
        >
          <Plus className="w-4 h-4 text-[#F2C94C]" />
          <span>New User Account</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter / Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            id="input-search-users"
            type="text"
            placeholder="Search by name, email, department..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Total Users: <strong className="text-gray-900">{users.length}</strong>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading user accounts...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-gray-700">No users found</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {searchQuery ? 'Try another search query.' : 'Click "New User Account" to add officers.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4">Staff / Officer</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Assigned Department</th>
                  <th className="py-2.5 px-4">Staff ID</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{u.name}</div>
                      <div className="text-[11px] text-gray-500 font-normal">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          u.role === 'Administrator'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : u.role === 'Departmental Desk Officer'
                            ? 'bg-emerald-50 text-[#006B3F] border-emerald-300'
                            : 'bg-sky-50 text-sky-900 border-sky-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.department_name ? (
                        <span className="font-semibold text-gray-900">{u.department_name}</span>
                      ) : (
                        <span className="text-gray-400 italic">Organization-wide (All)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{u.staff_id || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      {u.is_active ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                          <XCircle className="w-3 h-3 text-gray-400" />
                          <span>Disabled</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        id={`btn-edit-user-${u.id}`}
                        onClick={() => openEditModal(u)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-[#006B3F] hover:bg-emerald-50 rounded-md border border-emerald-300 transition-colors inline-flex items-center space-x-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              {editingUser ? 'Edit User Account' : 'Create New User Account'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Configure system role and departmental boundaries.
            </p>

            {modalError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  id="modal-user-name"
                  type="text"
                  required
                  placeholder="e.g. Fatima Mohammed"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Official Email Address *
                </label>
                <input
                  id="modal-user-email"
                  type="email"
                  required
                  placeholder="officer@nigerianstat.gov.ng"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    System Role *
                  </label>
                  <select
                    id="modal-user-role"
                    value={role}
                    onChange={e => setRole(e.target.value as Role)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white"
                  >
                    <option value="Departmental Desk Officer">Departmental Desk Officer</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Management Viewer">Management Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Staff ID
                  </label>
                  <input
                    id="modal-user-staff-id"
                    type="text"
                    placeholder="NBS-ESD-04"
                    value={staffId}
                    onChange={e => setStaffId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Department Selector (Required for Desk Officer) */}
              {role === 'Departmental Desk Officer' && (
                <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 space-y-1">
                  <label className="block text-xs font-bold text-[#006B3F]">
                    Assign Department * (Strict Partition)
                  </label>
                  <select
                    id="modal-user-dept"
                    required
                    value={departmentId}
                    onChange={e => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden bg-white font-medium"
                  >
                    <option value="" disabled>
                      Select Department...
                    </option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-emerald-800 italic">
                    The Desk Officer will exclusively view and manage work plans and reports for this department.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {editingUser ? 'New Password (leave blank to keep unchanged)' : 'Initial Password *'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    id="modal-user-password"
                    type="password"
                    placeholder={editingUser ? '••••••••' : 'Minimum 6 characters'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                  />
                </div>
              </div>

              {editingUser && (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    id="modal-user-status"
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#006B3F] rounded border-gray-300 focus:ring-[#006B3F]"
                  />
                  <label htmlFor="modal-user-status" className="text-xs font-semibold text-gray-700">
                    Account is Active
                  </label>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-user"
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#006B3F] hover:bg-[#004D2A] rounded-lg shadow-xs"
                >
                  {isSaving ? 'Saving...' : editingUser ? 'Save User' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
