import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, ArrowLeft, ChevronDown, ChevronRight, Edit2, Trash2, MessageSquare, Users, DollarSign, TrendingUp, TrendingDown, X, FileText } from 'lucide-react';
import { modulesApi, lineItemsApi, statusesApi, categoriesApi, tagsApi, subLineItemTypesApi, commentsApi, eventsApi } from '../lib/api';
import type { LineItem, Status, Category, Tag, SubLineItemType, ModuleType, Event } from '@event-management/shared';
import { ModuleType as ModuleTypeEnum } from '@event-management/shared';
import { ArtistLineItemModal } from '../components/ArtistLineItemModal';
import { SubLineItemModal } from '../components/SubLineItemModal';
import { StatusDropdown } from '../components/StatusDropdown';
import { InlineAmountInput } from '../components/InlineAmountInput';
import { InlineTextInput } from '../components/InlineTextInput';
import { CommentsModal } from '../components/CommentsModal';
import { FileAttachmentsButton } from '../components/FileAttachmentsButton';
import { ItineraryModal } from '../components/ItineraryModal';
import { formatCurrency } from '../lib/utils';
import { Breadcrumbs } from '../components/Breadcrumbs';

export function ArtistsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [mainStatuses, setMainStatuses] = useState<Status[]>([]);
  const [subStatuses, setSubStatuses] = useState<Status[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [subLineItemTypes, setSubLineItemTypes] = useState<SubLineItemType[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubLineItemModal, setShowSubLineItemModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [itineraryArtist, setItineraryArtist] = useState<LineItem | null>(null);
  const [commentsLineItemId, setCommentsLineItemId] = useState<string | null>(null);
  const [commentsLineItemName, setCommentsLineItemName] = useState<string>('');
  const [commentCounts, setCommentCounts] = useState<Map<string, number>>(new Map());
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [parentItemId, setParentItemId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [flippedCard, setFlippedCard] = useState<string | null>(null);

  const moduleType: ModuleType = ModuleTypeEnum.ARTISTS;

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const loadData = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const [itemsRes, statusesRes, subStatusesRes, categoriesRes, tagsRes, subLineItemTypesRes, eventRes] = await Promise.all([
        modulesApi.getLineItems(eventId, moduleType),
        statusesApi.getByModule(moduleType, 'main'),
        statusesApi.getByModule(moduleType, 'sub'),
        categoriesApi.getByModule(moduleType),
        tagsApi.getByModule(moduleType),
        subLineItemTypesApi.getByModule(moduleType),
        eventsApi.getById(eventId),
      ]);
      setLineItems(itemsRes.data);
      setMainStatuses(statusesRes.data);
      setSubStatuses(subStatusesRes.data);
      setCategories(categoriesRes.data);
      setTags(tagsRes.data);
      setSubLineItemTypes(subLineItemTypesRes.data);
      setEvent(eventRes.data);

      // Load comment counts for all sub-line items
      const subLineItemIds: string[] = [];
      itemsRes.data.forEach((artist: LineItem) => {
        if (artist.subLineItems) {
          artist.subLineItems.forEach(subItem => {
            subLineItemIds.push(subItem.id);
          });
        }
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
            // Ignore errors for individual comment fetches
            counts.set(id, 0);
          }
        })
      );
      setCommentCounts(counts);
    } catch (error) {
      console.error('Failed to load comment counts:', error);
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
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await lineItemsApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete item:', error);
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

  const handleNameChange = async (itemId: string, name: string) => {
    try {
      await lineItemsApi.update(itemId, { name });
      loadData();
    } catch (error) {
      console.error('Failed to update name:', error);
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


  // Calculate dashboard totals
  const calculateTotals = () => {
    let totalPlanned = 0;
    let totalActual = 0;
    
    // Get configured sub-line item type names
    const configuredTypeNames = new Set(subLineItemTypes.map(type => type.name));
    
    // Group sub-items by type
    const subItemsByType = new Map<string, { planned: number; actual: number; count: number }>();
    
    lineItems.forEach(artist => {
      // Add main item costs
      totalPlanned += artist.plannedCost || 0;
      totalActual += artist.actualCost || 0;
      
      // Add sub-item costs and group by type
      if (artist.subLineItems) {
        artist.subLineItems.forEach(subItem => {
          const subItemName = subItem.name;
          // Check if this is a configured type or ad-hoc
          const isConfiguredType = configuredTypeNames.has(subItemName);
          const groupKey = isConfiguredType ? subItemName : 'Ad-hoc Items';
          
          // Initialize group if it doesn't exist
          if (!subItemsByType.has(groupKey)) {
            subItemsByType.set(groupKey, { planned: 0, actual: 0, count: 0 });
          }
          
          const group = subItemsByType.get(groupKey)!;
          group.planned += subItem.plannedCost || 0;
          group.actual += subItem.actualCost || 0;
          group.count++;
          
          // Also add to totals (for overall totals including sub-items)
          totalPlanned += subItem.plannedCost || 0;
          totalActual += subItem.actualCost || 0;
        });
      }
    });
    
    // Convert map to array and sort: configured types first (by order), then ad-hoc
    const subItemsGroups = Array.from(subItemsByType.entries())
      .map(([name, totals]) => ({
        name,
        planned: totals.planned,
        actual: totals.actual,
        variance: totals.actual - totals.planned,
        count: totals.count,
        isAdHoc: name === 'Ad-hoc Items',
        order: name === 'Ad-hoc Items' ? 9999 : subLineItemTypes.find(t => t.name === name)?.order || 0,
      }))
      .sort((a, b) => {
        if (a.isAdHoc && !b.isAdHoc) return 1;
        if (!a.isAdHoc && b.isAdHoc) return -1;
        return a.order - b.order;
      });
    
    return {
      artistCount: lineItems.length,
      totalPlanned,
      totalActual,
      variance: totalActual - totalPlanned,
      subItemsGroups,
    };
  };

  const totals = calculateTotals();

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      {/* Breadcrumbs */}
      {event && (
        <Breadcrumbs 
          items={[
            { label: 'Events', href: '/events' },
            { label: event.name, href: `/events/${eventId}` },
            { label: 'Artists' }
          ]} 
        />
      )}
      
      {/* Dashboard Summary */}
      <div className="w-full mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Artists Card */}
          <div 
            className={`card-flip-container ${flippedCard === 'artists' ? 'flipped' : ''}`}
            onClick={() => setFlippedCard(flippedCard === 'artists' ? null : 'artists')}
          >
            <div className={`card-flip ${flippedCard === 'artists' ? 'flipped' : ''}`}>
              {/* Front */}
              <div className="card-front card bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30 cursor-pointer hover:shadow-xl hover:border-blue-500/50 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-semibold text-blue-400 uppercase tracking-wide">Total Artists</p>
                    <p className="text-3xl font-bold text-blue-300 mt-2">
                      {totals.artistCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              {/* Back */}
              <div className="card-back card bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30 cursor-pointer overflow-y-auto">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-base font-semibold text-blue-400 uppercase tracking-wide">Costs per Artist</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFlippedCard(null);
                    }}
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg p-1.5 transition-all"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-[450px] overflow-y-auto">
                  {lineItems.map((artist) => {
                    const artistName = (artist.metadata as any)?.artistName || artist.name;
                    const planned = artist.plannedCost || 0;
                    const actual = artist.actualCost || 0;
                    return (
                      <div key={artist.id} className="flex justify-between items-center py-2 border-b border-blue-500/20">
                        <span className="text-sm text-blue-300 truncate flex-1 mr-2">{artistName}</span>
                        <div className="flex gap-4 text-sm">
                          <span className="text-blue-400 font-medium">Est: {formatCurrency(planned)}</span>
                          <span className="text-blue-300 font-medium">Act: {formatCurrency(actual)}</span>
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
              <div className="card-front card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 cursor-pointer hover:shadow-xl hover:border-purple-500/50 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-semibold text-purple-400 uppercase tracking-wide">Total Estimated</p>
                    <p className="text-3xl font-bold text-purple-300 mt-2">
                      {formatCurrency(totals.totalPlanned)}
                    </p>
                    <p className="text-xs text-purple-400 mt-1">Including sub-items</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              {/* Back */}
              <div className="card-back card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 cursor-pointer overflow-y-auto">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-base font-semibold text-purple-400 uppercase tracking-wide">Estimated by Artist</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFlippedCard(null);
                    }}
                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-lg p-1.5 transition-all"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-[450px] overflow-y-auto">
                  {lineItems.map((artist) => {
                    const artistName = (artist.metadata as any)?.artistName || artist.name;
                    const planned = artist.plannedCost || 0;
                    const subPlanned = (artist.subLineItems || []).reduce((sum, sub) => sum + (sub.plannedCost || 0), 0);
                    const total = planned + subPlanned;
                    return (
                      <div key={artist.id} className="flex justify-between items-center py-2 border-b border-purple-500/20">
                        <span className="text-sm text-purple-300 truncate flex-1 mr-2">{artistName}</span>
                        <div className="flex flex-col items-end text-sm">
                          <span className="text-purple-400 font-semibold">{formatCurrency(total)}</span>
                          {subPlanned > 0 && (
                            <span className="text-purple-500 text-xs mt-1">+{formatCurrency(subPlanned)} sub</span>
                          )}
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
              <div className="card-front card bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30 cursor-pointer hover:shadow-xl hover:border-green-500/50 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-semibold text-green-400 uppercase tracking-wide">Total Actual</p>
                    <p className="text-3xl font-bold text-green-300 mt-2">
                      {formatCurrency(totals.totalActual)}
                    </p>
                    <p className="text-xs text-green-400 mt-1">Including sub-items</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-lg flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              {/* Back */}
              <div className="card-back card bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30 cursor-pointer overflow-y-auto">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-base font-semibold text-green-400 uppercase tracking-wide">Actual by Sub-Item Type</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFlippedCard(null);
                    }}
                    className="text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg p-1.5 transition-all"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-[450px] overflow-y-auto">
                  {totals.subItemsGroups.map((group) => (
                    <div key={group.name} className="flex justify-between items-center py-2 border-b border-green-500/20">
                      <span className="text-sm text-green-300 truncate flex-1 mr-2">{group.name}</span>
                      <div className="flex flex-col items-end text-sm">
                        <span className="text-green-400 font-semibold">{formatCurrency(group.actual)}</span>
                        <span className="text-green-400 text-xs mt-1">{group.count} {group.count === 1 ? 'item' : 'items'}</span>
                      </div>
                    </div>
                  ))}
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
                  ? 'from-red-500/10 to-red-600/10 border-red-500/30' 
                  : 'from-emerald-500/10 to-emerald-600/10 border-emerald-500/30'
              } cursor-pointer hover:shadow-xl hover:border-red-500/50 hover:border-emerald-500/50 transition-all`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className={`text-sm font-semibold uppercase tracking-wide ${
                      totals.variance >= 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      Variance
                    </p>
                    <p className={`text-3xl font-bold mt-2 ${
                      totals.variance >= 0 ? 'text-red-300' : 'text-emerald-300'
                    }`}>
                      {totals.variance >= 0 ? '+' : ''}{formatCurrency(totals.variance)}
                    </p>
                    <p className={`text-xs mt-1 ${
                      totals.variance >= 0 ? 'text-red-400' : 'text-emerald-400'
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
                  ? 'from-red-500/10 to-red-600/10 border-red-500/30' 
                  : 'from-emerald-500/10 to-emerald-600/10 border-emerald-500/30'
              } cursor-pointer overflow-y-auto`}>
                <div className="flex items-start justify-between mb-4">
                  <p className={`text-base font-semibold uppercase tracking-wide ${
                    totals.variance >= 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    Variance by Artist
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFlippedCard(null);
                    }}
                    className={`${totals.variance >= 0 ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20' : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20'} rounded-lg p-1.5 transition-all`}
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-[450px] overflow-y-auto">
                  {lineItems.map((artist) => {
                    const artistName = (artist.metadata as any)?.artistName || artist.name;
                    const planned = artist.plannedCost || 0;
                    const actual = artist.actualCost || 0;
                    const variance = actual - planned;
                    const varianceColor = variance >= 0 ? 'text-red-400' : 'text-emerald-400';
                    return (
                      <div key={artist.id} className={`flex justify-between items-center py-2 border-b ${
                        totals.variance >= 0 ? 'border-red-500/20' : 'border-emerald-500/20'
                      }`}>
                        <span className={`text-sm truncate flex-1 mr-2 ${
                          totals.variance >= 0 ? 'text-red-300' : 'text-emerald-300'
                        }`}>{artistName}</span>
                        <span className={`text-sm font-semibold ${varianceColor}`}>
                          {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="page-header">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="page-title">Artists</h1>
            <p className="page-subtitle">Manage artists and their advancing costs</p>
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

      {/* Artists List / Management Area */}
      {lineItems.length === 0 ? (
        <div className="card text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 mb-6 border border-primary-500/30">
            <Plus className="w-10 h-10 text-primary-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-200 mb-2">No artists yet</h3>
          <p className="text-gray-400 mb-6">Get started by adding your first artist</p>
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
              <div key={artist.id} className="line-item-card">
                {/* Top Row: Artist Name + Status + Budget Overview + Actions */}
                <div className="line-item-header">
                  {/* Left Section: Expand, Name, Status, Sub-items */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <button
                      onClick={() => toggleExpand(artist.id)}
                      className="text-gray-300 hover:text-gray-100 hover:bg-gray-700 rounded-lg p-1.5 transition-all flex-shrink-0 border border-transparent hover:border-gray-600"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <h3 className="line-item-title">
                        {(artist.metadata as any)?.artistName || artist.name}
                      </h3>
                      <StatusDropdown
                        statuses={mainStatuses}
                        currentStatus={artist.status || null}
                        onStatusChange={(statusId) => handleStatusChange(artist.id, statusId)}
                        size="sm"
                      />
                      
                      {/* Sub-item Status Summary */}
                      {subItems.length > 0 && (
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          <span className="text-xs text-gray-400 font-semibold">Sub-items:</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {Array.from(subItemStatusCounts.entries()).map(([statusId, { count, color }]) => {
                              const status = subStatuses.find(s => s.id === statusId);
                              return (
                                <div
                                  key={statusId}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
                                  style={{ backgroundColor: color }}
                                  title={status?.name || 'Unknown'}
                                >
                                  <span>{status?.name || 'Unknown'}</span>
                                  <span className="bg-white/25 px-1.5 py-0.5 rounded-full font-bold">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Budget Overview - Middle Section */}
                  <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-right min-w-[90px]">
                        <div className="text-xs text-gray-400 font-semibold mb-1.5">Planned</div>
                        <div className="text-base font-bold text-gray-100">
                        {plannedTotal !== null && plannedTotal !== undefined ? (
                          <InlineAmountInput
                            value={plannedTotal}
                            onSave={(value) => handlePlannedCostChange(artist.id, value)}
                            color="blue"
                          />
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right min-w-[90px]">
                      <div className="text-xs text-gray-400 font-semibold mb-1.5">Actual</div>
                      <div className="text-base font-bold text-gray-100">
                        {actualTotal !== null && actualTotal !== undefined ? (
                          <InlineAmountInput
                            value={actualTotal}
                            onSave={(value) => handleActualCostChange(artist.id, value)}
                            color="green"
                          />
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </div>
                      <div className="text-right min-w-[100px]">
                        <div className="text-xs text-gray-400 font-semibold mb-1.5">Variance</div>
                        <div className={`text-base font-bold ${variance >= 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                        {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons - Right Section */}
                  <div className="line-item-actions">
                    <button
                      onClick={() => {
                        setItineraryArtist(artist);
                        setShowItineraryModal(true);
                      }}
                      className="action-btn-primary"
                      title="View/Export Itinerary"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingItem(artist);
                        setShowCreateModal(true);
                      }}
                      className="action-btn-primary"
                      title="Edit Artist"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(artist.id)}
                      className="action-btn-danger"
                      title="Delete Artist"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Bottom Section: Sub-items */}
                {isExpanded && (
                  <div className="expandable-section">
                    {subItems.length > 0 ? (
                      <div className="space-y-3">
                        {subItems.map((subItem) => {
                          const subStatusColor = subItem.status ? 
                            subStatuses.find(s => s.id === subItem.status?.id)?.color || '#9CA3AF' 
                            : '#9CA3AF';
                          return (
                            <div key={subItem.id} className="sub-item-card">
                              {/* Status Color Indicator */}
                              <div 
                                className="sub-item-status-indicator"
                                style={{ backgroundColor: subStatusColor }}
                              />
                              
                              {/* Content Section */}
                              <div className="sub-item-content flex-1 min-w-0">
                                <div className="sub-item-header">
                                  <div className="sub-item-name-section">
                                    <InlineTextInput
                                      value={subItem.name}
                                      onSave={(value) => handleNameChange(subItem.id, value)}
                                      placeholder="Sub-item name"
                                      className="text-sm font-semibold text-gray-50"
                                    />
                                    <StatusDropdown
                                      statuses={subStatuses}
                                      currentStatus={subItem.status || null}
                                      onStatusChange={(statusId) => handleStatusChange(subItem.id, statusId)}
                                      size="sm"
                                    />
                                  </div>
                                  
                                  {/* Budget Section */}
                                  <div className="sub-item-budget-section">
                                    <div className="budget-value">
                                      <div className="budget-label">Planned</div>
                                      <InlineAmountInput
                                        value={subItem.plannedCost || null}
                                        onSave={(value) => handlePlannedCostChange(subItem.id, value)}
                                        placeholder="0.00"
                                        color="blue"
                                        className="text-sm font-semibold"
                                      />
                                    </div>
                                    <div className="budget-value">
                                      <div className="budget-label">Actual</div>
                                      <InlineAmountInput
                                        value={subItem.actualCost || null}
                                        onSave={(value) => handleActualCostChange(subItem.id, value)}
                                        placeholder="0.00"
                                        color="green"
                                        className="text-sm font-semibold"
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Action Buttons */}
                                  <div className="line-item-actions">
                                    <FileAttachmentsButton
                                      lineItemId={subItem.id}
                                      onUpdate={loadData}
                                    />
                                    <button
                                      onClick={() => {
                                        setCommentsLineItemId(subItem.id);
                                        setCommentsLineItemName(subItem.name);
                                        setShowCommentsModal(true);
                                      }}
                                      className="relative action-btn-primary"
                                      title="View comments"
                                    >
                                      <MessageSquare className="w-5 h-5" />
                                      {(commentCounts.get(subItem.id) || 0) > 0 && (
                                        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-primary-500 rounded-full shadow-md">
                                          {commentCounts.get(subItem.id)}
                                        </span>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleDelete(subItem.id)}
                                      className="action-btn-danger"
                                      title="Delete sub-item"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Notes Section */}
                                <div className="sub-item-notes">
                                  <div className="sub-item-notes-label">Notes:</div>
                                  <InlineTextInput
                                    value={subItem.description}
                                    onSave={(value) => handleDescriptionChange(subItem.id, value)}
                                    placeholder="Click to add notes..."
                                    multiline
                                    className="text-xs text-gray-300 w-full"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="empty-state-card">
                        <p className="text-sm font-medium">No sub-items yet. Click the button below to add one.</p>
                      </div>
                    )}
                    <div className="mt-6 pt-6 section-divider">
                      <button
                        onClick={() => {
                          setParentItemId(artist.id);
                          setShowSubLineItemModal(true);
                        }}
                        className="btn btn-secondary flex items-center gap-2 w-full justify-center"
                      >
                        <Plus className="w-4 h-4" />
                        Add Sub-Item
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <ArtistLineItemModal
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
            if (commentsLineItemId) {
              loadCommentCounts([commentsLineItemId]);
            }
          }}
        />
      )}

      {showItineraryModal && itineraryArtist && eventId && (
        <ItineraryModal
          eventId={eventId}
          artist={itineraryArtist}
          subLineItemTypes={subLineItemTypes}
          onClose={() => {
            setShowItineraryModal(false);
            setItineraryArtist(null);
          }}
          onSave={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}
