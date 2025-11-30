import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Settings, Edit2 } from 'lucide-react';
import { DollarSign, Calendar, MapPin, Building2, Users, Phone, User } from 'lucide-react';
import { eventsApi } from '../lib/api';
import type { Event, ModuleType } from '@event-management/shared';
import { MODULE_DISPLAY_NAMES, MODULE_COLORS, EVENT_SCOPED_MODULES, ModuleType as ModuleTypeEnum } from '@event-management/shared';
import { format } from 'date-fns';
import { EventDetailsModal } from '../components/EventDetailsModal';

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
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
            <Link
              to={`/events/${eventId}/finance`}
              className="btn btn-primary flex items-center gap-2"
            >
              <DollarSign className="w-5 h-5" />
              Finance Board
            </Link>
          </div>
        </div>

        {/* Event Details Summary */}
        <div className="card mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-900">Event Details</h2>
            <button
              onClick={() => setShowEditModal(true)}
              className="btn btn-secondary flex items-center gap-2 text-sm"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
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

          {/* Compact Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(event.startDate), 'MMM d, yyyy')} - {format(new Date(event.endDate), 'MMM d, yyyy')}</span>
            </div>
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
            {event.technicalName && (
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>Technical: {event.technicalName}</span>
                {event.technicalPhone && <span className="text-gray-400">• {event.technicalPhone}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Management Link */}
      <div className="mb-6 card p-4 bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Metadata Management</h3>
            <p className="text-sm text-gray-600">Manage statuses, categories, and tags for all modules</p>
          </div>
          <Link
            to="/manage-metadata"
            className="btn btn-primary flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            <span>Manage Metadata</span>
          </Link>
        </div>
      </div>

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
