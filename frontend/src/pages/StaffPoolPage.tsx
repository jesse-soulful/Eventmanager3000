import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowLeft, Edit2, Trash2, Mail, Phone, User, Calendar, DollarSign, MessageSquare } from 'lucide-react';
import { modulesApi, lineItemsApi, statusesApi, categoriesApi, tagsApi, eventsApi, subLineItemTypesApi } from '../lib/api';
import type { LineItem, Status, Category, Tag, Event, SubLineItemType, ModuleType } from '@event-management/shared';
import { ModuleType as ModuleTypeEnum, StaffRole, STAFF_ROLE_DISPLAY_NAMES, MODULE_DISPLAY_NAMES } from '@event-management/shared';
import { StaffLineItemModal } from '../components/StaffLineItemModal';
import { SubLineItemModal } from '../components/SubLineItemModal';
import { StatusDropdown } from '../components/StatusDropdown';
import { CommentsModal } from '../components/CommentsModal';
import { FileAttachmentsButton } from '../components/FileAttachmentsButton';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';

export function StaffPoolPage() {
  const [staffMembers, setStaffMembers] = useState<LineItem[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [subLineItemTypes, setSubLineItemTypes] = useState<SubLineItemType[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubLineItemModal, setShowSubLineItemModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentsLineItemId, setCommentsLineItemId] = useState<string | null>(null);
  const [commentsLineItemName, setCommentsLineItemName] = useState<string>('');
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [parentItemId, setParentItemId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadEvents();
    loadData();
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const response = await eventsApi.getAll();
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to load events:', error);
      setEvents([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsRes, statusesRes, categoriesRes, tagsRes, subLineItemTypesRes] = await Promise.all([
        modulesApi.getGlobalModuleLineItems(ModuleTypeEnum.STAFF_POOL, selectedEventId || undefined),
        statusesApi.getByModule(ModuleTypeEnum.STAFF_POOL, 'main'),
        categoriesApi.getByModule(ModuleTypeEnum.STAFF_POOL),
        tagsApi.getByModule(ModuleTypeEnum.STAFF_POOL),
        subLineItemTypesApi.getByModule(ModuleTypeEnum.STAFF_POOL),
      ]);
      setStaffMembers(itemsRes.data || []);
      setStatuses(statusesRes.data || []);
      setCategories(categoriesRes.data || []);
      setTags(tagsRes.data || []);
      setSubLineItemTypes(subLineItemTypesRes.data || []);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      setStaffMembers([]);
      setStatuses([]);
      setCategories([]);
      setTags([]);
      setSubLineItemTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await lineItemsApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete staff member:', error);
    }
  };

  const handleStatusChange = async (itemId: string, statusId: string | null) => {
    try {
      await lineItemsApi.update(itemId, { statusId: statusId || undefined });
      loadData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const toggleExpand = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading staff pool...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="page-title">Staff Pool</h1>
            <p className="page-subtitle">Manage staff contacts, roles, and event assignments</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Event Filter */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
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

      {/* Staff Members List */}
      {staffMembers.length === 0 ? (
        <div className="card text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 mb-6 border border-primary-500/30">
            <Plus className="w-10 h-10 text-primary-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-200 mb-2">No staff members yet</h3>
          <p className="text-gray-400 mb-6">Get started by adding your first staff member</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            Add First Staff Member
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {staffMembers.map((staff) => {
            const isExpanded = expandedItems.has(staff.id);
            const metadata = (staff.metadata as Record<string, any>) || {};
            const email = metadata.email || '';
            const phone = metadata.phone || '';
            const canWorkAs = metadata.canWorkAs || [];
            const subItems = staff.subLineItems || [];
            const event = (staff as any).event;

            return (
              <div key={staff.id} className="line-item-card">
                {/* Staff Header */}
                <div className="line-item-header">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-100">{staff.name}</h3>
                      <StatusDropdown
                        statuses={statuses}
                        currentStatus={staff.status || null}
                        onStatusChange={(statusId) => handleStatusChange(staff.id, statusId)}
                        size="sm"
                      />
                    </div>
                    
                    {/* Contact Information */}
                    <div className="flex flex-wrap gap-4 mb-3">
                      {email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-300">{email}</span>
                        </div>
                      )}
                      {phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-300">{phone}</span>
                        </div>
                      )}
                      {event && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <Link
                            to={`/events/${event.id}`}
                            className="text-primary-400 hover:text-primary-300 transition-colors"
                          >
                            {event.name}
                          </Link>
                        </div>
                      )}
                    </div>
                    
                    {/* Can Work As Roles */}
                    {canWorkAs.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Can work as</div>
                        <div className="flex flex-wrap gap-2">
                          {canWorkAs.map((role: StaffRole) => (
                            <span
                              key={role}
                              className="px-2.5 py-1 bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full text-xs font-semibold"
                            >
                              {STAFF_ROLE_DISPLAY_NAMES[role]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="line-item-actions">
                    <button
                      onClick={() => {
                        setEditingItem(staff);
                        setShowCreateModal(true);
                      }}
                      className="action-btn-primary"
                      title="Edit staff member"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(staff.id)}
                      className="action-btn-danger"
                      title="Delete staff member"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Event History Section */}
                <div className="expandable-section">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Event History</h4>
                    <button
                      onClick={() => {
                        setParentItemId(staff.id);
                        setEditingItem(null);
                        setShowSubLineItemModal(true);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1.5 border border-gray-700 hover:border-gray-600"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Assignment
                    </button>
                  </div>
                  {subItems.length === 0 ? (
                    <div className="empty-state-card">
                      <p className="text-sm">No event assignments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {subItems.map((subItem) => {
                        const subEvent = (subItem as any).event;
                        const subMetadata = typeof subItem.metadata === 'string' 
                          ? JSON.parse(subItem.metadata) 
                          : (subItem.metadata || {});
                        const moduleType = subMetadata.moduleType;
                        const role = subMetadata.role;
                        const moduleDisplayName = moduleType 
                          ? MODULE_DISPLAY_NAMES[moduleType as ModuleType] 
                          : null;
                        
                        return (
                          <div key={subItem.id} className="sub-item-card">
                            <div className="sub-item-content">
                              <div className="sub-item-header">
                                <div className="sub-item-name-section">
                                  <span className="font-semibold text-gray-100">{subItem.name}</span>
                                  {subEvent && (
                                    <>
                                      <span className="text-gray-500">•</span>
                                      <Link
                                        to={`/events/${subEvent.id}`}
                                        className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                                      >
                                        {subEvent.name}
                                      </Link>
                                    </>
                                  )}
                                  {moduleDisplayName && (
                                    <>
                                      <span className="text-gray-500">•</span>
                                      <span className="text-xs px-2 py-0.5 bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full font-semibold">
                                        {moduleDisplayName}
                                      </span>
                                    </>
                                  )}
                                  {role && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-200 border border-gray-600 rounded-full font-medium">
                                      {role}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {subItem.description && (
                                <p className="text-sm text-gray-400 mb-3">{subItem.description}</p>
                              )}
                              <div className="flex flex-wrap gap-4 text-xs">
                                {subItem.plannedCost && (
                                  <div className="flex items-center gap-1.5">
                                    <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-gray-400">Planned:</span>
                                    <span className="text-blue-400 font-semibold">{formatCurrency(subItem.plannedCost)}</span>
                                  </div>
                                )}
                                {subItem.actualCost && (
                                  <div className="flex items-center gap-1.5">
                                    <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-gray-400">Actual:</span>
                                    <span className="text-emerald-400 font-semibold">{formatCurrency(subItem.actualCost)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="line-item-actions">
                              <FileAttachmentsButton lineItemId={subItem.id} onUpdate={loadData} />
                              <button
                                onClick={() => {
                                  setCommentsLineItemId(subItem.id);
                                  setCommentsLineItemName(subItem.name);
                                  setShowCommentsModal(true);
                                }}
                                className="action-btn-primary"
                                title="View comments"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingItem(subItem);
                                  setParentItemId(staff.id);
                                  setShowSubLineItemModal(true);
                                }}
                                className="action-btn-primary"
                                title="Edit assignment"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Staff Modal */}
      {(showCreateModal || editingItem) && (
        <StaffLineItemModal
          moduleType={ModuleTypeEnum.STAFF_POOL}
          eventId={editingItem?.eventId || selectedEventId || events[0]?.id || undefined}
          lineItem={editingItem}
          statuses={statuses}
          categories={categories}
          tags={tags}
          subLineItemTypes={subLineItemTypes}
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

      {/* Sub-line Item Modal (Event History) */}
      {showSubLineItemModal && parentItemId && (
        <SubLineItemModal
          eventId={(() => {
            const parentStaff = staffMembers.find(s => s.id === parentItemId);
            // For event history sub-items, use the event from the sub-item if editing, or allow selection
            if (editingItem && editingItem.eventId) {
              return editingItem.eventId;
            }
            return parentStaff?.eventId || selectedEventId || events[0]?.id || '';
          })()}
          moduleType={ModuleTypeEnum.STAFF_POOL}
          parentLineItemId={parentItemId}
          lineItem={editingItem}
          statuses={statuses}
          categories={categories}
          tags={tags}
          onClose={() => {
            setShowSubLineItemModal(false);
            setEditingItem(null);
            setParentItemId(null);
          }}
          onSave={() => {
            setShowSubLineItemModal(false);
            setEditingItem(null);
            setParentItemId(null);
            loadData();
          }}
        />
      )}

      {/* Comments Modal */}
      {showCommentsModal && commentsLineItemId && (
        <CommentsModal
          lineItemId={commentsLineItemId}
          lineItemName={commentsLineItemName}
          onClose={() => {
            setShowCommentsModal(false);
            setCommentsLineItemId(null);
            setCommentsLineItemName('');
          }}
          onCommentChange={() => {
            // Reload if needed
          }}
        />
      )}
    </div>
  );
}

