import React from 'react';
import KanbanBoard from '../components/KanbanBoard';
import PipelineView from '../components/PipelineView';

const Kanban = () => {
  return (
    <div className="kanban-page">
      <div className="page-header">
        <h1>Kanban Board</h1>
        <p>Visualize and manage your workflow</p>
      </div>
      
      <KanbanBoard />
      <PipelineView />
    </div>
  );
};

export default Kanban;
