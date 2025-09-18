import React, { useState } from 'react';
import TimeTracker from '../components/TimeTracker';
import { CheckCircle, Circle, Calendar, AlertCircle, Plus, X, Clock, Filter, Trash2, Edit, CheckSquare } from 'lucide-react';
import { useData } from '../context/DataContext';
import { format, isPast, isToday, isTomorrow, isThisWeek } from 'date-fns';
import AdvancedFilters from '../components/AdvancedFilters';

const Tasks = () => {
  const { tasks, clients, completeTask, deleteTask, updateTask, addTask } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [filteredByAdvanced, setFilteredByAdvanced] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    priority: 'medium',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    category: 'estate-planning'
  });

  const categories = [
    { value: 'estate-planning', label: 'Estate Planning' },
    { value: 'probate', label: 'Probate' },
    { value: 'trust-litigation', label: 'Trust Litigation' },
    { value: 'conservatorship', label: 'Conservatorship' },
    { value: 'guardianship', label: 'Guardianship' },
    { value: 'fire-victim', label: 'Fire Victim' }
  ];

  // Use advanced filters if active, otherwise use regular filters
  let displayTasks = filteredByAdvanced || tasks;
  
  // Apply regular filters only if advanced filters are not active
  if (!filteredByAdvanced) {
    if (filterCategory !== 'all') {
      displayTasks = displayTasks.filter(task => task.category === filterCategory);
    }
    if (filterStatus !== 'all') {
      if (filterStatus === 'completed') {
        displayTasks = displayTasks.filter(task => task.completed);
      } else if (filterStatus === 'pending') {
        displayTasks = displayTasks.filter(task => !task.completed);
      } else if (filterStatus === 'overdue') {
        displayTasks = displayTasks.filter(task => !task.completed && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)));
      }
    }
    if (filterClient !== 'all') {
      displayTasks = displayTasks.filter(task => task.clientId === filterClient);
    }
  }

  // Categorize tasks
  const overdueTasks = displayTasks.filter(task => !task.completed && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)));
  const todayTasks = displayTasks.filter(task => !task.completed && isToday(new Date(task.dueDate)));
  const upcomingTasks = displayTasks.filter(task => !task.completed && !isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)));
  const completedTasks = displayTasks.filter(task => task.completed);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (showEditModal && selectedTask) {
      updateTask(selectedTask.id, formData);
      setShowEditModal(false);
    } else {
      addTask({
        ...formData,
        status: 'pending',
        completed: false
      });
      setShowAddModal(false);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      clientId: '',
      priority: 'medium',
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      category: 'estate-planning'
    });
    setSelectedTask(null);
  };

  const handleEdit = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      clientId: task.clientId || '',
      priority: task.priority,
      dueDate: format(new Date(task.dueDate), 'yyyy-MM-dd'),
      category: task.category || 'estate-planning'
    });
    setShowEditModal(true);
  };

  const handleToggleComplete = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task.completed) {
      updateTask(taskId, { completed: false, status: 'pending' });
    } else {
      completeTask(taskId);
    }
  };

  const handleSelectTask = (taskId) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    } else {
      setSelectedTasks([...selectedTasks, taskId]);
    }
  };

  const handleSelectAll = (taskGroup) => {
    const taskIds = taskGroup.map(t => t.id);
    const allSelected = taskIds.every(id => selectedTasks.includes(id));
    
    if (allSelected) {
      setSelectedTasks(selectedTasks.filter(id => !taskIds.includes(id)));
    } else {
      setSelectedTasks([...new Set([...selectedTasks, ...taskIds])]);
    }
  };

  const handleBatchComplete = () => {
    if (selectedTasks.length === 0) return;
    if (window.confirm(`Mark ${selectedTasks.length} tasks as complete?`)) {
      selectedTasks.forEach(taskId => {
        completeTask(taskId);
      });
      setSelectedTasks([]);
      setSelectMode(false);
    }
  };

  const handleBatchDelete = () => {
    if (selectedTasks.length === 0) return;
    if (window.confirm(`Delete ${selectedTasks.length} tasks? This cannot be undone.`)) {
      selectedTasks.forEach(taskId => {
        deleteTask(taskId);
      });
      setSelectedTasks([]);
      setSelectMode(false);
    }
  };

  const handleBatchUpdatePriority = (priority) => {
    if (selectedTasks.length === 0) return;
    selectedTasks.forEach(taskId => {
      updateTask(taskId, { priority });
    });
    setSelectedTasks([]);
    setSelectMode(false);
  };

  const handleBatchReschedule = () => {
    if (selectedTasks.length === 0) return;
    const newDate = prompt('Enter new due date (YYYY-MM-DD):', format(new Date(), 'yyyy-MM-dd'));
    if (newDate) {
      selectedTasks.forEach(taskId => {
        updateTask(taskId, { dueDate: new Date(newDate).toISOString() });
      });
      setSelectedTasks([]);
      setSelectMode(false);
    }
  };

  const renderTaskGroup = (title, tasks, colorClass = '') => {
    if (tasks.length === 0) return null;
    
    const allSelected = tasks.every(t => selectedTasks.includes(t.id));
    const someSelected = tasks.some(t => selectedTasks.includes(t.id));

    return (
      <div className="task-section">
        <div className="section-header-with-select">
          <h3 className={`section-title ${colorClass}`}>{title} ({tasks.length})</h3>
          {selectMode && (
            <button
              className="select-all-btn"
              onClick={() => handleSelectAll(tasks)}
            >
              {allSelected ? '✓ All Selected' : someSelected ? '- Some Selected' : 'Select All'}
            </button>
          )}
        </div>
        {tasks.map(task => {
          const client = clients.find(c => c.id === task.clientId);
          const isSelected = selectedTasks.includes(task.id);
          
          return (
            <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''} ${isSelected ? 'selected' : ''}`}>
              {selectMode && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleSelectTask(task.id)}
                  className="task-select-checkbox"
                />
              )}
              <button
                className={`task-checkbox ${task.completed ? 'checked' : ''}`}
                onClick={() => handleToggleComplete(task.id)}
              >
                {task.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
              </button>
              <div className="task-content">
                <div className="task-header">
                  <h4 className={task.completed ? 'line-through' : ''}>{task.title}</h4>
                  {!selectMode && (
                    <div className="task-actions">
                      <button className="btn-icon" onClick={() => handleEdit(task)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn-icon text-red" onClick={() => deleteTask(task.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}
                <div className="task-meta">
                  {client && (
                    <span className="client-name">{client.name}</span>
                  )}
                  <span className={`priority-badge ${task.priority}`}>
                    {task.priority}
                  </span>
                  <span className={`due-date ${isPast(new Date(task.dueDate)) && !task.completed ? 'text-red' : ''}`}>
                    <Calendar size={14} />
                    {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                  </span>
                  {task.category && (
                    <span className={`category-badge ${task.category}`}>
                      {categories.find(c => c.value === task.category)?.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p>Manage your tasks and deadlines</p>
        </div>
        <div className="header-actions">
          {!selectMode ? (
            <>
              <button className="btn-secondary" onClick={() => {
                setSelectMode(true);
                setSelectedTasks([]);
              }}>
                <CheckSquare size={20} />
                Batch Mode
              </button>
              <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={20} />
                Add Task
              </button>
            </>
          ) : (
            <>
              <button className="btn-text" onClick={() => {
                setSelectMode(false);
                setSelectedTasks([]);
              }}>
                Cancel
              </button>
              <span className="selected-count">{selectedTasks.length} selected</span>
            </>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        items={tasks}
        onFilterChange={setFilteredByAdvanced}
        filterableFields={['status', 'priority', 'category', 'dateRange']}
        entityType="tasks"
      />

      {/* Batch Actions Bar */}
      {selectMode && selectedTasks.length > 0 && (
        <div className="batch-actions-bar">
          <div className="batch-actions-group">
            <button className="btn-primary" onClick={handleBatchComplete}>
              <CheckCircle size={18} />
              Complete ({selectedTasks.length})
            </button>
            <button className="btn-secondary" onClick={handleBatchReschedule}>
              <Calendar size={18} />
              Reschedule
            </button>
            <div className="batch-priority-group">
              <span>Set Priority:</span>
              <button className="btn-text" onClick={() => handleBatchUpdatePriority('high')}>High</button>
              <button className="btn-text" onClick={() => handleBatchUpdatePriority('medium')}>Medium</button>
              <button className="btn-text" onClick={() => handleBatchUpdatePriority('low')}>Low</button>
            </div>
            <button className="btn-danger" onClick={handleBatchDelete}>
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Regular Filters - Only show if advanced filters are not active */}
      {!filteredByAdvanced && (
        <div className="filters-bar">
          <div className="filter-group">
            <Filter size={20} />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="filter-group">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)}>
              <option value="all">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="tasks-container">
        {renderTaskGroup('Overdue', overdueTasks, 'text-red')}
        {renderTaskGroup('Today', todayTasks)}
        {renderTaskGroup('Upcoming', upcomingTasks)}
        {renderTaskGroup('Completed', completedTasks, 'text-gray')}
        
        {displayTasks.length === 0 && (
          <div className="empty-state">
            <CheckCircle size={48} />
            <p>No tasks found</p>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              Create Your First Task
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showEditModal ? 'Edit Task' : 'Add New Task'}</h2>
              <button className="btn-icon" onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                resetForm();
              }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Client</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                >
                  <option value="">No client assigned</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {showEditModal ? 'Update Task' : 'Add Task'}
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

