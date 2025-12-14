import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Calendar, MapPin, Trash2 } from 'lucide-react';
import { eventsApi } from '../lib/api';
import type { Event, EventStatus } from '@event-management/shared';
import { format } from 'date-fns';
import { CreateEventModal } from '../components/CreateEventModal';

const STATUS_COLORS: Record<EventStatus, string> = {
  DRAFT: 'bg-gray-700 text-gray-300 border border-gray-600',
  PLANNING: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  CONFIRMED: 'bg-green-500/20 text-green-400 border border-green-500/30',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  COMPLETED: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border border-red-500/30',
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
    return <div className="text-center py-12 text-gray-400">Loading events...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="page-title">Events</h1>
            <p className="page-subtitle">Manage all your events in one place</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Event
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="card text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 mb-6 border border-primary-500/30">
            <Calendar className="w-10 h-10 text-primary-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-200 mb-2">No events yet</h3>
          <p className="text-gray-400 mb-6">Get started by creating your first event.</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            Create Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="card-hover group relative">
              <div className="flex items-start justify-between gap-4 mb-4">
                <Link
                  to={`/events/${event.id}`}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="text-xl font-bold text-gray-200 group-hover:text-primary-400 transition-colors flex-1 min-w-0">{event.name}</h2>
                    <span className={`badge ${STATUS_COLORS[event.status]} flex-shrink-0`}>
                      {event.status.replace('_', ' ')}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-gray-400 mb-4 line-clamp-2">{event.description}</p>
                  )}
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>{format(new Date(event.startDate), 'MMM d, yyyy')} - {format(new Date(event.endDate), 'MMM d, yyyy')}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="line-item-actions">
                  <button
                    onClick={(e) => handleDeleteEvent(event.id, event.name, e)}
                    className="action-btn-danger"
                    title="Delete event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
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

