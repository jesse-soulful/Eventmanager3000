import { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { eventsApi } from '../lib/api';
import type { Event } from '@event-management/shared';
import { format } from 'date-fns';

interface EventDetailsModalProps {
  event: Event;
  onClose: () => void;
  onSave: () => void;
}

export function EventDetailsModal({ event, onClose, onSave }: EventDetailsModalProps) {
  const [editData, setEditData] = useState<Partial<Event>>(event);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditData(event);
  }, [event]);

  const handleSave = async () => {
    try {
      await eventsApi.update(event.id, {
        ...editData,
        startDate: editData.startDate ? new Date(editData.startDate) : undefined,
        endDate: editData.endDate ? new Date(editData.endDate) : undefined,
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to update event:', error);
      alert('Failed to update event. Please try again.');
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    try {
      await eventsApi.uploadBanner(event.id, file);
      // Reload event data
      const response = await eventsApi.getById(event.id);
      setEditData(response.data);
      onSave();
    } catch (error) {
      console.error('Failed to upload banner:', error);
      alert('Failed to upload banner. Please try again.');
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
    }
  };

  const handleBannerDelete = async () => {
    if (!confirm('Are you sure you want to delete the banner image?')) return;

    try {
      await eventsApi.deleteBanner(event.id);
      const response = await eventsApi.getById(event.id);
      setEditData(response.data);
      onSave();
    } catch (error) {
      console.error('Failed to delete banner:', error);
      alert('Failed to delete banner. Please try again.');
    }
  };

  const getBannerUrl = () => {
    if (!editData?.bannerImageUrl) return null;
    if (editData.bannerImageUrl.startsWith('http')) {
      return editData.bannerImageUrl;
    }
    // Banner URL from backend is already like /api/events/:id/banner/:filename
    if (editData.bannerImageUrl.startsWith('/api/')) {
      return editData.bannerImageUrl;
    }
    return `/api${editData.bannerImageUrl}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold gradient-text">Edit Event Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
          {/* Banner Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
            {getBannerUrl() ? (
              <div className="space-y-3">
                <img
                  src={getBannerUrl() || ''}
                  alt={`${event.name} banner`}
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
                <div className="flex gap-2">
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploadingBanner}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingBanner ? 'Uploading...' : 'Replace Banner'}
                  </button>
                  <button
                    type="button"
                    onClick={handleBannerDelete}
                    disabled={uploadingBanner}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm mb-3">No banner image uploaded</p>
                </div>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingBanner ? 'Uploading...' : 'Upload Banner'}
                </button>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Event Title *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date *</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={editData.startDate ? format(new Date(editData.startDate), 'yyyy-MM-dd') : ''}
                    onChange={(e) => setEditData({ ...editData, startDate: new Date(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="label">End Date *</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={editData.endDate ? format(new Date(editData.endDate), 'yyyy-MM-dd') : ''}
                    onChange={(e) => setEditData({ ...editData, endDate: new Date(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Venue Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Venue Details</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Venue Name</label>
                <input
                  type="text"
                  className="input"
                  value={editData.venueName || ''}
                  onChange={(e) => setEditData({ ...editData, venueName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Venue Address</label>
                <input
                  type="text"
                  className="input"
                  value={editData.venueAddress || ''}
                  onChange={(e) => setEditData({ ...editData, venueAddress: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Venue Capacity</label>
                <input
                  type="number"
                  className="input"
                  value={editData.venueCapacity || ''}
                  onChange={(e) => setEditData({ ...editData, venueCapacity: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>
            </div>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Contacts</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Promotor Name</label>
                <input
                  type="text"
                  className="input"
                  value={editData.promotorName || ''}
                  onChange={(e) => setEditData({ ...editData, promotorName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Promotor Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={editData.promotorPhone || ''}
                  onChange={(e) => setEditData({ ...editData, promotorPhone: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Artist Liaison Name</label>
                <input
                  type="text"
                  className="input"
                  value={editData.artistLiaisonName || ''}
                  onChange={(e) => setEditData({ ...editData, artistLiaisonName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Artist Liaison Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={editData.artistLiaisonPhone || ''}
                  onChange={(e) => setEditData({ ...editData, artistLiaisonPhone: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Technical Name</label>
                <input
                  type="text"
                  className="input"
                  value={editData.technicalName || ''}
                  onChange={(e) => setEditData({ ...editData, technicalName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Technical Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={editData.technicalPhone || ''}
                  onChange={(e) => setEditData({ ...editData, technicalPhone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Running Order */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Running Order</h3>
            <div>
              <label className="label">Running Order</label>
              <textarea
                className="input"
                rows={8}
                value={editData.runningOrder || ''}
                onChange={(e) => setEditData({ ...editData, runningOrder: e.target.value })}
                placeholder="Enter the running order/schedule for the event"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

