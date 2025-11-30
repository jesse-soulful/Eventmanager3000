import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, MapPin, Upload, Image as ImageIcon } from 'lucide-react';
import { eventsApi } from '../lib/api';
import type { Event, EventStatus } from '@event-management/shared';
import { format } from 'date-fns';

const STATUS_COLORS: Record<EventStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PLANNING: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
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

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await eventsApi.getAll();
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await eventsApi.create({
        name: formData.name,
        description: formData.description || undefined,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        location: formData.location || undefined,
        venueName: formData.venueName || undefined,
        venueAddress: formData.venueAddress || undefined,
        venueCapacity: formData.venueCapacity ? parseInt(formData.venueCapacity) : undefined,
        promotorName: formData.promotorName || undefined,
        promotorPhone: formData.promotorPhone || undefined,
        artistLiaisonName: formData.artistLiaisonName || undefined,
        artistLiaisonPhone: formData.artistLiaisonPhone || undefined,
        technicalName: formData.technicalName || undefined,
        technicalPhone: formData.technicalPhone || undefined,
        runningOrder: formData.runningOrder || undefined,
      });
      setShowCreateModal(false);
      setFormData({ 
        name: '', 
        description: '', 
        startDate: '', 
        endDate: '', 
        location: '',
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
      loadEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading events...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Events</h1>
          <p className="text-gray-600">Manage all your events in one place</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="card text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 mb-6">
            <Calendar className="w-10 h-10 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-500 mb-6">Get started by creating your first event.</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            Create Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="card-hover group"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{event.name}</h2>
                <span className={`badge ${STATUS_COLORS[event.status]}`}>
                  {event.status.replace('_', ' ')}
                </span>
              </div>
              {event.description && (
                <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
              )}
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(event.startDate), 'MMM d, yyyy')} - {format(new Date(event.endDate), 'MMM d, yyyy')}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <h2 className="text-3xl font-bold gradient-text mb-6">Create New Event</h2>
            <form onSubmit={handleCreate} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
              {/* Banner Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Banner Image</h3>
                {bannerPreview ? (
                  <div className="relative">
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBannerFile(null);
                        setBannerPreview(null);
                        if (bannerInputRef.current) {
                          bannerInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-2 right-2 btn btn-secondary bg-white/90 hover:bg-white text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-3 text-sm">No banner image selected</p>
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
                      className="btn btn-secondary flex items-center gap-2 mx-auto text-sm"
                    >
                      <Upload className="w-4 h-4" />
                      Select Banner
                    </button>
                  </div>
                )}
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
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

              {/* Venue Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mt-6">Venue Information</h3>
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
                    placeholder="Enter capacity"
                  />
                </div>
                <div>
                  <label className="label">Location (Legacy)</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Optional: general location"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mt-6">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
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
              </div>

              {/* Running Order */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mt-6">Schedule</h3>
                <div>
                  <label className="label">Running Order</label>
                  <textarea
                    className="input"
                    rows={6}
                    value={formData.runningOrder}
                    onChange={(e) => setFormData({ ...formData, runningOrder: e.target.value })}
                    placeholder="Enter the running order/schedule for the event"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

