import { useState, useEffect } from 'react';
import { Plus, Search, X, Building2 } from 'lucide-react';
import { modulesApi, lineItemsApi } from '../lib/api';
import type { LineItem } from '@event-management/shared';
import { ModuleType as ModuleTypeEnum } from '@event-management/shared';

interface VenueSelectorProps {
  value?: { id: string; name: string; address?: string; capacity?: number } | null;
  onSelect: (venue: { id: string; name: string; address?: string; capacity?: number } | null) => void;
  onCreateNew?: (name: string, address?: string, capacity?: number) => Promise<{ id: string; name: string; address?: string; capacity?: number }>;
  placeholder?: string;
  label?: string;
}

export function VenueSelector({
  value,
  onSelect,
  onCreateNew,
  placeholder = 'Select or create venue',
  label,
}: VenueSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [venues, setVenues] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueAddress, setNewVenueAddress] = useState('');
  const [newVenueCapacity, setNewVenueCapacity] = useState('');

  useEffect(() => {
    if (showDropdown && searchQuery.length > 0) {
      loadVenues();
    } else if (showDropdown) {
      setVenues([]);
    }
  }, [searchQuery, showDropdown]);

  const loadVenues = async () => {
    setLoading(true);
    try {
      const response = await modulesApi.getGlobalModuleLineItems(ModuleTypeEnum.VENDORS_SUPPLIERS);
      const allVenues = response.data;
      
      // Filter by search query
      const searchLower = searchQuery.toLowerCase();
      const matchedVenues = allVenues.filter((venue: LineItem) => {
        const name = venue.name.toLowerCase();
        const description = (venue.description || '').toLowerCase();
        const metadata = (venue.metadata as any) || {};
        const address = (metadata.address || '').toLowerCase();
        return name.includes(searchLower) || description.includes(searchLower) || address.includes(searchLower);
      });

      setVenues(matchedVenues);
    } catch (error) {
      console.error('Failed to load venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (venue: LineItem) => {
    const metadata = (venue.metadata as any) || {};
    onSelect({
      id: venue.id,
      name: venue.name,
      address: metadata.address || venue.description || undefined,
      capacity: metadata.capacity || undefined,
    });
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handleCreateNew = async () => {
    if (!newVenueName.trim()) return;
    if (!onCreateNew) return;

    try {
      const capacity = newVenueCapacity ? parseInt(newVenueCapacity) : undefined;
      const newVenue = await onCreateNew(newVenueName, newVenueAddress || undefined, capacity);
      onSelect(newVenue);
      setShowCreateForm(false);
      setNewVenueName('');
      setNewVenueAddress('');
      setNewVenueCapacity('');
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to create venue:', error);
      alert('Failed to create venue. Please try again.');
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
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-medium text-gray-900">{value.name}</div>
                {value.address && <div className="text-sm text-gray-600">{value.address}</div>}
                {value.capacity && <div className="text-sm text-gray-500">Capacity: {value.capacity.toLocaleString()}</div>}
              </div>
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
                  Create new venue
                </button>
              </div>
            ) : venues.length === 0 ? (
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-2">No venues found</div>
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
                {venues.map((venue) => {
                  const metadata = (venue.metadata as any) || {};
                  return (
                    <button
                      key={venue.id}
                      type="button"
                      onClick={() => handleSelect(venue)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{venue.name}</div>
                      {(metadata.address || venue.description) && (
                        <div className="text-sm text-gray-600">{metadata.address || venue.description}</div>
                      )}
                      {metadata.capacity && (
                        <div className="text-sm text-gray-500">Capacity: {metadata.capacity.toLocaleString()}</div>
                      )}
                    </button>
                  );
                })}
                <div className="border-t border-gray-200 p-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-primary-600 hover:bg-primary-50 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Create new venue
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {showCreateForm && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
            <h4 className="font-semibold mb-3">Create New Venue</h4>
            <div className="space-y-3">
              <input
                type="text"
                className="input"
                placeholder="Venue Name *"
                value={newVenueName}
                onChange={(e) => setNewVenueName(e.target.value)}
                autoFocus
              />
              <input
                type="text"
                className="input"
                placeholder="Address"
                value={newVenueAddress}
                onChange={(e) => setNewVenueAddress(e.target.value)}
              />
              <input
                type="number"
                className="input"
                placeholder="Capacity"
                value={newVenueCapacity}
                onChange={(e) => setNewVenueCapacity(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateNew}
                  disabled={!newVenueName.trim()}
                  className="btn btn-primary btn-sm flex-1"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewVenueName('');
                    setNewVenueAddress('');
                    setNewVenueCapacity('');
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

