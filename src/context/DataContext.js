import React, { createContext, useState, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

// Firebase imports
import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, setDoc, getDoc } from 'firebase/firestore';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [trustAccounts, setTrustAccounts] = useState([]);
  const [workflows] = useState(getDefaultWorkflows());
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState('local'); // 'local', 'syncing', 'synced'
  
  // Check if Firebase is configured
  const useFirebase = true; // Firebase is now enabled
  
  // Load initial data
  useEffect(() => {
    if (!useFirebase) {
      // Local storage mode
      const savedClients = localStorage.getItem('clients');
      const savedTasks = localStorage.getItem('tasks');
      const savedEvents = localStorage.getItem('events');
      const savedDocuments = localStorage.getItem('documents');
      const savedInvoices = localStorage.getItem('invoices');
      const savedPayments = localStorage.getItem('payments');
      const savedTrustAccounts = localStorage.getItem('trustAccounts');
      
      setClients(savedClients ? JSON.parse(savedClients) : []);
      setTasks(savedTasks ? JSON.parse(savedTasks) : []);
      setEvents(savedEvents ? JSON.parse(savedEvents) : []);
      setDocuments(savedDocuments ? JSON.parse(savedDocuments) : []);
      setInvoices(savedInvoices ? JSON.parse(savedInvoices) : []);
      setPayments(savedPayments ? JSON.parse(savedPayments) : []);
      setTrustAccounts(savedTrustAccounts ? JSON.parse(savedTrustAccounts) : []);
      setSyncStatus('local');
    } else {
      // Firebase mode
      setSyncStatus('syncing');
      
      // Load existing localStorage data first (for migration)
      const localClients = JSON.parse(localStorage.getItem('clients') || '[]');
      const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const localEvents = JSON.parse(localStorage.getItem('events') || '[]');
      const localDocuments = JSON.parse(localStorage.getItem('documents') || '[]');
      const localInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      const localPayments = JSON.parse(localStorage.getItem('payments') || '[]');
      const localTrustAccounts = JSON.parse(localStorage.getItem('trustAccounts') || '[]');
      
      // Set local data immediately
      setClients(localClients);
      setTasks(localTasks);
      setEvents(localEvents);
      setDocuments(localDocuments);
      setInvoices(localInvoices);
      setPayments(localPayments);
      setTrustAccounts(localTrustAccounts);
      
      // Real-time sync for clients
      const unsubClients = onSnapshot(
        collection(db, 'clients'),
        (snapshot) => {
          const clientsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setClients(clientsList);
          localStorage.setItem('clients', JSON.stringify(clientsList)); // Offline backup
        },
        (error) => {
          console.error('Error syncing clients:', error);
          // Keep using local data if Firebase fails
        }
      );
      
      // Real-time sync for tasks
      const unsubTasks = onSnapshot(
        collection(db, 'tasks'),
        (snapshot) => {
          const tasksList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setTasks(tasksList);
          localStorage.setItem('tasks', JSON.stringify(tasksList));
        }
      );
      
      // Real-time sync for events
      const unsubEvents = onSnapshot(
        collection(db, 'events'),
        (snapshot) => {
          const eventsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setEvents(eventsList);
          localStorage.setItem('events', JSON.stringify(eventsList));
        }
      );
      
      // Real-time sync for documents
      const unsubDocs = onSnapshot(
        collection(db, 'documents'),
        (snapshot) => {
          const docsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setDocuments(docsList);
          localStorage.setItem('documents', JSON.stringify(docsList));
        }
      );
      
      // Real-time sync for invoices
      const unsubInvoices = onSnapshot(
        collection(db, 'invoices'),
        (snapshot) => {
          const invoicesList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setInvoices(invoicesList);
          localStorage.setItem('invoices', JSON.stringify(invoicesList));
        }
      );
      
      // Real-time sync for payments
      const unsubPayments = onSnapshot(
        collection(db, 'payments'),
        (snapshot) => {
          const paymentsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPayments(paymentsList);
          localStorage.setItem('payments', JSON.stringify(paymentsList));
        }
      );
      
      // Real-time sync for trust accounts
      const unsubTrustAccounts = onSnapshot(
        collection(db, 'trustAccounts'),
        (snapshot) => {
          const trustAccountsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setTrustAccounts(trustAccountsList);
          localStorage.setItem('trustAccounts', JSON.stringify(trustAccountsList));
        }
      );
      
      setSyncStatus('synced');
      
      // Migrate existing localStorage data to Firebase
      if (localClients.length > 0) {
        localClients.forEach(async (client) => {
          try {
            await setDoc(doc(db, 'clients', client.id), client);
          } catch (error) {
            console.error('Error migrating client:', error);
          }
        });
      }
      
      if (localTasks.length > 0) {
        localTasks.forEach(async (task) => {
          try {
            await setDoc(doc(db, 'tasks', task.id), task);
          } catch (error) {
            console.error('Error migrating task:', error);
          }
        });
      }
      
      if (localEvents.length > 0) {
        localEvents.forEach(async (event) => {
          try {
            await setDoc(doc(db, 'events', event.id), event);
          } catch (error) {
            console.error('Error migrating event:', error);
          }
        });
      }
      
      if (localInvoices.length > 0) {
        localInvoices.forEach(async (invoice) => {
          try {
            await setDoc(doc(db, 'invoices', invoice.id), invoice);
          } catch (error) {
            console.error('Error migrating invoice:', error);
          }
        });
      }
      
      if (localPayments.length > 0) {
        localPayments.forEach(async (payment) => {
          try {
            await setDoc(doc(db, 'payments', payment.id), payment);
          } catch (error) {
            console.error('Error migrating payment:', error);
          }
        });
      }
      
      if (localTrustAccounts.length > 0) {
        localTrustAccounts.forEach(async (account) => {
          try {
            await setDoc(doc(db, 'trustAccounts', account.id), account);
          } catch (error) {
            console.error('Error migrating trust account:', error);
          }
        });
      }
      
      return () => {
        unsubClients();
        unsubTasks();
        unsubEvents();
        unsubDocs();
        unsubInvoices();
        unsubPayments();
        unsubTrustAccounts();
      };
    }
  }, [useFirebase]);
  
  // Save to localStorage when data changes (local mode)
  useEffect(() => {
    if (!useFirebase) {
      localStorage.setItem('clients', JSON.stringify(clients));
    }
  }, [clients, useFirebase]);

  useEffect(() => {
    if (!useFirebase) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks, useFirebase]);

  useEffect(() => {
    if (!useFirebase) {
      localStorage.setItem('events', JSON.stringify(events));
    }
  }, [events, useFirebase]);

  useEffect(() => {
    if (!useFirebase) {
      localStorage.setItem('documents', JSON.stringify(documents));
    }
  }, [documents, useFirebase]);

  useEffect(() => {
    if (!useFirebase) {
      localStorage.setItem('invoices', JSON.stringify(invoices));
    }
  }, [invoices, useFirebase]);

  useEffect(() => {
    if (!useFirebase) {
      localStorage.setItem('payments', JSON.stringify(payments));
    }
  }, [payments, useFirebase]);

  useEffect(() => {
    if (!useFirebase) {
      localStorage.setItem('trustAccounts', JSON.stringify(trustAccounts));
    }
  }, [trustAccounts, useFirebase]);
  
  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online - data syncing');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast('Working offline - changes will sync when reconnected', {
        icon: '📵'
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add client function
  const addClient = async (clientData) => {
    const newClient = {
      id: uuidv4(),
      ...clientData,
      createdAt: new Date().toISOString(),
      tasks: [],
      documents: [],
      events: []
    };
    
    if (useFirebase && isOnline) {
      try {
        await setDoc(doc(db, 'clients', newClient.id), newClient);
        toast.success('Client added and synced');
      } catch (error) {
        console.error('Error adding client to Firebase:', error);
        toast.error('Error syncing - saved locally');
        setClients([...clients, newClient]);
      }
    } else {
      setClients([...clients, newClient]);
      toast.success('Client added successfully');
    }
    
    // Create workflow tasks
    const workflow = workflows[clientData.category];
    if (workflow) {
      for (const taskTemplate of workflow.tasks) {
        await addTask({
          clientId: newClient.id,
          title: taskTemplate.name,
          description: taskTemplate.description,
          priority: 'medium',
          status: 'pending',
          dueDate: calculateDueDate(taskTemplate.daysFromStart),
          category: clientData.category
        });
      }
    }
    
    return newClient;
  };

  const updateClient = async (id, updates) => {
    if (useFirebase && isOnline) {
      try {
        await updateDoc(doc(db, 'clients', id), updates);
        toast.success('Client updated and synced');
      } catch (error) {
        console.error('Error updating client:', error);
        toast.error('Error syncing - saved locally');
        setClients(clients.map(client => 
          client.id === id ? { ...client, ...updates } : client
        ));
      }
    } else {
      setClients(clients.map(client => 
        client.id === id ? { ...client, ...updates } : client
      ));
      toast.success('Client updated');
    }
  };

  const deleteClient = async (id) => {
    if (useFirebase && isOnline) {
      try {
        await deleteDoc(doc(db, 'clients', id));
        // Also delete related data
        const clientTasks = tasks.filter(task => task.clientId === id);
        const clientDocs = documents.filter(doc => doc.clientId === id);
        const clientEvents = events.filter(event => event.clientId === id);
        
        for (const task of clientTasks) {
          await deleteDoc(doc(db, 'tasks', task.id));
        }
        for (const document of clientDocs) {
          await deleteDoc(doc(db, 'documents', document.id));
        }
        for (const event of clientEvents) {
          await deleteDoc(doc(db, 'events', event.id));
        }
        
        toast.success('Client deleted and synced');
      } catch (error) {
        console.error('Error deleting client:', error);
        toast.error('Error syncing - deleted locally');
      }
    } else {
      setClients(clients.filter(client => client.id !== id));
      setTasks(tasks.filter(task => task.clientId !== id));
      setDocuments(documents.filter(doc => doc.clientId !== id));
      setEvents(events.filter(event => event.clientId !== id));
      toast.success('Client deleted');
    }
  };

  const addTask = async (taskData) => {
    const newTask = {
      id: uuidv4(),
      ...taskData,
      createdAt: new Date().toISOString(),
      completed: false
    };
    
    if (useFirebase && isOnline) {
      try {
        await setDoc(doc(db, 'tasks', newTask.id), newTask);
      } catch (error) {
        console.error('Error adding task:', error);
        setTasks([...tasks, newTask]);
      }
    } else {
      setTasks([...tasks, newTask]);
    }
    
    return newTask;
  };

  const updateTask = async (id, updates) => {
    if (useFirebase && isOnline) {
      try {
        await updateDoc(doc(db, 'tasks', id), updates);
        toast.success('Task updated');
      } catch (error) {
        console.error('Error updating task:', error);
        setTasks(tasks.map(task => 
          task.id === id ? { ...task, ...updates } : task
        ));
      }
    } else {
      setTasks(tasks.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ));
      toast.success('Task updated');
    }
  };

  const deleteTask = async (id) => {
    if (useFirebase && isOnline) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
        toast.success('Task deleted');
      } catch (error) {
        console.error('Error deleting task:', error);
        setTasks(tasks.filter(task => task.id !== id));
      }
    } else {
      setTasks(tasks.filter(task => task.id !== id));
      toast.success('Task deleted');
    }
  };

  const completeTask = (id) => {
    updateTask(id, { completed: true, status: 'completed' });
    toast.success('Task marked as complete');
  };

  const addEvent = async (eventData) => {
    const newEvent = {
      id: uuidv4(),
      ...eventData,
      createdAt: new Date().toISOString()
    };
    
    if (useFirebase && isOnline) {
      try {
        await setDoc(doc(db, 'events', newEvent.id), newEvent);
        toast.success('Event added to calendar');
      } catch (error) {
        console.error('Error adding event:', error);
        setEvents([...events, newEvent]);
      }
    } else {
      setEvents([...events, newEvent]);
      toast.success('Event added to calendar');
    }
    
    return newEvent;
  };

  const updateEvent = async (id, updates) => {
    if (useFirebase && isOnline) {
      try {
        await updateDoc(doc(db, 'events', id), updates);
        toast.success('Event updated');
      } catch (error) {
        console.error('Error updating event:', error);
        setEvents(events.map(event => 
          event.id === id ? { ...event, ...updates } : event
        ));
      }
    } else {
      setEvents(events.map(event => 
        event.id === id ? { ...event, ...updates } : event
      ));
      toast.success('Event updated');
    }
  };

  const deleteEvent = async (id) => {
    if (useFirebase && isOnline) {
      try {
        await deleteDoc(doc(db, 'events', id));
        toast.success('Event deleted');
      } catch (error) {
        console.error('Error deleting event:', error);
        setEvents(events.filter(event => event.id !== id));
      }
    } else {
      setEvents(events.filter(event => event.id !== id));
      toast.success('Event deleted');
    }
  };

  const addDocument = async (docData) => {
    const newDoc = {
      id: uuidv4(),
      ...docData,
      uploadedAt: new Date().toISOString()
    };
    
    if (useFirebase && isOnline) {
      try {
        await setDoc(doc(db, 'documents', newDoc.id), newDoc);
        toast.success('Document added');
      } catch (error) {
        console.error('Error adding document:', error);
        setDocuments([...documents, newDoc]);
      }
    } else {
      setDocuments([...documents, newDoc]);
      toast.success('Document added');
    }
    
    return newDoc;
  };

  const deleteDocument = async (id) => {
    if (useFirebase && isOnline) {
      try {
        await deleteDoc(doc(db, 'documents', id));
        toast.success('Document deleted');
      } catch (error) {
        console.error('Error deleting document:', error);
        setDocuments(documents.filter(doc => doc.id !== id));
      }
    } else {
      setDocuments(documents.filter(doc => doc.id !== id));
      toast.success('Document deleted');
    }
  };

  // Invoice functions
  const addInvoice = async (invoiceData) => {
    const newInvoice = {
      id: uuidv4(),
      ...invoiceData,
      createdAt: new Date().toISOString()
    };
    
    if (useFirebase && isOnline) {
      try {
        await setDoc(doc(db, 'invoices', newInvoice.id), newInvoice);
        toast.success('Invoice generated');
      } catch (error) {
        console.error('Error adding invoice:', error);
        setInvoices([...invoices, newInvoice]);
      }
    } else {
      setInvoices([...invoices, newInvoice]);
      toast.success('Invoice generated');
    }
    
    return newInvoice;
  };

  const getClientInvoices = (clientId) => {
    return invoices.filter(inv => inv.clientId === clientId);
  };

  // Payment and Trust Account functions
  const addPayment = async (paymentData) => {
    const newPayment = {
      id: uuidv4(),
      ...paymentData,
      createdAt: new Date().toISOString()
    };
    
    if (useFirebase && isOnline) {
      try {
        await setDoc(doc(db, 'payments', newPayment.id), newPayment);
        toast.success('Payment recorded');
      } catch (error) {
        console.error('Error adding payment:', error);
        setPayments([...payments, newPayment]);
      }
    } else {
      setPayments([...payments, newPayment]);
      toast.success('Payment recorded');
    }
    
    // Update trust account balance if retainer
    if (paymentData.type === 'retainer' && paymentData.account === 'trust') {
      updateTrustBalance(paymentData.clientId, paymentData.amount, 'deposit');
    }
    
    return newPayment;
  };

  const updateTrustBalance = async (clientId, amount, action) => {
    const existingAccount = trustAccounts.find(ta => ta.clientId === clientId);
    
    if (existingAccount) {
      const newBalance = action === 'deposit' 
        ? existingAccount.balance + amount 
        : existingAccount.balance - amount;
        
      const updatedAccount = {
        ...existingAccount,
        balance: newBalance,
        lastUpdated: new Date().toISOString()
      };
      
      if (useFirebase && isOnline) {
        try {
          await updateDoc(doc(db, 'trustAccounts', existingAccount.id), updatedAccount);
        } catch (error) {
          console.error('Error updating trust account:', error);
        }
      }
      
      setTrustAccounts(trustAccounts.map(ta => 
        ta.clientId === clientId ? updatedAccount : ta
      ));
    } else {
      // Create new trust account
      const newTrustAccount = {
        id: uuidv4(),
        clientId,
        balance: amount,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      if (useFirebase && isOnline) {
        try {
          await setDoc(doc(db, 'trustAccounts', newTrustAccount.id), newTrustAccount);
        } catch (error) {
          console.error('Error creating trust account:', error);
        }
      }
      
      setTrustAccounts([...trustAccounts, newTrustAccount]);
    }
  };

  const applyRetainerToInvoice = async (clientId, invoiceId, amount) => {
    // Deduct from trust account
    updateTrustBalance(clientId, amount, 'withdraw');
    
    // Record the application
    const application = {
      id: uuidv4(),
      clientId,
      invoiceId,
      amount,
      type: 'retainer_applied',
      account: 'operating',
      description: 'Retainer applied to invoice',
      createdAt: new Date().toISOString()
    };
    
    addPayment(application);
    
    toast.success('Retainer applied to invoice');
  };

  const refundRetainer = async (clientId, amount, reason) => {
    // Deduct from trust account
    updateTrustBalance(clientId, amount, 'withdraw');
    
    // Record the refund
    const refund = {
      id: uuidv4(),
      clientId,
      amount,
      type: 'retainer_refund',
      account: 'trust',
      description: reason || 'Unused retainer refund',
      createdAt: new Date().toISOString()
    };
    
    addPayment(refund);
    
    toast.success('Retainer refund processed');
  };

  const getClientPayments = (clientId) => {
    return payments.filter(payment => payment.clientId === clientId);
  };

  const getClientTrustBalance = (clientId) => {
    const account = trustAccounts.find(ta => ta.clientId === clientId);
    return account ? account.balance : 0;
  };

  const transferTrustToOperating = async (clientId, amount, invoiceId = null) => {
    // This is for earned fees - moving money from trust to operating
    updateTrustBalance(clientId, amount, 'withdraw');
    
    const transfer = {
      id: uuidv4(),
      clientId,
      amount,
      type: 'trust_transfer',
      fromAccount: 'trust',
      toAccount: 'operating',
      invoiceId,
      description: 'Transfer from trust to operating for earned fees',
      createdAt: new Date().toISOString()
    };
    
    addPayment(transfer);
    
    toast.success('Trust funds transferred to operating account');
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
    invoices,
    payments,
    trustAccounts,
    workflows,
    isOnline,
    syncStatus,
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
    addInvoice,
    getClientInvoices,
    addPayment,
    updateTrustBalance,
    applyRetainerToInvoice,
    refundRetainer,
    getClientPayments,
    getClientTrustBalance,
    transferTrustToOperating,
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
