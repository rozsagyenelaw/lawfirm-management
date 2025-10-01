import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckSquare, Calendar, FileText, TrendingUp, Clock, AlertCircle, DollarSign } from 'lucide-react';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import CourtReminders from '../components/CourtReminders';
import PendingSignatures from '../components/PendingSignatures';
import RecentSignedDocuments from '../components/RecentSignedDocuments';

const Dashboard = () => {
  const navigate = useNavigate();
  const { clients, tasks, events, documents, getUpcomingTasks, getUpcomingEvents } = useData();
  
  const upcomingTasks = getUpcomingTasks(7);
  const upcomingEvents = getUpcomingEvents(7);
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;

  const stats = [
    { label: 'Total Clients', value: clients.length, icon: Users, color: 'blue', path: '/clients' },
    { label: 'Pending Tasks', value: pendingTasks, icon: CheckSquare, color: 'yellow', path: '/tasks' },
    { label: 'Upcoming Events', value: upcomingEvents.length, icon: Calendar, color: 'purple', path: '/calendar' },
    { label: 'Documents', value: documents.length, icon: FileText, color: 'green', path: '/documents' }
  ];

  const categoryData = {
    'estate-planning': { name: 'Estate Planning', count: 0, color: '#3B82F6' },
    'probate': { name: 'Probate', count: 0, color: '#10B981' },
    'trust-litigation': { name: 'Trust Litigation', count: 0, color: '#F59E0B' },
    'conservatorship': { name: 'Conservatorship', count: 0, color: '#8B5CF6' },
    'guardianship': { name: 'Guardianship', count: 0, color: '#1E40AF' },
    'fire-victim': { name: 'Fire Victim', count: 0, color: '#EF4444' }
  };

  clients.forEach(client => {
    if (categoryData[client.category]) {
      categoryData[client.category].count++;
    }
  });

  const pieData = Object.values(categoryData).filter(d => d.count > 0);
  
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthClients = clients.filter(c => {
      const clientDate = new Date(c.createdAt);
      return clientDate.getMonth() === date.getMonth() && 
             clientDate.getFullYear() === date.getFullYear();
    });
    return {
      month: format(date, 'MMM'),
      clients: monthClients.length
    };
  });

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your practice overview.</p>
      </div>

      {/* Court Reminders Component */}
      <CourtReminders />

      <div className="stats-grid">
        {stats.map(stat => (
          <div 
            key={stat.label} 
            className={`stat-card ${stat.color}`}
            onClick={() => navigate(stat.path)}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-icon">
              <stat.icon size={24} />
            </div>
            <div className="stat-content">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Upcoming Tasks</h2>
          {upcomingTasks.length > 0 ? (
            <div className="task-list">
              {upcomingTasks.slice(0, 5).map(task => {
                const client = clients.find(c => c.id === task.clientId);
                return (
                  <div key={task.id} className="task-item">
                    <div className="task-info">
                      <h4>{task.title}</h4>
                      <p>{client?.name || 'No client'}</p>
                    </div>
                    <span className={`priority-badge ${task.priority}`}>
                      {format(new Date(task.dueDate), 'MMM dd')}
                    </span>
                  </div>
                );
              })}
              <button 
                className="btn-link"
                onClick={() => navigate('/tasks')}
              >
                View all tasks →
              </button>
            </div>
          ) : (
            <p className="empty-state">No upcoming tasks</p>
          )}
        </div>

        <div className="dashboard-card">
          <h2>Upcoming Events</h2>
          {upcomingEvents.length > 0 ? (
            <div className="event-list">
              {upcomingEvents.slice(0, 5).map(event => (
                <div key={event.id} className="event-item">
                  <div className="event-info">
                    <h4>{event.title}</h4>
                    <p>{format(new Date(event.start), 'MMM dd, h:mm a')}</p>
                  </div>
                  <span className={`event-type ${event.type}`}>
                    {event.type}
                  </span>
                </div>
              ))}
              <button 
                className="btn-link"
                onClick={() => navigate('/calendar')}
              >
                View calendar →
              </button>
            </div>
          ) : (
            <p className="empty-state">No upcoming events</p>
          )}
        </div>

        <div className="dashboard-card">
          <h2>Client Growth</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="clients" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-card">
          <h2>Practice Areas</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={entry => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-state">No client data yet</p>
          )}
        </div>

        <div className="dashboard-card">
          <h2>Task Overview</h2>
          <div className="task-stats">
            <div className="task-stat">
              <span className="task-stat-value">{completedTasks}</span>
              <span className="task-stat-label">Completed</span>
            </div>
            <div className="task-stat">
              <span className="task-stat-value">{pendingTasks}</span>
              <span className="task-stat-label">Pending</span>
            </div>
            <div className="task-stat">
              <span className="task-stat-value">
                {tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%
              </span>
              <span className="task-stat-label">Completion Rate</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button className="btn-primary" onClick={() => navigate('/clients')}>
              Add New Client
            </button>
            <button className="btn-secondary" onClick={() => navigate('/tasks')}>
              Create Task
            </button>
            <button className="btn-secondary" onClick={() => navigate('/calendar')}>
              Schedule Event
            </button>
          </div>
        </div>
      </div>

      {/* Document Signature Tracking - Moved to Bottom */}
      <div className="dashboard-grid" style={{ marginTop: '30px' }}>
        <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
          <PendingSignatures />
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: '20px' }}>
        <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
          <RecentSignedDocuments />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
