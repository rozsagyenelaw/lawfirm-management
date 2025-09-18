import React from 'react';
import ActivityLog from '../components/ActivityLog';

const ActivityLogPage = () => {
  return (
    <div className="activity-log-page">
      <div className="page-header">
        <h1>Activity Log</h1>
        <p>Track all client interactions and billable time</p>
      </div>
      
      <ActivityLog />
    </div>
  );
};

export default ActivityLogPage;
