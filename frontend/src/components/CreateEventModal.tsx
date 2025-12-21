import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { eventsApi, lineItemsApi } from '../lib/api';
import type { Event } from '@event-management/shared';
import { ModuleType as ModuleTypeEnum, StaffRole, STAFF_ROLE_DISPLAY_NAMES } from '@event-management/shared';
import { StaffSelector } from './StaffSelector';
import { VenueSelector } from './VenueSelector';
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
    eventLink: '',
    ticketshopLink: '',
    venueName: '',
    venueAddress: '',
    venueCapacity: '',
    promotorName: '',
    promotorPhone: '',
    artistLiaisonName: '',
    artistLiaisonPhone: '',
    runningOrder: '',
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [promotorStaff, setPromotorStaff] = useState<{ id: string; name: string; phone?: string; email?: string } | null>(null);
  const [artistLiaisonStaff, setArtistLiaisonStaff] = useState<{ id: string; name: string; phone?: string; email?: string } | null>(null);
  const [venue, setVenue] = useState<{ id: string; name: string; address?: string; capacity?: number } | null>(null);

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

  const handleCreateVenue = async (name: string, address?: string, capacity?: number): Promise<{ id: string; name: string; address?: string; capacity?: number }> => {
    try {
      const response = await lineItemsApi.create({
        moduleType: ModuleTypeEnum.VENDORS_SUPPLIERS,
        eventId: 'temp', // Temporary - will be updated when event is created
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
    } catch (error) {
      console.error('Failed to create venue:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      // Update venue details from selected venue
      const finalVenueName = venue?.name || formData.venueName || undefined;
      const finalVenueAddress = venue?.address || formData.venueAddress || undefined;
      const finalVenueCapacity = venue?.capacity || (formData.venueCapacity ? parseInt(formData.venueCapacity) : undefined);

      const metadata = {
        promotorStaffId: promotorStaff?.id || null,
        artistLiaisonStaffId: artistLiaisonStaff?.id || null,
        venueVendorId: venue?.id || null,
      };

      const response = await eventsApi.create({
        name: formData.name,
        description: formData.description || undefined,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        eventLink: formData.eventLink || undefined,
        ticketshopLink: formData.ticketshopLink || undefined,
        venueName: finalVenueName,
        venueAddress: finalVenueAddress,
        venueCapacity: finalVenueCapacity,
        promotorName: promotorStaff?.name || formData.promotorName || undefined,
        promotorPhone: promotorStaff?.phone || formData.promotorPhone || undefined,
        artistLiaisonName: artistLiaisonStaff?.name || formData.artistLiaisonName || undefined,
        artistLiaisonPhone: artistLiaisonStaff?.phone || formData.artistLiaisonPhone || undefined,
        runningOrder: formData.runningOrder || undefined,
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
          { staff: promotorStaff, role: StaffRole.PROMOTOR, moduleType: ModuleTypeEnum.PRODUCTION },
          { staff: artistLiaisonStaff, role: StaffRole.ARTIST_LIAISON, moduleType: ModuleTypeEnum.PRODUCTION },
        ];

        // Update venue vendor eventId if created
        if (venue && venue.id) {
          try {
            // Note: eventId cannot be updated via UpdateLineItemInput
            // This would require a different approach or backend support
          } catch (error) {
            console.error('Failed to update venue eventId:', error);
          }
        }

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
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title gradient-text">Create New Event</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-700/50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="modal-body space-y-6">
          {/* Banner Image */}
          <div>
            <label className="label">Banner Image</label>
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

          {/* Event */}
          <div>
            <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700/50 pb-2 mb-4">Event</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Event Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Event Date (Start) *</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Event Date (End) *</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Event Link</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={formData.eventLink}
                  onChange={(e) => setFormData({ ...formData, eventLink: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Ticketshop Link</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={formData.ticketshopLink}
                  onChange={(e) => setFormData({ ...formData, ticketshopLink: e.target.value })}
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
                    setFormData({
                      ...formData,
                      venueName: selectedVenue.name,
                      venueAddress: selectedVenue.address || '',
                      venueCapacity: selectedVenue.capacity?.toString() || '',
                    });
                  } else {
                    setFormData({
                      ...formData,
                      venueName: '',
                      venueAddress: '',
                      venueCapacity: '',
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
          <div className="flex gap-3 justify-end pt-6 border-t border-gray-700/50">
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

