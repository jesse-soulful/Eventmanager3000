import { useState, useEffect } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { modulesApi, lineItemsApi } from '../lib/api';
import type { LineItem, ModuleType } from '@event-management/shared';
import { ModuleType as ModuleTypeEnum, StaffRole, STAFF_ROLE_DISPLAY_NAMES } from '@event-management/shared';

interface StaffSelectorProps {
  value?: { id: string; name: string; phone?: string; email?: string } | null;
  role: StaffRole;
  onSelect: (staff: { id: string; name: string; phone?: string; email?: string } | null) => void;
  onCreateNew?: (name: string, phone?: string, email?: string) => Promise<{ id: string; name: string; phone?: string; email?: string }>;
  placeholder?: string;
  label?: string;
}

export function StaffSelector({
  value,
  role,
  onSelect,
  onCreateNew,
  placeholder = 'Select or create staff member',
  label,
}: StaffSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [staffMembers, setStaffMembers] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');

  useEffect(() => {
    if (showDropdown && searchQuery.length > 0) {
      loadStaffMembers();
    } else if (showDropdown) {
      setStaffMembers([]);
    }
  }, [searchQuery, showDropdown]);

  const loadStaffMembers = async () => {
    setLoading(true);
    try {
      const response = await modulesApi.getGlobalModuleLineItems(ModuleTypeEnum.STAFF_POOL);
      const allStaff = response.data;
      
      // Filter by role - check if staff can work as this role
      const filteredStaff = allStaff.filter((staff: LineItem) => {
        const metadata = (staff.metadata as any) || {};
        const canWorkAs = metadata.canWorkAs || [];
        return canWorkAs.includes(role);
      });

      // Filter by search query
      const searchLower = searchQuery.toLowerCase();
      const matchedStaff = filteredStaff.filter((staff: LineItem) => {
        const name = staff.name.toLowerCase();
        const email = ((staff.metadata as any)?.email || '').toLowerCase();
        const phone = ((staff.metadata as any)?.phone || '').toLowerCase();
        return name.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower);
      });

      setStaffMembers(matchedStaff);
    } catch (error) {
      console.error('Failed to load staff members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (staff: LineItem) => {
    const metadata = (staff.metadata as any) || {};
    onSelect({
      id: staff.id,
      name: staff.name,
      phone: metadata.phone,
      email: metadata.email,
    });
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handleCreateNew = async () => {
    if (!newStaffName.trim()) return;
    if (!onCreateNew) return;

    try {
      const newStaff = await onCreateNew(newStaffName, newStaffPhone || undefined, newStaffEmail || undefined);
      onSelect(newStaff);
      setShowCreateForm(false);
      setNewStaffName('');
      setNewStaffPhone('');
      setNewStaffEmail('');
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to create staff member:', error);
      alert('Failed to create staff member. Please try again.');
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
              {value.phone && <div className="text-sm text-gray-400">{value.phone}</div>}
              {value.email && <div className="text-sm text-gray-400">{value.email}</div>}
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
                  Create new {STAFF_ROLE_DISPLAY_NAMES[role]}
                </button>
              </div>
            ) : staffMembers.length === 0 ? (
              <div className="p-4">
                <div className="text-sm text-gray-400 mb-2">No staff found</div>
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
                {staffMembers.map((staff) => {
                  const metadata = (staff.metadata as any) || {};
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => handleSelect(staff)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-700/50 border-b border-gray-700/50 last:border-b-0 transition-colors text-gray-200"
                    >
                      <div className="font-medium text-gray-200">{staff.name}</div>
                      {metadata.phone && <div className="text-sm text-gray-400">{metadata.phone}</div>}
                      {metadata.email && <div className="text-sm text-gray-400">{metadata.email}</div>}
                    </button>
                  );
                })}
                <div className="border-t border-gray-700/50 p-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create new staff member
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {showCreateForm && (
          <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700/50 rounded-lg shadow-2xl p-4 backdrop-blur-sm">
            <h4 className="font-semibold mb-3 text-gray-200">Create New Staff Member</h4>
            <div className="space-y-3">
              <input
                type="text"
                className="input"
                placeholder="Name *"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                autoFocus
              />
              <input
                type="tel"
                className="input"
                placeholder="Phone"
                value={newStaffPhone}
                onChange={(e) => setNewStaffPhone(e.target.value)}
              />
              <input
                type="email"
                className="input"
                placeholder="Email"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateNew}
                  disabled={!newStaffName.trim()}
                  className="btn btn-primary btn-sm flex-1"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewStaffName('');
                    setNewStaffPhone('');
                    setNewStaffEmail('');
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



