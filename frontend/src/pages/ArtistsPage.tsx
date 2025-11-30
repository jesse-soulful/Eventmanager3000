import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, ArrowLeft, ChevronDown, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { modulesApi, lineItemsApi, statusesApi, categoriesApi, tagsApi, subLineItemTypesApi } from '../lib/api';
import type { LineItem, Status, Category, Tag, SubLineItemType, ModuleType } from '@event-management/shared';
import { ModuleType as ModuleTypeEnum } from '@event-management/shared';
import { ArtistLineItemModal } from '../components/ArtistLineItemModal';
import { SubLineItemModal } from '../components/SubLineItemModal';
import { StatusDropdown } from '../components/StatusDropdown';
import { InlineAmountInput } from '../components/InlineAmountInput';

export function ArtistsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [mainStatuses, setMainStatuses] = useState<Status[]>([]);
  const [subStatuses, setSubStatuses] = useState<Status[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [subLineItemTypes, setSubLineItemTypes] = useState<SubLineItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubLineItemModal, setShowSubLineItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [parentItemId, setParentItemId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const moduleType: ModuleType = ModuleTypeEnum.ARTISTS;

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const loadData = async () => {
    if (!eventId) return;
    try {
      const [itemsRes, mainStatusesRes, subStatusesRes, categoriesRes, tagsRes, typesRes] = await Promise.all([
        modulesApi.getLineItems(eventId, moduleType),
        statusesApi.getByModule(moduleType, 'main'),
        statusesApi.getByModule(moduleType, 'sub'),
        categoriesApi.getByModule(moduleType),
        tagsApi.getByModule(moduleType),
        subLineItemTypesApi.getByModule(moduleType),
      ]);
      setLineItems(itemsRes.data);
      setMainStatuses(mainStatusesRes.data);
      setSubStatuses(subStatusesRes.data);
      setCategories(categoriesRes.data);
      setTags(tagsRes.data);
      setSubLineItemTypes(typesRes.data);
      console.log('🔵 ArtistsPage loaded data:', {
        mainStatuses: mainStatusesRes.data.length,
        subStatuses: subStatusesRes.data.length,
        categories: categoriesRes.data.length,
        tags: tagsRes.data.length,
        subLineItemTypes: typesRes.data.length,
        subLineItemTypesData: typesRes.data,
        mainStatusesData: mainStatusesRes.data,
      });
    } catch (error: any) {
      console.error('Failed to load data:', error);
      if (error.response) {
        console.error('API Error:', error.response.status, error.response.data);
      }
      // Set empty array on error to prevent undefined issues
      setSubLineItemTypes([]);
    } finally {
      setLoading(false);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this line item?')) return;
    try {
      await lineItemsApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete line item:', error);
    }
  };

  const handleAddSubLineItem = (parentId: string, type?: SubLineItemType) => {
    setParentItemId(parentId);
    setEditingItem(type ? {
      id: '',
      moduleType: 'ARTISTS',
      eventId: eventId!,
      name: type.name,
      description: type.description,
      statusId: subStatuses.find(s => s.isDefault)?.id || subStatuses[0]?.id || '',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LineItem : null);
    setShowSubLineItemModal(true);
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
      throw error;
    }
  };

  const handleActualCostChange = async (itemId: string, actualCost: number | null) => {
    try {
      await lineItemsApi.update(itemId, { actualCost: actualCost || undefined });
      loadData();
    } catch (error) {
      console.error('Failed to update actual cost:', error);
      throw error;
    }
  };

  const formatCurrency = (amount?: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Artists</h1>
            <p className="text-gray-600 text-lg">Manage artists and their advancing costs</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Artist
          </button>
        </div>
      </div>

      {/* Artists List */}
      {lineItems.length === 0 ? (
        <div className="card text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 mb-6">
            <Plus className="w-10 h-10 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No artists yet</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first artist</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            Add First Artist
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {lineItems.map((artist) => {
            const isExpanded = expandedItems.has(artist.id);
            const subItems = artist.subLineItems || [];
            const plannedTotal = artist.plannedCost || 0;
            const actualTotal = artist.actualCost || 0;
            const variance = actualTotal - plannedTotal;

            return (
              <div key={artist.id} className="card">
                {/* Artist Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => toggleExpand(artist.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                      <h3 className="text-xl font-bold text-gray-900">
                        {(artist.metadata as any)?.artistName || artist.name}
                      </h3>
                      <StatusDropdown
                        statuses={mainStatuses}
                        currentStatus={artist.status || null}
                        onStatusChange={(statusId) => handleStatusChange(artist.id, statusId)}
                        size="sm"
                      />
                    </div>
                    {artist.description && (
                      <p className="text-gray-600 ml-8 mb-3">{artist.description}</p>
                    )}
                    
                    {/* Cost Summary */}
                    <div className="ml-8 grid grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Planned Cost</p>
                        <InlineAmountInput
                          value={plannedTotal}
                          onSave={(value) => handlePlannedCostChange(artist.id, value)}
                          color="blue"
                          className="text-lg"
                        />
                        {subItems.length > 0 && (() => {
                          const subItemsPlannedTotal = subItems.reduce((sum, item) => sum + (item.plannedCost || 0), 0);
                          const difference = plannedTotal - subItemsPlannedTotal;
                          return (
                            <div className="mt-1">
                              <p className="text-xs text-gray-500">
                                Sub-items: {formatCurrency(subItemsPlannedTotal)}
                              </p>
                              <p className={`text-xs font-medium ${
                                difference > 0 
                                  ? 'text-green-600' 
                                  : difference < 0 
                                  ? 'text-red-600' 
                                  : 'text-gray-600'
                              }`}>
                                {difference > 0 ? '+' : ''}{formatCurrency(difference)} remaining
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Actual Cost</p>
                        <InlineAmountInput
                          value={actualTotal}
                          onSave={(value) => handleActualCostChange(artist.id, value)}
                          color="green"
                          className="text-lg"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Variance</p>
                        <p className={`text-lg font-semibold ${variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(variance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Sub-items</p>
                        <p className="text-lg font-semibold text-gray-900">{subItems.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingItem(artist);
                        setShowCreateModal(true);
                      }}
                      className="btn btn-secondary text-sm"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(artist.id)}
                      className="btn btn-danger text-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Sub-line Items */}
                {isExpanded && (
                  <div className="ml-8 mt-4 border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-700">Sub-line Items</h4>
                      <div className="flex gap-2">
                        {subLineItemTypes.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => handleAddSubLineItem(artist.id, type)}
                            className="btn btn-secondary text-xs"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            {type.name}
                          </button>
                        ))}
                        <button
                          onClick={() => handleAddSubLineItem(artist.id)}
                          className="btn btn-secondary text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Ad-hoc Item
                        </button>
                      </div>
                    </div>

                    {subItems.length === 0 ? (
                      <p className="text-gray-500 text-sm py-4">No sub-line items yet. Add one to get started.</p>
                    ) : (
                      <div className="space-y-2">
                        {subItems.map((subItem) => (
                          <div
                            key={subItem.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">{subItem.name}</span>
                                <StatusDropdown
                                  statuses={subStatuses}
                                  currentStatus={subItem.status || null}
                                  onStatusChange={(statusId) => handleStatusChange(subItem.id, statusId)}
                                  size="sm"
                                />
                              </div>
                              {subItem.description && (
                                <p className="text-sm text-gray-600">{subItem.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-sm text-gray-500 mb-1">Planned</p>
                                <InlineAmountInput
                                  value={subItem.plannedCost}
                                  onSave={(value) => handlePlannedCostChange(subItem.id, value)}
                                  color="blue"
                                />
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500 mb-1">Actual</p>
                                <InlineAmountInput
                                  value={subItem.actualCost}
                                  onSave={(value) => handleActualCostChange(subItem.id, value)}
                                  color="green"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingItem(subItem);
                                    setParentItemId(artist.id);
                                    setShowSubLineItemModal(true);
                                  }}
                                  className="text-primary-600 hover:text-primary-800"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(subItem.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Artist Modal */}
      {showCreateModal && (
        <ArtistLineItemModal
          key={`modal-${subLineItemTypes.length}-${showCreateModal}`} // Force re-render when subLineItemTypes changes
          eventId={eventId!}
          moduleType={moduleType}
          lineItem={editingItem}
          statuses={mainStatuses}
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

      {/* Create/Edit Sub-line Item Modal */}
      {showSubLineItemModal && parentItemId && (
        <SubLineItemModal
          eventId={eventId!}
          moduleType={moduleType}
          parentLineItemId={parentItemId}
          lineItem={editingItem}
          statuses={subStatuses}
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
    </div>
  );
}

