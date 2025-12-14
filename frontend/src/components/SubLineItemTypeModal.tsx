import { useState, useEffect } from 'react';
import type { SubLineItemType } from '@event-management/shared';

interface SubLineItemTypeModalProps {
  subLineItemType?: SubLineItemType | null;
  onClose: () => void;
  onSave: (data: { name: string; description: string; isDefault: boolean; order: number }) => void;
}

export function SubLineItemTypeModal({ subLineItemType, onClose, onSave }: SubLineItemTypeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false,
    order: 0,
  });

  useEffect(() => {
    if (subLineItemType) {
      setFormData({
        name: subLineItemType.name,
        description: subLineItemType.description || '',
        isDefault: subLineItemType.isDefault,
        order: subLineItemType.order,
      });
    }
  }, [subLineItemType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold gradient-text mb-4">
          {subLineItemType ? 'Edit Sub-Line Item Type' : 'Create Sub-Line Item Type'}
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
              placeholder="e.g., Artist Fee, Travel Cost"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="label">Order</label>
            <input
              type="number"
              className="input"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              min="0"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
            />
            <label htmlFor="isDefault" className="label cursor-pointer mb-0">
              Set as default (will be pre-selected when adding sub-items)
            </label>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {subLineItemType ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



