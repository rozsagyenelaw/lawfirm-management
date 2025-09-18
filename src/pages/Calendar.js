import React, { useState } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const CalendarPage = () => {
  const { events, clients, addEvent, updateEvent, deleteEvent } = useData();
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    start: moment().format('YYYY-MM-DDTHH:mm'),
    end: moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
    clientId: '',
    type: 'meeting',
    description: ''
  });

  const calendarEvents = events.map(event => ({
    ...event,
    start: new Date(event.start),
    end: new Date(event.end || event.start)
  }));

  const handleSelectSlot = ({ start, end }) => {
    setFormData({
      title: '',
      start: moment(start).format('YYYY-MM-DDTHH:mm'),
      end: moment(end).format('YYYY-MM-DDTHH:mm'),
      clientId: '',
      type: 'meeting',
      description: ''
    });
    setShowAddModal(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addEvent({
      ...formData,
      start: new Date(formData.start).toISOString(),
      end: new Date(formData.end).toISOString()
    });
    setShowAddModal(false);
    setFormData({
      title: '',
      start: moment().format('YYYY-MM-DDTHH:mm'),
      end: moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
      clientId: '',
      type: 'meeting',
      description: ''
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDeleteEvent = (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteEvent(eventId);
      setSelectedEvent(null);
    }
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3B82F6';
    
    switch(event.type) {
      case 'court':
        backgroundColor = '#EF4444';
        break;
      case 'meeting':
        backgroundColor = '#3B82F6';
        break;
      case 'deadline':
        backgroundColor = '#F59E0B';
        break;
      case 'other':
        backgroundColor = '#8B5CF6';
        break;
      default:
        backgroundColor = '#6B7280';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block'
      }
    };
  };

  const CustomToolbar = ({ label, onNavigate, onView }) => (
    <div className="calendar-toolbar">
      <div className="toolbar-nav">
        <button className="btn-icon" onClick={() => onNavigate('PREV')}>
          <ChevronLeft size={20} />
        </button>
        <button className="btn-secondary" onClick={() => onNavigate('TODAY')}>
          Today
        </button>
        <button className="btn-icon" onClick={() => onNavigate('NEXT')}>
          <ChevronRight size={20} />
        </button>
      </div>
      <h2>{label}</h2>
      <div className="toolbar-views">
        <button 
          className={view === 'month' ? 'active' : ''}
          onClick={() => { setView('month'); onView('month'); }}
        >
          Month
        </button>
        <button 
          className={view === 'week' ? 'active' : ''}
          onClick={() => { setView('week'); onView('week'); }}
        >
          Week
        </button>
        <button 
          className={view === 'day' ? 'active' : ''}
          onClick={() => { setView('day'); onView('day'); }}
        >
          Day
        </button>
      </div>
    </div>
  );

  return (
    <div className="calendar-page">
      <div className="page-header">
        <div>
          <h1>Calendar</h1>
          <p>Manage your schedule and appointments</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Add Event
        </button>
      </div>

      <div className="calendar-container">
        <BigCalendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          view={view}
          date={date}
          onView={setView}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          components={{
            toolbar: CustomToolbar
          }}
        />
      </div>

      <div className="event-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#EF4444' }}></span>
          <span>Court</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#3B82F6' }}></span>
          <span>Meeting</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#F59E0B' }}></span>
          <span>Deadline</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#8B5CF6' }}></span>
          <span>Other</span>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Event</h2>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start *</label>
                  <input
                    type="datetime-local"
                    name="start"
                    value={formData.start}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End *</label>
                  <input
                    type="datetime-local"
                    name="end"
                    value={formData.end}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="meeting">Meeting</option>
                    <option value="court">Court</option>
                    <option value="deadline">Deadline</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Client</label>
                  <select
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleInputChange}
                  >
                    <option value="">No client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedEvent.title}</h2>
              <button className="btn-icon" onClick={() => setSelectedEvent(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="event-details">
              <div className="detail-row">
                <CalendarIcon size={18} />
                <span>
                  {moment(selectedEvent.start).format('MMMM DD, YYYY h:mm A')} - 
                  {moment(selectedEvent.end).format('h:mm A')}
                </span>
              </div>
              {selectedEvent.clientId && (
                <div className="detail-row">
                  <span>Client: {clients.find(c => c.id === selectedEvent.clientId)?.name}</span>
                </div>
              )}
              <div className="detail-row">
                <span className={`event-type ${selectedEvent.type}`}>
                  {selectedEvent.type}
                </span>
              </div>
              {selectedEvent.description && (
                <div className="detail-row">
                  <p>{selectedEvent.description}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn-danger" 
                onClick={() => handleDeleteEvent(selectedEvent.id)}
              >
                Delete Event
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
