import React from 'react';
import KanbanBoard from '../components/KanbanBoard';

const Kanban = () => {
  return (
    <div className="kanban-page">
      <div className="page-header">
        <h1>Kanban Board</h1>
        <p>Visualize and manage your workflow</p>
      </div>
      
      <KanbanBoard />
    </div>
  );
};

export default Kanban;
