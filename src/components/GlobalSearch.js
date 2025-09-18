import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, CheckSquare, FileText, Calendar, Clock, ChevronRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';

const GlobalSearch = () => {
  const navigate = useNavigate();
  const { clients, tasks, documents, events } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef(null);
  const searchBoxRef = useRef(null);

  // Global keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
        setResults([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setResults([]);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Perform search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const searchResults = [];

    // Search clients
    clients.forEach(client => {
      if (
        client.name.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.phone?.toLowerCase().includes(term) ||
        client.category?.toLowerCase().includes(term)
      ) {
        searchResults.push({
          type: 'client',
          id: client.id,
          title: client.name,
          subtitle: client.email || client.phone || 'No contact info',
          meta: client.category?.replace('-', ' '),
          icon: Users,
          path: `/clients/${client.id}`
        });
      }
    });

    // Search tasks
    tasks.forEach(task => {
      if (
        task.title.toLowerCase().includes(term) ||
        task.description?.toLowerCase().includes(term)
      ) {
        const client = clients.find(c => c.id === task.clientId);
        searchResults.push({
          type: 'task',
          id: task.id,
          title: task.title,
          subtitle: task.description || 'No description',
          meta: `${client?.name || 'No client'} • Due ${format(new Date(task.dueDate), 'MMM dd')}`,
          icon: CheckSquare,
          path: `/tasks`,
          status: task.completed ? 'completed' : task.priority
        });
      }
    });

    // Search documents
    documents.forEach(doc => {
      if (
        doc.name.toLowerCase().includes(term) ||
        doc.type?.toLowerCase().includes(term) ||
        doc.notes?.toLowerCase().includes(term)
      ) {
        const client = clients.find(c => c.id === doc.clientId);
        searchResults.push({
          type: 'document',
          id: doc.id,
          title: doc.name,
          subtitle: doc.notes || `${doc.type} document`,
          meta: client?.name || 'General document',
          icon: FileText,
          path: `/documents`
        });
      }
    });

    // Search events
    events.forEach(event => {
      if (
        event.title.toLowerCase().includes(term) ||
        event.type?.toLowerCase().includes(term)
      ) {
        searchResults.push({
          type: 'event',
          id: event.id,
          title: event.title,
          subtitle: event.type,
          meta: format(new Date(event.start), 'MMM dd, yyyy h:mm a'),
          icon: Calendar,
          path: `/calendar`
        });
      }
    });

    // Sort results by relevance (exact matches first)
    searchResults.sort((a, b) => {
      const aExact = a.title.toLowerCase() === term;
      const bExact = b.title.toLowerCase() === term;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    setResults(searchResults.slice(0, 10)); // Limit to 10 results
    setSelectedIndex(0);
  }, [searchTerm, clients, tasks, documents, events]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      default:
        break;
    }
  };

  const handleResultClick = (result) => {
    navigate(result.path);
    setIsOpen(false);
    setSearchTerm('');
    setResults([]);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'high': return 'text-red';
      case 'medium': return 'text-yellow';
      case 'low': return 'text-gray';
      case 'completed': return 'text-green';
      default: return '';
    }
  };

  return (
    <>
      {/* Floating Search Button */}
      <button 
        className="global-search-trigger"
        onClick={() => setIsOpen(true)}
        title="Search (Cmd/Ctrl + K)"
      >
        <Search size={20} />
        <span>Search</span>
        <kbd>⌘K</kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="global-search-overlay">
          <div className="global-search-modal" ref={searchBoxRef}>
            <div className="search-header">
              <Search size={20} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search clients, tasks, documents, events..."
                className="search-input"
              />
              <button 
                className="search-close"
                onClick={() => {
                  setIsOpen(false);
                  setSearchTerm('');
                  setResults([]);
                }}
              >
                <X size={20} />
              </button>
            </div>

            {results.length > 0 && (
              <div className="search-results-list">
                {results.map((result, index) => {
                  const Icon = result.icon;
                  return (
                    <div
                      key={`${result.type}-${result.id}`}
                      className={`search-result ${selectedIndex === index ? 'selected' : ''}`}
                      onClick={() => handleResultClick(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="result-icon">
                        <Icon size={18} />
                      </div>
                      <div className="result-content">
                        <div className="result-title">
                          {result.title}
                          {result.status && (
                            <span className={`result-status ${getStatusColor(result.status)}`}>
                              {result.status === 'completed' ? '✓' : `${result.status} priority`}
                            </span>
                          )}
                        </div>
                        <div className="result-subtitle">{result.subtitle}</div>
                        <div className="result-meta">
                          <span className="result-type">{result.type}</span>
                          {result.meta && <span className="result-meta-text">{result.meta}</span>}
                        </div>
                      </div>
                      <ChevronRight size={16} className="result-arrow" />
                    </div>
                  );
                })}
              </div>
            )}

            {searchTerm && results.length === 0 && (
              <div className="no-results">
                <Clock size={24} />
                <p>No results found for "{searchTerm}"</p>
                <span>Try searching for clients, tasks, documents, or events</span>
              </div>
            )}

            {!searchTerm && (
              <div className="search-hints">
                <h4>Quick Actions</h4>
                <div className="hint-item">
                  <kbd>↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="hint-item">
                  <kbd>Enter</kbd>
                  <span>Select</span>
                </div>
                <div className="hint-item">
                  <kbd>Esc</kbd>
                  <span>Close</span>
                </div>
                <div className="recent-searches">
                  <h4>Search for:</h4>
                  <div className="search-suggestions">
                    <button onClick={() => setSearchTerm('overdue')}>Overdue tasks</button>
                    <button onClick={() => setSearchTerm('estate')}>Estate planning</button>
                    <button onClick={() => setSearchTerm('meeting')}>Meetings</button>
                    <button onClick={() => setSearchTerm('contract')}>Contracts</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalSearch;
