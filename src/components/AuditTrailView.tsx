import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { AuditLog } from '../types.js';
import { History, Search, ShieldCheck, Filter, AlertCircle } from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.auditLogs.getAll();
      setLogs(res.audit_logs);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = logs.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    return matchesSearch && matchesEntity;
  });

  const entityTypes = Array.from(new Set(logs.map(l => l.entity_type)));

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-[#006B3F]" />
            <h2 className="text-base font-bold text-gray-900">System Audit Trail & Security Logs</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Immutable transaction records for all user authentications, submissions, approvals, and system edits.
          </p>
        </div>

        <div className="flex items-center space-x-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold">
          <ShieldCheck className="w-4 h-4 text-[#006B3F]" />
          <span>Real-time Tamper Log</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              id="input-search-audit"
              type="text"
              placeholder="Search action, officer, details..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#006B3F] focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-gray-400 ml-1" />
            <select
              id="select-filter-entity"
              value={entityFilter}
              onChange={e => setEntityFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:ring-[#006B3F] focus:outline-hidden"
            >
              <option value="all">All Entity Types</option>
              {entityTypes.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Total Recorded Actions: <strong className="text-gray-900">{logs.length}</strong>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading audit records...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-gray-700">No audit records found</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">Logs populate automatically on user operations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Officer / User</th>
                  <th className="py-2.5 px-4">Entity</th>
                  <th className="py-2.5 px-4">Operation Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-[#006B3F] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{log.user_name}</div>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="text-[11px] text-gray-600 uppercase font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                        {log.entity_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-gray-700 max-w-md">
                      <div className="line-clamp-2">{log.details}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
