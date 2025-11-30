import { useState, useEffect } from 'react';
import { lineItemsApi, subLineItemTypesApi, documentsApi } from '../lib/api';
import type { LineItem, Status, Category, Tag, ModuleType, SubLineItemType } from '@event-management/shared';
import { Upload, X, File, Plus } from 'lucide-react';
import { SubLineItemModal } from './SubLineItemModal';

interface ArtistLineItemModalProps {
  eventId: string;
  moduleType: ModuleType;
  lineItem?: LineItem | null;
  statuses: Status[];
  categories: Category[];
  tags: Tag[];
  subLineItemTypes: SubLineItemType[];
  onClose: () => void;
  onSave: () => void;
}

// DEFAULT_SUB_ITEMS removed - now using configured subLineItemTypes from metadata

export function ArtistLineItemModal({
  eventId,
  moduleType,
  lineItem,
  statuses,
  categories,
  tags,
  subLineItemTypes,
  onClose,
  onSave,
}: ArtistLineItemModalProps) {
  const [formData, setFormData] = useState({
    artistName: '',
    plannedTotalCost: '',
    statusId: statuses.find(s => s.isDefault)?.id || statuses[0]?.id || '',
    categoryId: '',
    tagIds: [] as string[],
    agentContact: '',
    selectedSubItems: [] as string[],
    documents: [] as { name: string; file: File; url?: string }[],
  });
  const [showSubItemModal, setShowSubItemModal] = useState(false);
  const [editingSubItem, setEditingSubItem] = useState<LineItem | null>(null);
  const [tempArtistId, setTempArtistId] = useState<string | null>(null);

  useEffect(() => {
    if (lineItem) {
      const metadata = (lineItem.metadata as Record<string, any>) || {};
      setFormData(prev => ({
        artistName: metadata.artistName || lineItem.name || '',
        plannedTotalCost: lineItem.plannedCost?.toString() || '',
        statusId: lineItem.status?.id || prev.statusId || statuses.find(s => s.isDefault)?.id || statuses[0]?.id || '',
        categoryId: lineItem.category?.id || prev.categoryId || '',
        tagIds: lineItem.tags.map(t => t.id),
        agentContact: metadata.agentContact || '',
        selectedSubItems: lineItem.subLineItems?.map(item => item.name) || [],
        documents: metadata.documents || [],
      }));
    } else {
      // Reset form when creating new artist - update statusId when statuses are loaded
      setFormData(prev => ({
        ...prev,
        statusId: statuses.find(s => s.isDefault)?.id || statuses[0]?.id || prev.statusId || '',
      }));
    }
  }, [lineItem, statuses]);

  // Debug: Log props when they change
  useEffect(() => {
    console.log('🔵 ArtistLineItemModal props:', {
      statusesLength: statuses.length,
      statuses: statuses.map(s => ({ id: s.id, name: s.name, isDefault: s.isDefault })),
      subLineItemTypesLength: subLineItemTypes.length,
      subLineItemTypes: subLineItemTypes.map(t => ({ id: t.id, name: t.name, moduleType: t.moduleType })),
      formDataStatusId: formData.statusId,
      formDataSelectedSubItems: formData.selectedSubItems,
    });
  }, [statuses, subLineItemTypes]);

  // Update formData when statuses are loaded (for new artists)
  useEffect(() => {
    if (!lineItem && statuses.length > 0 && !formData.statusId) {
      const defaultStatusId = statuses.find(s => s.isDefault)?.id || statuses[0]?.id || '';
      if (defaultStatusId) {
        console.log('🔵 Setting default statusId:', defaultStatusId);
        setFormData(prev => ({ ...prev, statusId: defaultStatusId }));
      }
    }
  }, [statuses, lineItem, formData.statusId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newDocuments = files.map(file => ({
      name: file.name,
      file,
    }));
    setFormData({
      ...formData,
      documents: [...formData.documents, ...newDocuments],
    });
  };

  const removeDocument = (index: number) => {
    setFormData({
      ...formData,
      documents: formData.documents.filter((_, i) => i !== index),
    });
  };

  const toggleSubItem = (itemName: string) => {
    setFormData({
      ...formData,
      selectedSubItems: formData.selectedSubItems.includes(itemName)
        ? formData.selectedSubItems.filter(name => name !== itemName)
        : [...formData.selectedSubItems, itemName],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let artistLineItem: LineItem;
      if (lineItem) {
        // Update: Don't send moduleType or eventId (they can't be changed)
        const artistData = {
          name: formData.artistName,
          plannedCost: formData.plannedTotalCost ? parseFloat(formData.plannedTotalCost) : undefined,
          statusId: formData.statusId || undefined,
          categoryId: formData.categoryId || undefined,
          tagIds: formData.tagIds,
          metadata: {
            artistName: formData.artistName,
            agentContact: formData.agentContact,
            documents: formData.documents.map(doc => ({
              name: doc.name,
              url: doc.url, // In production, this would be the uploaded file URL
            })),
          },
        };
        console.log('🔵 Updating artist with data:', artistData);
        const updated = await lineItemsApi.update(lineItem.id, artistData);
        artistLineItem = updated.data;
      } else {
        // Create: Include moduleType and eventId
        const createData = {
          moduleType,
          eventId,
          name: formData.artistName,
          plannedCost: formData.plannedTotalCost ? parseFloat(formData.plannedTotalCost) : undefined,
          statusId: formData.statusId || undefined,
          categoryId: formData.categoryId || undefined,
          tagIds: formData.tagIds,
          metadata: {
            artistName: formData.artistName,
            agentContact: formData.agentContact,
            documents: formData.documents.map(doc => ({
              name: doc.name,
              url: doc.url, // In production, this would be the uploaded file URL
            })),
          },
        };
        const created = await lineItemsApi.create(createData);
        artistLineItem = created.data;
        // Store the ID for ad-hoc sub-item creation
        setTempArtistId(artistLineItem.id);
      }

      // Upload documents if any
      if (formData.documents.length > 0 && formData.documents.some(doc => doc.file)) {
        const filesToUpload = formData.documents.filter(doc => doc.file).map(doc => doc.file!);
        try {
          await documentsApi.upload(artistLineItem.id, filesToUpload);
        } catch (error) {
          console.error('Failed to upload documents:', error);
          // Continue even if upload fails
        }
      }

      // Create sub-line items for selected checkboxes
      if (formData.selectedSubItems.length > 0) {
        const existingSubItems = lineItem?.subLineItems || [];
        const existingNames = existingSubItems.map(item => item.name);

        for (const subItemName of formData.selectedSubItems) {
          // Only create if it doesn't already exist
          if (!existingNames.includes(subItemName)) {
            // Find matching sub-line item type
            const subItemType = subLineItemTypes.find(type => type.name === subItemName);
            
            await lineItemsApi.create({
              moduleType,
              eventId,
              parentLineItemId: artistLineItem.id,
              name: subItemName,
              plannedCost: 0,
              // Don't pass statusId - let backend find default sub status
              statusId: undefined,
              metadata: {
                subItemType: subItemType?.id,
              },
            });
          }
        }
      }

      onSave();
    } catch (error) {
      console.error('Failed to save artist:', error);
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-3xl font-bold gradient-text mb-6">
          {lineItem ? 'Edit Artist' : 'Add Artist'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Artist Name */}
          <div>
            <label className="label">Artist Name *</label>
            <input
              type="text"
              required
              className="input"
              value={formData.artistName}
              onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
              placeholder="Enter artist name"
            />
          </div>

          {/* Planned Total Cost */}
          <div>
            <label className="label">Planned Total Cost</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={formData.plannedTotalCost}
              onChange={(e) => setFormData({ ...formData, plannedTotalCost: e.target.value })}
              placeholder="0.00"
            />
          </div>

          {/* Sub-items Checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">Sub-items to Include</label>
              <button
                type="button"
                onClick={() => {
                  if (lineItem?.id) {
                    setTempArtistId(null);
                    setEditingSubItem(null);
                    setShowSubItemModal(true);
                  } else if (tempArtistId) {
                    setEditingSubItem(null);
                    setShowSubItemModal(true);
                  } else {
                    // Artist not created yet, need to create first
                    alert('Please create the artist first, then you can add ad-hoc sub-items.');
                  }
                }}
                disabled={!lineItem?.id && !tempArtistId}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add Ad Hoc Sub-item
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Debug: Show count */}
              {process.env.NODE_ENV === 'development' && (
                <div className="col-span-2 text-xs text-gray-400 mb-2">
                  Debug: subLineItemTypes.length = {subLineItemTypes.length}, statuses.length = {statuses.length}
                </div>
              )}
              {subLineItemTypes.length === 0 ? (
                <div className="col-span-2 text-center py-4">
                  <p className="text-sm text-gray-500 mb-2">
                    {statuses.length === 0 ? 'Loading sub-line item types...' : 'No sub-line item types configured for Artists.'}
                  </p>
                  {statuses.length > 0 && (
                    <p className="text-xs text-gray-400">
                      Go to <strong>Manage Metadata</strong> → <strong>Sub-Line Item Types</strong> to add them.
                    </p>
                  )}
                </div>
              ) : (
                subLineItemTypes.map((type) => (
                  <label
                    key={type.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedSubItems.includes(type.name)}
                      onChange={() => toggleSubItem(type.name)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div className="ml-3 flex-1">
                      <span className="text-sm font-medium text-gray-700">{type.name}</span>
                      {type.description && (
                        <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                      )}
                    </div>
                    {type.isDefault && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                        Default
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Agent Contact */}
          <div>
            <label className="label">Agent Contact</label>
            <input
              type="text"
              className="input"
              value={formData.agentContact}
              onChange={(e) => setFormData({ ...formData, agentContact: e.target.value })}
              placeholder="Name, email, phone"
            />
          </div>

          {/* Document Upload */}
          <div>
            <label className="label">Documents</label>
            <div className="mt-2">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX, Images (MAX. 10MB each)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
            {formData.documents.length > 0 && (
              <div className="mt-4 space-y-2">
                {formData.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <File className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-700">{doc.name}</span>
                      {doc.url && (
                        <a
                          href={`http://localhost:3001/api/documents/file/${doc.url.split('/').pop()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:text-primary-800 ml-2"
                        >
                          View
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="label">Status</label>
            {statuses.length === 0 ? (
              <div className="text-sm text-gray-500 italic">Loading statuses...</div>
            ) : (
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
            )}
          </div>

          {/* Category */}
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

          {/* Tags */}
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

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {lineItem ? 'Update Artist' : 'Create Artist'}
            </button>
          </div>
        </form>

        {/* Sub-line Item Modal */}
        {showSubItemModal && (lineItem?.id || tempArtistId) && (
          <SubLineItemModal
            eventId={eventId}
            moduleType={moduleType}
            parentLineItemId={lineItem?.id || tempArtistId!}
            lineItem={editingSubItem}
            statuses={statuses}
            categories={categories}
            tags={tags}
            onClose={() => {
              setShowSubItemModal(false);
              setEditingSubItem(null);
              setTempArtistId(null);
            }}
            onSave={() => {
              setShowSubItemModal(false);
              setEditingSubItem(null);
              // Refresh to show new sub-items
              onSave();
            }}
          />
        )}
      </div>
    </div>
  );
}

