import { useState, useEffect } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { modulesApi, lineItemsApi } from '../lib/api';
import type { LineItem, ModuleType } from '@event-management/shared';
import { ModuleType as ModuleTypeEnum } from '@event-management/shared';

interface MaterialSelectorProps {
  value?: { id: string; name: string; description?: string } | null;
  onSelect: (material: { id: string; name: string; description?: string } | null) => void;
  onCreateNew?: (name: string, description?: string) => Promise<{ id: string; name: string; description?: string }>;
  placeholder?: string;
  label?: string;
}

export function MaterialSelector({
  value,
  onSelect,
  onCreateNew,
  placeholder = 'Select or create material',
  label,
}: MaterialSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [materials, setMaterials] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialDescription, setNewMaterialDescription] = useState('');

  useEffect(() => {
    if (showDropdown && searchQuery.length > 0) {
      loadMaterials();
    } else if (showDropdown) {
      setMaterials([]);
    }
  }, [searchQuery, showDropdown]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const response = await modulesApi.getGlobalModuleLineItems(ModuleTypeEnum.MATERIALS_STOCK);
      const allMaterials = response.data;
      
      // Filter by search query
      const searchLower = searchQuery.toLowerCase();
      const matchedMaterials = allMaterials.filter((material: LineItem) => {
        const name = material.name.toLowerCase();
        const description = (material.description || '').toLowerCase();
        return name.includes(searchLower) || description.includes(searchLower);
      });

      setMaterials(matchedMaterials);
    } catch (error) {
      console.error('Failed to load materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (material: LineItem) => {
    onSelect({
      id: material.id,
      name: material.name,
      description: material.description,
    });
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handleCreateNew = async () => {
    if (!newMaterialName.trim()) return;
    if (!onCreateNew) return;

    try {
      const newMaterial = await onCreateNew(newMaterialName, newMaterialDescription || undefined);
      onSelect(newMaterial);
      setShowCreateForm(false);
      setNewMaterialName('');
      setNewMaterialDescription('');
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to create material:', error);
      alert('Failed to create material. Please try again.');
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
          <div className="flex items-center justify-between p-3 border border-gray-700 rounded-lg bg-gray-800/50">
            <div>
              <div className="font-medium text-gray-200">{value.name}</div>
              {value.description && <div className="text-sm text-gray-400">{value.description}</div>}
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-200 transition-colors"
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
          <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700/50 rounded-lg shadow-2xl max-h-60 overflow-y-auto backdrop-blur-sm">
            {loading ? (
              <div className="p-4 text-center text-gray-400">Loading...</div>
            ) : searchQuery.length === 0 ? (
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create new material
                </button>
              </div>
            ) : materials.length === 0 ? (
              <div className="p-4">
                <div className="text-sm text-gray-400 mb-2">No materials found</div>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create "{searchQuery}"
                </button>
              </div>
            ) : (
              <>
                {materials.map((material) => (
                  <button
                    key={material.id}
                    type="button"
                    onClick={() => handleSelect(material)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-700/50 border-b border-gray-700/50 last:border-b-0 transition-colors text-gray-200"
                  >
                    <div className="font-medium text-gray-200">{material.name}</div>
                    {material.description && <div className="text-sm text-gray-400">{material.description}</div>}
                  </button>
                ))}
                <div className="border-t border-gray-700/50 p-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create new material
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {showCreateForm && (
          <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700/50 rounded-lg shadow-2xl p-4 backdrop-blur-sm">
            <h4 className="font-semibold mb-3 text-gray-200">Create New Material</h4>
            <div className="space-y-3">
              <input
                type="text"
                className="input"
                placeholder="Material Name *"
                value={newMaterialName}
                onChange={(e) => setNewMaterialName(e.target.value)}
                autoFocus
              />
              <textarea
                className="input"
                placeholder="Description"
                rows={2}
                value={newMaterialDescription}
                onChange={(e) => setNewMaterialDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateNew}
                  disabled={!newMaterialName.trim()}
                  className="btn btn-primary btn-sm flex-1"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewMaterialName('');
                    setNewMaterialDescription('');
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



