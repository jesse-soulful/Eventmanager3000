import { useState, useEffect } from 'react';
import { formatCurrency, formatNumber } from '../lib/utils';
import { lineItemsApi, modulesApi } from '../lib/api';
import type { LineItem, Status, Category, Tag, SubLineItemType, ModuleType } from '@event-management/shared';
import { ModuleType as ModuleTypeEnum } from '@event-management/shared';
import { AlertTriangle } from 'lucide-react';
import { VendorSelector } from './VendorSelector';
import { MaterialSelector } from './MaterialSelector';

interface SubLineItemModalProps {
  eventId: string;
  moduleType: ModuleType;
  parentLineItemId: string;
  lineItem?: LineItem | null;
  statuses: Status[];
  categories: Category[];
  tags: Tag[];
  subLineItemTypes?: SubLineItemType[];
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
  subLineItemTypes = [],
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
  const [itemType, setItemType] = useState<'rental' | 'owned' | ''>(''); // 'rental' = from vendor, 'owned' = from materials
  const [selectedVendor, setSelectedVendor] = useState<{ id: string; name: string; description?: string } | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<{ id: string; name: string; description?: string } | null>(null);
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
    // Reset form when modal opens/closes or lineItem changes
    if (!lineItem) {
      // Reset to defaults when creating new
      setFormData({
        name: '',
        description: '',
        plannedCost: '',
        actualCost: '',
        statusId: statuses.find(s => s.isDefault)?.id || statuses[0]?.id || '',
        categoryId: '',
        tagIds: [],
        metadata: {},
      });
      setItemType('');
      setSelectedVendor(null);
      setSelectedMaterial(null);
    }

    // Fetch parent item to get total planned cost
    if (parentLineItemId) {
      lineItemsApi.getById(parentLineItemId).then((response) => {
        setParentItem(response.data);
      }).catch(console.error);
    }

