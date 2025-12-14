import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, ArrowLeft, ChevronDown, ChevronRight, Edit2, Trash2, MessageSquare, DollarSign, TrendingUp, TrendingDown, X, Tag as TagIcon, Package } from 'lucide-react';
import { modulesApi, lineItemsApi, statusesApi, categoriesApi, tagsApi, subLineItemTypesApi, commentsApi } from '../lib/api';
import type { LineItem, Status, Category, Tag, SubLineItemType, ModuleType } from '@event-management/shared';
import { ModuleType as ModuleTypeEnum } from '@event-management/shared';
import { LineItemModal } from '../components/LineItemModal';
import { SubLineItemModal } from '../components/SubLineItemModal';
import { CategoryModal } from '../components/CategoryModal';
import { StatusDropdown } from '../components/StatusDropdown';
import { InlineAmountInput } from '../components/InlineAmountInput';
import { InlineTextInput } from '../components/InlineTextInput';
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
  const [flippedCard, setFlippedCard] = useState<string | null>(null);

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
  const uncategorizedItems = allLineItems.filter(item => !item.categoryId && !item.parentLineItemId);
  if (uncategorizedItems.length > 0) {
    const plannedTotal = uncategorizedItems.reduce((sum, item) => {
      const itemPlanned = item.plannedCost || 0;
      const subItemsPlanned = (item.subLineItems || []).reduce((subSum, sub) => subSum + (sub.plannedCost || 0), 0);
      return sum + itemPlanned + subItemsPlanned;
    }, 0);
    const actualTotal = uncategorizedItems.reduce((sum, item) => {
      const itemActual = item.actualCost || 0;
      const subItemsActual = (item.subLineItems || []).reduce((subSum, sub) => subSum + (sub.actualCost || 0), 0);
      return sum + itemActual + subItemsActual;
    }, 0);
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

  // Calculate dashboard totals
  const calculateTotals = () => {
    let totalPlanned = 0;
    let totalActual = 0;
    let totalItems = 0;
    let totalSubItems = 0;
    
    // Group sub-items by type (rental vs owned vs custom)
    const subItemsByType = new Map<string, { planned: number; actual: number; count: number }>();
    
    categoriesWithItems.forEach(category => {
      totalPlanned += category.plannedTotal;
      totalActual += category.actualTotal;
      totalItems += category.lineItems.length;
      
      // Process sub-items in this category
      category.lineItems.forEach(item => {
        if (item.subLineItems) {
          item.subLineItems.forEach(subItem => {
            totalSubItems++;
            const metadata = (subItem.metadata as any) || {};
            let typeKey = 'Custom Items';
            if (metadata.vendorId) {
              typeKey = 'Rental Items';
            } else if (metadata.materialId) {
              typeKey = 'Owned Items';
            }
            
            if (!subItemsByType.has(typeKey)) {
              subItemsByType.set(typeKey, { planned: 0, actual: 0, count: 0 });
            }
            
            const group = subItemsByType.get(typeKey)!;
            group.planned += subItem.plannedCost || 0;
            group.actual += subItem.actualCost || 0;
            group.count++;
          });
        }
      });
    });
    
    // Convert map to array
    const subItemsGroups = Array.from(subItemsByType.entries())
      .map(([name, totals]) => ({
        name,
        planned: totals.planned,
        actual: totals.actual,
        variance: totals.actual - totals.planned,
        count: totals.count,
      }))
      .sort((a, b) => {
        // Sort: Rental, Owned, Custom
        const order = { 'Rental Items': 0, 'Owned Items': 1, 'Custom Items': 2 };
        return (order[a.name as keyof typeof order] ?? 99) - (order[b.name as keyof typeof order] ?? 99);
      });
    
    return {
      categoryCount: categoriesWithItems.filter(c => c.id !== 'uncategorized').length,
      totalItems,
      totalSubItems,
      totalPlanned,
      totalActual,
      variance: totalActual - totalPlanned,
      subItemsGroups,
    };
  };

  const totals = calculateTotals();

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

  const handleDescriptionChange = async (itemId: string, description: string) => {
    try {
      await lineItemsApi.update(itemId, { description: description || undefined });
      loadData();
    } catch (error) {
      console.error('Failed to update description:', error);
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

      {/* Dashboard Summary */}
      {categoriesWithItems.length > 0 && (
        <div className="w-full mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Categories Card */}
            <div 
              className={`card-flip-container ${flippedCard === 'categories' ? 'flipped' : ''}`}
              onClick={() => setFlippedCard(flippedCard === 'categories' ? null : 'categories')}
            >
              <div className={`card-flip ${flippedCard === 'categories' ? 'flipped' : ''}`}>
                {/* Front */}
                <div className="card-front card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Total Categories</p>
                      <p className="text-3xl font-bold text-blue-900 mt-2">
                        {totals.categoryCount}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <TagIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                {/* Back */}
                <div className="card-back card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer overflow-y-auto">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-base font-semibold text-blue-700 uppercase tracking-wide">Costs per Category</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFlippedCard(null);
                      }}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[450px] overflow-y-auto">
                    {categoriesWithItems.filter(c => c.id !== 'uncategorized').map((category) => {
                      return (
                        <div key={category.id} className="flex justify-between items-center py-2 border-b border-blue-200/50">
                          <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: category.color || '#6B7280' }}
                            />
                            <span className="text-sm text-blue-800 truncate">{category.name}</span>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <span className="text-blue-600 font-medium">Est: {formatCurrency(category.plannedTotal)}</span>
                            <span className="text-blue-700 font-medium">Act: {formatCurrency(category.actualTotal)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Total Estimated Card */}
            <div 
              className={`card-flip-container ${flippedCard === 'estimated' ? 'flipped' : ''}`}
              onClick={() => setFlippedCard(flippedCard === 'estimated' ? null : 'estimated')}
            >
              <div className={`card-flip ${flippedCard === 'estimated' ? 'flipped' : ''}`}>
                {/* Front */}
                <div className="card-front card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 cursor-pointer hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Total Estimated</p>
                      <p className="text-3xl font-bold text-purple-900 mt-2">
                        {formatCurrency(totals.totalPlanned)}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">Including sub-items</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                {/* Back */}
                <div className="card-back card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 cursor-pointer overflow-y-auto">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-base font-semibold text-purple-700 uppercase tracking-wide">Estimated by Category</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFlippedCard(null);
                      }}
                      className="text-purple-600 hover:text-purple-800 p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[450px] overflow-y-auto">
                    {categoriesWithItems.filter(c => c.id !== 'uncategorized').map((category) => {
                      return (
                        <div key={category.id} className="flex justify-between items-center py-2 border-b border-purple-200/50">
                          <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: category.color || '#6B7280' }}
                            />
                            <span className="text-sm text-purple-800 truncate">{category.name}</span>
                          </div>
                          <div className="flex flex-col items-end text-sm">
                            <span className="text-purple-600 font-semibold">{formatCurrency(category.plannedTotal)}</span>
                            <span className="text-purple-500 text-xs mt-1">{category.lineItems.length} {category.lineItems.length === 1 ? 'item' : 'items'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Total Actual Card */}
            <div 
              className={`card-flip-container ${flippedCard === 'actual' ? 'flipped' : ''}`}
              onClick={() => setFlippedCard(flippedCard === 'actual' ? null : 'actual')}
            >
              <div className={`card-flip ${flippedCard === 'actual' ? 'flipped' : ''}`}>
                {/* Front */}
                <div className="card-front card bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Total Actual</p>
                      <p className="text-3xl font-bold text-green-900 mt-2">
                        {formatCurrency(totals.totalActual)}
                      </p>
                      <p className="text-xs text-green-600 mt-1">Including sub-items</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                {/* Back */}
                <div className="card-back card bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer overflow-y-auto">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-base font-semibold text-green-700 uppercase tracking-wide">Actual by Sub-Item Type</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFlippedCard(null);
                      }}
                      className="text-green-600 hover:text-green-800 p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[450px] overflow-y-auto">
                    {totals.subItemsGroups.map((group) => (
                      <div key={group.name} className="flex justify-between items-center py-2 border-b border-green-200/50">
                        <span className="text-sm text-green-800 truncate flex-1 mr-2">{group.name}</span>
                        <div className="flex flex-col items-end text-sm">
                          <span className="text-green-600 font-semibold">{formatCurrency(group.actual)}</span>
                          <span className="text-green-500 text-xs mt-1">{group.count} {group.count === 1 ? 'item' : 'items'}</span>
                        </div>
                      </div>
                    ))}
                    {totals.subItemsGroups.length === 0 && (
                      <div className="text-sm text-green-600 text-center py-4">No sub-items yet</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Variance Card */}
            <div 
              className={`card-flip-container ${flippedCard === 'variance' ? 'flipped' : ''}`}
              onClick={() => setFlippedCard(flippedCard === 'variance' ? null : 'variance')}
            >
              <div className={`card-flip ${flippedCard === 'variance' ? 'flipped' : ''}`}>
                {/* Front */}
                <div className={`card-front card bg-gradient-to-br ${
                  totals.variance >= 0 
                    ? 'from-red-50 to-red-100 border-red-200' 
                    : 'from-emerald-50 to-emerald-100 border-emerald-200'
                } cursor-pointer hover:shadow-xl transition-shadow`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className={`text-sm font-semibold uppercase tracking-wide ${
                        totals.variance >= 0 ? 'text-red-700' : 'text-emerald-700'
                      }`}>
                        Variance
                      </p>
                      <p className={`text-3xl font-bold mt-2 ${
                        totals.variance >= 0 ? 'text-red-900' : 'text-emerald-900'
                      }`}>
                        {totals.variance >= 0 ? '+' : ''}{formatCurrency(totals.variance)}
                      </p>
                      <p className={`text-xs mt-1 ${
                        totals.variance >= 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        {totals.variance >= 0 ? 'Over budget' : 'Under budget'}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                      totals.variance >= 0 ? 'bg-red-500' : 'bg-emerald-500'
                    }`}>
                      <TrendingDown className={`w-6 h-6 text-white ${
                        totals.variance < 0 ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </div>
                </div>
                {/* Back */}
                <div className={`card-back card bg-gradient-to-br ${
                  totals.variance >= 0 
                    ? 'from-red-50 to-red-100 border-red-200' 
                    : 'from-emerald-50 to-emerald-100 border-emerald-200'
                } cursor-pointer overflow-y-auto`}>
                  <div className="flex items-start justify-between mb-4">
                    <p className={`text-base font-semibold uppercase tracking-wide ${
                      totals.variance >= 0 ? 'text-red-700' : 'text-emerald-700'
                    }`}>
                      Variance by Category
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFlippedCard(null);
                      }}
                      className={totals.variance >= 0 ? 'text-red-600 hover:text-red-800' : 'text-emerald-600 hover:text-emerald-800 p-1'}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[450px] overflow-y-auto">
                    {categoriesWithItems.filter(c => c.id !== 'uncategorized').map((category) => {
                      const varianceColor = category.variance >= 0 ? 'text-red-600' : 'text-emerald-600';
                      return (
                        <div key={category.id} className={`flex justify-between items-center py-2 border-b ${
                          totals.variance >= 0 ? 'border-red-200/50' : 'border-emerald-200/50'
                        }`}>
                          <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: category.color || '#6B7280' }}
                            />
                            <span className={`text-sm truncate ${
                              totals.variance >= 0 ? 'text-red-800' : 'text-emerald-800'
                            }`}>
                              {category.name}
                            </span>
                          </div>
                          <div className="flex flex-col items-end text-sm">
                            <span className={`font-semibold ${varianceColor}`}>
                              {category.variance >= 0 ? '+' : ''}{formatCurrency(category.variance)}
                            </span>
                            <span className={`text-xs mt-1 ${
                              totals.variance >= 0 ? 'text-red-500' : 'text-emerald-500'
                            }`}>
                              {formatCurrency(category.plannedTotal)} planned
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      {categoriesWithItems.length === 0 ? (
        <div className="card text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 mb-6">
            <Plus className="w-10 h-10 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-200 mb-2">No categories yet</h3>
          <p className="text-gray-400 mb-6">Get started by adding your first category</p>
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
              <div key={category.id} className="line-item-card">
                {/* Top Row: Category Name + Budget Overview + Actions */}
                <div className="line-item-header">
                  <div className="line-item-content flex items-center gap-3">
                    <button
                      onClick={() => toggleExpand(category.id)}
                      className="text-gray-300 hover:text-gray-100 hover:bg-gray-700 rounded-lg p-1.5 transition-all flex-shrink-0 border border-transparent hover:border-gray-600"
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
                    <h3 className="line-item-title">
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
                    <div className="budget-value">
                      <div className="budget-label">Planned</div>
                      <div className="text-base font-bold text-blue-400">
                        {formatCurrency(category.plannedTotal)}
                      </div>
                    </div>
                    <div className="budget-value">
                      <div className="budget-label">Actual</div>
                      <div className="text-base font-bold text-emerald-400">
                        {formatCurrency(category.actualTotal)}
                      </div>
                    </div>
                    <div className="budget-value">
                      <div className="budget-label">Variance</div>
                      <div className={`text-base font-bold flex items-center gap-1 ${
                        category.variance >= 0 ? 'text-red-300' : 'text-emerald-300'
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
                  <div className="line-item-actions">
                    {category.id !== 'uncategorized' && (
                      <button
                        onClick={() => {
                          setEditingCategory(category);
                          setShowCreateCategoryModal(true);
                        }}
                        className="action-btn-primary"
                        title="Edit category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {category.id !== 'uncategorized' && (
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="action-btn-danger"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Section: Production Items */}
                {isExpanded && (
                  <div className="border-t border-gray-700 pt-4">
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
                            <div key={item.id} className="sub-item-card">
                              {/* Production Item Header */}
                              <div className="sub-item-header">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <button
                                    onClick={() => toggleItemExpand(item.id)}
                                    className="text-gray-300 hover:text-gray-100 hover:bg-gray-700 rounded-lg p-1 transition-all flex-shrink-0 border border-transparent hover:border-gray-600"
                                  >
                                    {isItemExpanded ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </button>
                                  <h4 className="font-semibold text-gray-100">{item.name}</h4>
                                  <StatusDropdown
                                    statuses={mainStatuses}
                                    currentStatus={item.status || null}
                                    onStatusChange={(statusId) => handleStatusChange(item.id, statusId)}
                                    size="sm"
                                  />
                                </div>
                                <div className="sub-item-budget-section">
                                  <div className="budget-value">
                                    <div className="budget-label">Planned</div>
                                    <InlineAmountInput
                                      value={item.plannedCost}
                                      onSave={(value) => handlePlannedCostChange(item.id, value)}
                                      color="blue"
                                      className="text-sm font-semibold"
                                    />
                                  </div>
                                  <div className="budget-value">
                                    <div className="budget-label">Actual</div>
                                    <InlineAmountInput
                                      value={item.actualCost}
                                      onSave={(value) => handleActualCostChange(item.id, value)}
                                      color="green"
                                      className="text-sm font-semibold"
                                    />
                                  </div>
                                </div>
                                <div className="line-item-actions">
                                  <FileAttachmentsButton lineItemId={item.id} onUpdate={loadData} />
                                  <button
                                    onClick={() => {
                                      setCommentsLineItemId(item.id);
                                      setCommentsLineItemName(item.name);
                                      setShowCommentsModal(true);
                                    }}
                                    className="relative action-btn-primary"
                                    title="View comments"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                    {itemCommentCount > 0 && (
                                      <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                                        {itemCommentCount}
                                      </span>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubItem(item.id)}
                                    className="action-btn-danger"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Description */}
                              <div className="sub-item-notes">
                                <div className="sub-item-notes-label">Notes:</div>
                                <InlineTextInput
                                  value={item.description || ''}
                                  onSave={(value) => handleDescriptionChange(item.id, value)}
                                  placeholder="Click to add description..."
                                  multiline
                                  className="text-sm text-gray-300 w-full"
                                />
                              </div>
                              
                              {/* Sub-line Items */}
                              {isItemExpanded && (
                                <div className="ml-6 mt-3 pt-3 section-divider">
                                  {itemSubItems.length === 0 ? (
                                    <div className="text-sm text-gray-400 py-2">
                                      No sub-items yet.{' '}
                                      <button
                                        onClick={() => {
                                          setParentItemId(item.id);
                                          setEditingSubItem(null);
                                          setShowCreateSubItemModal(true);
                                        }}
                                        className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                                      >
                                        Add sub-item
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {itemSubItems.map((subItem) => {
                                        const subCommentCount = commentCounts.get(subItem.id) || 0;
                                        return (
                                          <div key={subItem.id} className="sub-item-card bg-gray-800/40">
                                            <div className="sub-item-content">
                                              <div className="sub-item-header">
                                                <div className="sub-item-name-section">
                                                  <h5 className="text-sm font-semibold text-gray-100">{subItem.name}</h5>
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
                                                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                                                          Rental: {metadata.vendorName || 'Vendor'}
                                                        </span>
                                                      );
                                                    } else if (metadata.materialId) {
                                                      return (
                                                        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                                                          Owned: {metadata.materialName || 'Material'}
                                                        </span>
                                                      );
                                                    }
                                                    return null;
                                                  })()}
                                                </div>
                                                <div className="sub-item-budget-section">
                                                  <div className="budget-value">
                                                    <div className="budget-label">Planned</div>
                                                    <InlineAmountInput
                                                      value={subItem.plannedCost}
                                                      onSave={(value) => handlePlannedCostChange(subItem.id, value)}
                                                      color="blue"
                                                      className="text-xs font-semibold"
                                                    />
                                                  </div>
                                                  <div className="budget-value">
                                                    <div className="budget-label">Actual</div>
                                                    <InlineAmountInput
                                                      value={subItem.actualCost}
                                                      onSave={(value) => handleActualCostChange(subItem.id, value)}
                                                      color="green"
                                                      className="text-xs font-semibold"
                                                    />
                                                  </div>
                                                </div>
                                              </div>
                                              {subItem.description && (
                                                <div className="sub-item-notes">
                                                  <div className="sub-item-notes-label">Notes:</div>
                                                  <p className="text-xs text-gray-300">{subItem.description}</p>
                                                </div>
                                              )}
                                            </div>
                                            <div className="line-item-actions">
                                              <FileAttachmentsButton lineItemId={subItem.id} onUpdate={loadData} />
                                              <button
                                                onClick={() => {
                                                  setCommentsLineItemId(subItem.id);
                                                  setCommentsLineItemName(subItem.name);
                                                  setShowCommentsModal(true);
                                                }}
                                                className="relative action-btn-primary"
                                                title="View comments"
                                              >
                                                <MessageSquare className="w-4 h-4" />
                                                {subCommentCount > 0 && (
                                                  <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
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
                                                className="action-btn-primary"
                                                title="Edit"
                                              >
                                                <Edit2 className="w-4 h-4" />
                                              </button>
                                              <button
                                                onClick={() => handleDeleteSubItem(subItem.id)}
                                                className="action-btn-danger"
                                                title="Delete"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </button>
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

