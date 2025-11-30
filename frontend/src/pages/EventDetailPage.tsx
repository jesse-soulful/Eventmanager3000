import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { DollarSign, Calendar, MapPin } from 'lucide-react';
import { eventsApi } from '../lib/api';
import type { Event, ModuleType } from '@event-management/shared';
import { MODULE_DISPLAY_NAMES, MODULE_COLORS } from '@event-management/shared';
import { format } from 'date-fns';

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="text-center py-12">Loading event...</div>;
  }

  if (!event) {
    return <div className="text-center py-12">Event not found</div>;
  }

  const modules: ModuleType[] = [
    'ARTISTS',
    'VENDORS',
    'MATERIALS',
    'FOOD_BEVERAGE',
    'SPONSORS',
    'MARKETING',
  ] as ModuleType[];

  return (
    <div>
      {/* Event Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-3">{event.name}</h1>
            {event.description && (
              <p className="text-gray-600 text-lg mb-4">{event.description}</p>
            )}
          </div>
          <Link
            to={`/events/${eventId}/finance`}
            className="btn btn-primary flex items-center gap-2"
          >
            <DollarSign className="w-5 h-5" />
            Finance Board
          </Link>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
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
            to={moduleType === 'ARTISTS' 
              ? `/events/${eventId}/artists`
              : `/events/${eventId}/${moduleType.toLowerCase().replace('_', '-')}`
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
    </div>
  );
}

