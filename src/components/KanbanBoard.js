import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Clock, User, Calendar, ChevronRight, Plus, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const KanbanBoard = () => {
  const { tasks, updateTask, clients } = useData();
  const [draggedTask, setDraggedTask] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [activeColumn, setActiveColumn] = useState(null);

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
      const updates = {
        status: newStatus,
        completed: newStatus === 'completed'
      };
      updateTask(draggedTask.id, updates);
      toast.success(`Task moved to ${columns.find(c => c.id === newStatus).title}`);
    }
    setDraggedTask(null);
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
    
    return (
      <div
        className="kanban-task-card"
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        style={{ borderLeft: `4px solid ${getPriorityColor(task.priority)}` }}
      >
        <div className="task-card-header">
          <h4>{task.title}</h4>
          <button className="task-menu-btn">
            <MoreVertical size={16} />
          </button>
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
    </div>
  );
};

export default KanbanBoard;
