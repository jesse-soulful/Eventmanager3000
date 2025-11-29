import { useState, useEffect } from 'react';
import { lineItemsApi } from '../lib/api';
import type { LineItem, Status, Category, Tag, ModuleType } from '@event-management/shared';
import { AlertTriangle } from 'lucide-react';

interface SubLineItemModalProps {
  eventId: string;
  moduleType: ModuleType;
  parentLineItemId: string;
  lineItem?: LineItem | null;
  statuses: Status[];
  categories: Category[];
  tags: Tag[];
  onClose: () => void;
  onSave: () => void;
}

export function SubLineItemModal({
  eventId,
  moduleType,
  parentLineItemId,
  lineItem,
  statuses,
  categories,
  tags,
  onClose,
  onSave,
}: SubLineItemModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    plannedCost: '',
    actualCost: '',
    statusId: statuses.find(s => s.isDefault)?.id || statuses[0]?.id || '',
    categoryId: '',
    tagIds: [] as string[],
    metadata: {} as Record<string, any>,
  });
  const [parentItem, setParentItem] = useState<LineItem | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [totalSubItemsPlanned, setTotalSubItemsPlanned] = useState<number>(0);

  const calculateTotalPlannedCost = async (): Promise<number> => {
    if (!parentLineItemId || !parentItem) return 0;
    
    try {
      const subItems = parentItem.subLineItems || [];
      
      // Get current planned costs of all sub-items (excluding the one being edited)
      const otherSubItemsTotal = subItems
        .filter(item => item.id !== lineItem?.id)
        .reduce((sum, item) => sum + (item.plannedCost || 0), 0);
      
      // Add the new planned cost
      const newPlannedCost = formData.plannedCost ? parseFloat(formData.plannedCost) : 0;
      return otherSubItemsTotal + newPlannedCost;
    } catch (error) {
      console.error('Failed to calculate total:', error);
      return 0;
    }
  };

  useEffect(() => {
    // Fetch parent item to get total planned cost
    if (parentLineItemId) {
      lineItemsApi.getById(parentLineItemId).then((response) => {
        setParentItem(response.data);
      }).catch(console.error);
    }

    if (lineItem) {
      setFormData({
        name: lineItem.name,
        description: lineItem.description || '',
        plannedCost: lineItem.plannedCost?.toString() || '',
        actualCost: lineItem.actualCost?.toString() || '',
        statusId: lineItem.status?.id || '',
        categoryId: lineItem.category?.id || '',
        tagIds: lineItem.tags.map(t => t.id),
        metadata: (lineItem.metadata as Record<string, any>) || {},
      });
    }
  }, [lineItem, statuses, parentLineItemId]);

  useEffect(() => {
    if (parentItem && formData.plannedCost) {
      calculateTotalPlannedCost().then(setTotalSubItemsPlanned);
    } else if (parentItem) {
      setTotalSubItemsPlanned(0);
    }
  }, [formData.plannedCost, parentItem, lineItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if planned cost exceeds parent's total planned cost
    if (parentItem && formData.plannedCost && !pendingSubmit) {
      const totalPlanned = await calculateTotalPlannedCost();
      const parentPlannedCost = parentItem.plannedCost || 0;
      
      if (totalPlanned > parentPlannedCost) {
        setShowWarning(true);
        setPendingSubmit(true);
        return;
      }
    }

    try {
      const data = {
        moduleType,
        eventId,
        parentLineItemId,
        name: formData.name,
        description: formData.description || undefined,
        plannedCost: formData.plannedCost ? parseFloat(formData.plannedCost) : undefined,
        actualCost: formData.actualCost ? parseFloat(formData.actualCost) : undefined,
        statusId: formData.statusId || undefined,
        categoryId: formData.categoryId || undefined,
        tagIds: formData.tagIds,
        metadata: formData.metadata,
      };

      if (lineItem) {
        await lineItemsApi.update(lineItem.id, data);
      } else {
        await lineItemsApi.create(data);
      }
      
      setShowWarning(false);
      setPendingSubmit(false);
      onSave();
    } catch (error) {
      console.error('Failed to save sub-line item:', error);
      setPendingSubmit(false);
    }
  };

  const handleConfirmSubmit = () => {
    setShowWarning(false);
    // Trigger submit again
    const form = document.querySelector('form');
    if (form) {
      form.requestSubmit();
    }
  };

  const toggleTag = (tagId: string) => {
    setFormData({
      ...formData,
      tagIds: formData.tagIds.includes(tagId)
        ? formData.tagIds.filter((id: string) => id !== tagId)
        : [...formData.tagIds, tagId],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-3xl font-bold gradient-text mb-6">
          {lineItem ? 'Edit Sub-line Item' : 'Create Sub-line Item'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Warning Banner */}
          {showWarning && parentItem && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-800 mb-1">
                    Planned Cost Exceeds Total Budget
                  </h3>
                  <p className="text-sm text-yellow-700 mb-3">
                    The total planned cost of all sub-items (${totalSubItemsPlanned.toFixed(2)}) exceeds 
                    the artist's total planned cost (${parentItem.plannedCost?.toFixed(2) || '0.00'}). 
                    Are you sure you want to continue?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmSubmit}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700"
                    >
                      Yes, Continue
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowWarning(false);
                        setPendingSubmit(false);
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cost Summary */}
          {parentItem && (
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">Parent Total Planned Cost:</span>
                <span className="font-semibold text-gray-900">
                  ${parentItem.plannedCost?.toFixed(2) || '0.00'}
                </span>
              </div>
              {formData.plannedCost && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">This Sub-item Planned Cost:</span>
                  <span className={`font-semibold ${
                    parseFloat(formData.plannedCost) > (parentItem.plannedCost || 0)
                      ? 'text-red-600'
                      : 'text-gray-900'
                  }`}>
                    ${parseFloat(formData.plannedCost).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="label">Name *</label>
            <input
              type="text"
              required
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Planned Cost</label>
              <input
                type="number"
                step="0.01"
                className={`input ${
                  parentItem && formData.plannedCost && 
                  totalSubItemsPlanned > (parentItem.plannedCost || 0)
                    ? 'border-yellow-400 focus:ring-yellow-400'
                    : ''
                }`}
                value={formData.plannedCost}
                onChange={(e) => {
                  setFormData({ ...formData, plannedCost: e.target.value });
                  setShowWarning(false);
                  setPendingSubmit(false);
                }}
                placeholder="0.00"
              />
              {parentItem && (
                <p className="text-xs mt-1 text-gray-500">
                  Will be added to parent total
                </p>
              )}
            </div>
            <div>
              <label className="label">Actual Cost</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={formData.actualCost}
                onChange={(e) => setFormData({ ...formData, actualCost: e.target.value })}
                placeholder="0.00"
              />
              <p className="text-xs mt-1 text-gray-500">
                Will be added to parent actual cost
              </p>
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={formData.statusId}
              onChange={(e) => setFormData({ ...formData, statusId: e.target.value })}
            >
              <option value="">None</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            >
              <option value="">None</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tags</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    formData.tagIds.includes(tag.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {lineItem ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

