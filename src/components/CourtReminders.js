import React, { useEffect, useState } from 'react';
import { Bell, AlertCircle, Calendar, FileText, Gavel } from 'lucide-react';
import { differenceInDays, format, addDays, isWithinInterval, subDays } from 'date-fns';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';

const CourtReminders = () => {
  const { events } = useData();
  const [reminders, setReminders] = useState([]);
  const [dismissedReminders, setDismissedReminders] = useState([]);
  
  useEffect(() => {
    // Load dismissed reminders from localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissedReminders') || '[]');
    setDismissedReminders(dismissed);
    
    checkForReminders();
    
    // Check reminders every minute while app is open
    const interval = setInterval(checkForReminders, 60000);
    
    // Also check when events change
    return () => clearInterval(interval);
  }, [events]);

  const checkForReminders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingReminders = [];
    const dismissed = JSON.parse(localStorage.getItem('dismissedReminders') || '[]');
    
    // Get the last check time
    const lastCheckStr = localStorage.getItem('lastReminderCheck');
    const lastCheck = lastCheckStr ? new Date(lastCheckStr) : subDays(today, 1);
    const isNewCheck = differenceInDays(today, lastCheck) >= 1;
    
    events.forEach(event => {
      // Check for court-related events - be more flexible with type checking
      const isCourtEvent = 
        event.type === 'court-date' || 
        event.type === 'court' ||
        event.type === 'hearing' ||
        event.type === 'trial' ||
        (event.title && (
          event.title.toLowerCase().includes('court') ||
          event.title.toLowerCase().includes('hearing') ||
          event.title.toLowerCase().includes('trial') ||
          event.title.toLowerCase().includes('probate')
        ));
      
      if (!isCourtEvent) return;
      
      const eventDate = new Date(event.start);
      eventDate.setHours(0, 0, 0, 0);
      const daysUntil = differenceInDays(eventDate, today);
      
      // Check for 10-day reminder (actually check 10-7 days range to catch it)
      if (daysUntil >= 7 && daysUntil <= 10) {
        const reminderId = `${event.id}-10day-${format(today, 'yyyy-MM-dd')}`;
        
        if (!dismissed.includes(reminderId)) {
          upcomingReminders.push({
            id: reminderId,
            eventId: event.id,
            type: 'clear-notes',
            title: event.title,
            date: eventDate,
            daysUntil: daysUntil,
            message: `Clear notes for ${event.title} (${daysUntil} days)`,
            priority: 'high'
          });
          
          // Show toast notification only once per day
          if (isNewCheck && daysUntil === 10) {
            toast(`⚠️ Clear notes for ${event.title} - Court date in 10 days!`, {
              duration: 8000,
              icon: '⚖️',
              style: {
                background: '#FEF3C7',
                color: '#92400E',
              },
            });
          }
        }
      }
      
      // 3-day warning
      if (daysUntil === 3) {
        const reminderId = `${event.id}-3day-${format(today, 'yyyy-MM-dd')}`;
        
        if (!dismissed.includes(reminderId)) {
          upcomingReminders.push({
            id: reminderId,
            eventId: event.id,
            type: 'three-days',
            title: event.title,
            date: eventDate,
            daysUntil: 3,
            message: `3 DAYS: ${event.title}`,
            priority: 'high'
          });
          
          if (isNewCheck) {
            toast.error(`⚠️ 3 DAYS until ${event.title}`, {
              duration: 8000
            });
          }
        }
      }
      
      // 1-day reminder
      if (daysUntil === 1) {
        const reminderId = `${event.id}-1day-${format(today, 'yyyy-MM-dd')}`;
        
        if (!dismissed.includes(reminderId)) {
          upcomingReminders.push({
            id: reminderId,
            eventId: event.id,
            type: 'tomorrow',
            title: event.title,
            date: eventDate,
            daysUntil: 1,
            message: `TOMORROW: ${event.title}`,
            priority: 'urgent'
          });
          
          if (isNewCheck) {
            toast.error(`🔔 TOMORROW: ${event.title}`, {
              duration: 10000
            });
          }
        }
      }
      
      // Today reminder
      if (daysUntil === 0) {
        const reminderId = `${event.id}-today-${format(today, 'yyyy-MM-dd')}`;
        
        if (!dismissed.includes(reminderId)) {
          upcomingReminders.push({
            id: reminderId,
            eventId: event.id,
            type: 'today',
            title: event.title,
            date: eventDate,
            daysUntil: 0,
            message: `TODAY: ${event.title}`,
            priority: 'urgent'
          });
          
          if (isNewCheck) {
            toast.error(`📍 TODAY: ${event.title}`, {
              duration: 10000,
              style: {
                background: '#DC2626',
                color: '#fff',
              },
            });
          }
        }
      }
      
      // Show overdue if court date has passed and not dismissed
      if (daysUntil < 0 && daysUntil >= -3) {
        const reminderId = `${event.id}-overdue-${format(today, 'yyyy-MM-dd')}`;
        
        if (!dismissed.includes(reminderId)) {
          upcomingReminders.push({
            id: reminderId,
            eventId: event.id,
            type: 'overdue',
            title: event.title,
            date: eventDate,
            daysUntil: daysUntil,
            message: `OVERDUE: ${event.title}`,
            priority: 'overdue'
          });
        }
      }
    });
    
    // Update last check time
    if (isNewCheck) {
      localStorage.setItem('lastReminderCheck', today.toISOString());
    }
    
    setReminders(upcomingReminders);
    
    // Save current reminders to localStorage
    localStorage.setItem('courtReminders', JSON.stringify(upcomingReminders));
  };

  const dismissReminder = (reminderId) => {
    const dismissed = JSON.parse(localStorage.getItem('dismissedReminders') || '[]');
    if (!dismissed.includes(reminderId)) {
      dismissed.push(reminderId);
      localStorage.setItem('dismissedReminders', JSON.stringify(dismissed));
    }
    setDismissedReminders(dismissed);
    setReminders(reminders.filter(r => r.id !== reminderId));
    toast.success('Reminder dismissed');
  };

  const dismissAll = () => {
    const dismissed = JSON.parse(localStorage.getItem('dismissedReminders') || '[]');
    reminders.forEach(reminder => {
      if (!dismissed.includes(reminder.id)) {
        dismissed.push(reminder.id);
      }
    });
    localStorage.setItem('dismissedReminders', JSON.stringify(dismissed));
    setDismissedReminders(dismissed);
    setReminders([]);
    toast.success('All reminders dismissed');
  };

  // Also check on component mount for any missed reminders
  useEffect(() => {
    const checkMissedReminders = () => {
      const today = new Date();
      const tenDaysFromNow = addDays(today, 10);
      
      events.forEach(event => {
        const isCourtEvent = 
          event.type === 'court-date' || 
          event.type === 'court' ||
          event.type === 'hearing' ||
          (event.title && event.title.toLowerCase().includes('court'));
          
        if (!isCourtEvent) return;
        
        const eventDate = new Date(event.start);
        
        // Check if event is within the next 10 days
        if (isWithinInterval(eventDate, { start: today, end: tenDaysFromNow })) {
          const daysUntil = differenceInDays(eventDate, today);
          console.log(`Court event "${event.title}" in ${daysUntil} days`);
        }
      });
    };
    
    checkMissedReminders();
  }, [events]);

  if (reminders.length === 0) return null;

  return (
    <div className="court-reminders">
      <div className="reminders-header">
        <h3>
          <Gavel size={20} />
          Court Date Reminders ({reminders.length})
        </h3>
        {reminders.length > 1 && (
          <button onClick={dismissAll} className="dismiss-all-btn">
            Dismiss All
          </button>
        )}
      </div>
      
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
            ) : reminder.type === 'today' ? (
              <AlertCircle size={20} />
            ) : reminder.type === 'three-days' ? (
              <Calendar size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
          </div>
          
          <div className="reminder-content">
            <h4>{reminder.message}</h4>
            <p>{format(reminder.date, 'EEEE, MMMM d, yyyy')}</p>
            {reminder.type === 'clear-notes' && (
              <small>Remember to clear all notes before the hearing</small>
            )}
            {reminder.type === 'overdue' && (
              <small style={{color: '#DC2626'}}>This court date has passed</small>
            )}
          </div>
          
          <button 
            className="dismiss-btn"
            onClick={() => dismissReminder(reminder.id)}
            title="Dismiss this reminder"
          >
            Dismiss
          </button>
        </div>
      ))}
      
      <style jsx>{`
        .court-reminders {
          position: fixed;
          top: 80px;
          right: 20px;
          width: 350px;
          max-height: 500px;
          overflow-y: auto;
          z-index: 1000;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          border: 1px solid #e5e7eb;
        }
        
        .reminders-header {
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f9fafb;
          border-radius: 8px 8px 0 0;
        }
        
        .reminders-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #374151;
        }
        
        .dismiss-all-btn {
          padding: 4px 8px;
          font-size: 12px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .reminder-alert {
          display: flex;
          align-items: flex-start;
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
          background: white;
          transition: background 0.2s;
        }
        
        .reminder-alert:hover {
          background: #f9fafb;
        }
        
        .reminder-alert.urgent {
          background: #FEE2E2;
        }
        
        .reminder-alert.urgent:hover {
          background: #FECACA;
        }
        
        .reminder-alert.high {
          background: #FEF3C7;
        }
        
        .reminder-alert.high:hover {
          background: #FDE68A;
        }
        
        .reminder-alert.overdue {
          background: #DC2626;
          color: white;
        }
        
        .reminder-alert.overdue .reminder-content p {
          color: #FCA5A5;
        }
        
        .reminder-icon {
          margin-right: 12px;
          color: #EF4444;
        }
        
        .reminder-content {
          flex: 1;
        }
        
        .reminder-content h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
        }
        
        .reminder-content p {
          margin: 0;
          font-size: 12px;
          color: #6B7280;
        }
        
        .reminder-content small {
          display: block;
          margin-top: 4px;
          font-size: 11px;
          color: #9CA3AF;
          font-style: italic;
        }
        
        .dismiss-btn {
          padding: 4px 8px;
          font-size: 12px;
          background: transparent;
          color: #6B7280;
          border: 1px solid #D1D5DB;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .dismiss-btn:hover {
          background: #EF4444;
          color: white;
          border-color: #EF4444;
        }
        
        @media (max-width: 768px) {
          .court-reminders {
            width: 90%;
            right: 5%;
            left: 5%;
          }
        }
      `}</style>
    </div>
  );
};

export default CourtReminders;
