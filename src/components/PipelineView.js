import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { TrendingUp, Clock, AlertCircle, CheckCircle, BarChart3, Users } from 'lucide-react';
import { format, differenceInDays, startOfWeek, startOfMonth } from 'date-fns';

const PipelineView = () => {
  const { tasks, clients, events } = useData();
  const [view, setView] = useState('funnel');
  const [timeRange, setTimeRange] = useState('month');
  
  const stages = [
    { id: 'intake', name: 'Intake', color: '#3B82F6' },
    { id: 'pending', name: 'Pending', color: '#F59E0B' },
    { id: 'in-progress', name: 'In Progress', color: '#8B5CF6' },
    { id: 'review', name: 'Review', color: '#EC4899' },
    { id: 'completed', name: 'Completed', color: '#10B981' }
  ];
  
  const caseTypes = [
    'estate-planning',
    'probate',
    'conservatorship',
    'guardianship',
    'trust-litigation',
    'fire-victim'
  ];
  
  const getStageMetrics = () => {
    const metrics = stages.map(stage => {
      let count = 0;
      let totalDays = 0;
      let items = [];
      
      if (stage.id === 'intake') {
        const recentClients = clients.filter(c => {
          const daysOld = differenceInDays(new Date(), new Date(c.createdAt));
          return daysOld <= 7;
        });
        count = recentClients.length;
        items = recentClients;
      } else if (stage.id === 'completed') {
        items = tasks.filter(t => t.completed);
        count = items.length;
      } else {
        items = tasks.filter(t => t.status === stage.id && !t.completed);
        count = items.length;
      }
      
      items.forEach(item => {
        const created = new Date(item.createdAt);
        const now = new Date();
        totalDays += differenceInDays(now, created);
      });
      
      const avgDays = count > 0 ? Math.round(totalDays / count) : 0;
      
      return {
        ...stage,
        count,
        avgDays,
        items
      };
    });
    
    return metrics;
  };
  
  const getCaseTypeMetrics = () => {
    return caseTypes.map(type => {
      const typeClients = clients.filter(c => c.category === type);
      const typeTasks = tasks.filter(t => t.category === type);
      const completedTasks = typeTasks.filter(t => t.completed);
      const pendingTasks = typeTasks.filter(t => !t.completed);
      
      let avgCompletionDays = 0;
      if (completedTasks.length > 0) {
        const totalDays = completedTasks.reduce((sum, task) => {
          const created = new Date(task.createdAt);
          const completed = new Date(task.updatedAt || task.createdAt);
          return sum + differenceInDays(completed, created);
        }, 0);
        avgCompletionDays = Math.round(totalDays / completedTasks.length);
      }
      
      return {
        type,
        name: type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        clients: typeClients.length,
        pending: pendingTasks.length,
        completed: completedTasks.length,
        avgDays: avgCompletionDays,
        successRate: typeTasks.length > 0 
          ? Math.round((completedTasks.length / typeTasks.length) * 100) 
          : 0
      };
    });
  };
  
  const getBottlenecks = () => {
    const stageMetrics = getStageMetrics();
    const bottlenecks = [];
    
    stageMetrics.forEach(stage => {
      if (stage.avgDays > 14 && stage.count > 0) {
        bottlenecks.push({
          stage: stage.name,
          avgDays: stage.avgDays,
          count: stage.count,
          severity: stage.avgDays > 30 ? 'high' : 'medium'
        });
      }
    });
    
    return bottlenecks.sort((a, b) => b.avgDays - a.avgDays);
  };
  
  const getThroughput = () => {
    const now = new Date();
    const ranges = {
      week: startOfWeek(now),
      month: startOfMonth(now),
      quarter: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
    };
    
    const rangeStart = ranges[timeRange] || ranges.month;
    
    const completedInRange = tasks.filter(task => {
      if (!task.completed) return false;
      const completedDate = new Date(task.updatedAt || task.createdAt);
      return completedDate >= rangeStart;
    });
    
    const startedInRange = clients.filter(client => {
      const created = new Date(client.createdAt);
      return created >= rangeStart;
    });
    
    return {
      started: startedInRange.length,
      completed: completedInRange.length,
      range: timeRange
    };
  };
  
  const stageMetrics = getStageMetrics();
  const caseTypeMetrics = getCaseTypeMetrics();
  const bottlenecks = getBottlenecks();
  const throughput = getThroughput();
  
  const FunnelView = () => (
    <div className="funnel-view">
      <div className="funnel-container">
        {stageMetrics.map((stage, index) => {
          const width = 100 - (index * 15);
          return (
            <div 
              key={stage.id}
              className="funnel-stage"
              style={{ 
                width: `${width}%`,
                background: stage.color
              }}
            >
              <div className="stage-content">
                <h3>{stage.name}</h3>
                <div className="stage-count">{stage.count}</div>
                {stage.avgDays > 0 && (
                  <div className="stage-time">Avg: {stage.avgDays} days</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="funnel-legend">
        {stageMetrics.map(stage => (
          <div key={stage.id} className="legend-item">
            <div 
              className="legend-color" 
              style={{ background: stage.color }}
            />
            <span>{stage.name}: {stage.count} items</span>
          </div>
        ))}
      </div>
    </div>
  );
  
  const FlowView = () => (
    <div className="flow-view">
      <div className="flow-container">
        {stageMetrics.map((stage, index) => (
          <React.Fragment key={stage.id}>
            <div className="flow-stage">
              <div 
                className="stage-box"
                style={{ borderColor: stage.color }}
              >
                <h4>{stage.name}</h4>
                <div className="stage-metrics">
                  <div className="metric">
                    <span className="metric-value">{stage.count}</span>
                    <span className="metric-label">Items</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">{stage.avgDays}d</span>
                    <span className="metric-label">Avg Time</span>
                  </div>
                </div>
              </div>
            </div>
            {index < stageMetrics.length - 1 && (
              <div className="flow-arrow">→</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
  
  const MetricsView = () => (
    <div className="metrics-view">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <Users size={20} />
            <h4>Active Cases</h4>
          </div>
          <div className="metric-value">
            {clients.filter(c => {
              const clientTasks = tasks.filter(t => t.clientId === c.id);
              return clientTasks.some(t => !t.completed);
            }).length}
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-header">
            <TrendingUp size={20} />
            <h4>Throughput</h4>
          </div>
          <div className="metric-value">
            {throughput.completed}
            <span className="metric-sublabel">completed this {throughput.range}</span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-header">
            <Clock size={20} />
            <h4>Avg Cycle Time</h4>
          </div>
          <div className="metric-value">
            {Math.round(stageMetrics.reduce((sum, s) => sum + s.avgDays, 0) / stageMetrics.length)}
            <span className="metric-sublabel">days per stage</span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-header">
            <CheckCircle size={20} />
            <h4>Completion Rate</h4>
          </div>
          <div className="metric-value">
            {tasks.length > 0 
              ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) 
              : 0}%
          </div>
        </div>
      </div>
      
      {bottlenecks.length > 0 && (
        <div className="bottlenecks-section">
          <h3><AlertCircle size={20} /> Bottlenecks Detected</h3>
          <div className="bottlenecks-list">
            {bottlenecks.map(bottleneck => (
              <div 
                key={bottleneck.stage}
                className={`bottleneck-item ${bottleneck.severity}`}
              >
                <strong>{bottleneck.stage}</strong>
                <span>{bottleneck.count} items averaging {bottleneck.avgDays} days</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="case-types-section">
        <h3>Performance by Case Type</h3>
        <div className="case-types-table">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Clients</th>
                <th>Pending</th>
                <th>Completed</th>
                <th>Success Rate</th>
                <th>Avg Days</th>
              </tr>
            </thead>
            <tbody>
              {caseTypeMetrics.map(caseType => (
                <tr key={caseType.type}>
                  <td>{caseType.name}</td>
                  <td>{caseType.clients}</td>
                  <td>{caseType.pending}</td>
                  <td>{caseType.completed}</td>
                  <td>
                    <span className={`success-rate ${caseType.successRate > 75 ? 'high' : caseType.successRate > 50 ? 'medium' : 'low'}`}>
                      {caseType.successRate}%
                    </span>
                  </td>
                  <td>{caseType.avgDays || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="pipeline-view">
      <div className="pipeline-header">
        <h2>Pipeline Visualization</h2>
        <div className="view-controls">
          <div className="view-tabs">
            <button 
              className={view === 'funnel' ? 'active' : ''}
              onClick={() => setView('funnel')}
            >
              Funnel
            </button>
            <button 
              className={view === 'flow' ? 'active' : ''}
              onClick={() => setView('flow')}
            >
              Flow
            </button>
            <button 
              className={view === 'metrics' ? 'active' : ''}
              onClick={() => setView('metrics')}
            >
              Metrics
            </button>
          </div>
          
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>
      
      <div className="pipeline-content">
        {view === 'funnel' && <FunnelView />}
        {view === 'flow' && <FlowView />}
        {view === 'metrics' && <MetricsView />}
      </div>
    </div>
  );
};

export default PipelineView;
