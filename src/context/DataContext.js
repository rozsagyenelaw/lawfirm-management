import React, { createContext, useState, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem('clients');
    return saved ? JSON.parse(saved) : [];
  });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('events');
    return saved ? JSON.parse(saved) : [];
  });

  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('documents');
    return saved ? JSON.parse(saved) : [];
  });

  const [workflows] = useState(() => {
    const saved = localStorage.getItem('workflows');
    return saved ? JSON.parse(saved) : getDefaultWorkflows();
  });

  useEffect(() => {
    localStorage.setItem('clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('documents', JSON.stringify(documents));
  }, [documents]);

  const addClient = (clientData) => {
    const newClient = {
      id: uuidv4(),
      ...clientData,
      createdAt: new Date().toISOString(),
      tasks: [],
      documents: [],
      events: []
    };
    setClients([...clients, newClient]);
    
    const workflow = workflows[clientData.category];
    if (workflow) {
      workflow.tasks.forEach(taskTemplate => {
        addTask({
          clientId: newClient.id,
          title: taskTemplate.name,
          description: taskTemplate.description,
          priority: 'medium',
          status: 'pending',
          dueDate: calculateDueDate(taskTemplate.daysFromStart),
          category: clientData.category
        });
      });
    }
    
    toast.success('Client added successfully');
    return newClient;
  };

  const updateClient = (id, updates) => {
    setClients(clients.map(client => 
      client.id === id ? { ...client, ...updates } : client
    ));
    toast.success('Client updated');
  };

  const deleteClient = (id) => {
    setClients(clients.filter(client => client.id !== id));
    setTasks(tasks.filter(task => task.clientId !== id));
    setDocuments(documents.filter(doc => doc.clientId !== id));
    setEvents(events.filter(event => event.clientId !== id));
    toast.success('Client deleted');
  };

  const addTask = (taskData) => {
    const newTask = {
      id: uuidv4(),
      ...taskData,
      createdAt: new Date().toISOString(),
      completed: false
    };
    setTasks([...tasks, newTask]);
    return newTask;
  };

  const updateTask = (id, updates) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ));
    toast.success('Task updated');
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
    toast.success('Task deleted');
  };

  const completeTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: true, status: 'completed' } : task
    ));
    toast.success('Task marked as complete');
  };

  const addEvent = (eventData) => {
    const newEvent = {
      id: uuidv4(),
      ...eventData,
      createdAt: new Date().toISOString()
    };
    setEvents([...events, newEvent]);
    toast.success('Event added to calendar');
    return newEvent;
  };

  const updateEvent = (id, updates) => {
    setEvents(events.map(event => 
      event.id === id ? { ...event, ...updates } : event
    ));
    toast.success('Event updated');
  };

  const deleteEvent = (id) => {
    setEvents(events.filter(event => event.id !== id));
    toast.success('Event deleted');
  };

  const addDocument = (docData) => {
    const newDoc = {
      id: uuidv4(),
      ...docData,
      uploadedAt: new Date().toISOString()
    };
    setDocuments([...documents, newDoc]);
    toast.success('Document added');
    return newDoc;
  };

  const deleteDocument = (id) => {
    setDocuments(documents.filter(doc => doc.id !== id));
    toast.success('Document deleted');
  };

  const calculateDueDate = (daysFromStart) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromStart);
    return date.toISOString();
  };

  const getClientTasks = (clientId) => {
    return tasks.filter(task => task.clientId === clientId);
  };

  const getClientDocuments = (clientId) => {
    return documents.filter(doc => doc.clientId === clientId);
  };

  const getClientEvents = (clientId) => {
    return events.filter(event => event.clientId === clientId);
  };

  const getUpcomingTasks = (days = 7) => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return tasks.filter(task => {
      if (task.completed) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= now && dueDate <= futureDate;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  };

  const getUpcomingEvents = (days = 7) => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return events.filter(event => {
      const startDate = new Date(event.start);
      return startDate >= now && startDate <= futureDate;
    }).sort((a, b) => new Date(a.start) - new Date(b.start));
  };

  const value = {
    clients,
    tasks,
    events,
    documents,
    workflows,
    addClient,
    updateClient,
    deleteClient,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    addEvent,
    updateEvent,
    deleteEvent,
    addDocument,
    deleteDocument,
    getClientTasks,
    getClientDocuments,
    getClientEvents,
    getUpcomingTasks,
    getUpcomingEvents
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

function getDefaultWorkflows() {
  return {
    'estate-planning': {
      name: 'Estate Planning',
      tasks: [
        { name: 'Initial Client Consultation', description: 'Meet with client to discuss estate planning needs', daysFromStart: 0 },
        { name: 'Email Digital Copies', description: 'Send digital copies of estate planning documents to client', daysFromStart: 1 },
        { name: 'Await Client Confirmation', description: 'Wait for client to review and confirm documents', daysFromStart: 3 },
        { name: 'Follow Up on Documents', description: 'Check if client has questions or needs changes', daysFromStart: 5 },
        { name: 'Schedule Signing Appointment', description: 'Coordinate signing method (in-office notarization or mail package)', daysFromStart: 6 },
        { name: 'Notarize Documents OR Mail Package', description: 'Complete notarization in office or send package based on client preference', daysFromStart: 8 },
        { name: 'Confirm Receipt/Completion', description: 'Ensure client received package or completed in-office signing', daysFromStart: 10 },
        { name: 'File and Store Documents', description: 'Archive final signed documents', daysFromStart: 12 }
      ]
    },
    'probate': {
      name: 'Probate',
      tasks: [
        { name: 'File Petition for Probate', description: 'Submit petition to open probate case', daysFromStart: 0 },
        { name: 'Notice to Heirs', description: 'Send required notices to all heirs and beneficiaries', daysFromStart: 5 },
        { name: 'Clear Notes Before Hearing', description: 'Review and prepare all documentation for hearing (7 days before hearing date)', daysFromStart: 23 },
        { name: 'Attend Probate Hearing', description: 'Appear at probate hearing', daysFromStart: 30 },
        { name: 'File Order and Letters', description: 'File court order and letters testamentary/administration', daysFromStart: 31 },
        { name: 'Inventory Assets', description: 'Complete inventory of estate assets', daysFromStart: 45 },
        { name: 'Pay Debts and Taxes', description: 'Settle all estate debts and file tax returns', daysFromStart: 90 },
        { name: 'Wait Period - 4 Months', description: 'Mandatory 4-month waiting period after letters issued', daysFromStart: 120 },
        { name: 'File Petition for Distribution', description: 'File petition for final distribution (4 months after letters)', daysFromStart: 151 },
        { name: 'Distribute Assets', description: 'Distribute assets to beneficiaries per court order', daysFromStart: 180 }
      ]
    },
    'trust-litigation': {
      name: 'Trust Litigation',
      tasks: [
        { name: 'Case Evaluation', description: 'Evaluate merits of trust dispute case', daysFromStart: 0 },
        { name: 'File Complaint/Answer', description: 'File initial pleadings with court', daysFromStart: 5 },
        { name: 'Discovery Requests', description: 'Prepare and serve discovery requests', daysFromStart: 30 }
      ]
    },
    'conservatorship': {
      name: 'Conservatorship',
      tasks: [
        { name: 'Case Evaluation', description: 'Evaluate merits and requirements for conservatorship', daysFromStart: 0 },
        { name: 'File Petition', description: 'File petition for conservatorship with court', daysFromStart: 2 },
        { name: 'File Capacity Declaration', description: 'Submit medical/capacity declaration from qualified professional', daysFromStart: 3 },
        { name: 'File Citation', description: 'File and serve citation to proposed conservatee', daysFromStart: 5 },
        { name: 'Court Investigation', description: 'Coordinate with court investigator for required investigation', daysFromStart: 15 },
        { name: 'Court Hearing', description: 'Attend conservatorship hearing', daysFromStart: 30 },
        { name: 'File Order and Letters', description: 'File order appointing conservator and letters of conservatorship', daysFromStart: 31 },
        { name: 'Initial Inventory', description: 'Complete initial inventory of conservatee assets (if estate)', daysFromStart: 60 },
        { name: 'First Annual Accounting', description: 'Prepare and file first annual accounting', daysFromStart: 365 },
        { name: 'Second Annual Accounting', description: 'Prepare and file second annual accounting', daysFromStart: 730 },
        { name: 'Biennial Review Hearing', description: 'Court review hearing (every 2 years)', daysFromStart: 730 }
      ]
    },
    'guardianship': {
      name: 'Guardianship',
      tasks: [
        { name: 'Case Evaluation', description: 'Evaluate need for guardianship of minor', daysFromStart: 0 },
        { name: 'File Petition', description: 'File petition for guardianship with court', daysFromStart: 2 },
        { name: 'File Consent Forms', description: 'File parental consent forms if applicable', daysFromStart: 3 },
        { name: 'File Citation', description: 'File and serve citation to interested parties', daysFromStart: 5 },
        { name: 'Court Investigation', description: 'Coordinate with court investigator for home study', daysFromStart: 15 },
        { name: 'Court Hearing', description: 'Attend guardianship hearing', daysFromStart: 30 },
        { name: 'File Order and Letters', description: 'File order appointing guardian and letters of guardianship', daysFromStart: 31 },
        { name: 'Initial Status Report', description: 'File initial status report with court', daysFromStart: 90 },
        { name: 'First Annual Review', description: 'Prepare and file first annual status report', daysFromStart: 365 },
        { name: 'Second Annual Review', description: 'Prepare and file second annual status report', daysFromStart: 730 }
      ]
    },
    'fire-victim': {
      name: 'Fire Victim',
      tasks: [
        { name: 'Document Damages', description: 'Photograph and document all property damage', daysFromStart: 2 },
        { name: 'Insurance Claim', description: 'File insurance claim with carrier', daysFromStart: 5 },
        { name: 'Settlement Negotiations', description: 'Negotiate with insurance/responsible parties', daysFromStart: 60 }
      ]
    }
  };
}
