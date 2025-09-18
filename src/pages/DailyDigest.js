import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, Calendar, CheckCircle, Users, FileText, TrendingUp, Filter } from 'lucide-react';
import { useData } from '../context/DataContext';
import { format, isToday, isTomorrow, isPast, isThisWeek, addDays } from 'date-fns';

const DailyDigest = () => {
  const navigate = useNavigate();
  const { clients, tasks, events, documents } = useData();
  const [filter, setFilter] = useState('all');
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [timeOfDay, setTimeOfDay] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('Good morning');
    else if (hour < 17) setTimeOfDay('Good afternoon');
    else setTimeOfDay('Good evening');
  }, []);

  // Categorize tasks
  const overdueTasks = tasks.filter(t => !t.completed && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));
  const todayTasks = tasks.filter(t => !t.completed && isToday(new Date(t.dueDate)));
  const tomorrowTasks = tasks.filter(t => !t.completed && isTomorrow(new Date(t.dueDate)));
  const thisWeekTasks = tasks.filter(t => !t.completed && isThisWeek(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && !isTomorrow(new Date(t.dueDate)));
  
  // Today's events
  const todayEvents = events.filter(e => isToday(new Date(e.start)));
  const thisWeekEvents = events.filter(e => isThisWeek(new Date(e.start)) && !isToday(new Date(e.start)));

  // Recent activity
  const recentClients = clients.filter(c => {
    const createdDate = new Date(c.createdAt);
    const threeDaysAgo = addDays(new Date(), -3);
    return createdDate >= threeDaysAgo;
  }).slice(0, 5);

  // Clients by workflow stage
  const workflowStages = {};
  tasks.forEach(task => {
    if (!task.completed && task.clientId) {
      const client = clients.find(c => c.id === task.clientId);
      if (client) {
        if (!workflowStages[client.category]) {
          workflowStages[client.category] = {};
        }
        if (!workflowStages[client.category][task.title]) {
          workflowStages[client.category][task.title] = [];
        }
        workflowStages[client.category][task.title].push({
          client,
          task,
          daysOverdue: isPast(new Date(task.dueDate)) ? Math.floor((new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24)) : 0
        });
      }
    }
  });

  const handleBatchComplete = () => {
    if (selectedTasks.length === 0) return;
    if (window.confirm(`Mark ${selectedTasks.length} tasks as complete?`)) {
      // In real implementation, this would update all tasks
      selectedTasks.forEach(taskId => {
        // This would call completeTask(taskId) from context
      });
      setSelectedTasks([]);
    }
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'text-red';
      case 'medium': return 'text-yellow';
      default: return 'text-gray';
    }
  };

  return (
    <div className="daily-digest">
      <div className="page-header">
        <div>
          <h1>{timeOfDay}! Here's Your Day</h1>
          <p>{format(new Date(), 'EEEE, MMMM dd, yyyy')}</p>
        </div>
        <div className="header-actions">
          {selectedTasks.length > 0 && (
            <button className="btn-primary" onClick={handleBatchComplete}>
              <CheckCircle size={20} />
              Complete {selectedTasks.length} Tasks
            </button>
          )}
        </div>
      </div>

      {/* Critical Alerts */}
      {overdueTasks.length > 0 && (
        <div className="alert-banner danger">
          <AlertCircle size={24} />
          <div className="alert-content">
            <h3>You have {overdueTasks.length} overdue tasks</h3>
            <p>These tasks need immediate attention</p>
          </div>
          <button className="btn-text" onClick={() => setFilter('overdue')}>
            View All →
          </button>
        </div>
      )}

      <div className="digest-grid">
        {/* Today's Priority Tasks */}
        <div className="digest-card priority">
          <div className="card-header">
            <h2>
              <Clock size={20} />
              Today's Tasks ({todayTasks.length})
            </h2>
          </div>
          <div className="task-list-compact">
            {todayTasks.length > 0 ? (
              todayTasks.map(task => {
                const client = clients.find(c => c.id === task.clientId);
                return (
                  <div key={task.id} className="task-item-compact">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => toggleTaskSelection(task.id)}
                    />
                    <div className="task-content">
                      <div className="task-main">
                        <span className={`priority-dot ${task.priority}`}></span>
                        <span className="task-title">{task.title}</span>
                      </div>
                      <div className="task-meta">
                        <span className="client-link" onClick={() => navigate(`/clients/${client?.id}`)}>
                          {client?.name}
                        </span>
                        <span className="category-tag">{client?.category.replace('-', ' ')}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty-message">No tasks due today</p>
            )}
          </div>
        </div>

        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <div className="digest-card danger">
            <div className="card-header">
              <h2>
                <AlertCircle size={20} />
                Overdue Tasks ({overdueTasks.length})
              </h2>
            </div>
            <div className="task-list-compact">
              {overdueTasks.slice(0, 5).map(task => {
                const client = clients.find(c => c.id === task.clientId);
                const daysOverdue = Math.floor((new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24));
                return (
                  <div key={task.id} className="task-item-compact overdue">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => toggleTaskSelection(task.id)}
                    />
                    <div className="task-content">
                      <div className="task-main">
                        <span className="task-title">{task.title}</span>
                        <span className="overdue-badge">{daysOverdue} days overdue</span>
                      </div>
                      <div className="task-meta">
                        <span className="client-link" onClick={() => navigate(`/clients/${client?.id}`)}>
                          {client?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {overdueTasks.length > 5 && (
                <button className="btn-link" onClick={() => navigate('/tasks')}>
                  View all {overdueTasks.length} overdue tasks →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Today's Events */}
        <div className="digest-card">
          <div className="card-header">
            <h2>
              <Calendar size={20} />
              Today's Schedule
            </h2>
          </div>
          {todayEvents.length > 0 ? (
            <div className="event-list-compact">
              {todayEvents.map(event => (
                <div key={event.id} className="event-item-compact">
                  <div className="event-time">
                    {format(new Date(event.start), 'h:mm a')}
                  </div>
                  <div className="event-details">
                    <span className="event-title">{event.title}</span>
                    <span className={`event-type ${event.type}`}>{event.type}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">No events scheduled today</p>
          )}
        </div>

        {/* Tomorrow's Tasks */}
        <div className="digest-card">
          <div className="card-header">
            <h2>Tomorrow's Tasks ({tomorrowTasks.length})</h2>
          </div>
          <div className="task-list-compact">
            {tomorrowTasks.length > 0 ? (
              tomorrowTasks.slice(0, 5).map(task => {
                const client = clients.find(c => c.id === task.clientId);
                return (
                  <div key={task.id} className="task-item-compact">
                    <div className="task-content">
                      <span className="task-title">{task.title}</span>
                      <span className="client-name">{client?.name}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty-message">No tasks due tomorrow</p>
            )}
          </div>
        </div>

        {/* This Week Overview */}
        <div className="digest-card">
          <div className="card-header">
            <h2>This Week Overview</h2>
          </div>
          <div className="week-stats">
            <div className="stat-item">
              <span className="stat-value">{thisWeekTasks.length}</span>
              <span className="stat-label">Tasks Due</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{thisWeekEvents.length}</span>
              <span className="stat-label">Events</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{recentClients.length}</span>
              <span className="stat-label">New Clients</span>
            </div>
          </div>
        </div>

        {/* Workflow Bottlenecks */}
        <div className="digest-card wide">
          <div className="card-header">
            <h2>
              <TrendingUp size={20} />
              Workflow Status by Practice Area
            </h2>
          </div>
          <div className="workflow-grid">
            {Object.entries(workflowStages).map(([category, stages]) => (
              <div key={category} className="workflow-category">
                <h3>{category.replace('-', ' ').toUpperCase()}</h3>
                <div className="stage-list">
                  {Object.entries(stages).slice(0, 3).map(([stage, items]) => (
                    <div key={stage} className="stage-item">
                      <span className="stage-name">{stage}</span>
                      <span className="stage-count">{items.length} clients</span>
                      {items.some(i => i.daysOverdue > 0) && (
                        <span className="overdue-indicator">!</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyDigest;
