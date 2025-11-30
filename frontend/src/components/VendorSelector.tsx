import { useState, useEffect } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { modulesApi, lineItemsApi } from '../lib/api';
import type { LineItem, ModuleType } from '@event-management/shared';
import { ModuleType as ModuleTypeEnum } from '@event-management/shared';

interface VendorSelectorProps {
  value?: { id: string; name: string; description?: string } | null;
  onSelect: (vendor: { id: string; name: string; description?: string } | null) => void;
  onCreateNew?: (name: string, description?: string) => Promise<{ id: string; name: string; description?: string }>;
  placeholder?: string;
  label?: string;
}

export function VendorSelector({
  value,
  onSelect,
  onCreateNew,
  placeholder = 'Select or create vendor',
  label,
}: VendorSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [vendors, setVendors] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorDescription, setNewVendorDescription] = useState('');

  useEffect(() => {
    if (showDropdown && searchQuery.length > 0) {
      loadVendors();
    } else if (showDropdown) {
      setVendors([]);
    }
  }, [searchQuery, showDropdown]);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const response = await modulesApi.getGlobalModuleLineItems(ModuleTypeEnum.VENDORS_SUPPLIERS);
      const allVendors = response.data;
      
      // Filter by search query
      const searchLower = searchQuery.toLowerCase();
      const matchedVendors = allVendors.filter((vendor: LineItem) => {
        const name = vendor.name.toLowerCase();
        const description = (vendor.description || '').toLowerCase();
        return name.includes(searchLower) || description.includes(searchLower);
      });

      setVendors(matchedVendors);
    } catch (error) {
      console.error('Failed to load vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (vendor: LineItem) => {
    onSelect({
      id: vendor.id,
      name: vendor.name,
      description: vendor.description,
    });
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handleCreateNew = async () => {
    if (!newVendorName.trim()) return;
    if (!onCreateNew) return;

    try {
      const newVendor = await onCreateNew(newVendorName, newVendorDescription || undefined);
      onSelect(newVendor);
      setShowCreateForm(false);
      setNewVendorName('');
      setNewVendorDescription('');
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to create vendor:', error);
      alert('Failed to create vendor. Please try again.');
    }
  };

  const handleClear = () => {
    onSelect(null);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {value ? (
          <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
            <div>
              <div className="font-medium text-gray-900">{value.name}</div>
              {value.description && <div className="text-sm text-gray-600">{value.description}</div>}
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              className="input"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        )}

        {showDropdown && !value && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : searchQuery.length === 0 ? (
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-primary-600 hover:bg-primary-50 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Create new vendor
                </button>
              </div>
            ) : vendors.length === 0 ? (
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-2">No vendors found</div>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-primary-600 hover:bg-primary-50 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Create "{searchQuery}"
                </button>
              </div>
            ) : (
              <>
                {vendors.map((vendor) => (
                  <button
                    key={vendor.id}
                    type="button"
                    onClick={() => handleSelect(vendor)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{vendor.name}</div>
                    {vendor.description && <div className="text-sm text-gray-600">{vendor.description}</div>}
                  </button>
                ))}
                <div className="border-t border-gray-200 p-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-primary-600 hover:bg-primary-50 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Create new vendor
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {showCreateForm && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
            <h4 className="font-semibold mb-3">Create New Vendor</h4>
            <div className="space-y-3">
              <input
                type="text"
                className="input"
                placeholder="Vendor Name *"
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                autoFocus
              />
              <textarea
                className="input"
                placeholder="Description"
                rows={2}
                value={newVendorDescription}
                onChange={(e) => setNewVendorDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateNew}
                  disabled={!newVendorName.trim()}
                  className="btn btn-primary btn-sm flex-1"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewVendorName('');
                    setNewVendorDescription('');
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowDropdown(false);
            setShowCreateForm(false);
            setSearchQuery('');
          }}
        />
      )}
    </div>
  );
}

