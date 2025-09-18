import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock, DollarSign, Save, X } from 'lucide-react';
import { format } from 'date-fns';

const TimeTracker = ({ task, onSaveTime, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sessions, setSessions] = useState(task.timeSessions || []);
  const [hourlyRate, setHourlyRate] = useState(task.hourlyRate || 150);
  const [description, setDescription] = useState('');
  const [isBillable, setIsBillable] = useState(true);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    // Load saved sessions from task
    if (task.timeSessions) {
      setSessions(task.timeSessions);
      // Calculate total time from previous sessions
      const totalSeconds = task.timeSessions.reduce((acc, session) => acc + session.duration, 0);
      setSeconds(totalSeconds);
    }
  }, [task]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const calculateAmount = (totalSeconds, rate) => {
    const hours = totalSeconds / 3600;
    return (hours * rate).toFixed(2);
  };

  const handleStart = () => {
    setIsRunning(true);
    startTimeRef.current = new Date();
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    if (seconds > 0 || isRunning) {
      const endTime = new Date();
      const duration = isRunning ? 
        Math.floor((endTime - startTimeRef.current) / 1000) : 
        seconds - sessions.reduce((acc, s) => acc + s.duration, 0);

      if (duration > 0) {
        const newSession = {
          id: Date.now(),
          startTime: startTimeRef.current || new Date(endTime - duration * 1000),
          endTime: endTime,
          duration: duration,
          description: description || 'Work session',
          isBillable,
          rate: hourlyRate,
          amount: isBillable ? calculateAmount(duration, hourlyRate) : 0
        };

        setSessions([...sessions, newSession]);
        setDescription('');
      }
    }
    setIsRunning(false);
  };

  const handleSave = () => {
    const totalDuration = sessions.reduce((acc, session) => acc + session.duration, 0);
    const totalBillable = sessions
      .filter(s => s.isBillable)
      .reduce((acc, session) => acc + parseFloat(session.amount), 0);

    onSaveTime({
      taskId: task.id,
      sessions,
      totalDuration,
      totalBillable,
      hourlyRate
    });
  };

  const handleDeleteSession = (sessionId) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    const totalSeconds = updatedSessions.reduce((acc, session) => acc + session.duration, 0);
    setSeconds(totalSeconds);
  };

  const totalBillableAmount = sessions
    .filter(s => s.isBillable)
    .reduce((acc, session) => acc + parseFloat(session.amount), 0);

  return (
    <div className="time-tracker-modal">
      <div className="tracker-header">
        <h3>
          <Clock size={20} />
          Time Tracking: {task.title}
        </h3>
        <button className="btn-icon" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="tracker-display">
        <div className="timer-main">
          <div className="timer-digits">{formatTime(seconds)}</div>
          <div className="timer-controls">
            {!isRunning ? (
              <button className="timer-btn start" onClick={handleStart}>
                <Play size={20} />
                Start
              </button>
            ) : (
              <button className="timer-btn pause" onClick={handlePause}>
                <Pause size={20} />
                Pause
              </button>
            )}
            <button className="timer-btn stop" onClick={handleStop} disabled={seconds === 0 && !isRunning}>
              <Square size={20} />
              Stop & Save
            </button>
          </div>
        </div>

        <div className="timer-settings">
          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={isBillable}
                onChange={(e) => setIsBillable(e.target.checked)}
              />
              Billable
            </label>
          </div>
          <div className="setting-group">
            <label>Hourly Rate</label>
            <div className="rate-input">
              <DollarSign size={16} />
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                min="0"
                step="10"
              />
            </div>
          </div>
          <div className="setting-group full-width">
            <label>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
            />
          </div>
        </div>
      </div>

      <div className="sessions-list">
        <h4>Time Sessions</h4>
        {sessions.length > 0 ? (
          <>
            <div className="sessions-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>Description</th>
                    <th>Rate</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(session => (
                    <tr key={session.id} className={!session.isBillable ? 'non-billable' : ''}>
                      <td>{format(new Date(session.startTime), 'MMM dd, h:mm a')}</td>
                      <td>{formatDuration(session.duration)}</td>
                      <td>{session.description}</td>
                      <td>{session.isBillable ? `$${session.rate}/hr` : 'Non-billable'}</td>
                      <td>{session.isBillable ? `$${session.amount}` : '-'}</td>
                      <td>
                        <button 
                          className="btn-icon text-red"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="sessions-summary">
              <div className="summary-item">
                <span>Total Time:</span>
                <strong>{formatTime(sessions.reduce((acc, s) => acc + s.duration, 0))}</strong>
              </div>
              <div className="summary-item">
                <span>Billable Amount:</span>
                <strong className="amount">${totalBillableAmount.toFixed(2)}</strong>
              </div>
            </div>
          </>
        ) : (
          <p className="empty-message">No time sessions recorded yet</p>
        )}
      </div>

      <div className="tracker-footer">
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleSave}>
          <Save size={18} />
          Save Time Log
        </button>
      </div>
    </div>
  );
};

export default TimeTracker;
