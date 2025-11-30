import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Link as LinkIcon } from 'lucide-react';
import { Calendar, MapPin, Building2, Users, User } from 'lucide-react';
import { eventsApi } from '../lib/api';
import type { Event, ModuleType } from '@event-management/shared';
import { MODULE_DISPLAY_NAMES, MODULE_COLORS, EVENT_SCOPED_MODULES, ModuleType as ModuleTypeEnum } from '@event-management/shared';
import { format } from 'date-fns';
import { EventDetailsModal } from '../components/EventDetailsModal';
import { EventStaffOverview } from '../components/EventStaffOverview';

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    if (!eventId) return;
    try {
      const response = await eventsApi.getById(eventId);
      setEvent(response.data);
    } catch (error) {
      console.error('Failed to load event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!event || !eventId) return;
    
    if (!confirm(`Are you sure you want to delete "${event.name}"? This will permanently delete the event and all associated data (line items, staff assignments, etc.). This action cannot be undone.`)) {
      return;
    }

    try {
      await eventsApi.delete(eventId);
      navigate('/events');
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  const getBannerUrl = () => {
    if (!event?.bannerImageUrl) return null;
    if (event.bannerImageUrl.startsWith('http')) {
      return event.bannerImageUrl;
    }
    // Banner URL from backend is already like /api/events/:id/banner/:filename
    if (event.bannerImageUrl.startsWith('/api/')) {
      return event.bannerImageUrl;
    }
    return `/api${event.bannerImageUrl}`;
  };

  if (loading) {
    return <div className="text-center py-12">Loading event...</div>;
  }

  if (!event) {
    return <div className="text-center py-12">Event not found</div>;
  }

  const modules: ModuleType[] = EVENT_SCOPED_MODULES;

  return (
    <div>
      {/* Event Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold gradient-text mb-3">{event.name}</h1>
            {event.description && (
              <p className="text-gray-600 text-lg mb-4">{event.description}</p>
            )}
          </div>
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => setShowEditModal(true)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Details
            </button>
            <button
              onClick={handleDeleteEvent}
              className="btn btn-danger flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Event
            </button>
          </div>
        </div>

        {/* Event Details Summary */}
        <div className="card mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Event Details</h2>
          </div>
          
          {/* Banner Preview */}
          {getBannerUrl() && (
            <div className="mb-4">
              <img
                src={getBannerUrl() || ''}
                alt={`${event.name} banner`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
            </div>
          )}

          {/* Event Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Event</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(event.startDate), 'MMM d, yyyy')} - {format(new Date(event.endDate), 'MMM d, yyyy')}</span>
              </div>
              {event.eventLink && (
                <div className="flex items-center gap-2 text-gray-600">
                  <LinkIcon className="w-4 h-4" />
                  <a href={event.eventLink} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                    Event Link
                  </a>
                </div>
              )}
              {event.ticketshopLink && (
                <div className="flex items-center gap-2 text-gray-600">
                  <LinkIcon className="w-4 h-4" />
                  <a href={event.ticketshopLink} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                    Ticketshop Link
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Venue Details Section */}
          {(event.venueName || event.venueAddress || event.venueCapacity) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Venue Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {event.venueName && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span>{event.venueName}</span>
                  </div>
                )}
                {event.venueAddress && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{event.venueAddress}</span>
                  </div>
                )}
                {event.venueCapacity && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Capacity: {event.venueCapacity.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contacts Section */}
          {(event.promotorName || event.artistLiaisonName) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Contacts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {event.promotorName && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Promotor: {event.promotorName}</span>
                    {event.promotorPhone && <span className="text-gray-400">• {event.promotorPhone}</span>}
                  </div>
                )}
                {event.artistLiaisonName && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Artist Liaison: {event.artistLiaisonName}</span>
                    {event.artistLiaisonPhone && <span className="text-gray-400">• {event.artistLiaisonPhone}</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Running Order Section */}
          {event.runningOrder && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Running Order</h3>
              <div className="text-sm text-gray-600 whitespace-pre-wrap">{event.runningOrder}</div>
            </div>
          )}
        </div>
      </div>

      {/* Staff Overview */}
      {event && <EventStaffOverview event={event} />}

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((moduleType) => (
          <Link
            key={moduleType}
            to={moduleType === ModuleTypeEnum.ARTISTS 
              ? `/events/${eventId}/artists`
              : `/events/${eventId}/${moduleType.toLowerCase().replace(/_/g, '-')}`
            }
            className="card-hover group"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-200"
                style={{ 
                  background: `linear-gradient(135deg, ${MODULE_COLORS[moduleType]} 0%, ${MODULE_COLORS[moduleType]}dd 100%)`
                }}
              >
                {MODULE_DISPLAY_NAMES[moduleType].charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors mb-1">
                  {MODULE_DISPLAY_NAMES[moduleType]}
                </h3>
                <p className="text-sm text-gray-500">Manage line items</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Edit Details Modal */}
      {showEditModal && event && (
        <EventDetailsModal
          event={event}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            loadEvent();
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}
