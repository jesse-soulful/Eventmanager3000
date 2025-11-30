import { useState, useEffect } from 'react';
import { lineItemsApi } from '../lib/api';
import type { LineItem, Status, Category, Tag, ModuleType, SubLineItemType } from '@event-management/shared';
import { ModuleType as ModuleTypeEnum, StaffRole, STAFF_ROLES, STAFF_ROLE_DISPLAY_NAMES } from '@event-management/shared';
import { X } from 'lucide-react';

interface StaffLineItemModalProps {
  eventId?: string; // Optional for global staff pool
  moduleType: ModuleType;
  lineItem?: LineItem | null;
  statuses: Status[];
  categories: Category[];
  tags: Tag[];
  subLineItemTypes: SubLineItemType[];
  onClose: () => void;
  onSave: () => void;
}

export function StaffLineItemModal({
  eventId,
  moduleType,
  lineItem,
  statuses,
  categories,
  tags,
  subLineItemTypes,
  onClose,
  onSave,
}: StaffLineItemModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    canWorkAs: [] as StaffRole[],
    description: '',
    plannedCost: '',
    statusId: statuses.find(s => s.isDefault)?.id || statuses[0]?.id || '',
    categoryId: '',
    tagIds: [] as string[],
  });

  useEffect(() => {
    if (lineItem) {
      const metadata = (lineItem.metadata as Record<string, any>) || {};
      setFormData({
        name: lineItem.name || '',
        email: metadata.email || '',
        phone: metadata.phone || '',
        canWorkAs: metadata.canWorkAs || [],
        description: lineItem.description || '',
        plannedCost: lineItem.plannedCost?.toString() || '',
        statusId: lineItem.status?.id || statuses.find(s => s.isDefault)?.id || '',
        categoryId: lineItem.category?.id || '',
        tagIds: lineItem.tags.map(t => t.id),
      });
    }
  }, [lineItem, statuses]);

  const toggleRole = (role: StaffRole) => {
    setFormData({
      ...formData,
      canWorkAs: formData.canWorkAs.includes(role)
        ? formData.canWorkAs.filter(r => r !== role)
        : [...formData.canWorkAs, role],
    });
  };

  const toggleTag = (tagId: string) => {
    setFormData({
      ...formData,
      tagIds: formData.tagIds.includes(tagId)
        ? formData.tagIds.filter((id: string) => id !== tagId)
        : [...formData.tagIds, tagId],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate eventId for creation (required by backend)
      // For creating new staff members, eventId is required (cannot be empty string or undefined)
      // For updates, use existing eventId if no new one provided
      const finalEventId = lineItem 
        ? (eventId && eventId.trim() ? eventId : lineItem.eventId)
        : (eventId && eventId.trim() ? eventId : undefined);

      if (!lineItem && !finalEventId) {
        alert('Please select an event or create an event first before adding staff members.');
        return;
      }

      const data = {
        moduleType,
        eventId: finalEventId!,
        name: formData.name,
        description: formData.description || undefined,
        plannedCost: formData.plannedCost ? parseFloat(formData.plannedCost) : undefined,
        statusId: formData.statusId || undefined,
        categoryId: formData.categoryId || undefined,
        tagIds: formData.tagIds,
        metadata: {
          email: formData.email,
          phone: formData.phone,
          canWorkAs: formData.canWorkAs,
        },
      };

      if (lineItem) {
        await lineItemsApi.update(lineItem.id, data);
      } else {
        await lineItemsApi.create(data);
      }

      onSave();
    } catch (error) {
      console.error('Failed to save staff member:', error);
      alert('Failed to save staff member. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold gradient-text">
            {lineItem ? 'Edit Staff Member' : 'Add Staff Member'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Staff Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Staff Details</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter staff member name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Can Work As */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Can Work As</h3>
            <div className="grid grid-cols-2 gap-3">
              {STAFF_ROLES.map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={formData.canWorkAs.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {STAFF_ROLE_DISPLAY_NAMES[role]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Additional Details</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional notes or information"
                />
              </div>
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
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
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

