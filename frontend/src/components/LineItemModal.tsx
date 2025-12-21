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
  defaultCategoryId?: string;
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
  defaultCategoryId,
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
    } else if (defaultCategoryId) {
      // Set default category when creating new item
      setFormData(prev => ({
        ...prev,
        categoryId: defaultCategoryId,
      }));
    }
  }, [lineItem, defaultCategoryId]);

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
    <div className="modal-overlay modal-animate-overlay" onClick={onClose}>
      <div className="modal-content modal-animate-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {lineItem ? 'Edit Line Item' : 'Create Line Item'}
          </h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="modal-body flex-1 overflow-y-auto min-h-0">
            <div className="space-y-4">
              <div className="form-group">
                <label className="label">
                  Name <span className="required-indicator">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-grid">
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
              <div className="form-grid">
                <div className="form-group">
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
                <div className="form-group">
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
              <div className="form-group">
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
              <div className="form-group">
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
              <div className="form-group">
                <label className="label">Tags</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={formData.tagIds.includes(tag.id) ? 'tag-toggle-active' : 'tag-toggle-inactive'}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
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

