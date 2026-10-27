import React, { useState, useMemo } from 'react';
import {
  DashboardStats,
  DepartmentSummaryItem,
  DepartmentMonthlyTimeline
} from '../types.js';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Calendar,
  Layers,
  Filter,
  ArrowUpDown,
  Search,
  Sparkles,
  Flame,
  AlertOctagon,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  ComposedChart
} from 'recharts';

interface DepartmentTrendsComparisonProps {
  stats: DashboardStats;
}

type TabMode = 'comparison' | 'consistency' | 'performance' | 'agency';
type ConsistencyFilter = 'all' | 'Consistent' | 'Regular' | 'Inconsistent' | 'Non-Reporting';
type PerformanceFilter = 'all' | 'High' | 'Moderate' | 'Low' | 'Critical';
type SortOption = 'performance-desc' | 'consistency-desc' | 'reports-desc' | 'code-asc';

export const DepartmentTrendsComparison: React.FC<DepartmentTrendsComparisonProps> = ({ stats }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('comparison');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [consistencyFilter, setConsistencyFilter] = useState<ConsistencyFilter>('all');
  const [performanceFilter, setPerformanceFilter] = useState<PerformanceFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('performance-desc');
  const [selectedDeptDetail, setSelectedDeptDetail] = useState<DepartmentSummaryItem | null>(null);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const fullMonthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const departments = stats.department_summaries || [];
  const monthlyTrends = stats.monthly_trends || [];
  const consistencyOverview = stats.consistency_comparison;

  // Filter & Sort departments
  const filteredDepartments = useMemo(() => {
    return departments
      .filter(dept => {
        const matchesSearch =
          dept.department_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dept.department_code.toLowerCase().includes(searchQuery.toLowerCase());

        const consistencyStatus = dept.reporting_consistency?.status || 'Non-Reporting';
        const matchesConsistency =
          consistencyFilter === 'all' || consistencyStatus === consistencyFilter;

        const perfTier = dept.performance_level?.tier || 'Critical';
        const matchesPerf =
          performanceFilter === 'all' || perfTier === performanceFilter;

        return matchesSearch && matchesConsistency && matchesPerf;
      })
      .sort((a, b) => {
        if (sortBy === 'performance-desc') {
          return (b.achievement_rate || 0) - (a.achievement_rate || 0);
        }
        if (sortBy === 'consistency-desc') {
          return (
            (b.reporting_consistency?.consistency_rate || 0) -
            (a.reporting_consistency?.consistency_rate || 0)
          );
        }
        if (sortBy === 'reports-desc') {
          return (b.monthly_reports || 0) - (a.monthly_reports || 0);
        }
        if (sortBy === 'code-asc') {
          return a.department_code.localeCompare(b.department_code);
        }
        return 0;
      });
  }, [departments, searchQuery, consistencyFilter, performanceFilter, sortBy]);

  // Chart data for Cross-Departmental Comparison
  const chartData = useMemo(() => {
    if (selectedMonth === 'all') {
      // Aggregate across full year per department
      return filteredDepartments.map(dept => ({
        code: dept.department_code,
        name: dept.department_name,
        reports_count: dept.monthly_reports,
        performance_level: dept.achievement_rate,
        consistency_rate: dept.reporting_consistency?.consistency_rate || 0,
        work_plan_compliance: dept.work_plan_compliance
      }));
    } else {
      // For a specific month
      const monthNum = parseInt(selectedMonth, 10);
      const monthData = monthlyTrends.find(m => m.month_num === monthNum);

      return filteredDepartments.map(dept => {
        const deptMonth = monthData?.by_department?.[dept.department_id];
        return {
          code: dept.department_code,
          name: dept.department_name,
          reports_count: deptMonth?.reports_count || 0,
          performance_level: deptMonth?.avg_achievement || 0,
          outside_count: deptMonth?.outside_count || 0,
          reported: deptMonth?.reported || false
        };
      });
    }
  }, [filteredDepartments, selectedMonth, monthlyTrends]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
      {/* Module Title Header */}
      <div className="p-4 sm:p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50/80 to-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-[#006B3F]/10 rounded-lg text-[#006B3F]">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-gray-900">
                Monthly Monitoring & Evaluation Reporting Trends
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Cross-departmental comparison of reporting consistency, monthly submission timelines, and performance levels across all added departments.
            </p>
          </div>

          {/* Sub-Tab Navigation Switcher */}
          <div className="flex flex-wrap items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200 self-start lg:self-auto text-xs font-semibold">
            <button
              id="btn-tab-trends-comparison"
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'comparison'
                  ? 'bg-white text-[#006B3F] font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Department Comparison</span>
            </button>

            <button
              id="btn-tab-trends-consistency"
              onClick={() => setActiveTab('consistency')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'consistency'
                  ? 'bg-white text-[#006B3F] font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Reporting Consistency</span>
            </button>

            <button
              id="btn-tab-trends-performance"
              onClick={() => setActiveTab('performance')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'performance'
                  ? 'bg-white text-[#006B3F] font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Performance Levels</span>
            </button>

            <button
              id="btn-tab-trends-agency"
              onClick={() => setActiveTab('agency')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'agency'
                  ? 'bg-white text-[#006B3F] font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Agency Aggregate</span>
            </button>
          </div>
        </div>

        {/* Executive Highlights KPI Cards */}
        {consistencyOverview && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-gray-200/70 text-xs">
            <div className="p-3 bg-white rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Reporting Consistently</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    consistencyOverview.consistency_percentage >= 70
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  }`}
                />
              </div>
              <div className="text-lg font-bold text-gray-900 mt-0.5">
                {consistencyOverview.consistent_departments_count} / {consistencyOverview.total_departments}
                <span className="text-xs font-normal text-gray-500 ml-1">
                  ({consistencyOverview.consistency_percentage}%)
                </span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {consistencyOverview.consistent_departments_count} departments with 100% active submissions
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-200">
              <span className="text-gray-500 font-medium">Top Performer</span>
              <div className="text-lg font-bold text-[#006B3F] mt-0.5 truncate">
                {consistencyOverview.top_performing_department?.code || 'None'}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                {consistencyOverview.top_performing_department
                  ? `${consistencyOverview.top_performing_department.rate}% average achievement`
                  : 'No reports filed yet'}
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-200">
              <span className="text-gray-500 font-medium">Consistency Leader</span>
              <div className="text-lg font-bold text-blue-700 mt-0.5 truncate">
                {consistencyOverview.most_consistent_department?.code || 'None'}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                {consistencyOverview.most_consistent_department
                  ? `${consistencyOverview.most_consistent_department.rate}% reporting reliability`
                  : 'No reports filed yet'}
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-200">
              <span className="text-gray-500 font-medium">Lagging / Inconsistent</span>
              <div className="text-lg font-bold text-amber-700 mt-0.5">
                {consistencyOverview.inconsistent_departments_count +
                  consistencyOverview.non_reporting_departments_count}
                <span className="text-xs font-normal text-gray-500 ml-1">
                  departments
                </span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {consistencyOverview.non_reporting_departments_count} non-reporting; {consistencyOverview.inconsistent_departments_count} with gaps
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Control Bar (For comparison, consistency, and performance modes) */}
      {activeTab !== 'agency' && (
        <div className="p-3 bg-gray-50/60 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
              <input
                id="input-search-dept-trends"
                type="text"
                placeholder="Search department code or name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#006B3F]"
              />
            </div>

            {/* Consistency Filter */}
            <div className="flex items-center space-x-1">
              <span className="text-gray-500 text-[11px] font-medium hidden sm:inline">Consistency:</span>
              <select
                id="select-filter-consistency"
                value={consistencyFilter}
                onChange={e => setConsistencyFilter(e.target.value as ConsistencyFilter)}
                className="py-1 px-2 text-xs bg-white rounded-lg border border-gray-200 focus:outline-hidden focus:ring-1 focus:ring-[#006B3F]"
              >
                <option value="all">All Consistency Tiers</option>
                <option value="Consistent">🌟 Consistent (100%)</option>
                <option value="Regular">⚡ Regular (65–99%)</option>
                <option value="Inconsistent">⚠️ Inconsistent (&lt;65%)</option>
                <option value="Non-Reporting">🚫 Non-Reporting</option>
              </select>
            </div>

            {/* Performance Level Filter */}
            <div className="flex items-center space-x-1">
              <span className="text-gray-500 text-[11px] font-medium hidden sm:inline">Performance:</span>
              <select
                id="select-filter-perf"
                value={performanceFilter}
                onChange={e => setPerformanceFilter(e.target.value as PerformanceFilter)}
                className="py-1 px-2 text-xs bg-white rounded-lg border border-gray-200 focus:outline-hidden focus:ring-1 focus:ring-[#006B3F]"
              >
                <option value="all">All Performance Levels</option>
                <option value="High">🟢 High Performer (≥80%)</option>
                <option value="Moderate">🔵 Moderate (60–79%)</option>
                <option value="Low">🟠 Low / Lagging (40–59%)</option>
                <option value="Critical">🔴 Critical (&lt;40%)</option>
              </select>
            </div>

            {/* Month Filter (for comparison chart) */}
            {activeTab === 'comparison' && (
              <div className="flex items-center space-x-1">
                <span className="text-gray-500 text-[11px] font-medium hidden sm:inline">Period:</span>
                <select
                  id="select-compare-month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="py-1 px-2 text-xs bg-white rounded-lg border border-gray-200 focus:outline-hidden focus:ring-1 focus:ring-[#006B3F] font-semibold text-[#006B3F]"
                >
                  <option value="all">Full Year (Cumulative)</option>
                  {monthNames.map((m, i) => (
                    <option key={m} value={String(i + 1)}>
                      Month {i + 1}: {fullMonthNames[i]}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center space-x-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500 text-[11px]">Sort:</span>
            <select
              id="select-sort-dept"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="py-1 px-2 text-xs bg-white rounded-lg border border-gray-200 focus:outline-hidden"
            >
              <option value="performance-desc">Highest Performance Level</option>
              <option value="consistency-desc">Most Consistently Reporting</option>
              <option value="reports-desc">Most Reports Submitted</option>
              <option value="code-asc">Department Code (A-Z)</option>
            </select>
          </div>
        </div>
      )}

      {/* TAB 1: CROSS-DEPARTMENTAL COMPARISON CHART */}
      {activeTab === 'comparison' && (
        <div className="p-5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-gray-900">
                Departmental M&E Reporting & Performance Comparison
              </h4>
              <p className="text-xs text-gray-500">
                {selectedMonth === 'all'
                  ? 'Comparing total monthly reports submitted and average performance level across all added departments.'
                  : `Comparing reports submitted and milestone achievement for Month ${selectedMonth} (${fullMonthNames[parseInt(selectedMonth, 10) - 1]}).`}
              </p>
            </div>
            <div className="flex items-center space-x-4 text-[11px] text-gray-600 font-medium">
              <span className="inline-flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#006B3F]" />
                <span>M&E Reports Filed</span>
              </span>
              <span className="inline-flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#F2C94C]" />
                <span>Performance Level (%)</span>
              </span>
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">
              No department data matching the selected filters.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="code"
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#374151' }}
                    interval={0}
                  />
                  <YAxis
                    yAxisId="left"
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Reports Filed', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#6B7280' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    unit="%"
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Performance %', angle: 90, position: 'insideRight', fontSize: 10, fill: '#6B7280' }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-lg text-xs space-y-1">
                            <div className="font-bold text-gray-900">{data.name} ({label})</div>
                            <div className="text-emerald-700 font-semibold">
                              Reports Filed: {data.reports_count}
                            </div>
                            <div className="text-amber-700 font-semibold">
                              Performance Level: {data.performance_level}%
                            </div>
                            {data.consistency_rate !== undefined && (
                              <div className="text-blue-700 font-medium text-[11px]">
                                Reporting Consistency: {data.consistency_rate}%
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="reports_count"
                    name="M&E Reports Submitted"
                    fill="#006B3F"
                    radius={[4, 4, 0, 0]}
                    barSize={28}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="performance_level"
                    name="Performance Level (%)"
                    stroke="#D97706"
                    strokeWidth={2.5}
                    dot={{ fill: '#D97706', r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quick Department Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredDepartments.map(dept => {
              const consistency = dept.reporting_consistency;
              const perf = dept.performance_level;
              return (
                <div
                  key={dept.department_id}
                  onClick={() => setSelectedDeptDetail(dept)}
                  className="p-3.5 rounded-xl border border-gray-200 hover:border-[#006B3F]/40 hover:shadow-xs transition-all cursor-pointer bg-white"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#006B3F] bg-[#006B3F]/10 px-1.5 py-0.5 rounded">
                        {dept.department_code}
                      </span>
                      <h5 className="font-bold text-xs text-gray-900 mt-1 line-clamp-1" title={dept.department_name}>
                        {dept.department_name}
                      </h5>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        consistency?.status === 'Consistent'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : consistency?.status === 'Regular'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : consistency?.status === 'Inconsistent'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-gray-100 text-gray-600 border-gray-300'
                      }`}
                    >
                      {consistency?.status || 'Non-Reporting'}
                    </span>
                  </div>

                  {/* Performance Progress */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500">Performance Level:</span>
                      <strong className="text-gray-900">{dept.achievement_rate}%</strong>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${dept.achievement_rate}%`,
                          backgroundColor: perf?.color || '#006B3F'
                        }}
                      />
                    </div>
                  </div>

                  {/* Consistency & Reports Count */}
                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                    <span>
                      Reports: <strong className="text-gray-900">{dept.monthly_reports}</strong>
                    </span>
                    <span>
                      Consistency: <strong className="text-gray-900">{consistency?.consistency_rate || 0}%</strong>
                    </span>
                    <span>
                      Streak: <strong className="text-gray-900">{consistency?.consecutive_months || 0}m</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY REPORTING CONSISTENCY MATRIX (Jan - Dec) */}
      {activeTab === 'consistency' && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-gray-900">
                Monthly M&E Reporting Consistency Matrix
              </h4>
              <p className="text-xs text-gray-500">
                Month-by-month submission tracker showing departments that report consistently without missing active cycles.
              </p>
            </div>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="flex items-center space-x-1 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Reported On Schedule</span>
              </span>
              <span className="flex items-center space-x-1 text-red-700">
                <XCircle className="w-3.5 h-3.5 text-red-500" />
                <span>Missed / Lagging</span>
              </span>
              <span className="flex items-center space-x-1 text-gray-400">
                <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                <span>Upcoming</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3 whitespace-nowrap">Dept Code</th>
                  <th className="py-2.5 px-3 min-w-[150px]">Department Name</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Consistency</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Streak</th>
                  {/* 12 Months Columns */}
                  {monthNames.map(m => (
                    <th key={m} className="py-2.5 px-2 text-center font-mono font-bold text-gray-700">
                      {m}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Total Reports</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {filteredDepartments.map(dept => {
                  const consistency = dept.reporting_consistency;
                  const isCons = consistency?.is_consistent;
                  const status = consistency?.status || 'Non-Reporting';

                  return (
                    <tr key={dept.department_id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#006B3F] bg-[#006B3F]/10 px-1.5 py-0.5 rounded">
                          {dept.department_code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-gray-900 truncate max-w-[200px]" title={dept.department_name}>
                          {dept.department_name}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {dept.approved_projects} approved projects
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            status === 'Consistent'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : status === 'Regular'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : status === 'Inconsistent'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-gray-100 text-gray-600 border-gray-300'
                          }`}
                        >
                          {status === 'Consistent' && '🌟 '}
                          {consistency?.consistency_rate || 0}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {(consistency?.consecutive_months || 0) > 0 ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold">
                            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>{consistency?.consecutive_months}m</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>

                      {/* 12 Months Heatmap Cells */}
                      {dept.timeline?.map(t => {
                        return (
                          <td key={t.month_num} className="py-2.5 px-1.5 text-center">
                            {t.status === 'reported' ? (
                              <div
                                className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300 shadow-2xs"
                                title={`Reported Month ${t.month_num}: ${t.reports_count} reports filed, ${t.avg_achievement}% progress`}
                              >
                                {t.reports_count}
                              </div>
                            ) : t.status === 'missed' ? (
                              <div
                                className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-red-100 text-red-700 font-bold text-[10px] border border-red-300"
                                title={`Missed reporting for Month ${t.month_num} (${t.month_name})`}
                              >
                                ✕
                              </div>
                            ) : (
                              <div
                                className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 text-gray-400 text-[10px]"
                                title={`Month ${t.month_num} (${t.month_name}) Upcoming`}
                              >
                                ·
                              </div>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-3 text-center font-bold text-gray-900 whitespace-nowrap">
                        {dept.monthly_reports}
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-gray-900">
                          {dept.achievement_rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PERFORMANCE LEVEL RANKINGS & EVALUATION */}
      {activeTab === 'performance' && (
        <div className="p-4 sm:p-5 space-y-6">
          <div>
            <h4 className="text-sm font-bold text-gray-900">
              Departmental Performance Level Matrix & Tiers
            </h4>
            <p className="text-xs text-gray-500">
              Classifying departments into performance tiers based on milestone delivery rate and reporting compliance.
            </p>
          </div>

          {/* 4 Tiers Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* High Performers */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="p-1 bg-emerald-600 text-white rounded-md">
                    <Award className="w-4 h-4" />
                  </span>
                  <h5 className="font-bold text-xs text-emerald-950">
                    High Performers (≥ 80% Achievement)
                  </h5>
                </div>
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  {departments.filter(d => d.performance_level?.tier === 'High').length} Departments
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Consistently advancing approved project milestones with verifiable statistical outcomes.
              </p>

              <div className="space-y-2">
                {departments
                  .filter(d => d.performance_level?.tier === 'High')
                  .map(d => (
                    <div key={d.department_id} className="p-2.5 bg-white rounded-lg border border-emerald-200 shadow-2xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-gray-900">
                          <span className="font-mono text-emerald-700 mr-1.5">{d.department_code}</span>
                          {d.department_name}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {d.monthly_reports} reports filed • Consistency: {d.reporting_consistency?.consistency_rate}%
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-emerald-700">
                          {d.achievement_rate}%
                        </span>
                        <div className="text-[10px] text-emerald-600 font-semibold">On Track</div>
                      </div>
                    </div>
                  ))}
                {departments.filter(d => d.performance_level?.tier === 'High').length === 0 && (
                  <div className="text-center py-4 text-xs text-gray-400">No departments currently at High Performer tier.</div>
                )}
              </div>
            </div>

            {/* Moderate Performers */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="p-1 bg-blue-600 text-white rounded-md">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <h5 className="font-bold text-xs text-blue-950">
                    Moderate Performers (60% – 79% Achievement)
                  </h5>
                </div>
                <span className="text-xs font-extrabold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-300">
                  {departments.filter(d => d.performance_level?.tier === 'Moderate').length} Departments
                </span>
              </div>
              <p className="text-[11px] text-blue-800">
                Steady delivery with satisfactory progress towards annual institutional targets.
              </p>

              <div className="space-y-2">
                {departments
                  .filter(d => d.performance_level?.tier === 'Moderate')
                  .map(d => (
                    <div key={d.department_id} className="p-2.5 bg-white rounded-lg border border-blue-200 shadow-2xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-gray-900">
                          <span className="font-mono text-blue-700 mr-1.5">{d.department_code}</span>
                          {d.department_name}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {d.monthly_reports} reports filed • Consistency: {d.reporting_consistency?.consistency_rate}%
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-blue-700">
                          {d.achievement_rate}%
                        </span>
                        <div className="text-[10px] text-blue-600 font-semibold">Standard Progress</div>
                      </div>
                    </div>
                  ))}
                {departments.filter(d => d.performance_level?.tier === 'Moderate').length === 0 && (
                  <div className="text-center py-4 text-xs text-gray-400">No departments in Moderate tier.</div>
                )}
              </div>
            </div>

            {/* Low / Lagging Performers */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="p-1 bg-amber-600 text-white rounded-md">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <h5 className="font-bold text-xs text-amber-950">
                    Low / Lagging Performers (40% – 59% Achievement)
                  </h5>
                </div>
                <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  {departments.filter(d => d.performance_level?.tier === 'Low').length} Departments
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                Experiencing milestone lag; departmental desks should review operational hurdles.
              </p>

              <div className="space-y-2">
                {departments
                  .filter(d => d.performance_level?.tier === 'Low')
                  .map(d => (
                    <div key={d.department_id} className="p-2.5 bg-white rounded-lg border border-amber-200 shadow-2xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-gray-900">
                          <span className="font-mono text-amber-700 mr-1.5">{d.department_code}</span>
                          {d.department_name}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {d.monthly_reports} reports filed • Consistency: {d.reporting_consistency?.consistency_rate}%
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-amber-700">
                          {d.achievement_rate}%
                        </span>
                        <div className="text-[10px] text-amber-600 font-semibold">Needs Follow-up</div>
                      </div>
                    </div>
                  ))}
                {departments.filter(d => d.performance_level?.tier === 'Low').length === 0 && (
                  <div className="text-center py-4 text-xs text-gray-400">No departments in Low tier.</div>
                )}
              </div>
            </div>

            {/* Critical / Non-Reporting */}
            <div className="rounded-xl border border-red-200 bg-red-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="p-1 bg-red-600 text-white rounded-md">
                    <AlertOctagon className="w-4 h-4" />
                  </span>
                  <h5 className="font-bold text-xs text-red-950">
                    Critical / Non-Reporting (&lt; 40% or 0 Reports)
                  </h5>
                </div>
                <span className="text-xs font-extrabold text-red-800 bg-red-100 px-2 py-0.5 rounded-full border border-red-300">
                  {departments.filter(d => d.performance_level?.tier === 'Critical').length} Departments
                </span>
              </div>
              <p className="text-[11px] text-red-800">
                Severely lagging or zero monthly reports filed; urgent administrative intervention required.
              </p>

              <div className="space-y-2">
                {departments
                  .filter(d => d.performance_level?.tier === 'Critical')
                  .map(d => (
                    <div key={d.department_id} className="p-2.5 bg-white rounded-lg border border-red-200 shadow-2xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-gray-900">
                          <span className="font-mono text-red-700 mr-1.5">{d.department_code}</span>
                          {d.department_name}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {d.monthly_reports} reports filed • Consistency: {d.reporting_consistency?.consistency_rate || 0}%
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-red-700">
                          {d.achievement_rate}%
                        </span>
                        <div className="text-[10px] text-red-600 font-semibold">Immediate Action</div>
                      </div>
                    </div>
                  ))}
                {departments.filter(d => d.performance_level?.tier === 'Critical').length === 0 && (
                  <div className="text-center py-4 text-xs text-gray-400">No departments in Critical tier.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AGENCY AGGREGATE TREND */}
      {activeTab === 'agency' && (
        <div className="p-5 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-gray-900">
              Agency Monthly M&E Reporting Volume & Ad-Hoc Trends
            </h4>
            <p className="text-xs text-gray-500">
              Total monthly M&E submissions filed across all departments vs activities conducted outside the approved annual work plan.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month_name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    borderColor: '#E5E7EB',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar
                  dataKey="reports_count"
                  name="Approved Plan M&E Reports"
                  fill="#006B3F"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="outside_count"
                  name="Outside Plan Activities (Non-compliant)"
                  fill="#F2C94C"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Department Detail Modal */}
      {selectedDeptDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-4">
              <div>
                <span className="font-mono text-xs font-bold text-[#006B3F] bg-[#006B3F]/10 px-2 py-0.5 rounded">
                  {selectedDeptDetail.department_code}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-1">
                  {selectedDeptDetail.department_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDeptDetail(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <div className="text-gray-500 text-[10px]">Reporting Consistency</div>
                  <div className="font-bold text-sm text-gray-900 mt-0.5">
                    {selectedDeptDetail.reporting_consistency?.consistency_rate}%
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold">
                    {selectedDeptDetail.reporting_consistency?.status}
                  </div>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <div className="text-gray-500 text-[10px]">Performance Level</div>
                  <div className="font-bold text-sm text-gray-900 mt-0.5">
                    {selectedDeptDetail.achievement_rate}%
                  </div>
                  <div className="text-[10px] text-blue-700 font-semibold">
                    {selectedDeptDetail.performance_level?.tier} Performer
                  </div>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <div className="text-gray-500 text-[10px]">Active Streak</div>
                  <div className="font-bold text-sm text-gray-900 mt-0.5">
                    {selectedDeptDetail.reporting_consistency?.consecutive_months || 0} mos
                  </div>
                  <div className="text-[10px] text-gray-500">Consecutive</div>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-lg">
                  <div className="text-gray-500 text-[10px]">Total M&E Reports</div>
                  <div className="font-bold text-sm text-gray-900 mt-0.5">
                    {selectedDeptDetail.monthly_reports}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {selectedDeptDetail.approved_projects} Projects
                  </div>
                </div>
              </div>

              {/* Month-by-month breakdown list */}
              <div>
                <h5 className="font-bold text-gray-900 mb-2">12-Month Reporting Timeline</h5>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {selectedDeptDetail.timeline?.map(t => (
                    <div
                      key={t.month_num}
                      className={`p-2 rounded-lg border text-center ${
                        t.status === 'reported'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : t.status === 'missed'
                          ? 'bg-red-50 border-red-200 text-red-900'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}
                    >
                      <div className="font-bold text-[11px]">{t.month_name}</div>
                      <div className="text-[10px] mt-0.5">
                        {t.status === 'reported' ? (
                          <span className="font-semibold text-emerald-700">
                            {t.reports_count} rep • {t.avg_achievement}%
                          </span>
                        ) : t.status === 'missed' ? (
                          <span className="font-semibold text-red-600">Missed</span>
                        ) : (
                          <span>Upcoming</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedDeptDetail(null)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
