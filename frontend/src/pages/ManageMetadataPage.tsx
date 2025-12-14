import { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { statusesApi, categoriesApi, tagsApi, subLineItemTypesApi } from '../lib/api';
import type { Status, Category, Tag, SubLineItemType, ModuleType, StatusItemType } from '@event-management/shared';
import { MODULE_DISPLAY_NAMES, ModuleType as ModuleTypeEnum, EVENT_SCOPED_MODULES, GLOBAL_MODULES } from '@event-management/shared';
import { StatusModal } from '../components/StatusModal';
import { CategoryModal } from '../components/CategoryModal';
import { TagModal } from '../components/TagModal';
import { SubLineItemTypeModal } from '../components/SubLineItemTypeModal';
import { UserManagement } from '../components/UserManagement';
import { useAuth } from '../contexts/AuthContext';

const MODULE_TYPES: ModuleType[] = [
  ...EVENT_SCOPED_MODULES,
  ...GLOBAL_MODULES,
];

export function ManageMetadataPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<'statuses' | 'categories' | 'tags' | 'subLineItemTypes' | 'users'>('statuses');
  const [selectedModule, setSelectedModule] = useState<ModuleType>(ModuleTypeEnum.ARTISTS);
  
  const [mainStatuses, setMainStatuses] = useState<Status[]>([]);
  const [subStatuses, setSubStatuses] = useState<Status[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [subLineItemTypes, setSubLineItemTypes] = useState<SubLineItemType[]>([]);
  
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [editingStatusItemType, setEditingStatusItemType] = useState<StatusItemType>('main');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editingSubLineItemType, setEditingSubLineItemType] = useState<SubLineItemType | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showSubLineItemTypeModal, setShowSubLineItemTypeModal] = useState(false);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedModule]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mainStatusesRes, subStatusesRes, categoriesRes, tagsRes, subLineItemTypesRes] = await Promise.all([
        statusesApi.getByModule(selectedModule, 'main'),
        statusesApi.getByModule(selectedModule, 'sub'),
        categoriesApi.getByModule(selectedModule),
        tagsApi.getByModule(selectedModule),
        subLineItemTypesApi.getByModule(selectedModule),
      ]);
      setMainStatuses(mainStatusesRes.data);
      setSubStatuses(subStatusesRes.data);
      setCategories(categoriesRes.data);
      setTags(tagsRes.data);
      setSubLineItemTypes(subLineItemTypesRes.data);
    } catch (error) {
      console.error('Failed to load metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStatus = (itemType: StatusItemType) => {
    setEditingStatus(null);
    setEditingStatusItemType(itemType);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = (status: Status) => {
    setEditingStatus(status);
    setEditingStatusItemType(status.itemType);
    setShowStatusModal(true);
  };

  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const savingStatusRef = useRef<string | null>(null); // Track the status being saved

  const handleSaveStatus = async (data: { name: string; color: string; isDefault: boolean; order: number; itemType: StatusItemType }) => {
    // Create a key WITHOUT timestamp for duplicate detection
    const duplicateCheckKey = `${data.name}-${data.itemType}`;
    
    console.log('🚨 handleSaveStatus CALLED:', { name: data.name, itemType: data.itemType, duplicateCheckKey });
    console.log('🚨 Current state:', { isSavingStatus, savingStatusRef: savingStatusRef.current });
    
    // AGGRESSIVE duplicate prevention
    if (isSavingStatus) {
      console.warn('❌ BLOCKED: Already saving');
      return;
    }
    
    // Check if we're already saving this exact status (same name + itemType)
    if (savingStatusRef.current === duplicateCheckKey) {
      console.warn('❌ BLOCKED: Duplicate save attempt for:', duplicateCheckKey);
      return;
    }
    
    // Set flags IMMEDIATELY
    setIsSavingStatus(true);
    savingStatusRef.current = duplicateCheckKey;
    
    // Small delay to ensure state is set
    await new Promise(resolve => setTimeout(resolve, 10));
    
    try {
      console.log('✅ STARTING status creation:', { name: data.name, itemType: data.itemType, duplicateCheckKey });
      console.log('✅ VERIFYING itemType is:', data.itemType, 'type:', typeof data.itemType);
      
      if (editingStatus) {
        await statusesApi.update(editingStatus.id, {
          name: data.name,
          color: data.color,
          isDefault: data.isDefault,
          order: editingStatus.order,
          itemType: data.itemType,
        });
      } else {
            const statusesForType = data.itemType === 'main' ? mainStatuses : subStatuses;
            // Only create ONE status with the specified itemType - NO DUPLICATES
            // eventId is optional - undefined means global metadata
            const createPayload = {
              moduleType: selectedModule,
              name: data.name,
              color: data.color,
              order: statusesForType.length,
              isDefault: data.isDefault,
              itemType: data.itemType as 'main' | 'sub', // Explicitly pass itemType - ONLY ONE
            };
        console.log('📤 Sending create request:', createPayload);
        console.log('📤 VERIFYING payload itemType:', createPayload.itemType, 'type:', typeof createPayload.itemType);
        console.log('📤 About to call statusesApi.create with itemType:', createPayload.itemType);
        const result = await statusesApi.create(createPayload);
        console.log('✅ Status created response:', result.data);
        console.log('✅ Created status itemType:', result.data.itemType);
      }
      
      setShowStatusModal(false);
      setEditingStatus(null);
      savingStatusRef.current = null; // Clear before loadData
      await loadData();
    } catch (error: any) {
      console.error('❌ Failed to save status:', error);
      alert(`Failed to save status: ${error?.response?.data?.error || error.message}`);
      savingStatusRef.current = null;
    } finally {
      setIsSavingStatus(false);
      // Clear ref after delay
      setTimeout(() => {
        savingStatusRef.current = null;
      }, 3000);
    }
  };

  const handleDeleteStatus = async (id: string) => {
    if (!confirm('Are you sure you want to delete this status?')) return;
    try {
      await statusesApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete status:', error);
      alert('Failed to delete status');
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleUpdateCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (data: { name: string; color: string }) => {
    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, data);
      } else {
        await categoriesApi.create({
          moduleType: selectedModule,
          ...data,
        });
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      loadData();
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await categoriesApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  const handleCreateTag = () => {
    setEditingTag(null);
    setShowTagModal(true);
  };

  const handleUpdateTag = (tag: Tag) => {
    setEditingTag(tag);
    setShowTagModal(true);
  };

  const handleSaveTag = async (data: { name: string; color: string }) => {
    try {
      if (editingTag) {
        await tagsApi.update(editingTag.id, data);
      } else {
        await tagsApi.create({
          moduleType: selectedModule,
          ...data,
        });
      }
      setShowTagModal(false);
      setEditingTag(null);
      loadData();
    } catch (error) {
      console.error('Failed to save tag:', error);
      alert('Failed to save tag');
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    try {
      await tagsApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete tag:', error);
      alert('Failed to delete tag');
    }
  };

  const handleCreateSubLineItemType = () => {
    setEditingSubLineItemType(null);
    setShowSubLineItemTypeModal(true);
  };

  const handleUpdateSubLineItemType = (type: SubLineItemType) => {
    setEditingSubLineItemType(type);
    setShowSubLineItemTypeModal(true);
  };

  const handleSaveSubLineItemType = async (data: { name: string; description: string; isDefault: boolean; order: number }) => {
    try {
      if (editingSubLineItemType) {
        await subLineItemTypesApi.update(editingSubLineItemType.id, data);
      } else {
        await subLineItemTypesApi.create({
          moduleType: selectedModule,
          ...data,
        });
      }
      setShowSubLineItemTypeModal(false);
      setEditingSubLineItemType(null);
      loadData();
    } catch (error) {
      console.error('Failed to save sub-line item type:', error);
      alert('Failed to save sub-line item type');
    }
  };

  const handleDeleteSubLineItemType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sub-line item type?')) return;
    try {
      await subLineItemTypesApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete sub-line item type:', error);
      alert('Failed to delete sub-line item type');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manage Metadata</h1>
        <p className="page-subtitle">Manage statuses, categories, and tags for line items</p>
      </div>

      {/* Module Selector - Hidden for Users tab */}
      {activeTab !== 'users' && (
        <div className="card mb-6">
          <label className="label mb-3">Select Module</label>
          <div className="flex flex-wrap gap-2">
            {MODULE_TYPES.map((moduleType) => (
              <button
                key={moduleType}
                onClick={() => setSelectedModule(moduleType)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedModule === moduleType
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
              }`}
              >
                {MODULE_DISPLAY_NAMES[moduleType]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('statuses')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'statuses'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Statuses ({mainStatuses.length + subStatuses.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'tags'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Tags ({tags.length})
        </button>
        <button
          onClick={() => setActiveTab('subLineItemTypes')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'subLineItemTypes'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Sub-Line Item Types ({subLineItemTypes.length})
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Users
          </button>
        )}
      </div>

      {/* Statuses Tab */}
      {activeTab === 'statuses' && (
        <div className="space-y-6">
          {/* Main Line Item Statuses */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-200">Main Line Item Statuses</h2>
                <p className="text-sm text-gray-400 mt-1">Statuses for general line items (e.g., "Draft", "Approved", "Completed")</p>
              </div>
              <button onClick={() => handleCreateStatus('main')} className="btn btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Main Status
              </button>
            </div>
            <div className="space-y-2">
              {mainStatuses.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No main statuses yet. Create one to get started.</p>
              ) : (
                mainStatuses.map((status) => (
                  <div
                    key={status.id}
                    className="sub-item-card"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="font-semibold text-gray-100">{status.name}</span>
                      {status.isDefault && (
                        <span className="px-2.5 py-1 text-xs font-semibold bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="line-item-actions">
                      <button
                        onClick={() => handleUpdateStatus(status)}
                        className="action-btn-primary"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStatus(status.id)}
                        className="action-btn-danger"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sub-Line Item Statuses */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-200">Sub-Line Item Statuses</h2>
                <p className="text-sm text-gray-400 mt-1">Statuses for to-do list items (e.g., "To Do", "In Progress", "Done")</p>
              </div>
              <button onClick={() => handleCreateStatus('sub')} className="btn btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Sub Status
              </button>
            </div>
            <div className="space-y-2">
              {subStatuses.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No sub statuses yet. Create one to get started.</p>
              ) : (
                subStatuses.map((status) => (
                  <div
                    key={status.id}
                    className="sub-item-card"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="font-semibold text-gray-100">{status.name}</span>
                      {status.isDefault && (
                        <span className="px-2.5 py-1 text-xs font-semibold bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="line-item-actions">
                      <button
                        onClick={() => handleUpdateStatus(status)}
                        className="action-btn-primary"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStatus(status.id)}
                        className="action-btn-danger"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-200">Categories</h2>
            <button onClick={handleCreateCategory} className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </button>
          </div>
          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No categories yet. Create one to get started.</p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="sub-item-card"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-semibold text-gray-100">{category.name}</span>
                  </div>
                  <div className="line-item-actions">
                    <button
                      onClick={() => handleUpdateCategory(category)}
                      className="action-btn-primary"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="action-btn-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tags Tab */}
      {activeTab === 'tags' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-200">Tags</h2>
            <button onClick={handleCreateTag} className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Tag
            </button>
          </div>
          <div className="space-y-2">
            {tags.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No tags yet. Create one to get started.</p>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.id}
                  className="sub-item-card"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="font-semibold text-gray-100">{tag.name}</span>
                  </div>
                  <div className="line-item-actions">
                    <button
                      onClick={() => handleUpdateTag(tag)}
                      className="action-btn-primary"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="action-btn-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sub-Line Item Types Tab */}
      {activeTab === 'subLineItemTypes' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Sub-Line Item Types</h2>
            <button onClick={handleCreateSubLineItemType} className="btn btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Sub-Line Item Type
            </button>
          </div>
          {subLineItemTypes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No sub-line item types yet. Create one to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {subLineItemTypes.map((type) => (
                <div
                  key={type.id}
                  className="sub-item-card"
                >
                  <div className="sub-item-content">
                    <div className="sub-item-header">
                      <div className="sub-item-name-section">
                        <h3 className="font-semibold text-gray-100">{type.name}</h3>
                        {type.isDefault && (
                          <span className="px-2.5 py-1 text-xs font-semibold bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                    {type.description && (
                      <p className="text-sm text-gray-300 mt-1 mb-2">{type.description}</p>
                    )}
                    <p className="text-xs text-gray-400 font-medium">Order: {type.order}</p>
                  </div>
                  <div className="line-item-actions">
                    <button
                      onClick={() => handleUpdateSubLineItemType(type)}
                      className="action-btn-primary"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubLineItemType(type.id)}
                      className="action-btn-danger"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Tab - Admin Only */}
      {isAdmin && activeTab === 'users' && (
        <UserManagement />
      )}

      {/* Modals */}
      {showStatusModal && (
        <StatusModal
          status={editingStatus}
          itemType={editingStatusItemType}
          onClose={() => {
            setShowStatusModal(false);
            setEditingStatus(null);
          }}
          onSave={handleSaveStatus}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          onSave={handleSaveCategory}
        />
      )}

      {showTagModal && (
        <TagModal
          tag={editingTag}
          onClose={() => {
            setShowTagModal(false);
            setEditingTag(null);
          }}
          onSave={handleSaveTag}
        />
      )}

      {showSubLineItemTypeModal && (
        <SubLineItemTypeModal
          subLineItemType={editingSubLineItemType}
          onClose={() => {
            setShowSubLineItemTypeModal(false);
            setEditingSubLineItemType(null);
          }}
          onSave={handleSaveSubLineItemType}
        />
      )}
    </div>
  );
}

