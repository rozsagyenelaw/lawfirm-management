import React, { useState } from 'react';
import { Plus, Filter, Calendar, CheckCircle, Circle, AlertCircle, Clock, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';

const Tasks = () => {
  const { tasks, clients, addTask, updateTask, deleteTask, completeTask } = useData();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    priority: 'medium',
    status: 'pending',
    dueDate: format(new Date(), 'yyyy-MM-dd')
  });

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'completed' && task.completed) ||
                         (filterStatus === 'pending' && !task.completed);
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addTask({
      ...formData,
      dueDate: new Date(formData.dueDate).toISOString()
    });
    setShowAddModal(false);
    setFormData({
      title: '',
      description: '',
      clientId: '',
      priority: 'medium',
      status: 'pending',
      dueDate: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'high':
        return <AlertCircle size={16} className="text-red" />;
      case 'medium':
        return <Clock size={16} className="text-yellow" />;
      default:
        return <Circle size={16} className="text-gray" />;
    }
  };

  const groupedTasks = {
    overdue: [],
    today: [],
    upcoming: [],
    later: []
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  filteredTasks.forEach(task => {
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    if (task.completed) return;
    
    if (dueDate < today) {
      groupedTasks.overdue.push(task);
    } else if (dueDate.getTime() === today.getTime()) {
      groupedTasks.today.push(task);
    } else if (dueDate < nextWeek) {
      groupedTasks.upcoming.push(task);
    } else {
      groupedTasks.later.push(task);
    }
  });

  const completedTasks = filteredTasks.filter(t => t.completed);

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p>Manage your tasks and deadlines</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Add Task
        </button>
      </div>

      <div className="controls-bar">
        <div className="filter-group">
          <Filter size={20} />
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="filter-group">
          <select 
            value={filterPriority} 
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      <div className="tasks-container">
        {groupedTasks.overdue.length > 0 && (
          <div className="task-section">
            <h3 className="section-title text-red">Overdue ({groupedTasks.overdue.length})</h3>
            <div className="task-list">
              {groupedTasks.overdue.map(task => {
                const client = clients.find(c => c.id === task.clientId);
                return (
                  <div key={task.id} className="task-card">
                    <button 
                      className="task-checkbox"
                      onClick={() => completeTask(task.id)}
                    >
                      <Circle size={20} />
                    </button>
                    <div className="task-content">
                      <div className="task-header">
                        <h4>{task.title}</h4>
                        {getPriorityIcon(task.priority)}
                      </div>
                      {task.description && <p className="task-description">{task.description}</p>}
                      <div className="task-meta">
                        {client && <span className="client-name">{client.name}</span>}
                        <span className="due-date text-red">
                          <Calendar size={14} />
                          {format(new Date(task.dueDate), 'MMM dd')}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="btn-icon"
                      onClick={() => deleteTask(task.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {groupedTasks.today.length > 0 && (
          <div className="task-section">
            <h3 className="section-title">Today ({groupedTasks.today.length})</h3>
            <div className="task-list">
              {groupedTasks.today.map(task => {
                const client = clients.find(c => c.id === task.clientId);
                return (
                  <div key={task.id} className="task-card">
                    <button 
                      className="task-checkbox"
                      onClick={() => completeTask(task.id)}
                    >
                      <Circle size={20} />
                    </button>
                    <div className="task-content">
                      <div className="task-header">
                        <h4>{task.title}</h4>
                        {getPriorityIcon(task.priority)}
                      </div>
                      {task.description && <p className="task-description">{task.description}</p>}
                      <div className="task-meta">
                        {client && <span className="client-name">{client.name}</span>}
                        <span className="due-date">
                          <Calendar size={14} />
                          Today
                        </span>
                      </div>
                    </div>
                    <button 
                      className="btn-icon"
                      onClick={() => deleteTask(task.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {groupedTasks.upcoming.length > 0 && (
          <div className="task-section">
            <h3 className="section-title">Next 7 Days ({groupedTasks.upcoming.length})</h3>
            <div className="task-list">
              {groupedTasks.upcoming.map(task => {
                const client = clients.find(c => c.id === task.clientId);
                return (
                  <div key={task.id} className="task-card">
                    <button 
                      className="task-checkbox"
                      onClick={() => completeTask(task.id)}
                    >
                      <Circle size={20} />
                    </button>
                    <div className="task-content">
                      <div className="task-header">
                        <h4>{task.title}</h4>
                        {getPriorityIcon(task.priority)}
                      </div>
                      {task.description && <p className="task-description">{task.description}</p>}
                      <div className="task-meta">
                        {client && <span className="client-name">{client.name}</span>}
                        <span className="due-date">
                          <Calendar size={14} />
                          {format(new Date(task.dueDate), 'MMM dd')}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="btn-icon"
                      onClick={() => deleteTask(task.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {groupedTasks.later.length > 0 && (
          <div className="task-section">
            <h3 className="section-title">Later ({groupedTasks.later.length})</h3>
            <div className="task-list">
              {groupedTasks.later.map(task => {
                const client = clients.find(c => c.id === task.clientId);
                return (
                  <div key={task.id} className="task-card">
                    <button 
                      className="task-checkbox"
                      onClick={() => completeTask(task.id)}
                    >
                      <Circle size={20} />
                    </button>
                    <div className="task-content">
                      <div className="task-header">
                        <h4>{task.title}</h4>
                        {getPriorityIcon(task.priority)}
                      </div>
                      {task.description && <p className="task-description">{task.description}</p>}
                      <div className="task-meta">
                        {client && <span className="client-name">{client.name}</span>}
                        <span className="due-date">
                          <Calendar size={14} />
                          {format(new Date(task.dueDate), 'MMM dd')}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="btn-icon"
                      onClick={() => deleteTask(task.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {completedTasks.length > 0 && (
          <div className="task-section">
            <h3 className="section-title text-gray">Completed ({completedTasks.length})</h3>
            <div className="task-list">
              {completedTasks.map(task => {
                const client = clients.find(c => c.id === task.clientId);
                return (
                  <div key={task.id} className="task-card completed">
                    <button className="task-checkbox checked">
                      <CheckCircle size={20} />
                    </button>
                    <div className="task-content">
                      <h4 className="line-through">{task.title}</h4>
                      <div className="task-meta">
                        {client && <span className="client-name">{client.name}</span>}
                      </div>
                    </div>
                    <button 
                      className="btn-icon"
                      onClick={() => deleteTask(task.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <div className="empty-state">
            <p>No tasks yet</p>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              Create Your First Task
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Task</h2>
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
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
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
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