    if (lineItem) {
      const metadata = (lineItem.metadata as Record<string, any>) || {};
      setFormData({
        name: lineItem.name,
        description: lineItem.description || '',
        plannedCost: lineItem.plannedCost?.toString() || '',
        actualCost: lineItem.actualCost?.toString() || '',
        statusId: lineItem.status?.id || '',
        categoryId: lineItem.category?.id || '',
        tagIds: lineItem.tags.map(t => t.id),
        metadata: metadata,
      });
      // Set item type and vendor/material from metadata
      if (metadata.vendorId) {
        setItemType('rental');
        // Try to fetch vendor details, fallback to metadata
        modulesApi.getGlobalModuleLineItems(ModuleTypeEnum.VENDORS_SUPPLIERS)
          .then(response => {
            const vendor = response.data.find((v: LineItem) => v.id === metadata.vendorId);
            if (vendor) {
              setSelectedVendor({
                id: vendor.id,
                name: vendor.name,
                description: vendor.description || metadata.vendorDescription,
              });
            } else {
              // Fallback to metadata
              setSelectedVendor({ 
                id: metadata.vendorId, 
                name: metadata.vendorName || lineItem.name,
                description: metadata.vendorDescription 
              });
            }
          })
          .catch(() => {
            // Fallback to metadata if fetch fails
            setSelectedVendor({ 
              id: metadata.vendorId, 
              name: metadata.vendorName || lineItem.name,
              description: metadata.vendorDescription 
            });
          });
      } else if (metadata.materialId) {
        setItemType('owned');
        // Try to fetch material details, fallback to metadata
        modulesApi.getGlobalModuleLineItems(ModuleTypeEnum.MATERIALS_STOCK)
          .then(response => {
            const material = response.data.find((m: LineItem) => m.id === metadata.materialId);
            if (material) {
              setSelectedMaterial({
                id: material.id,
                name: material.name,
                description: material.description || metadata.materialDescription,
              });
            } else {
              // Fallback to metadata
              setSelectedMaterial({ 
                id: metadata.materialId, 
                name: metadata.materialName || lineItem.name,
                description: metadata.materialDescription 
              });
            }
          })
          .catch(() => {
            // Fallback to metadata if fetch fails
            setSelectedMaterial({ 
              id: metadata.materialId, 
              name: metadata.materialName || lineItem.name,
              description: metadata.materialDescription 
            });
          });
      } else {
        setItemType('');
        setSelectedVendor(null);
        setSelectedMaterial(null);
      }
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
    
    // Check if planned cost exceeds parent's total planned cost (only for non-staff-pool modules)
    if (parentItem && formData.plannedCost && !pendingSubmit && moduleType !== ModuleTypeEnum.STAFF_POOL) {
      const totalPlanned = await calculateTotalPlannedCost();
      const parentPlannedCost = parentItem.plannedCost || 0;
      
      if (totalPlanned > parentPlannedCost) {
        setShowWarning(true);
        setPendingSubmit(true);
        return;
      }
    }

    try {
      // Prepare metadata with vendor/material references
      const metadata: Record<string, any> = { ...formData.metadata };
      if (itemType === 'rental' && selectedVendor) {
        metadata.vendorId = selectedVendor.id;
        metadata.vendorName = selectedVendor.name;
        metadata.vendorDescription = selectedVendor.description;
        metadata.itemType = 'rental';
        // Clear material references
        delete metadata.materialId;
        delete metadata.materialName;
        delete metadata.materialDescription;
      } else if (itemType === 'owned' && selectedMaterial) {
        metadata.materialId = selectedMaterial.id;
        metadata.materialName = selectedMaterial.name;
        metadata.materialDescription = selectedMaterial.description;
        metadata.itemType = 'owned';
        // Clear vendor references
        delete metadata.vendorId;
        delete metadata.vendorName;
        delete metadata.vendorDescription;
      } else {
        // Clear both if no type selected
        delete metadata.vendorId;
        delete metadata.vendorName;
        delete metadata.vendorDescription;
        delete metadata.materialId;
        delete metadata.materialName;
        delete metadata.materialDescription;
        delete metadata.itemType;
      }

      const data = {
        moduleType,
        eventId,
        parentLineItemId,
        name: formData.name,
        description: formData.description || undefined,
        plannedCost: formData.plannedCost ? parseFloat(formData.plannedCost) : undefined,
        actualCost: formData.actualCost ? parseFloat(formData.actualCost) : undefined,
        statusId: moduleType !== ModuleTypeEnum.STAFF_POOL ? (formData.statusId || undefined) : undefined,
        categoryId: moduleType !== ModuleTypeEnum.STAFF_POOL ? (formData.categoryId || undefined) : undefined,
        tagIds: moduleType !== ModuleTypeEnum.STAFF_POOL ? formData.tagIds : [],
        metadata: metadata,
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-animate-overlay">
      <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl border border-gray-700 modal-animate-content">
        <h2 className="text-3xl font-bold gradient-text mb-6">
          {moduleType === ModuleTypeEnum.STAFF_POOL
            ? (lineItem ? 'Edit Event Assignment' : 'Add Event Assignment')
            : (lineItem ? 'Edit Sub-line Item' : 'Create Sub-line Item')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Warning Banner - Only show for non-staff-pool modules */}
          {showWarning && parentItem && moduleType !== ModuleTypeEnum.STAFF_POOL && (
            <div className="bg-yellow-500/10 border-l-4 border-yellow-500/50 p-4 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-300 mb-1">
                    Planned Cost Exceeds Total Budget
                  </h3>
                  <p className="text-sm text-yellow-400 mb-3">
                    The total planned cost of all sub-items ({formatCurrency(totalSubItemsPlanned)}) exceeds 
                    the artist's total planned cost ({formatCurrency(parentItem.plannedCost) || formatCurrency(0)}). 
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
                      className="px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cost Summary - Only show for non-staff-pool modules */}
          {parentItem && moduleType !== ModuleTypeEnum.STAFF_POOL && (
            <div className="bg-gray-900/50 p-3 rounded-lg text-sm border border-gray-700/50">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400">Parent Total Planned Cost:</span>
                <span className="font-semibold text-gray-200">
                  {formatCurrency(parentItem.plannedCost) || formatCurrency(0)}
                </span>
              </div>
              {formData.plannedCost && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">This Sub-item Planned Cost:</span>
                  <span className={`font-semibold ${
                    parseFloat(formData.plannedCost) > (parentItem.plannedCost || 0)
                      ? 'text-red-400'
                      : 'text-gray-200'
                  }`}>
                    {formatCurrency(parseFloat(formData.plannedCost))}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quick Select from Default Types */}
          {!lineItem && subLineItemTypes.length > 0 && (
            <div>
              <label className="label">Quick Select from Default Types</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {subLineItemTypes
                  .filter(type => type.isDefault)
                  .sort((a, b) => a.order - b.order)
                  .map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          name: type.name,
                          description: type.description || '',
                        });
                      }}
                      className="flex items-center p-2 border border-gray-700 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors text-left"
                    >
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700">{type.name}</span>
                        {type.description && (
                          <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Item Type Selection (only for Production module) */}
          {moduleType === ModuleTypeEnum.PRODUCTION && (
            <div>
              <label className="label">Item Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="itemType"
                    value="rental"
                    checked={itemType === 'rental'}
                    onChange={(e) => {
                      setItemType('rental');
                      setSelectedMaterial(null);
                      if (!selectedVendor && formData.name) {
                        setFormData({ ...formData, name: '' });
                      }
                    }}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span>Rental (from Vendor/Supplier)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="itemType"
                    value="owned"
                    checked={itemType === 'owned'}
                    onChange={(e) => {
                      setItemType('owned');
                      setSelectedVendor(null);
                      if (!selectedMaterial && formData.name) {
                        setFormData({ ...formData, name: '' });
                      }
                    }}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span>Owned (from Materials & Stock)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="itemType"
                    value=""
                    checked={itemType === ''}
                    onChange={(e) => {
                      setItemType('');
                      setSelectedVendor(null);
                      setSelectedMaterial(null);
                    }}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span>None (Custom Item)</span>
                </label>
              </div>
            </div>
          )}

          {/* Vendor Selector (for rentals) */}
          {moduleType === ModuleTypeEnum.PRODUCTION && itemType === 'rental' && (
            <div>
              <VendorSelector
                label="Select Vendor/Supplier"
                value={selectedVendor}
                onSelect={(vendor) => {
                  setSelectedVendor(vendor);
                  if (vendor) {
                    setFormData({ ...formData, name: vendor.name, description: vendor.description || formData.description });
                  }
                }}
                onCreateNew={async (name, description) => {
                  const response = await lineItemsApi.create({
                    moduleType: ModuleTypeEnum.VENDORS_SUPPLIERS,
                    eventId: eventId,
                    name,
                    description: description || '',
                  });
                  return {
                    id: response.data.id,
                    name: response.data.name,
                    description: response.data.description,
                  };
                }}
                placeholder="Search vendors..."
              />
            </div>
          )}

          {/* Material Selector (for owned items) */}
          {moduleType === ModuleTypeEnum.PRODUCTION && itemType === 'owned' && (
            <div>
              <MaterialSelector
                label="Select Material/Stock"
                value={selectedMaterial}
                onSelect={(material) => {
                  setSelectedMaterial(material);
                  if (material) {
                    setFormData({ ...formData, name: material.name, description: material.description || formData.description });
                  }
                }}
                onCreateNew={async (name, description) => {
                  const response = await lineItemsApi.create({
                    moduleType: ModuleTypeEnum.MATERIALS_STOCK,
                    eventId: eventId,
                    name,
                    description: description || '',
                  });
                  return {
                    id: response.data.id,
                    name: response.data.name,
                    description: response.data.description,
                  };
                }}
                placeholder="Search materials..."
              />
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
            {(itemType === 'rental' && selectedVendor) || (itemType === 'owned' && selectedMaterial) ? (
              <p className="text-xs mt-1 text-gray-500">Name is auto-filled from selection. You can edit if needed.</p>
            ) : null}
          </div>
          <div>
            <label className="label">{moduleType === ModuleTypeEnum.STAFF_POOL ? 'Notes' : 'Description'}</label>
            <textarea
              className="input"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={moduleType === ModuleTypeEnum.STAFF_POOL ? 'Add notes about this event assignment...' : ''}
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
              {parentItem && moduleType !== ModuleTypeEnum.STAFF_POOL && (
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
              {moduleType !== ModuleTypeEnum.STAFF_POOL && (
                <p className="text-xs mt-1 text-gray-500">
                  Will be added to parent actual cost
                </p>
              )}
            </div>
          </div>
          {/* Hide Status, Category, and Tags for Staff Pool sub-items */}
          {moduleType !== ModuleTypeEnum.STAFF_POOL && (
            <>
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
            </>
          )}
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

