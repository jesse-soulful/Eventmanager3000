import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Filter, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { financeApi, eventsApi } from '../lib/api';
import type { FinanceSummary, FinanceLineItem, FinanceFilters, Event, ModuleType } from '@event-management/shared';
import { MODULE_COLORS, MODULE_DISPLAY_NAMES, ModuleType as ModuleTypeEnum } from '@event-management/shared';
import { format } from 'date-fns';
import { formatCurrency } from '../lib/utils';

type GroupByOption = 'event' | 'module' | 'category' | 'status' | 'lineItem' | null;

interface GroupedItem {
  key: string;
  label: string;
  items: FinanceLineItem[];
  totals: {
    estimated: number;
    actual: number;
    variance: number;
  };
  children?: Map<string, GroupedItem>;
}

export function FinanceBoardPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [lineItems, setLineItems] = useState<FinanceLineItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary');

  // Filters
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>(() => {
    const ids = searchParams.get('eventIds');
    return ids ? ids.split(',') : [];
  });
  const [startDate, setStartDate] = useState<string>(() => searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState<string>(() => searchParams.get('endDate') || '');
  const [selectedModules, setSelectedModules] = useState<ModuleType[]>(() => {
    const modules = searchParams.get('moduleTypes');
    return modules ? modules.split(',') as ModuleType[] : [];
  });
  const [includeSubItems, setIncludeSubItems] = useState<boolean>(() => {
    return searchParams.get('includeSubItems') === 'true';
  });
  
  // Grouping
  const [groupBy, setGroupBy] = useState<GroupByOption[]>(() => {
    const groups = searchParams.get('groupBy');
    return groups ? groups.split(',') as GroupByOption[] : [];
  });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Load events for filter dropdown
  useEffect(() => {
    eventsApi.getAll().then(res => setEvents(res.data)).catch(console.error);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const filters: FinanceFilters = {
        eventIds: eventId ? [eventId] : (selectedEventIds.length > 0 ? selectedEventIds : undefined),
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        moduleTypes: selectedModules.length > 0 ? selectedModules : undefined,
        includeSubItems,
      };

      if (eventId) {
        // Event-scoped view (backward compatibility)
        const [summaryRes, itemsRes] = await Promise.all([
          financeApi.getSummary(eventId),
          financeApi.getLineItems(eventId),
        ]);
        setSummary(summaryRes.data);
        setLineItems(itemsRes.data);
      } else {
        // Cross-event view
        const [summaryRes, itemsRes] = await Promise.all([
          financeApi.getCrossEventSummary(filters),
          financeApi.getCrossEventLineItems(filters),
        ]);
        setSummary(summaryRes.data);
        setLineItems(itemsRes.data);
      }
    } catch (error) {
      console.error('Failed to load finance data:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId, selectedEventIds, startDate, endDate, selectedModules, includeSubItems]);

  // Load finance data
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadData]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedEventIds.length > 0) params.set('eventIds', selectedEventIds.join(','));
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (selectedModules.length > 0) params.set('moduleTypes', selectedModules.join(','));
    if (includeSubItems) params.set('includeSubItems', 'true');
    if (groupBy.length > 0) params.set('groupBy', groupBy.join(','));
    setSearchParams(params, { replace: true });
  }, [selectedEventIds, startDate, endDate, selectedModules, includeSubItems, groupBy, setSearchParams]);

  // Group items based on groupBy settings
  const groupedItems = useMemo(() => {
    if (groupBy.length === 0) {
      return null;
    }

    const groups = new Map<string, GroupedItem>();

    for (const item of lineItems) {
      let currentGroups = groups;
      let groupKey = '';

      for (let i = 0; i < groupBy.length; i++) {
        const groupOption = groupBy[i];
        if (!groupOption) continue;

        let key: string;
        let label: string;

        switch (groupOption) {
          case 'event':
            key = item.eventId;
            label = item.eventName || item.eventId;
            break;
          case 'module':
            key = item.moduleType;
            label = item.moduleName;
            break;
          case 'category':
            key = item.categoryName || 'uncategorized';
            label = item.categoryName || 'Uncategorized';
            break;
          case 'status':
            key = item.statusName || 'nostatus';
            label = item.statusName || 'No Status';
            break;
          case 'lineItem':
            key = item.id;
            label = item.lineItemName;
            break;
          default:
            continue;
        }

        groupKey += (groupKey ? '|' : '') + `${groupOption}:${key}`;

        if (!currentGroups.has(key)) {
          currentGroups.set(key, {
            key,
            label,
            items: [],
            totals: { estimated: 0, actual: 0, variance: 0 },
            children: i < groupBy.length - 1 ? new Map() : undefined,
          });
        }

        const group = currentGroups.get(key)!;
        
        if (i === groupBy.length - 1) {
          // Last level - add item
          group.items.push(item);
          const estimated = item.plannedCost ?? item.totalPrice ?? 0;
          const actual = item.actualCost ?? 0;
          group.totals.estimated += estimated;
          group.totals.actual += actual;
          group.totals.variance += (actual - estimated);
        } else {
          // Intermediate level - create nested groups
          if (!group.children) {
            group.children = new Map();
          }
          currentGroups = group.children;
        }
      }
    }

    // Calculate totals for parent groups
    const calculateParentTotals = (group: GroupedItem) => {
      if (group.children) {
        for (const child of group.children.values()) {
          calculateParentTotals(child);
          group.totals.estimated += child.totals.estimated;
          group.totals.actual += child.totals.actual;
          group.totals.variance += child.totals.variance;
        }
      }
    };

    for (const group of groups.values()) {
      calculateParentTotals(group);
    }

    return groups;
  }, [lineItems, groupBy]);

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const renderGroupedItems = (groups: Map<string, GroupedItem>, level: number = 0): JSX.Element[] => {
    const elements: JSX.Element[] = [];
    const sortedGroups = Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));
    const totalCols = eventId ? 8 : 9; // Module, Line Item, [Event], Category, Status, Estimated, Actual, Variance, Date

    for (const group of sortedGroups) {
      const groupKey = group.key;
      const isExpanded = expandedGroups.has(groupKey);
      const hasChildren = group.children && group.children.size > 0;

      elements.push(
        <tr key={groupKey} className="bg-gray-50">
          <td colSpan={hasChildren ? totalCols : 1} className="px-6 py-3">
            <div className="flex items-center" style={{ paddingLeft: `${level * 1.5}rem` }}>
              {hasChildren && (
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className="mr-2 p-1 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}
              <span className="font-semibold text-gray-900">{group.label}</span>
              <span className="ml-2 text-sm text-gray-500">({group.items.length} items)</span>
            </div>
          </td>
          {!hasChildren && (
            <>
              {!eventId && <td className="px-6 py-3 text-sm text-gray-500">-</td>}
              <td className="px-6 py-3 text-sm text-gray-500">-</td>
              <td className="px-6 py-3 text-sm text-gray-500">-</td>
              <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                {formatCurrency(group.totals.estimated)}
              </td>
              <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                {formatCurrency(group.totals.actual)}
              </td>
              <td className={`px-6 py-3 text-right text-sm font-medium ${
                group.totals.variance >= 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatCurrency(group.totals.variance)}
              </td>
              <td className="px-6 py-3 text-sm text-gray-500">-</td>
            </>
          )}
        </tr>
      );

      if (hasChildren && isExpanded && group.children) {
        elements.push(...renderGroupedItems(group.children, level + 1));
      }

      if (!hasChildren && isExpanded) {
        // Show individual items in this group
        for (const item of group.items) {
          elements.push(renderLineItemRow(item));
        }
      }
    }

    return elements;
  };

  const renderLineItemRow = (item: FinanceLineItem) => {
    const estimated = item.plannedCost ?? item.totalPrice ?? 0;
    const actual = item.actualCost ?? 0;
    const variance = actual - estimated;

    return (
      <tr key={item.id} className={item.isSubLineItem ? 'bg-gray-50' : ''}>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            {item.isSubLineItem && <span className="mr-2 text-gray-400">└─</span>}
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: MODULE_COLORS[item.moduleType] }}
            />
            <span className="text-sm text-gray-900">{item.moduleName}</span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {item.isSubLineItem && item.parentLineItemName && (
            <span className="text-gray-400 mr-1">{item.parentLineItemName} → </span>
          )}
          {item.lineItemName}
        </td>
        {!eventId && (
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {item.eventName || item.eventId}
          </td>
        )}
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {item.categoryName || '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {item.statusName || '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
          {formatCurrency(estimated)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
          {formatCurrency(actual)}
        </td>
        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
          variance >= 0 ? 'text-red-600' : 'text-green-600'
        }`}>
          {formatCurrency(variance)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {format(new Date(item.date), 'MMM d, yyyy')}
        </td>
      </tr>
    );
  };

  if (loading) {
    return <div className="text-center py-12">Loading finance data...</div>;
  }

  if (!summary) {
    return <div className="text-center py-12">Finance data not found</div>;
  }

  const totalEstimated = summary.totalEstimated ?? summary.totalBudget ?? 0;
  const totalActual = summary.totalActual ?? 0;
  const variance = summary.variance ?? (totalActual - totalEstimated);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        {eventId && (
        <Link
          to={`/events/${eventId}`}
          className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Event
        </Link>
        )}
        <div className="flex items-center justify-between">
          <div>
        <h1 className="text-4xl font-bold gradient-text mb-2">Finance Board</h1>
            <p className="text-gray-600 text-lg">
              {eventId ? 'Financial overview and breakdown' : 'Cross-event financial overview'}
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </h2>
          <button
            onClick={() => {
              setSelectedEventIds([]);
              setStartDate('');
              setEndDate('');
              setSelectedModules([]);
              setIncludeSubItems(false);
            }}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Event Filter */}
          {!eventId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Events</label>
              <select
                multiple
                value={selectedEventIds}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedEventIds(values);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                size={3}
              >
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({format(event.startDate, 'MMM d, yyyy')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* Module Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Modules</label>
            <select
              multiple
              value={selectedModules}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value) as ModuleType[];
                setSelectedModules(values);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              size={3}
            >
              {Object.values(ModuleTypeEnum).map(moduleType => (
                <option key={moduleType} value={moduleType}>
                  {MODULE_DISPLAY_NAMES[moduleType]}
                </option>
              ))}
            </select>
          </div>

          {/* Include Sub-Items Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeSubItems"
              checked={includeSubItems}
              onChange={(e) => setIncludeSubItems(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="includeSubItems" className="ml-2 text-sm font-medium text-gray-700">
              Include Sub-Line Items
            </label>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'summary'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Line Items
          </button>
        </nav>
      </div>

      {activeTab === 'summary' ? (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Estimated</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">
                    {formatCurrency(totalEstimated)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">Actual</p>
                  <p className="text-3xl font-bold text-red-900 mt-2">
                    {formatCurrency(totalActual)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shadow-lg">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className={`card bg-gradient-to-br ${
              variance >= 0 
                ? 'from-yellow-50 to-yellow-100 border-yellow-200' 
                : 'from-green-50 to-green-100 border-green-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold uppercase tracking-wide ${
                    variance >= 0 ? 'text-yellow-700' : 'text-green-700'
                  }`}>Variance</p>
                  <p className={`text-3xl font-bold mt-2 ${
                    variance >= 0 ? 'text-yellow-900' : 'text-green-900'
                  }`}>
                    {formatCurrency(variance)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                  variance >= 0 ? 'bg-yellow-500' : 'bg-green-500'
                }`}>
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Remaining</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatCurrency(totalEstimated - totalActual)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gray-500 flex items-center justify-center shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* By Module */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">By Module</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Estimated</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Remaining</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summary.byModule.map((module) => (
                    <tr key={module.moduleType}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: MODULE_COLORS[module.moduleType] }}
                          />
                          <span className="text-sm font-medium text-gray-900">{module.moduleName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatCurrency(module.totalEstimated ?? module.budget)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatCurrency(module.totalActual ?? 0)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                        (module.variance ?? 0) >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(module.variance ?? 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {formatCurrency((module.totalEstimated ?? module.budget) - (module.totalActual ?? 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {module.lineItemCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* By Category */}
          {summary.byCategory.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">By Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.byCategory.map((cat) => (
                  <div key={cat.categoryId} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">{cat.categoryName}</h3>
                    <div className="mt-2 space-y-1">
                      <p className="text-lg font-semibold text-gray-900">
                        Est: {formatCurrency(cat.totalEstimated ?? cat.amount)}
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        Act: {formatCurrency(cat.totalActual ?? 0)}
                      </p>
                      <p className={`text-sm font-medium ${
                        (cat.variance ?? 0) >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        Var: {formatCurrency(cat.variance ?? 0)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{cat.lineItemCount} items</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By Event (cross-event only) */}
          {!eventId && summary.byEvent && summary.byEvent.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">By Event</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Range</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Estimated</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summary.byEvent.map((event) => (
                      <tr key={event.eventId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {event.eventName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(event.startDate, 'MMM d')} - {format(event.endDate, 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {formatCurrency(event.totalEstimated)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {formatCurrency(event.totalActual)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                          event.variance >= 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(event.variance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {event.lineItemCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Grouping Controls */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Group By</h2>
            <div className="flex flex-wrap gap-2">
              {(['event', 'module', 'category', 'status'] as const).map((option) => {
                if (eventId && option === 'event') return null;
                const index = groupBy.indexOf(option);
                return (
                  <button
                    key={option}
                    onClick={() => {
                      if (index >= 0) {
                        setGroupBy(groupBy.filter((_, i) => i !== index));
                      } else {
                        setGroupBy([...groupBy, option]);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      index >= 0
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                    {index >= 0 && (
                      <span className="ml-2">
                        {index + 1}
                      </span>
                    )}
                  </button>
                );
              })}
              {groupBy.length > 0 && (
                <button
                  onClick={() => setGroupBy([])}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Line Items Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Line Item</th>
                    {!eventId && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                    )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Estimated</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {groupedItems ? (
                    renderGroupedItems(groupedItems)
                  ) : (
                    lineItems.map(item => renderLineItemRow(item))
                  )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
