import { useState, useEffect } from 'react';
import { lineItemsApi } from '../lib/api';
import type { LineItem, Status, Category, Tag, ModuleType } from '@event-management/shared';

interface LineItemModalProps {
  eventId: string;
  moduleType: ModuleType;
  lineItem?: LineItem | null;
  statuses: Status[];
  categories: Category[];
  tags: Tag[];
  onClose: () => void;
  onSave: () => void;
}

export function LineItemModal({
  eventId,
  moduleType,
  lineItem,
  statuses,
  categories,
  tags,
  onClose,
  onSave,
}: LineItemModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    unitPrice: '',
    plannedCost: '',
    actualCost: '',
    statusId: statuses.find(s => s.isDefault)?.id || statuses[0]?.id || '',
    categoryId: '',
    tagIds: [] as string[],
    metadata: {} as Record<string, any>,
  });

  useEffect(() => {
    if (lineItem) {
      setFormData({
        name: lineItem.name,
        description: lineItem.description || '',
        quantity: lineItem.quantity?.toString() || '',
        unitPrice: lineItem.unitPrice?.toString() || '',
        plannedCost: lineItem.plannedCost?.toString() || '',
        actualCost: lineItem.actualCost?.toString() || '',
        statusId: lineItem.status?.id || '',
        categoryId: lineItem.category?.id || '',
        tagIds: lineItem.tags.map(t => t.id),
        metadata: (lineItem.metadata as Record<string, any>) || {},
      });
    }
  }, [lineItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        moduleType,
        eventId,
        name: formData.name,
        description: formData.description || undefined,
        quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : undefined,
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
      onSave();
    } catch (error) {
      console.error('Failed to save line item:', error);
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
          {lineItem ? 'Edit Line Item' : 'Create Line Item'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="label">Quantity</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Unit Price</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Planned Cost</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={formData.plannedCost}
                onChange={(e) => setFormData({ ...formData, plannedCost: e.target.value })}
                placeholder="0.00"
              />
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

