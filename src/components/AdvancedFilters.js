import React, { useState, useEffect } from 'react';
import { Filter, X, Save, Star, Calendar, Users, Tag, AlertCircle, Clock, ChevronDown } from 'lucide-react';

const AdvancedFilters = ({ 
  items, 
  onFilterChange, 
  filterableFields,
  entityType = 'items'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [savedViews, setSavedViews] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewName, setViewName] = useState('');
  const [currentView, setCurrentView] = useState(null);

  // Load saved views from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`savedViews_${entityType}`);
    if (saved) {
      setSavedViews(JSON.parse(saved));
    }
  }, [entityType]);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [activeFilters]);

  const filterOptions = {
    status: [
      { value: 'pending', label: 'Pending', icon: Clock },
      { value: 'completed', label: 'Completed', icon: ChevronDown },
      { value: 'overdue', label: 'Overdue', icon: AlertCircle }
    ],
    priority: [
      { value: 'high', label: 'High Priority', color: 'red' },
      { value: 'medium', label: 'Medium Priority', color: 'yellow' },
      { value: 'low', label: 'Low Priority', color: 'gray' }
    ],
    category: [
      { value: 'estate-planning', label: 'Estate Planning' },
      { value: 'probate', label: 'Probate' },
      { value: 'trust-litigation', label: 'Trust Litigation' },
      { value: 'conservatorship', label: 'Conservatorship' },
      { value: 'guardianship', label: 'Guardianship' },
      { value: 'fire-victim', label: 'Fire Victim' }
    ],
    dateRange: [
      { value: 'today', label: 'Today' },
      { value: 'tomorrow', label: 'Tomorrow' },
      { value: 'this-week', label: 'This Week' },
      { value: 'next-week', label: 'Next Week' },
      { value: 'this-month', label: 'This Month' },
      { value: 'last-30-days', label: 'Last 30 Days' },
      { value: 'custom', label: 'Custom Range' }
    ]
  };

  const addFilter = (type, value, label) => {
    const newFilter = {
      id: Date.now(),
      type,
      value,
      label: label || value
    };

    setActiveFilters(prev => {
      // Remove any existing filter of the same type
      const filtered = prev.filter(f => f.type !== type);
      return [...filtered, newFilter];
    });
  };

  const removeFilter = (filterId) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId));
    setCurrentView(null);
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setCurrentView(null);
  };

  const applyFilters = () => {
    let filtered = [...items];

    activeFilters.forEach(filter => {
      switch(filter.type) {
        case 'status':
          if (filter.value === 'pending') {
            filtered = filtered.filter(item => !item.completed);
          } else if (filter.value === 'completed') {
            filtered = filtered.filter(item => item.completed);
          } else if (filter.value === 'overdue') {
            filtered = filtered.filter(item => {
              const dueDate = new Date(item.dueDate);
              return !item.completed && dueDate < new Date() && !isToday(dueDate);
            });
          }
          break;

        case 'priority':
          filtered = filtered.filter(item => item.priority === filter.value);
          break;

        case 'category':
          filtered = filtered.filter(item => item.category === filter.value);
          break;

        case 'client':
          filtered = filtered.filter(item => item.clientId === filter.value);
          break;

        case 'dateRange':
          filtered = filterByDateRange(filtered, filter.value);
          break;

        case 'search':
          const searchTerm = filter.value.toLowerCase();
          filtered = filtered.filter(item => 
            item.title?.toLowerCase().includes(searchTerm) ||
            item.name?.toLowerCase().includes(searchTerm) ||
            item.description?.toLowerCase().includes(searchTerm)
          );
          break;

        default:
          break;
      }
    });

    onFilterChange(filtered);
  };

  const filterByDateRange = (items, range) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
    
    const nextWeekStart = new Date(weekEnd);
    nextWeekStart.setDate(nextWeekStart.getDate() + 1);
    
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
    
    const monthEnd = new Date(today);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return items.filter(item => {
      const itemDate = new Date(item.dueDate || item.createdAt);
      itemDate.setHours(0, 0, 0, 0);

      switch(range) {
        case 'today':
          return itemDate.getTime() === today.getTime();
        case 'tomorrow':
          return itemDate.getTime() === tomorrow.getTime();
        case 'this-week':
          return itemDate >= today && itemDate <= weekEnd;
        case 'next-week':
          return itemDate >= nextWeekStart && itemDate <= nextWeekEnd;
        case 'this-month':
          return itemDate >= today && itemDate <= monthEnd;
        case 'last-30-days':
          return itemDate >= thirtyDaysAgo && itemDate <= today;
        default:
          return true;
      }
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const saveView = () => {
    if (!viewName.trim()) return;

    const newView = {
      id: Date.now(),
      name: viewName,
      filters: activeFilters,
      createdAt: new Date().toISOString()
    };

    const updatedViews = [...savedViews, newView];
    setSavedViews(updatedViews);
    localStorage.setItem(`savedViews_${entityType}`, JSON.stringify(updatedViews));
    
    setShowSaveDialog(false);
    setViewName('');
    setCurrentView(newView);
  };

  const loadView = (view) => {
    setActiveFilters(view.filters);
    setCurrentView(view);
  };

  const deleteView = (viewId) => {
    const updatedViews = savedViews.filter(v => v.id !== viewId);
    setSavedViews(updatedViews);
    localStorage.setItem(`savedViews_${entityType}`, JSON.stringify(updatedViews));
    
    if (currentView?.id === viewId) {
      setCurrentView(null);
    }
  };

  const getFilterColor = (filter) => {
    if (filter.type === 'priority') {
      switch(filter.value) {
        case 'high': return 'filter-red';
        case 'medium': return 'filter-yellow';
        case 'low': return 'filter-gray';
        default: return '';
      }
    }
    if (filter.type === 'status') {
      switch(filter.value) {
        case 'completed': return 'filter-green';
        case 'overdue': return 'filter-red';
        default: return '';
      }
    }
    return '';
  };

  return (
    <div className="advanced-filters">
      <div className="filters-toolbar">
        <div className="filters-left">
          <button 
            className={`filter-toggle-btn ${isOpen ? 'active' : ''}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <Filter size={18} />
            <span>Filters</span>
            {activeFilters.length > 0 && (
              <span className="filter-count">{activeFilters.length}</span>
            )}
          </button>

          {activeFilters.length > 0 && (
            <div className="active-filters">
              {activeFilters.map(filter => (
                <div 
                  key={filter.id} 
                  className={`filter-chip ${getFilterColor(filter)}`}
                >
                  <span>{filter.label}</span>
                  <button onClick={() => removeFilter(filter.id)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button className="clear-filters-btn" onClick={clearAllFilters}>
                Clear All
              </button>
            </div>
          )}
        </div>

        <div className="filters-right">
          {activeFilters.length > 0 && !currentView && (
            <button 
              className="save-view-btn"
              onClick={() => setShowSaveDialog(true)}
            >
              <Save size={16} />
              Save View
            </button>
          )}

          {currentView && (
            <div className="current-view">
              <Star size={16} className="view-icon" />
              <span>{currentView.name}</span>
            </div>
          )}

          {savedViews.length > 0 && (
            <div className="saved-views-dropdown">
              <button className="saved-views-toggle">
                <Star size={16} />
                Saved Views
                <ChevronDown size={16} />
              </button>
              <div className="saved-views-menu">
                {savedViews.map(view => (
                  <div key={view.id} className="saved-view-item">
                    <button 
                      className="view-name"
                      onClick={() => loadView(view)}
                    >
                      {view.name}
                      <span className="view-filter-count">
                        {view.filters.length} filters
                      </span>
                    </button>
                    <button 
                      className="delete-view-btn"
                      onClick={() => deleteView(view.id)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="filters-panel">
          <div className="filter-sections">
            {filterableFields.includes('status') && (
              <div className="filter-section">
                <h4>Status</h4>
                <div className="filter-options">
                  {filterOptions.status.map(option => (
                    <button
                      key={option.value}
                      className={`filter-option ${
                        activeFilters.some(f => f.value === option.value) ? 'active' : ''
                      }`}
                      onClick={() => addFilter('status', option.value, option.label)}
                    >
                      {option.icon && <option.icon size={16} />}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filterableFields.includes('priority') && (
              <div className="filter-section">
                <h4>Priority</h4>
                <div className="filter-options">
                  {filterOptions.priority.map(option => (
                    <button
                      key={option.value}
                      className={`filter-option priority-${option.value} ${
                        activeFilters.some(f => f.value === option.value) ? 'active' : ''
                      }`}
                      onClick={() => addFilter('priority', option.value, option.label)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filterableFields.includes('category') && (
              <div className="filter-section">
                <h4>Category</h4>
                <div className="filter-options">
                  {filterOptions.category.map(option => (
                    <button
                      key={option.value}
                      className={`filter-option ${
                        activeFilters.some(f => f.value === option.value) ? 'active' : ''
                      }`}
                      onClick={() => addFilter('category', option.value, option.label)}
                    >
                      <Tag size={16} />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filterableFields.includes('dateRange') && (
              <div className="filter-section">
                <h4>Date Range</h4>
                <div className="filter-options">
                  {filterOptions.dateRange.map(option => (
                    <button
                      key={option.value}
                      className={`filter-option ${
                        activeFilters.some(f => f.value === option.value) ? 'active' : ''
                      }`}
                      onClick={() => addFilter('dateRange', option.value, option.label)}
                    >
                      <Calendar size={16} />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showSaveDialog && (
        <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="save-view-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Save Current View</h3>
            <p>Save your current filters as a view for quick access</p>
            <input
              type="text"
              placeholder="Enter view name..."
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              autoFocus
            />
            <div className="dialog-footer">
              <button className="btn-secondary" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={saveView}>
                Save View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
