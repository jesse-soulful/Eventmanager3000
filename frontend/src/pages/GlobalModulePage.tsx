import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Plus, ArrowLeft, Tag as TagIcon, Filter } from 'lucide-react';
import { modulesApi, lineItemsApi, statusesApi, categoriesApi, tagsApi, eventsApi } from '../lib/api';
import type { LineItem, Status, Category, Tag, ModuleType, Event } from '@event-management/shared';
import { MODULE_DISPLAY_NAMES, MODULE_COLORS, GLOBAL_MODULES } from '@event-management/shared';
import { LineItemModal } from '../components/LineItemModal';
import { StatusDropdown } from '../components/StatusDropdown';
import { InlineAmountInput } from '../components/InlineAmountInput';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';

export function GlobalModulePage() {
  const location = useLocation();
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);

  // Extract moduleType from URL pathname
  // Routes: /vendors-suppliers, /materials-stock
  const pathname = location.pathname;
  const pathnameWithoutSlash = pathname.replace(/^\//, ''); // Remove leading slash
  
  // Map pathname to ModuleType enum
  const moduleTypeEnum: ModuleType | undefined = GLOBAL_MODULES.find(
    (mt) => mt.toLowerCase().replace(/_/g, '-') === pathnameWithoutSlash
  ) as ModuleType | undefined;

  useEffect(() => {
    console.log('GlobalModulePage: pathname:', pathname, 'pathnameWithoutSlash:', pathnameWithoutSlash, '-> moduleTypeEnum:', moduleTypeEnum);
    if (moduleTypeEnum) {
      loadEvents();
      loadData();
    } else {
      console.warn('GlobalModulePage: Invalid or missing moduleType from pathname:', pathname);
      setLoading(false);
    }
  }, [pathname, pathnameWithoutSlash, moduleTypeEnum, selectedEventId]);

  const loadEvents = async () => {
    try {
      const response = await eventsApi.getAll();
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to load events:', error);
      setEvents([]); // Set empty array on error
    }
  };

  const loadData = async () => {
    if (!moduleTypeEnum) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [itemsRes, statusesRes, categoriesRes, tagsRes] = await Promise.all([
        modulesApi.getGlobalModuleLineItems(moduleTypeEnum, selectedEventId || undefined),
        statusesApi.getByModule(moduleTypeEnum, 'main'),
        categoriesApi.getByModule(moduleTypeEnum),
        tagsApi.getByModule(moduleTypeEnum),
      ]);
      setLineItems(itemsRes.data || []);
      setStatuses(statusesRes.data || []);
      setCategories(categoriesRes.data || []);
      setTags(tagsRes.data || []);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      // Set empty arrays on error to prevent infinite loading
      setLineItems([]);
      setStatuses([]);
      setCategories([]);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this line item?')) return;
    try {
      await lineItemsApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete line item:', error);
    }
  };

  const handleStatusChange = async (itemId: string, statusId: string | null) => {
    try {
      await lineItemsApi.update(itemId, { statusId: statusId || undefined });
      loadData();
    } catch (error) {
      console.error('Failed to update status:', error);
      throw error;
    }
  };

  const handlePlannedCostChange = async (itemId: string, plannedCost: number | null) => {
    try {
      await lineItemsApi.update(itemId, { plannedCost: plannedCost || undefined });
      loadData();
    } catch (error) {
      console.error('Failed to update planned cost:', error);
    }
  };

  const handleActualCostChange = async (itemId: string, actualCost: number | null) => {
    try {
      await lineItemsApi.update(itemId, { actualCost: actualCost || undefined });
      loadData();
    } catch (error) {
      console.error('Failed to update actual cost:', error);
    }
  };

  if (!moduleTypeEnum) {
    return (
      <div className="card text-center py-12">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Invalid Module</h2>
        <p className="text-gray-400 mb-4">Could not determine module type from URL: {pathname}</p>
        <Link to="/events" className="btn btn-primary">
          Back to Events
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="page-title">
              {MODULE_DISPLAY_NAMES[moduleTypeEnum]}
            </h1>
            <p className="page-subtitle">Manage suppliers, materials, and invoices across all events</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>
      </div>

      {/* Event Filter */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <label className="text-sm font-semibold text-gray-300">Filter by Event:</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-3 py-2 border border-gray-600 rounded-lg text-sm bg-gray-800 text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All Events</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.name} ({format(new Date(event.startDate), 'MMM d, yyyy')})
              </option>
            ))}
          </select>
          {selectedEventId && (
            <button
              onClick={() => setSelectedEventId('')}
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Line Items Table */}
      {lineItems.length === 0 ? (
        <div className="card text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 mb-6 border border-primary-500/30">
            <Plus className="w-10 h-10 text-primary-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-200 mb-2">No items yet</h3>
          <p className="text-gray-400 mb-6">Get started by adding your first item</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            Add First Item
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Planned Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Actual Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                {lineItems.map((item) => {
                  const event = (item as any).event;
                  return (
                    <tr key={item.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-100">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-400 mt-1">{item.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {event ? (
                          <Link
                            to={`/events/${event.id}`}
                            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                          >
                            {event.name}
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusDropdown
                          statuses={statuses}
                          currentStatus={item.status || null}
                          onStatusChange={(statusId) => handleStatusChange(item.id, statusId)}
                          size="sm"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {item.category?.name || <span className="text-gray-500">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag: Tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-700/50 text-gray-200 border border-gray-600/50"
                            >
                              <TagIcon className="w-3 h-3 mr-1" />
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <InlineAmountInput
                          value={item.plannedCost}
                          onSave={(value) => handlePlannedCostChange(item.id, value)}
                          color="blue"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <InlineAmountInput
                          value={item.actualCost}
                          onSave={(value) => handleActualCostChange(item.id, value)}
                          color="green"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {item.quantity ?? <span className="text-gray-500">-</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {item.unitPrice ? formatCurrency(item.unitPrice) : <span className="text-gray-500">-</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-100">
                        {item.totalPrice ? formatCurrency(item.totalPrice) : <span className="text-gray-500">-</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-primary-400 hover:text-primary-300 mr-4 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingItem) && (
        <LineItemModal
          eventId={editingItem?.eventId || selectedEventId || events[0]?.id || ''}
          moduleType={moduleTypeEnum}
          lineItem={editingItem}
          statuses={statuses}
          categories={categories}
          tags={tags}
          onClose={() => {
            setShowCreateModal(false);
            setEditingItem(null);
          }}
          onSave={() => {
            setShowCreateModal(false);
            setEditingItem(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

