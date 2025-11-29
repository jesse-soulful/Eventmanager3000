import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { statusesApi, categoriesApi, tagsApi } from '../lib/api';
import type { Status, Category, Tag, ModuleType } from '@event-management/shared';
import { MODULE_DISPLAY_NAMES } from '@event-management/shared';
import { StatusModal } from '../components/StatusModal';
import { CategoryModal } from '../components/CategoryModal';
import { TagModal } from '../components/TagModal';

const MODULE_TYPES: ModuleType[] = [
  'ARTISTS',
  'VENDORS',
  'MATERIALS',
  'FOOD_BEVERAGE',
  'SPONSORS',
  'MARKETING',
];

export function ManageMetadataPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [activeTab, setActiveTab] = useState<'statuses' | 'categories' | 'tags'>('statuses');
  const [selectedModule, setSelectedModule] = useState<ModuleType>('ARTISTS');
  
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId, selectedModule]);

  const loadData = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const [statusesRes, categoriesRes, tagsRes] = await Promise.all([
        statusesApi.getByModule(eventId, selectedModule),
        categoriesApi.getByModule(eventId, selectedModule),
        tagsApi.getByModule(eventId, selectedModule),
      ]);
      setStatuses(statusesRes.data);
      setCategories(categoriesRes.data);
      setTags(tagsRes.data);
    } catch (error) {
      console.error('Failed to load metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStatus = () => {
    setEditingStatus(null);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = (status: Status) => {
    setEditingStatus(status);
    setShowStatusModal(true);
  };

  const handleSaveStatus = async (data: { name: string; color: string; isDefault: boolean; order: number }) => {
    if (!eventId) return;
    try {
      if (editingStatus) {
        await statusesApi.update(editingStatus.id, {
          ...data,
          order: editingStatus.order,
        });
      } else {
        await statusesApi.create({
          eventId,
          moduleType: selectedModule,
          ...data,
          order: statuses.length,
        });
      }
      setShowStatusModal(false);
      setEditingStatus(null);
      loadData();
    } catch (error) {
      console.error('Failed to save status:', error);
      alert('Failed to save status');
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
    if (!eventId) return;
    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, data);
      } else {
        await categoriesApi.create({
          eventId,
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
    if (!eventId) return;
    try {
      if (editingTag) {
        await tagsApi.update(editingTag.id, data);
      } else {
        await tagsApi.create({
          eventId,
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

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold gradient-text mb-2">Manage Metadata</h1>
        <p className="text-gray-600">Manage statuses, categories, and tags for line items</p>
      </div>

      {/* Module Selector */}
      <div className="card mb-6">
        <label className="label mb-3">Select Module</label>
        <div className="flex flex-wrap gap-2">
          {MODULE_TYPES.map((moduleType) => (
            <button
              key={moduleType}
              onClick={() => setSelectedModule(moduleType)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedModule === moduleType
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {MODULE_DISPLAY_NAMES[moduleType]}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('statuses')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'statuses'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Statuses ({statuses.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'tags'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Tags ({tags.length})
        </button>
      </div>

      {/* Statuses Tab */}
      {activeTab === 'statuses' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Statuses</h2>
            <button onClick={handleCreateStatus} className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Status
            </button>
          </div>
          <div className="space-y-2">
            {statuses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No statuses yet. Create one to get started.</p>
            ) : (
              statuses.map((status) => (
                <div
                  key={status.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="font-medium text-gray-900">{status.name}</span>
                    {status.isDefault && (
                      <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(status)}
                      className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStatus(status.id)}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
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

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Categories</h2>
            <button onClick={handleCreateCategory} className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </button>
          </div>
          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No categories yet. Create one to get started.</p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateCategory(category)}
                      className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
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
            <h2 className="text-xl font-bold text-gray-900">Tags</h2>
            <button onClick={handleCreateTag} className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Tag
            </button>
          </div>
          <div className="space-y-2">
            {tags.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tags yet. Create one to get started.</p>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="font-medium text-gray-900">{tag.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateTag(tag)}
                      className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
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

      {/* Modals */}
      {showStatusModal && (
        <StatusModal
          status={editingStatus}
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
    </div>
  );
}

