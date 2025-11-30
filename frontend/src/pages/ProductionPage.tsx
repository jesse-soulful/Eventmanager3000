import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, ArrowLeft, ChevronDown, ChevronRight, Edit2, Trash2, MessageSquare, DollarSign, TrendingUp, TrendingDown, X } from 'lucide-react';
import { modulesApi, lineItemsApi, statusesApi, categoriesApi, tagsApi, subLineItemTypesApi, commentsApi } from '../lib/api';
import type { LineItem, Status, Category, Tag, SubLineItemType, ModuleType } from '@event-management/shared';
import { ModuleType as ModuleTypeEnum } from '@event-management/shared';
import { LineItemModal } from '../components/LineItemModal';
import { SubLineItemModal } from '../components/SubLineItemModal';
import { CategoryModal } from '../components/CategoryModal';
import { StatusDropdown } from '../components/StatusDropdown';
import { InlineAmountInput } from '../components/InlineAmountInput';
import { CommentsModal } from '../components/CommentsModal';
import { FileAttachmentsButton } from '../components/FileAttachmentsButton';
import { formatCurrency } from '../lib/utils';

interface CategoryWithItems extends Category {
  lineItems: LineItem[];
  plannedTotal: number;
  actualTotal: number;
  variance: number;
}

export function ProductionPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allLineItems, setAllLineItems] = useState<LineItem[]>([]);
  const [mainStatuses, setMainStatuses] = useState<Status[]>([]);
  const [subStatuses, setSubStatuses] = useState<Status[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [subLineItemTypes, setSubLineItemTypes] = useState<SubLineItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);
  const [showCreateSubItemModal, setShowCreateSubItemModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentsLineItemId, setCommentsLineItemId] = useState<string | null>(null);
  const [commentsLineItemName, setCommentsLineItemName] = useState<string>('');
  const [commentCounts, setCommentCounts] = useState<Map<string, number>>(new Map());
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [editingSubItem, setEditingSubItem] = useState<LineItem | null>(null);
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);
  const [parentItemId, setParentItemId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const moduleType: ModuleType = ModuleTypeEnum.PRODUCTION;

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const loadData = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const [itemsRes, statusesRes, subStatusesRes, categoriesRes, tagsRes, subLineItemTypesRes] = await Promise.all([
        modulesApi.getLineItems(eventId, moduleType),
        statusesApi.getByModule(moduleType, 'main'),
        statusesApi.getByModule(moduleType, 'sub'),
        categoriesApi.getByModule(moduleType),
        tagsApi.getByModule(moduleType),
        subLineItemTypesApi.getByModule(moduleType),
      ]);
      
      setAllLineItems(itemsRes.data);
      setMainStatuses(statusesRes.data);
      setSubStatuses(subStatusesRes.data);
      setCategories(categoriesRes.data);
      setTags(tagsRes.data);
      setSubLineItemTypes(subLineItemTypesRes.data);

      // Load comment counts for all sub-line items
      const subLineItemIds: string[] = [];
      itemsRes.data.forEach((item: LineItem) => {
        subLineItemIds.push(item.id);
      });

      if (subLineItemIds.length > 0) {
        loadCommentCounts(subLineItemIds);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommentCounts = async (lineItemIds: string[]) => {
    try {
      const counts = new Map<string, number>();
      await Promise.all(
        lineItemIds.map(async (id) => {
          try {
            const response = await commentsApi.getByLineItem(id);
            counts.set(id, response.data.length);
          } catch (error) {
            counts.set(id, 0);
          }
        })
      );
      setCommentCounts(counts);
    } catch (error) {
      console.error('Failed to load comment counts:', error);
    }
  };

  // Group line items by category (only main items, not sub-line items)
  const categoriesWithItems: CategoryWithItems[] = categories.map(category => {
    const categoryItems = allLineItems.filter(item => 
      item.categoryId === category.id && !item.parentLineItemId // Only main items
    );
    // Calculate totals including sub-line items
    const plannedTotal = categoryItems.reduce((sum, item) => {
      const itemPlanned = item.plannedCost || 0;
      const subItemsPlanned = (item.subLineItems || []).reduce((subSum, sub) => subSum + (sub.plannedCost || 0), 0);
      return sum + itemPlanned + subItemsPlanned;
    }, 0);
    const actualTotal = categoryItems.reduce((sum, item) => {
      const itemActual = item.actualCost || 0;
      const subItemsActual = (item.subLineItems || []).reduce((subSum, sub) => subSum + (sub.actualCost || 0), 0);
      return sum + itemActual + subItemsActual;
    }, 0);
    
    return {
      ...category,
      lineItems: categoryItems,
      plannedTotal,
      actualTotal,
      variance: actualTotal - plannedTotal,
    };
  });

  // Also include uncategorized items as a special "category"
  const uncategorizedItems = allLineItems.filter(item => !item.categoryId);
  if (uncategorizedItems.length > 0) {
    const plannedTotal = uncategorizedItems.reduce((sum, item) => sum + (item.plannedCost || 0), 0);
    const actualTotal = uncategorizedItems.reduce((sum, item) => sum + (item.actualCost || 0), 0);
    categoriesWithItems.push({
      id: 'uncategorized',
      moduleType: moduleType,
      name: 'Uncategorized',
      description: null,
      color: '#9CA3AF',
      createdAt: new Date(),
      updatedAt: new Date(),
      eventId: null,
      lineItems: uncategorizedItems,
      plannedTotal,
      actualTotal,
      variance: actualTotal - plannedTotal,
    });
  }

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const toggleItemExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? All items in this category will become uncategorized.')) return;
    try {
      await categoriesApi.delete(categoryId);
      loadData();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category. Please try again.');
    }
  };

  const handleDeleteSubItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await lineItemsApi.delete(itemId);
      loadData();
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item. Please try again.');
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
            <h1 className="text-4xl font-bold gradient-text mb-2">Production</h1>
            <p className="text-gray-600 text-lg">Manage production categories and items</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingCategory(null);
                setShowCreateCategoryModal(true);
              }}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Category
            </button>
          </div>
        </div>
      </div>

      {/* Categories List */}
      {categoriesWithItems.length === 0 ? (
        <div className="card text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 mb-6">
            <Plus className="w-10 h-10 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No categories yet</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first category</p>
          <button onClick={() => setShowCreateCategoryModal(true)} className="btn btn-primary">
            Add First Category
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {categoriesWithItems.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            const subItems = category.lineItems;
            
            // Count sub-item statuses
            const subItemStatusCounts = new Map<string, { count: number; color: string }>();
            subItems.forEach((subItem) => {
              if (subItem.status) {
                const statusId = subItem.status.id;
                const status = subStatuses.find(s => s.id === statusId);
                if (status) {
                  const existing = subItemStatusCounts.get(statusId) || { count: 0, color: status.color };
                  subItemStatusCounts.set(statusId, {
                    count: existing.count + 1,
                    color: status.color,
                  });
                }
              }
            });

            return (
              <div key={category.id} className="card">
                {/* Top Row: Category Name + Budget Overview + Actions */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleExpand(category.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color || '#6B7280' }}
                    />
                    <h3 className="text-xl font-bold text-gray-900 flex-shrink-0">
                      {category.name}
                    </h3>
                    
                    {/* Sub-item Status Summary */}
                    {subItems.length > 0 && (
                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        <span className="text-xs text-gray-500">Items:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {Array.from(subItemStatusCounts.entries()).map(([statusId, { count, color }]) => {
                            const status = subStatuses.find(s => s.id === statusId);
                            return (
                              <div
                                key={statusId}
                                className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: `${color}20`,
                                  color: color,
                                }}
                              >
                                {status?.name || 'Unknown'} ({count})
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Budget Summary */}
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Planned</div>
                      <div className="text-sm font-semibold text-blue-600">
                        {formatCurrency(category.plannedTotal)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Actual</div>
                      <div className="text-sm font-semibold text-green-600">
                        {formatCurrency(category.actualTotal)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Variance</div>
                      <div className={`text-sm font-semibold flex items-center gap-1 ${
                        category.variance >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {category.variance >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {formatCurrency(Math.abs(category.variance))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    {category.id !== 'uncategorized' && (
                      <button
                        onClick={() => {
                          setEditingCategory(category);
                          setShowCreateCategoryModal(true);
                        }}
                        className="btn btn-secondary btn-sm"
                        title="Edit category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {category.id !== 'uncategorized' && (
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="btn btn-danger btn-sm"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Section: Production Items */}
                {isExpanded && (
                  <div className="border-t border-gray-200 pt-4">
                    {subItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No production items yet.
                        {category.id !== 'uncategorized' && (
                          <button
                            onClick={() => {
                              setParentCategoryId(category.id);
                              setEditingItem(null);
                              setShowCreateItemModal(true);
                            }}
                            className="block mt-2 text-primary-600 hover:text-primary-800 font-medium"
                          >
                            Add your first item
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {subItems.map((item) => {
                          const isItemExpanded = expandedItems.has(item.id);
                          const itemSubItems = item.subLineItems || [];
                          const itemCommentCount = commentCounts.get(item.id) || 0;
                          const itemPlannedTotal = (item.plannedCost || 0) + itemSubItems.reduce((sum, sub) => sum + (sub.plannedCost || 0), 0);
                          const itemActualTotal = (item.actualCost || 0) + itemSubItems.reduce((sum, sub) => sum + (sub.actualCost || 0), 0);
                          
                          return (
                            <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              {/* Production Item Header */}
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <button
                                    onClick={() => toggleItemExpand(item.id)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                                  >
                                    {isItemExpanded ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </button>
                                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                  <StatusDropdown
                                    statuses={mainStatuses}
                                    currentStatus={item.status || null}
                                    onStatusChange={(statusId) => handleStatusChange(item.id, statusId)}
                                    size="sm"
                                  />
                                </div>
                                <div className="flex items-center gap-4 text-sm flex-shrink-0">
                                  <div>
                                    <span className="text-gray-500">Planned: </span>
                                    <InlineAmountInput
                                      value={item.plannedCost}
                                      onSave={(value) => handlePlannedCostChange(item.id, value)}
                                      color="blue"
                                    />
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Actual: </span>
                                    <InlineAmountInput
                                      value={item.actualCost}
                                      onSave={(value) => handleActualCostChange(item.id, value)}
                                      color="green"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <FileAttachmentsButton lineItemId={item.id} />
                                  <button
                                    onClick={() => {
                                      setCommentsLineItemId(item.id);
                                      setCommentsLineItemName(item.name);
                                      setShowCommentsModal(true);
                                    }}
                                    className="btn btn-secondary btn-sm relative"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                    {itemCommentCount > 0 && (
                                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {itemCommentCount}
                                      </span>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingItem(item);
                                      setParentCategoryId(category.id);
                                      setShowCreateItemModal(true);
                                    }}
                                    className="btn btn-secondary btn-sm"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubItem(item.id)}
                                    className="btn btn-danger btn-sm"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Sub-line Items */}
                              {isItemExpanded && (
                                <div className="ml-6 mt-3 pt-3 border-t border-gray-300">
                                  {itemSubItems.length === 0 ? (
                                    <div className="text-sm text-gray-500 py-2">
                                      No sub-items yet.{' '}
                                      <button
                                        onClick={() => {
                                          setParentItemId(item.id);
                                          setEditingSubItem(null);
                                          setShowCreateSubItemModal(true);
                                        }}
                                        className="text-primary-600 hover:text-primary-800 font-medium"
                                      >
                                        Add sub-item
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {itemSubItems.map((subItem) => {
                                        const subCommentCount = commentCounts.get(subItem.id) || 0;
                                        return (
                                          <div key={subItem.id} className="bg-white rounded p-3 border border-gray-200">
                                            <div className="flex items-start justify-between gap-4">
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                  <h5 className="text-sm font-medium text-gray-900">{subItem.name}</h5>
                                                  <StatusDropdown
                                                    statuses={subStatuses}
                                                    currentStatus={subItem.status || null}
                                                    onStatusChange={(statusId) => handleStatusChange(subItem.id, statusId)}
                                                    size="sm"
                                                  />
                                                  {/* Show vendor/material badge */}
                                                  {(() => {
                                                    const metadata = (subItem.metadata as any) || {};
                                                    if (metadata.vendorId) {
                                                      return (
                                                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                                          Rental: {metadata.vendorName || 'Vendor'}
                                                        </span>
                                                      );
                                                    } else if (metadata.materialId) {
                                                      return (
                                                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                                                          Owned: {metadata.materialName || 'Material'}
                                                        </span>
                                                      );
                                                    }
                                                    return null;
                                                  })()}
                                                </div>
                                                {subItem.description && (
                                                  <p className="text-xs text-gray-600 mb-2">{subItem.description}</p>
                                                )}
                                                <div className="flex items-center gap-4 text-xs">
                                                  <div>
                                                    <span className="text-gray-500">Planned: </span>
                                                    <InlineAmountInput
                                                      value={subItem.plannedCost}
                                                      onSave={(value) => handlePlannedCostChange(subItem.id, value)}
                                                      color="blue"
                                                    />
                                                  </div>
                                                  <div>
                                                    <span className="text-gray-500">Actual: </span>
                                                    <InlineAmountInput
                                                      value={subItem.actualCost}
                                                      onSave={(value) => handleActualCostChange(subItem.id, value)}
                                                      color="green"
                                                    />
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex gap-1">
                                                <FileAttachmentsButton lineItemId={subItem.id} />
                                                <button
                                                  onClick={() => {
                                                    setCommentsLineItemId(subItem.id);
                                                    setCommentsLineItemName(subItem.name);
                                                    setShowCommentsModal(true);
                                                  }}
                                                  className="btn btn-secondary btn-xs relative"
                                                >
                                                  <MessageSquare className="w-3 h-3" />
                                                  {subCommentCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                                                      {subCommentCount}
                                                    </span>
                                                  )}
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setParentItemId(item.id);
                                                    setEditingSubItem(subItem);
                                                    setShowCreateSubItemModal(true);
                                                  }}
                                                  className="btn btn-secondary btn-xs"
                                                >
                                                  <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteSubItem(subItem.id)}
                                                  className="btn btn-danger btn-xs"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  <div className="mt-2">
                                    <button
                                      onClick={() => {
                                        setParentItemId(item.id);
                                        setEditingSubItem(null);
                                        setShowCreateSubItemModal(true);
                                      }}
                                      className="btn btn-secondary btn-xs"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add Sub-item
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {category.id !== 'uncategorized' && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setParentCategoryId(category.id);
                            setEditingItem(null);
                            setShowCreateItemModal(true);
                          }}
                          className="btn btn-secondary btn-sm w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Production Item to {category.name}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Category Modal */}
      {showCreateCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowCreateCategoryModal(false);
            setEditingCategory(null);
          }}
          onSave={async (data: { name: string; color: string }) => {
            try {
              if (editingCategory) {
                await categoriesApi.update(editingCategory.id, data);
              } else {
                await categoriesApi.create({
                  moduleType: moduleType,
                  ...data,
                });
              }
              setShowCreateCategoryModal(false);
              setEditingCategory(null);
              loadData();
            } catch (error) {
              console.error('Failed to save category:', error);
              alert('Failed to save category');
            }
          }}
        />
      )}

      {/* Create/Edit Production Item Modal */}
      {showCreateItemModal && parentCategoryId && parentCategoryId !== 'uncategorized' && (
        <LineItemModal
          eventId={eventId!}
          moduleType={moduleType}
          lineItem={editingItem}
          statuses={mainStatuses}
          categories={categories}
          tags={tags}
          defaultCategoryId={parentCategoryId}
          onClose={() => {
            setShowCreateItemModal(false);
            setEditingItem(null);
            setParentCategoryId(null);
          }}
          onSave={() => {
            setShowCreateItemModal(false);
            setEditingItem(null);
            setParentCategoryId(null);
            loadData();
          }}
        />
      )}

      {/* Create/Edit Sub-line Item Modal */}
      {showCreateSubItemModal && parentItemId && (() => {
        // Find the parent item to get its category
        const parentItem = allLineItems.find(item => item.id === parentItemId);
        const parentCategoryId = parentItem?.categoryId;
        // Get sub-line item types for this category (or global if no category)
        const relevantSubLineItemTypes = subLineItemTypes.filter(type => 
          !type.categoryId || type.categoryId === parentCategoryId
        );
        
        return (
          <SubLineItemModal
            eventId={eventId!}
            moduleType={moduleType}
            parentLineItemId={parentItemId}
            lineItem={editingSubItem}
            statuses={subStatuses}
            categories={categories}
            tags={tags}
            subLineItemTypes={relevantSubLineItemTypes}
            onClose={() => {
              setShowCreateSubItemModal(false);
              setEditingSubItem(null);
              setParentItemId(null);
            }}
            onSave={() => {
              setShowCreateSubItemModal(false);
              setEditingSubItem(null);
              setParentItemId(null);
              loadData();
            }}
          />
        );
      })()}

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
            loadCommentCounts([commentsLineItemId]);
          }}
        />
      )}
    </div>
  );
}

