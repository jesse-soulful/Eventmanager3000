import { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { eventsApi, lineItemsApi, modulesApi } from '../lib/api';
import type { Event } from '@event-management/shared';
import { ModuleType as ModuleTypeEnum, StaffRole, STAFF_ROLE_DISPLAY_NAMES } from '@event-management/shared';
import { StaffSelector } from './StaffSelector';
import { VenueSelector } from './VenueSelector';
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
  
  // Staff references from metadata
  const getEventMetadata = () => {
    if (!event.metadata) return {};
    if (typeof event.metadata === 'string') {
      try {
        return JSON.parse(event.metadata) || {};
      } catch {
        return {};
      }
    }
    return event.metadata || {};
  };

  const eventMetadata = getEventMetadata();
  const [promotorStaff, setPromotorStaff] = useState<{ id: string; name: string; phone?: string; email?: string } | null>(
    eventMetadata.promotorStaffId && event.promotorName
      ? { id: eventMetadata.promotorStaffId, name: event.promotorName, phone: event.promotorPhone }
      : null
  );
  const [artistLiaisonStaff, setArtistLiaisonStaff] = useState<{ id: string; name: string; phone?: string; email?: string } | null>(
    eventMetadata.artistLiaisonStaffId && event.artistLiaisonName
      ? { id: eventMetadata.artistLiaisonStaffId, name: event.artistLiaisonName, phone: event.artistLiaisonPhone }
      : null
  );
  const [venue, setVenue] = useState<{ id: string; name: string; address?: string; capacity?: number } | null>(
    eventMetadata.venueVendorId && event.venueName
      ? { id: eventMetadata.venueVendorId, name: event.venueName, address: event.venueAddress, capacity: event.venueCapacity }
      : null
  );

  useEffect(() => {
    setEditData(event);
  }, [event]);

  const handleCreateStaff = async (name: string, phone?: string, email?: string): Promise<{ id: string; name: string; phone?: string; email?: string }> => {
    // Create staff member in staff pool
    const response = await lineItemsApi.create({
      moduleType: ModuleTypeEnum.STAFF_POOL,
      eventId: event.id,
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
  };

  const handleCreateVenue = async (name: string, address?: string, capacity?: number): Promise<{ id: string; name: string; address?: string; capacity?: number }> => {
    // Create venue in vendors/suppliers module
    const response = await lineItemsApi.create({
      moduleType: ModuleTypeEnum.VENDORS_SUPPLIERS,
      eventId: event.id,
      name,
      description: address || '',
      metadata: {
        address: address || '',
        capacity: capacity || null,
      },
    });
    
    return {
      id: response.data.id,
      name: response.data.name,
      address: (response.data.metadata as any)?.address,
      capacity: (response.data.metadata as any)?.capacity,
    };
  };

  const handleSave = async () => {
    try {
      // Get previous staff assignments from metadata
      const previousPromotorId = eventMetadata.promotorStaffId;
      const previousArtistLiaisonId = eventMetadata.artistLiaisonStaffId;
      const previousVenueId = eventMetadata.venueVendorId;

      // Prepare updated venue details from selected venue
      const updatedVenueData = venue ? {
        venueName: venue.name,
        venueAddress: venue.address || '',
        venueCapacity: venue.capacity || undefined,
      } : {
        venueName: editData.venueName || '',
        venueAddress: editData.venueAddress || '',
        venueCapacity: editData.venueCapacity || undefined,
      };

      // Update event with staff and venue references in metadata
      const metadata = {
        promotorStaffId: promotorStaff?.id || null,
        artistLiaisonStaffId: artistLiaisonStaff?.id || null,
        venueVendorId: venue?.id || null,
      };

      await eventsApi.update(event.id, {
        ...editData,
        ...updatedVenueData,
        startDate: editData.startDate ? new Date(editData.startDate) : undefined,
        endDate: editData.endDate ? new Date(editData.endDate) : undefined,
        venueCapacity: updatedVenueData.venueCapacity !== undefined ? (updatedVenueData.venueCapacity === null ? null : Number(updatedVenueData.venueCapacity)) : undefined,
        metadata: JSON.stringify(metadata),
      });

      // Handle staff assignment sub-line items (create new, remove old)
      const staffAssignments = [
        { staff: promotorStaff, previousId: previousPromotorId, role: StaffRole.PROMOTOR, moduleType: ModuleTypeEnum.EVENT_DETAILS },
        { staff: artistLiaisonStaff, previousId: previousArtistLiaisonId, role: StaffRole.ARTIST_LIAISON, moduleType: ModuleTypeEnum.EVENT_DETAILS },
      ];

      for (const assignment of staffAssignments) {
        // Remove old assignment if staff was removed
        if (assignment.previousId && !assignment.staff) {
          try {
            const staffLineItemResponse = await lineItemsApi.getById(assignment.previousId);
            const staffLineItem = staffLineItemResponse.data;
            const existingSubItems = (staffLineItem as any).subLineItems || [];

            const assignmentToRemove = existingSubItems.find(
              (subItem: any) => {
                const subMetadata = typeof subItem.metadata === 'string' 
                  ? JSON.parse(subItem.metadata) 
                  : (subItem.metadata || {});
                return subItem.eventId === event.id && 
                       subMetadata.role === assignment.role &&
                       subMetadata.moduleType === assignment.moduleType;
              }
            );

            if (assignmentToRemove) {
              await lineItemsApi.delete(assignmentToRemove.id);
            }
          } catch (error) {
            console.error(`Failed to remove event assignment for ${assignment.role}:`, error);
          }
        }

        // Create new assignment if staff was added
        if (assignment.staff) {
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
                name: `${event.name} - ${STAFF_ROLE_DISPLAY_NAMES[assignment.role]}`,
                description: `Assigned as ${STAFF_ROLE_DISPLAY_NAMES[assignment.role]} for ${event.name}`,
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

          {/* Event */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Event</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Event Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Event Date (Start) *</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={editData.startDate ? format(new Date(editData.startDate), 'yyyy-MM-dd') : ''}
                    onChange={(e) => setEditData({ ...editData, startDate: new Date(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="label">Event Date (End) *</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={editData.endDate ? format(new Date(editData.endDate), 'yyyy-MM-dd') : ''}
                    onChange={(e) => setEditData({ ...editData, endDate: new Date(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Event Link</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={editData.eventLink || ''}
                  onChange={(e) => setEditData({ ...editData, eventLink: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Ticketshop Link</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={editData.ticketshopLink || ''}
                  onChange={(e) => setEditData({ ...editData, ticketshopLink: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Venue Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Venue Details</h3>
            <div className="space-y-4">
              <VenueSelector
                label="Venue (from Vendors/Suppliers)"
                value={venue}
                onSelect={(selectedVenue) => {
                  setVenue(selectedVenue);
                  if (selectedVenue) {
                    setEditData({
                      ...editData,
                      venueName: selectedVenue.name,
                      venueAddress: selectedVenue.address || '',
                      venueCapacity: selectedVenue.capacity || undefined,
                    });
                  } else {
                    setEditData({
                      ...editData,
                      venueName: '',
                      venueAddress: '',
                      venueCapacity: undefined,
                    });
                  }
                }}
                onCreateNew={handleCreateVenue}
                placeholder="Select or create venue"
              />
              {venue && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  Venue details are populated from the selected vendor. You can manually edit below if needed.
                </div>
              )}
              <div className="grid grid-cols-1 gap-4">
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
          </div>

          {/* Contacts */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Contacts</h3>
            <div className="space-y-4">
              <div>
                <StaffSelector
                  label="Promotor"
                  role={StaffRole.PROMOTOR}
                  value={promotorStaff}
                  onSelect={(staff) => {
                    setPromotorStaff(staff);
                    if (staff) {
                      setEditData({
                        ...editData,
                        promotorName: staff.name,
                        promotorPhone: staff.phone || '',
                      });
                    } else {
                      setEditData({
                        ...editData,
                        promotorName: '',
                        promotorPhone: '',
                      });
                    }
                  }}
                  onCreateNew={handleCreateStaff}
                  placeholder="Select or create promotor"
                />
                {promotorStaff && (
                  <div className="mt-2 text-sm text-gray-600">
                    You can manually edit name/phone below if needed
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 mt-2">
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
                </div>
              </div>

              <div>
                <StaffSelector
                  label="Artist Liaison"
                  role={StaffRole.ARTIST_LIAISON}
                  value={artistLiaisonStaff}
                  onSelect={(staff) => {
                    setArtistLiaisonStaff(staff);
                    if (staff) {
                      setEditData({
                        ...editData,
                        artistLiaisonName: staff.name,
                        artistLiaisonPhone: staff.phone || '',
                      });
                    } else {
                      setEditData({
                        ...editData,
                        artistLiaisonName: '',
                        artistLiaisonPhone: '',
                      });
                    }
                  }}
                  onCreateNew={handleCreateStaff}
                  placeholder="Select or create artist liaison"
                />
                {artistLiaisonStaff && (
                  <div className="mt-2 text-sm text-gray-600">
                    You can manually edit name/phone below if needed
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 mt-2">
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
                </div>
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

