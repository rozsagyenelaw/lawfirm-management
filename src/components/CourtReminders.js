import React, { useEffect, useState } from 'react';
import { Bell, AlertCircle, Calendar, FileText } from 'lucide-react';
import { differenceInDays, format, addDays } from 'date-fns';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';

const CourtReminders = () => {
  const { events } = useData();
  const [reminders, setReminders] = useState([]);
  
  useEffect(() => {
    checkForReminders();
    // Check reminders every hour
    const interval = setInterval(checkForReminders, 3600000);
    return () => clearInterval(interval);
  }, [events]);

  const checkForReminders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingReminders = [];
    
    events.forEach(event => {
      // Only check court events
      if (event.type !== 'court-date') return;
      
      const eventDate = new Date(event.start);
      eventDate.setHours(0, 0, 0, 0);
      const daysUntil = differenceInDays(eventDate, today);
      
      // 10-day reminder for clearing notes
      if (daysUntil === 10) {
        upcomingReminders.push({
          id: `${event.id}-10`,
          eventId: event.id,
          type: 'clear-notes',
          title: event.title,
          date: eventDate,
          daysUntil: 10,
          message: `Clear notes for ${event.title}`,
          priority: 'high'
        });
        
        // Show toast notification
        toast.error(`⚠️ Clear notes for ${event.title} - Court date in 10 days!`, {
          duration: 6000
        });
      }
      
      // 1-day reminder
      if (daysUntil === 1) {
        upcomingReminders.push({
          id: `${event.id}-1`,
          eventId: event.id,
          type: 'tomorrow',
          title: event.title,
          date: eventDate,
          daysUntil: 1,
          message: `Tomorrow: ${event.title}`,
          priority: 'urgent'
        });
        
        toast.error(`🔔 TOMORROW: ${event.title}`, {
          duration: 6000
        });
      }
      
      // Today reminder
      if (daysUntil === 0) {
        upcomingReminders.push({
          id: `${event.id}-0`,
          eventId: event.id,
          type: 'today',
          title: event.title,
          date: eventDate,
          daysUntil: 0,
          message: `TODAY: ${event.title}`,
          priority: 'urgent'
        });
        
        toast.error(`📍 TODAY: ${event.title}`, {
          duration: 8000
        });
      }
    });
    
    setReminders(upcomingReminders);
    
    // Save to localStorage to persist dismissals
    localStorage.setItem('courtReminders', JSON.stringify(upcomingReminders));
  };

  const dismissReminder = (reminderId) => {
    const dismissed = JSON.parse(localStorage.getItem('dismissedReminders') || '[]');
    dismissed.push(reminderId);
    localStorage.setItem('dismissedReminders', JSON.stringify(dismissed));
    setReminders(reminders.filter(r => r.id !== reminderId));
  };

  if (reminders.length === 0) return null;

  return (
    <div className="court-reminders">
      {reminders.map(reminder => (
        <div 
          key={reminder.id} 
          className={`reminder-alert ${reminder.priority}`}
        >
          <div className="reminder-icon">
            {reminder.type === 'clear-notes' ? (
              <FileText size={20} />
            ) : reminder.type === 'tomorrow' ? (
              <Bell size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
          </div>
          
          <div className="reminder-content">
            <h4>{reminder.message}</h4>
            <p>{format(reminder.date, 'EEEE, MMMM d, yyyy')}</p>
          </div>
          
          <button 
            className="dismiss-btn"
            onClick={() => dismissReminder(reminder.id)}
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
};

export default CourtReminders;
