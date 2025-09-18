import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Clock, User, Calendar, ChevronRight, Plus, MoreVertical, Link2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const KanbanBoard = () => {
  const { tasks, updateTask, clients, addTask } = useData();
  const [draggedTask, setDraggedTask] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [activeColumn, setActiveColumn] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDependencyModal, setShowDependencyModal] = useState(false);

  const columns = [
    { id: 'pending', title: 'To Do', color: '#F59E0B' },
    { id: 'in-progress', title: 'In Progress', color: '#3B82F6' },
    { id: 'review', title: 'Review', color: '#8B5CF6' },
    { id: 'completed', title: 'Completed', color: '#10B981' }
  ];

  const getTasksByStatus = (status) => {
    return tasks.filter(task => {
      if (status === 'pending') return task.status === 'pending' && !task.completed;
      if (status === 'in-progress') return task.status === 'in-progress';
      if (status === 'review') return task.status === 'review';
      if (status === 'completed') return task.completed || task.status === 'completed';
      return false;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const getBlockedBy = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.dependencies) return [];
    
    return task.dependencies
      .map(depId => tasks.find(t => t.id === depId))
      .filter(dep => dep && !dep.completed);
  };

  const getDependentTasks = (taskId) => {
    return tasks.filter(t => 
      t.dependencies && 
      t.dependencies.includes(taskId) && 
      !t.completed
    );
  };

  const canMoveToStatus = (task, newStatus) => {
    if (newStatus === 'pending') return true;
    
    const blockedBy = getBlockedBy(task.id);
    if (blockedBy.length > 0 && newStatus !== 'pending') {
      return false;
    }
    return true;
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    if (draggedTask) {
      if (!canMoveToStatus(draggedTask, newStatus)) {
        toast.error('Cannot move task - has incomplete dependencies');
        setDraggedTask(null);
        return;
      }
      
      const updates = {
        status: newStatus,
        completed: newStatus === 'completed'
      };
      updateTask(draggedTask.id, updates);
      toast.success(`Task moved to ${columns.find(c => c.id === newStatus).title}`);
      
      // Check if this unblocks other tasks
      const dependentTasks = getDependentTasks(draggedTask.id);
      if (newStatus === 'completed' && dependentTasks.length > 0) {
        toast.success(`Unblocked ${dependentTasks.length} dependent task(s)`);
      }
    }
    setDraggedTask(null);
  };

  const handleAddDependency = (taskId, dependencyId) => {
    const task = tasks.find(t => t.id === taskId);
    const currentDeps = task.dependencies || [];
    
    if (currentDeps.includes(dependencyId)) {
      toast.error('Dependency already exists');
      return;
    }
    
    if (dependencyId === taskId) {
      toast.error('Task cannot depend on itself');
      return;
    }
    
    updateTask(taskId, {
      dependencies: [...currentDeps, dependencyId]
    });
    toast.success('Dependency added');
  };

  const handleRemoveDependency = (taskId, dependencyId) => {
    const task = tasks.find(t => t.id === taskId);
    const currentDeps = task.dependencies || [];
    
    updateTask(taskId, {
      dependencies: currentDeps.filter(id => id !== dependencyId)
    });
    toast.success('Dependency removed');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const TaskCard = ({ task }) => {
    const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;
    const blockedBy = getBlockedBy(task.id);
    const isBlocked = blockedBy.length > 0;
    const dependentTasks = getDependentTasks(task.id);
    
    return (
      <div
        className={`kanban-task-card ${isBlocked ? 'blocked' : ''}`}
        draggable={!isBlocked}
        onDragStart={(e) => handleDragStart(e, task)}
        style={{ 
          borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
          opacity: isBlocked ? 0.7 : 1
        }}
      >
        {isBlocked && (
          <div className="blocked-indicator">
            <AlertCircle size={14} />
            <span>Blocked by {blockedBy.length} task(s)</span>
          </div>
        )}
        
        <div className="task-card-header">
          <h4>{task.title}</h4>
          <div className="task-actions">
            <button 
              className="task-menu-btn"
              onClick={() => {
                setSelectedTask(task);
                setShowDependencyModal(true);
              }}
              title="Manage dependencies"
            >
              <Link2 size={16} />
            </button>
            <button className="task-menu-btn">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
        
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
        
        <div className="task-meta">
          {task.clientId && (
            <div className="task-client">
              <User size={14} />
              <span>{getClientName(task.clientId)}</span>
            </div>
          )}
          
          <div className={`task-due ${isOverdue ? 'overdue' : ''}`}>
            <Calendar size={14} />
            <span>{format(new Date(task.dueDate), 'MMM d')}</span>
          </div>
        </div>

        <div className="task-footer">
          <span className={`priority-badge ${task.priority}`}>
            {task.priority}
          </span>
          {task.category && (
            <span className="category-badge">
              {task.category.replace('-', ' ')}
            </span>
          )}
          {dependentTasks.length > 0 && (
            <span className="dependency-badge">
              <Link2 size={12} />
              {dependentTasks.length} waiting
            </span>
          )}
        </div>
      </div>
    );
  };

  const DependencyModal = () => {
    if (!selectedTask || !showDependencyModal) return null;
    
    const currentDeps = selectedTask.dependencies || [];
    const availableTasks = tasks.filter(t => 
      t.id !== selectedTask.id && 
      !currentDeps.includes(t.id) &&
      t.clientId === selectedTask.clientId
    );
    
    return (
      <div className="modal-overlay" onClick={() => setShowDependencyModal(false)}>
        <div className="modal dependency-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Manage Dependencies</h2>
            <button onClick={() => setShowDependencyModal(false)}>✕</button>
          </div>
          
          <div className="dependency-content">
            <h3>{selectedTask.title}</h3>
            <p className="modal-subtitle">This task depends on:</p>
            
            {currentDeps.length > 0 ? (
              <div className="dependency-list">
                {currentDeps.map(depId => {
                  const depTask = tasks.find(t => t.id === depId);
                  if (!depTask) return null;
                  return (
                    <div key={depId} className="dependency-item">
                      <div>
                        <strong>{depTask.title}</strong>
                        <span className={`status-badge ${depTask.completed ? 'completed' : 'pending'}`}>
                          {depTask.completed ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                      <button 
                        className="btn-text"
                        onClick={() => handleRemoveDependency(selectedTask.id, depId)}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-dependencies">No dependencies set</p>
            )}
            
            {availableTasks.length > 0 && (
              <>
                <h4>Add Dependency:</h4>
                <div className="available-tasks">
                  {availableTasks.map(task => (
                    <div 
                      key={task.id}
                      className="available-task"
                      onClick={() => handleAddDependency(selectedTask.id, task.id)}
                    >
                      <Plus size={16} />
                      <span>{task.title}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="kanban-board">
      <div className="kanban-header">
        <h2>Task Board</h2>
        <div className="kanban-actions">
          <button className="btn-primary" onClick={() => setShowAddTask(true)}>
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>

      <div className="kanban-columns">
        {columns.map(column => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <div
              key={column.id}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div 
                className="column-header"
                style={{ borderTop: `3px solid ${column.color}` }}
              >
                <h3>{column.title}</h3>
                <span className="task-count">{columnTasks.length}</span>
              </div>
              
              <div className="column-content">
                {columnTasks.length === 0 ? (
                  <div className="empty-column">
                    <p>No tasks</p>
                    <button 
                      className="btn-text"
                      onClick={() => {
                        setActiveColumn(column.id);
                        setShowAddTask(true);
                      }}
                    >
                      Add a task
                    </button>
                  </div>
                ) : (
                  columnTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <DependencyModal />
    </div>
  );
};

export default KanbanBoard;
