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
import { Breadcrumbs } from '../components/Breadcrumbs';

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
    return <div className="text-center py-12 text-gray-400">Loading event...</div>;
  }

  if (!event) {
    return <div className="text-center py-12 text-gray-400">Event not found</div>;
  }

  const modules: ModuleType[] = EVENT_SCOPED_MODULES;

  return (
    <div>
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Events', href: '/events' }, { label: event.name }]} />
      
      {/* Event Header */}
      <div className="page-header">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="page-title">{event.name}</h1>
            {event.description && (
              <p className="page-subtitle mb-4">{event.description}</p>
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
          {/* Banner Preview */}
          {getBannerUrl() && (
            <div className="mb-6 -mx-6 -mt-6">
              <img
                src={getBannerUrl() || ''}
                alt={`${event.name} banner`}
                className="w-full h-48 object-cover rounded-t-2xl"
              />
            </div>
          )}
          
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-6">Event Details</h2>
            
            {/* Event Section */}
            <div className="mb-6 pb-6 border-b border-gray-700">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-4 tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Event Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Date Range</div>
                    <div className="text-sm font-medium text-gray-200">
                      {format(new Date(event.startDate), 'MMM d, yyyy')} - {format(new Date(event.endDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                {event.eventLink && (
                  <div className="flex items-start gap-3">
                    <LinkIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Event Link</div>
                      <a href={event.eventLink} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors break-all">
                        {event.eventLink}
                      </a>
                    </div>
                  </div>
                )}
                {event.ticketshopLink && (
                  <div className="flex items-start gap-3">
                    <LinkIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Ticketshop Link</div>
                      <a href={event.ticketshopLink} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors break-all">
                        {event.ticketshopLink}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Venue Details Section */}
            {(event.venueName || event.venueAddress || event.venueCapacity) && (
              <div className="mb-6 pb-6 border-b border-gray-700">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-4 tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Venue Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.venueName && (
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Venue Name</div>
                        <div className="text-sm font-medium text-gray-200">{event.venueName}</div>
                      </div>
                    </div>
                  )}
                  {event.venueAddress && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Address</div>
                        <div className="text-sm font-medium text-gray-200">{event.venueAddress}</div>
                      </div>
                    </div>
                  )}
                  {event.venueCapacity && (
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Capacity</div>
                        <div className="text-sm font-medium text-gray-200">{event.venueCapacity.toLocaleString()} people</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contacts Section */}
            {(event.promotorName || event.artistLiaisonName) && (
              <div className="mb-6 pb-6 border-b border-gray-700">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-4 tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Contacts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.promotorName && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Promotor</div>
                        <div className="text-sm font-medium text-gray-200">
                          {event.promotorName}
                          {event.promotorPhone && <span className="text-gray-400 ml-2">• {event.promotorPhone}</span>}
                        </div>
                      </div>
                    </div>
                  )}
                  {event.artistLiaisonName && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Artist Liaison</div>
                        <div className="text-sm font-medium text-gray-200">
                          {event.artistLiaisonName}
                          {event.artistLiaisonPhone && <span className="text-gray-400 ml-2">• {event.artistLiaisonPhone}</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Running Order Section */}
            {event.runningOrder && (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-4 tracking-wider">Running Order</h3>
                <div className="text-sm text-gray-300 whitespace-pre-wrap bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  {event.runningOrder}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Staff Overview */}
      {event && <EventStaffOverview event={event} />}

      {/* Modules Grid */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((moduleType) => (
            <Link
              key={moduleType}
              to={moduleType === ModuleTypeEnum.ARTISTS 
                ? `/events/${eventId}/artists`
                : `/events/${eventId}/${moduleType.toLowerCase().replace(/_/g, '-')}`
              }
              className="card-hover group relative overflow-hidden"
            >
              <div className="flex items-center gap-4 p-2">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-all duration-300 flex-shrink-0"
                  style={{ 
                    background: `linear-gradient(135deg, ${MODULE_COLORS[moduleType]} 0%, ${MODULE_COLORS[moduleType]}dd 100%)`
                  }}
                >
                  {MODULE_DISPLAY_NAMES[moduleType].charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-100 group-hover:text-primary-400 transition-colors mb-1">
                    {MODULE_DISPLAY_NAMES[moduleType]}
                  </h3>
                  <p className="text-sm text-gray-400">Manage line items</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
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
