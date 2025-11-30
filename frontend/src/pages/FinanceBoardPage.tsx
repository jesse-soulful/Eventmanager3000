import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { financeApi } from '../lib/api';
import type { FinanceSummary, FinanceLineItem } from '@event-management/shared';
import { MODULE_COLORS } from '@event-management/shared';
import { format } from 'date-fns';
import { formatCurrency } from '../lib/utils';

export function FinanceBoardPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [lineItems, setLineItems] = useState<FinanceLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary');

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const loadData = async () => {
    if (!eventId) return;
    try {
      const [summaryRes, itemsRes] = await Promise.all([
        financeApi.getSummary(eventId),
        financeApi.getLineItems(eventId),
      ]);
      setSummary(summaryRes.data);
      setLineItems(itemsRes.data);
    } catch (error) {
      console.error('Failed to load finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading finance data...</div>;
  }

  if (!summary) {
    return <div className="text-center py-12">Finance data not found</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          to={`/events/${eventId}`}
          className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Event
        </Link>
        <h1 className="text-4xl font-bold gradient-text mb-2">Finance Board</h1>
        <p className="text-gray-600 text-lg">Financial overview and breakdown</p>
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
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Total Budget</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">
                    ${summary.totalBudget.toFixed(2)}
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
                  <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">Total Spent</p>
                  <p className="text-3xl font-bold text-red-900 mt-2">
                    {formatCurrency(summary.totalSpent)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shadow-lg">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">Committed</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-2">
                    {formatCurrency(summary.totalCommitted)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className={`card bg-gradient-to-br ${
              summary.remaining >= 0 
                ? 'from-green-50 to-green-100 border-green-200' 
                : 'from-red-50 to-red-100 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold uppercase tracking-wide ${
                    summary.remaining >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>Remaining</p>
                  <p className={`text-3xl font-bold mt-2 ${
                    summary.remaining >= 0 ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {formatCurrency(summary.remaining)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                  summary.remaining >= 0 ? 'bg-green-500' : 'bg-red-500'
                }`}>
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Spent</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Committed</th>
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
                        {formatCurrency(module.budget)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600">
                        {formatCurrency(module.spent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-yellow-600">
                        {formatCurrency(module.committed)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                        module.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(module.remaining)}
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
                    <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(cat.amount)}</p>
                    <p className="text-sm text-gray-500 mt-1">{cat.lineItemCount} items</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Line Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: MODULE_COLORS[item.moduleType] }}
                        />
                        <span className="text-sm text-gray-900">{item.moduleName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.lineItemName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.categoryName || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.statusName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatCurrency(item.totalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(item.date), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

