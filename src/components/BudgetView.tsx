import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { api } from '../api/client.js';
import { BudgetRecord, Department } from '../types.js';
import {
  WalletCards,
  Edit2,
  AlertCircle,
  Building2,
  TrendingUp,
  Percent,
  Search,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

export const BudgetView: React.FC = () => {
  const { user, isAdmin, isDeskOfficer } = useAuth();

  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetRecord | null>(null);

  // Form Fields
  const [appropriation, setAppropriation] = useState<number>(0);
  const [donor, setDonor] = useState<string>('0');
  const [released, setReleased] = useState<number>(0);
  const [utilized, setUtilized] = useState<number>(0);
  const [moreFund, setMoreFund] = useState<number>(0);

  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [selectedDeptFilter, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto mt-12 bg-white rounded-xl border border-gray-200 text-center shadow-xs">
        <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-900">Administrator Access Required</h3>
        <p className="text-xs text-gray-500 mt-1">
          Budget Performance and Expenditure Tracking is strictly restricted to System Administrators.
        </p>
      </div>
    );
  }

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bRes, dRes] = await Promise.all([
        api.budgets.getAll(selectedDeptFilter || undefined),
        api.departments.getAll()
      ]);
      setBudgets(bRes.budgets);
      setDepartments(dRes.departments);
    } catch (err: any) {
      setError(err.message || 'Failed to load budget records');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (b: BudgetRecord) => {
    setEditingBudget(b);
    setAppropriation(b.appropriation || b.total_budget);
    setDonor(b.donor || '0');
    setReleased(b.released || 0);
    setUtilized(b.utilized || 0);
    setMoreFund(b.more_fund || 0);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;
    setModalError(null);

    if (utilized > released && released > 0) {
      const confirmExceed = window.confirm(
        'Warning: Funds Utilized exceeds statutory releases. Do you wish to proceed?'
      );
      if (!confirmExceed) return;
    }

    setIsSaving(true);
    try {
      await api.budgets.update(editingBudget.id, {
        appropriation: Number(appropriation) || 0,
        donor: donor,
        released: Number(released) || 0,
        utilized: Number(utilized) || 0,
        more_fund: Number(moreFund) || 0
      });
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to update budget performance record.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const filteredBudgets = budgets.filter(b => {
    const matchesSearch =
      b.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.activity_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.department_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Calculations for preview in modal
  const baseCalc = (Number(released) || 0) > 0 ? Number(released) : Number(appropriation) || 0;
  const previewBalance = baseCalc - (Number(utilized) || 0);
  const previewUtilizationPct = baseCalc > 0
    ? Math.round(((Number(utilized) || 0) / baseCalc) * 1000) / 10
    : 0;

  // Aggregate totals
  const totalAppropriation = budgets.reduce((acc, b) => acc + (b.appropriation || b.total_budget), 0);
  const totalReleased = budgets.reduce((acc, b) => acc + b.released, 0);
  const totalUtilized = budgets.reduce((acc, b) => acc + b.utilized, 0);
  const totalBalance = totalReleased > 0 ? totalReleased - totalUtilized : totalAppropriation - totalUtilized;
  const baseForPct = totalReleased > 0 ? totalReleased : totalAppropriation;
  const overallUtilizationPct = baseForPct > 0 ? Math.round((totalUtilized / baseForPct) * 1000) / 10 : 0;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <WalletCards className="w-5 h-5 text-[#006B3F]" />
            <h2 className="text-base font-bold text-gray-900">Budget Performance & Expenditure Tracking</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time monitoring of project appropriations, donor support, statutory releases, and utilization.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <FileSpreadsheet className="w-4 h-4 text-[#006B3F]" />
          <span>Linked automatically to Approved Annual Work Plans</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Aggregate Financial Performance Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Appropriation</span>
          <div className="text-base font-mono font-extrabold text-gray-900 mt-0.5">
            {formatCurrency(totalAppropriation)}
          </div>
        </div>

        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
          <span className="text-[10px] uppercase font-bold text-blue-700 block">Funds Released</span>
          <div className="text-base font-mono font-extrabold text-blue-950 mt-0.5">
            {formatCurrency(totalReleased)}
          </div>
        </div>

        <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Funds Utilized</span>
          <div className="text-base font-mono font-extrabold text-emerald-950 mt-0.5">
            {formatCurrency(totalUtilized)}
          </div>
        </div>

        <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
          <span className="text-[10px] uppercase font-bold text-amber-700 block">Available Balance</span>
          <div className="text-base font-mono font-extrabold text-amber-950 mt-0.5">
            {formatCurrency(totalBalance)}
          </div>
          <span className="text-[9px] text-gray-400 block mt-0.5">
            {totalReleased > 0 ? 'Released - Utilized' : 'Appropriation - Utilized'}
          </span>
        </div>

        <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 col-span-2 lg:col-span-1">
          <span className="text-[10px] uppercase font-bold text-purple-700 block">Utilization Rate</span>
          <div className="text-base font-bold text-purple-950 mt-0.5">{overallUtilizationPct}%</div>
          <div className="w-full bg-purple-200 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-purple-700 h-full rounded-full"
              style={{ width: `${Math.min(100, overallUtilizationPct)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              id="input-search-budget"
              type="text"
              placeholder="Search project, activity code, department..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#006B3F] focus:bg-white focus:outline-hidden"
            />
          </div>

          {!isDeskOfficer && (
            <select
              id="select-budget-dept"
              value={selectedDeptFilter}
              onChange={e => setSelectedDeptFilter(e.target.value)}
              className="text-xs py-1.5 px-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-[#006B3F] focus:outline-hidden"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Budget Items: <strong className="text-gray-900">{filteredBudgets.length}</strong>
        </div>
      </div>

      {/* Budget Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading budget records...</div>
        ) : filteredBudgets.length === 0 ? (
          <div className="py-12 text-center">
            <WalletCards className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-gray-700">No budget records found</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Budget records are automatically created when Annual Work Plans are saved.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4">Activity Code & Project</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4 text-right">Appropriation</th>
                  <th className="py-2.5 px-4 text-right">Donor Support</th>
                  <th className="py-2.5 px-4 text-right">Released</th>
                  <th className="py-2.5 px-4 text-right">Utilized</th>
                  <th className="py-2.5 px-4 text-right">Balance</th>
                  <th className="py-2.5 px-4 text-center">Utilization %</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {filteredBudgets.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <span className="font-mono text-[10px] text-[#006B3F] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block">
                        {b.activity_code}
                      </span>
                      <div className="font-bold text-gray-900 line-clamp-1 mt-0.5">{b.project_name}</div>
                      <div className="text-[10px] text-gray-400">Year: {b.year}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-semibold text-gray-800">
                      {b.department_name}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                      {formatCurrency(b.appropriation || b.total_budget)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600 whitespace-nowrap">
                      {b.donor && b.donor !== '0' ? b.donor : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-900 whitespace-nowrap">
                      {formatCurrency(b.released)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-900 whitespace-nowrap">
                      {formatCurrency(b.utilized)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap text-amber-900">
                      {formatCurrency(b.balance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[11px] bg-purple-50 text-purple-800 border border-purple-200">
                        {b.budget_utilization_pct}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        id={`btn-edit-budget-${b.id}`}
                        onClick={() => openEditModal(b)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-[#006B3F] hover:bg-emerald-50 rounded-md border border-emerald-300 transition-colors inline-flex items-center space-x-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Update</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upsert Modal */}
      {isModalOpen && editingBudget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              Update Budget Execution Record
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Project: <strong>{editingBudget.project_name}</strong> ({editingBudget.activity_code})
            </p>

            {modalError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Approved Appropriation (NGN) *
                </label>
                <input
                  id="modal-budget-appropriation"
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={appropriation}
                  onChange={e => setAppropriation(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Donor Support / External Partner Funding
                </label>
                <input
                  id="modal-budget-donor"
                  type="text"
                  placeholder="e.g. World Bank / UNICEF / None"
                  value={donor}
                  onChange={e => setDonor(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Funds Released by Treasury (NGN) *
                </label>
                <input
                  id="modal-budget-released"
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={released}
                  onChange={e => setReleased(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Funds Utilized / Expended (NGN) *
                </label>
                <input
                  id="modal-budget-utilized"
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={utilized}
                  onChange={e => setUtilized(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Additional Funds Needed / More Fund (NGN)
                </label>
                <input
                  id="modal-budget-morefund"
                  type="number"
                  min="0"
                  step="1000"
                  value={moreFund}
                  onChange={e => setMoreFund(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#006B3F] focus:outline-hidden font-mono"
                />
              </div>

              {/* Automatic live calculation preview */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Calculated Balance</span>
                  <span className="font-mono font-bold text-amber-900">{formatCurrency(previewBalance)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Utilization %</span>
                  <span className="font-bold text-purple-900">{previewUtilizationPct}%</span>
                </div>
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
                  id="btn-save-budget-changes"
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#006B3F] hover:bg-[#004D2A] rounded-lg shadow-xs"
                >
                  {isSaving ? 'Saving...' : 'Save Performance Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
