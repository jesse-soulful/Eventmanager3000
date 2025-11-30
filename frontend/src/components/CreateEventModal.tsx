import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { eventsApi, lineItemsApi } from '../lib/api';
import type { Event } from '@event-management/shared';
import { ModuleType as ModuleTypeEnum, StaffRole } from '@event-management/shared';
import { StaffSelector } from './StaffSelector';
import { format } from 'date-fns';

interface CreateEventModalProps {
  onClose: () => void;
  onSave: () => void;
}

export function CreateEventModal({ onClose, onSave }: CreateEventModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    venueName: '',
    venueAddress: '',
    venueCapacity: '',
    promotorName: '',
    promotorPhone: '',
    artistLiaisonName: '',
    artistLiaisonPhone: '',
    technicalName: '',
    technicalPhone: '',
    runningOrder: '',
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [promotorStaff, setPromotorStaff] = useState<{ id: string; name: string; phone?: string; email?: string } | null>(null);
  const [artistLiaisonStaff, setArtistLiaisonStaff] = useState<{ id: string; name: string; phone?: string; email?: string } | null>(null);
  const [technicalStaff, setTechnicalStaff] = useState<{ id: string; name: string; phone?: string; email?: string } | null>(null);

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateStaff = async (name: string, phone?: string, email?: string): Promise<{ id: string; name: string; phone?: string; email?: string }> => {
    // Create staff member in the staff pool (global module, no eventId needed for creation)
    // We'll use a placeholder eventId that will be updated after event creation
    try {
      const response = await lineItemsApi.create({
        moduleType: ModuleTypeEnum.STAFF_POOL,
        eventId: 'temp', // Temporary - will be updated when event is created
        name,
        description: '',
        metadata: {
          email: email || '',
          phone: phone || '',
          canWorkAs: [],
        },
      });
      
      return {
        id: response.data.id,
        name: response.data.name,
        phone: (response.data.metadata as any)?.phone,
        email: (response.data.metadata as any)?.email,
      };
    } catch (error) {
      console.error('Failed to create staff member:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      const metadata = {
        promotorStaffId: promotorStaff?.id || null,
        artistLiaisonStaffId: artistLiaisonStaff?.id || null,
        technicalStaffId: technicalStaff?.id || null,
      };

      const response = await eventsApi.create({
        name: formData.name,
        description: formData.description || undefined,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        venueName: formData.venueName || undefined,
        venueAddress: formData.venueAddress || undefined,
        venueCapacity: formData.venueCapacity ? parseInt(formData.venueCapacity) : undefined,
        promotorName: promotorStaff?.name || formData.promotorName || undefined,
        promotorPhone: promotorStaff?.phone || formData.promotorPhone || undefined,
        artistLiaisonName: artistLiaisonStaff?.name || formData.artistLiaisonName || undefined,
        artistLiaisonPhone: artistLiaisonStaff?.phone || formData.artistLiaisonPhone || undefined,
        technicalName: technicalStaff?.name || formData.technicalName || undefined,
        technicalPhone: technicalStaff?.phone || formData.technicalPhone || undefined,
        runningOrder: formData.runningOrder || undefined,
        metadata: JSON.stringify(metadata),
      });

      // Upload banner if selected
      if (bannerFile && response.data.id) {
        try {
          setUploadingBanner(true);
          await eventsApi.uploadBanner(response.data.id, bannerFile);
        } catch (error) {
          console.error('Failed to upload banner:', error);
        } finally {
          setUploadingBanner(false);
        }
      }

      // Create staff assignments if staff were selected
      if (response.data.id) {
        const event = response.data;
        const staffAssignments = [
          { staff: promotorStaff, role: StaffRole.PROMOTOR, moduleType: ModuleTypeEnum.EVENT_DETAILS },
          { staff: artistLiaisonStaff, role: StaffRole.ARTIST_LIAISON, moduleType: ModuleTypeEnum.EVENT_DETAILS },
          { staff: technicalStaff, role: StaffRole.TECHNICAL, moduleType: ModuleTypeEnum.EVENT_DETAILS },
        ];

        for (const assignment of staffAssignments) {
          if (assignment.staff && assignment.staff.id) {
            try {
              const staffLineItemResponse = await lineItemsApi.getById(assignment.staff.id);
              const staffLineItem = staffLineItemResponse.data;
              const existingSubItems = (staffLineItem as any).subLineItems || [];

              const existingAssignment = existingSubItems.find(
                (subItem: any) => {
                  const subMetadata = typeof subItem.metadata === 'string' 
                    ? JSON.parse(subItem.metadata) 
                    : (subItem.metadata || {});
                  return subItem.eventId === event.id && 
                         subMetadata.role === assignment.role &&
                         subMetadata.moduleType === assignment.moduleType;
                }
              );

              if (!existingAssignment) {
                const eventStartDate = event.startDate instanceof Date ? event.startDate.toISOString() : event.startDate;
                const eventEndDate = event.endDate instanceof Date ? event.endDate.toISOString() : event.endDate;
                
                await lineItemsApi.create({
                  moduleType: ModuleTypeEnum.STAFF_POOL,
                  eventId: event.id,
                  parentLineItemId: assignment.staff.id,
                  name: `${event.name} - ${assignment.role}`,
                  description: `Assigned as ${assignment.role} for ${event.name}`,
                  metadata: {
                    role: assignment.role,
                    moduleType: assignment.moduleType,
                    eventName: event.name,
                    eventStartDate: eventStartDate,
                    eventEndDate: eventEndDate,
                  },
                });
              }
            } catch (error) {
              console.error(`Failed to create event assignment for ${assignment.role}:`, error);
            }
          }
        }
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold gradient-text">Create New Event</h2>
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
            {bannerPreview ? (
              <div className="space-y-3">
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
                <div className="flex gap-2">
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerSelect}
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
                    onClick={() => {
                      setBannerFile(null);
                      setBannerPreview(null);
                      if (bannerInputRef.current) {
                        bannerInputRef.current.value = '';
                      }
                    }}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm mb-3">No banner image selected</p>
                </div>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Banner
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
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date *</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">End Date *</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
                  value={formData.venueName}
                  onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Venue Address</label>
                <input
                  type="text"
                  className="input"
                  value={formData.venueAddress}
                  onChange={(e) => setFormData({ ...formData, venueAddress: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Venue Capacity</label>
                <input
                  type="number"
                  className="input"
                  value={formData.venueCapacity}
                  onChange={(e) => setFormData({ ...formData, venueCapacity: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Contacts</h3>
            <div className="space-y-4">
              <StaffSelector
                label="Promotor"
                role={StaffRole.PROMOTOR}
                value={promotorStaff}
                onSelect={(staff) => {
                  setPromotorStaff(staff);
                  if (staff) {
                    setFormData({
                      ...formData,
                      promotorName: staff.name,
                      promotorPhone: staff.phone || '',
                    });
                  } else {
                    setFormData({
                      ...formData,
                      promotorName: '',
                      promotorPhone: '',
                    });
                  }
                }}
                onCreateNew={handleCreateStaff}
              />
              {promotorStaff && (
                <div className="grid grid-cols-2 gap-4 -mt-2">
                  <div>
                    <label className="label">Promotor Name</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.promotorName}
                      onChange={(e) => setFormData({ ...formData, promotorName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Promotor Phone</label>
                    <input
                      type="tel"
                      className="input"
                      value={formData.promotorPhone}
                      onChange={(e) => setFormData({ ...formData, promotorPhone: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <StaffSelector
                label="Artist Liaison"
                role={StaffRole.ARTIST_LIAISON}
                value={artistLiaisonStaff}
                onSelect={(staff) => {
                  setArtistLiaisonStaff(staff);
                  if (staff) {
                    setFormData({
                      ...formData,
                      artistLiaisonName: staff.name,
                      artistLiaisonPhone: staff.phone || '',
                    });
                  } else {
                    setFormData({
                      ...formData,
                      artistLiaisonName: '',
                      artistLiaisonPhone: '',
                    });
                  }
                }}
                onCreateNew={handleCreateStaff}
              />
              {artistLiaisonStaff && (
                <div className="grid grid-cols-2 gap-4 -mt-2">
                  <div>
                    <label className="label">Artist Liaison Name</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.artistLiaisonName}
                      onChange={(e) => setFormData({ ...formData, artistLiaisonName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Artist Liaison Phone</label>
                    <input
                      type="tel"
                      className="input"
                      value={formData.artistLiaisonPhone}
                      onChange={(e) => setFormData({ ...formData, artistLiaisonPhone: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <StaffSelector
                label="Technical Contact"
                role={StaffRole.TECHNICAL}
                value={technicalStaff}
                onSelect={(staff) => {
                  setTechnicalStaff(staff);
                  if (staff) {
                    setFormData({
                      ...formData,
                      technicalName: staff.name,
                      technicalPhone: staff.phone || '',
                    });
                  } else {
                    setFormData({
                      ...formData,
                      technicalName: '',
                      technicalPhone: '',
                    });
                  }
                }}
                onCreateNew={handleCreateStaff}
              />
              {technicalStaff && (
                <div className="grid grid-cols-2 gap-4 -mt-2">
                  <div>
                    <label className="label">Technical Name</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.technicalName}
                      onChange={(e) => setFormData({ ...formData, technicalName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Technical Phone</label>
                    <input
                      type="tel"
                      className="input"
                      value={formData.technicalPhone}
                      onChange={(e) => setFormData({ ...formData, technicalPhone: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Running Order */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Running Order</h3>
            <div>
              <label className="label">Running Order</label>
              <textarea
                className="input"
                rows={5}
                value={formData.runningOrder}
                onChange={(e) => setFormData({ ...formData, runningOrder: e.target.value })}
                placeholder="Enter the running order for the event..."
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
            <button type="submit" className="btn btn-primary" disabled={uploadingBanner}>
              {uploadingBanner ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

