import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Calendar, MapPin, Trash2 } from 'lucide-react';
import { eventsApi } from '../lib/api';
import type { Event, EventStatus } from '@event-management/shared';
import { format } from 'date-fns';
import { CreateEventModal } from '../components/CreateEventModal';

const STATUS_COLORS: Record<EventStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PLANNING: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const handleDeleteEvent = async (eventId: string, eventName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${eventName}"? This will permanently delete the event and all associated data (line items, staff assignments, etc.). This action cannot be undone.`)) {
      return;
    }

    try {
      await eventsApi.delete(eventId);
      loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event. Please try again.');
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
            <div key={event.id} className="card-hover group relative">
              <Link
                to={`/events/${event.id}`}
                className="block"
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
              <button
                onClick={(e) => handleDeleteEvent(event.id, event.name, e)}
                className="absolute top-4 right-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg opacity-60 hover:opacity-100 transition-all"
                title="Delete event"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            setShowCreateModal(false);
            loadEvents();
          }}
        />
      )}
    </div>
  );
}

