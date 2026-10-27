import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { Department } from '../types.js';
import { Building2, Plus, Edit2, CheckCircle2, XCircle, Search, AlertCircle, Sparkles } from 'lucide-react';

export const DepartmentsView: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [headOfDept, setHeadOfDept] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setIsLoading(true);
    try {
      const res = await api.departments.getAll();
      setDepartments(res.departments);
    } catch (err: any) {
      setError(err.message || 'Failed to load departments');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingDept(null);
    setCode('');
    setName('');
    setHeadOfDept('');
    setEmail('');
    setIsActive(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setCode(dept.code);
    setName(dept.name);
    setHeadOfDept(dept.head_of_department || '');
    setEmail(dept.email || '');
    setIsActive(dept.is_active);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!code || !name) {
      setModalError('Department Code and Full Name are required.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingDept) {
        await api.departments.update(editingDept.id, {
          code,
          name,
          head_of_department: headOfDept,
          email,
          is_active: isActive
        });
      } else {
        await api.departments.create({
          code,
          name,
          head_of_department: headOfDept,
          email,
          is_active: isActive
        });
      }
      setIsModalOpen(false);
      await loadDepartments();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save department.');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.head_of_department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-[#006B3F]" />
            <h2 className="text-base font-bold text-gray-900">Departments Management</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure official National Bureau of Statistics directorates and statistical departments.
          </p>
        </div>

        <button
          id="btn-add-department"
          onClick={openCreateModal}
          className="px-3.5 py-2 bg-[#006B3F] hover:bg-[#004D2A] text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
        >
          <Plus className="w-4 h-4 text-[#F2C94C]" />
          <span>New Department</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            id="input-search-dept"
            type="text"
            placeholder="Search by name, code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Total Departments: <strong className="text-gray-900">{departments.length}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading departments...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-gray-700">No departments found</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {searchQuery ? 'Try changing your search keywords.' : 'Click "New Department" above to create one.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Department Name</th>
                  <th className="py-2.5 px-4">Head of Department</th>
                  <th className="py-2.5 px-4">Official Contact</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {filtered.map(dept => (
                  <tr key={dept.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#006B3F]">
                      <span className="bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {dept.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{dept.name}</td>
                    <td className="py-3 px-4 text-gray-600">{dept.head_of_department || '—'}</td>
                    <td className="py-3 px-4 text-gray-500">{dept.email || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      {dept.is_active ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                          <XCircle className="w-3 h-3 text-gray-400" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        id={`btn-edit-dept-${dept.id}`}
                        onClick={() => openEditModal(dept)}
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

      {/* Create / Edit Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              {editingDept ? 'Edit Department' : 'Create New Department'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter department information for organizational and reporting alignment.
            </p>

            {modalError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Department Code * (e.g. ESD, RSD, F&A)
                </label>
                <input
                  id="modal-dept-code"
                  type="text"
                  required
                  placeholder="e.g. ESD"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Department Full Name *
                </label>
                <input
                  id="modal-dept-name"
                  type="text"
                  required
                  placeholder="e.g. Economic Statistics Department"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Head of Department / Director
                </label>
                <input
                  id="modal-dept-head"
                  type="text"
                  placeholder="e.g. Director Aminu Bello"
                  value={headOfDept}
                  onChange={e => setHeadOfDept(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Official Email
                </label>
                <input
                  id="modal-dept-email"
                  type="email"
                  placeholder="esd@nigerianstat.gov.ng"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  id="modal-dept-status"
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#006B3F] rounded border-gray-300 focus:ring-[#006B3F]"
                />
                <label htmlFor="modal-dept-status" className="text-xs font-semibold text-gray-700">
                  Active in Work Plan & M&E Cycles
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-department"
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#006B3F] hover:bg-[#004D2A] rounded-lg shadow-xs"
                >
                  {isSaving ? 'Saving...' : editingDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
