// src/components/LeadTable.jsx
import React, { useState } from 'react';
import LeadDetails from './LeadDetails';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { 
  Phone, 
  MessageCircle, 
  Eye, 
  Filter, 
  CheckCircle, 
  Clock, 
  Star,
  MapPin,
  Package,
  Search,
  Trash2,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LeadTable = ({ leads, onLeadUpdate }) => {
  const { user } = useAuth();
  const [selectedLead, setSelectedLead] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const getStatusConfig = (status) => {
    switch(status) {
      case 'New': 
        return { 
          bg: 'linear-gradient(135deg, #06D88915 0%, #06D88908 100%)', 
          color: '#06D889', 
          icon: <Star size={12} />, 
          label: 'New',
          border: '#06D889'
        };
      case 'Contacted': 
        return { 
          bg: 'linear-gradient(135deg, #FF980015 0%, #FF980008 100%)', 
          color: '#FF9800', 
          icon: <Clock size={12} />, 
          label: 'Contacted',
          border: '#FF9800'
        };
      case 'Closed': 
        return { 
          bg: 'linear-gradient(135deg, #4CAF5015 0%, #4CAF5008 100%)', 
          color: '#4CAF50', 
          icon: <CheckCircle size={12} />, 
          label: 'Closed',
          border: '#4CAF50'
        };
      default: 
        return { 
          bg: '#f5f5f5', 
          color: '#999', 
          icon: <Clock size={12} />, 
          label: status,
          border: '#ddd'
        };
    }
  };

  const handleStatusChange = (leadId, newStatus) => {
    api.updateLead(leadId, { status: newStatus });
    onLeadUpdate();
    toast.success(`Status updated to ${newStatus}`);
  };

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
    toast.info(`Calling ${phone}...`);
  };

  const handleWhatsApp = (phone) => {
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
    toast.info(`Opening WhatsApp for ${phone}`);
  };

  const handleDeleteLead = (leadId, leadName) => {
    try {
      api.deleteLead(leadId);
      setSelectedLeadIds((currentIds) => currentIds.filter((id) => id !== leadId));
      onLeadUpdate();
      setShowDeleteConfirm(null);
      toast.success(`Lead "${leadName}" deleted successfully`);
    } catch (error) {
      toast.error(error?.message || 'Unable to delete lead');
    }
  };

  // Filter and search leads
  const filteredLeads = leads.filter(lead => {
    const matchesFilter = filter === 'all' || lead.status === filter;
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.phone.includes(searchTerm) ||
                         lead.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.city.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Sort leads
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  const visibleLeadIds = sortedLeads.map((lead) => lead.id);
  const selectedVisibleLeadIds = selectedLeadIds.filter((leadId) => visibleLeadIds.includes(leadId));
  const allVisibleSelected = visibleLeadIds.length > 0 && selectedVisibleLeadIds.length === visibleLeadIds.length;

  const toggleLeadSelection = (leadId) => {
    setSelectedLeadIds((currentIds) => (
      currentIds.includes(leadId)
        ? currentIds.filter((id) => id !== leadId)
        : [...currentIds, leadId]
    ));
  };

  const toggleSelectVisibleLeads = () => {
    setSelectedLeadIds((currentIds) => {
      if (allVisibleSelected) {
        return currentIds.filter((leadId) => !visibleLeadIds.includes(leadId));
      }

      return Array.from(new Set([...currentIds, ...visibleLeadIds]));
    });
  };

  const handleBulkDelete = () => {
    try {
      api.deleteLeads(selectedLeadIds);
      toast.success(`${selectedLeadIds.length} lead${selectedLeadIds.length === 1 ? '' : 's'} deleted successfully`);
      setSelectedLeadIds([]);
      setShowBulkDeleteConfirm(false);
      onLeadUpdate();
    } catch (error) {
      toast.error(error?.message || 'Unable to delete selected leads');
    }
  };

  const filters = [
    { key: 'all', label: 'All Leads', icon: <Filter size={14} />, count: leads.length },
    { key: 'New', label: 'New', icon: <Star size={14} />, count: leads.filter(l => l.status === 'New').length },
    { key: 'Contacted', label: 'Contacted', icon: <Clock size={14} />, count: leads.filter(l => l.status === 'Contacted').length },
    { key: 'Closed', label: 'Closed', icon: <CheckCircle size={14} />, count: leads.filter(l => l.status === 'Closed').length }
  ];

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'New').length,
    contacted: leads.filter(l => l.status === 'Contacted').length,
    closed: leads.filter(l => l.status === 'Closed').length
  };

  return (
    <div className="lead-table-modern">
      {/* Header Stats */}
      <div className="stats-modern">
        <div className="stat-item">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Leads</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#06D889' }}>{stats.new}</div>
          <div className="stat-label">New</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#FF9800' }}>{stats.contacted}</div>
          <div className="stat-label">Contacted</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#4CAF50' }}>{stats.closed}</div>
          <div className="stat-label">Closed</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, phone, product, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`filter-tab ${filter === f.key ? 'active' : ''}`}
            >
              {f.icon}
              <span>{f.label}</span>
              <span className="filter-count">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {user?.role === 'admin' && sortedLeads.length > 0 && (
        <div className="bulk-actions-bar">
          <label className="bulk-select-toggle">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectVisibleLeads}
            />
            <span className="bulk-checkmark" aria-hidden="true"></span>
            <span>Select visible leads</span>
          </label>

          <div className="bulk-actions-meta">
            <span className="bulk-selected-count">{selectedLeadIds.length} selected</span>
            <button
              type="button"
              className="bulk-delete-btn"
              disabled={selectedLeadIds.length === 0}
              onClick={() => setShowBulkDeleteConfirm(true)}
            >
              <Trash2 size={16} />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Leads Grid */}
      <div className="leads-grid">
        {sortedLeads.length === 0 ? (
          <div className="empty-leads">
            <User size={64} strokeWidth={1} />
            <h3>No leads found</h3>
            <p>Upload leads to get started</p>
          </div>
        ) : (
          sortedLeads.map((lead) => {
            const statusConfig = getStatusConfig(lead.status);
            const isSelected = selectedLeadIds.includes(lead.id);
            return (
              <div key={lead.id} className={`lead-card ${isSelected ? 'selected' : ''}`}>
                {/* Lead Header */}
                <div className="lead-card-header">
                  <div className="lead-avatar">
                    {lead.name.charAt(0)}
                  </div>
                  <div className="lead-header-info">
                    <h3 className="lead-name">{lead.name}</h3>
                    <div className="lead-subline">
                      <span className="lead-phone">{lead.phone}</span>
                      {lead.notes && <span className="lead-notes-badge"> Has notes</span>}
                    </div>
                  </div>
                  <div className="lead-card-controls">
                    <div className="lead-status-badge" style={{ 
                      background: statusConfig.bg,
                      color: statusConfig.color,
                      borderLeftColor: statusConfig.border
                    }}>
                      {statusConfig.icon}
                      <span>{statusConfig.label}</span>
                    </div>
                    {user?.role === 'admin' && (
                      <label className="lead-select-checkbox" title="Select lead">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleLeadSelection(lead.id)}
                        />
                        <span className="lead-checkmark" aria-hidden="true"></span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Lead Body */}
                <div className="lead-card-body">
                  <div className="lead-context-grid">
                    <div className="context-item">
                      <div className="detail-icon">
                        <Package size={14} />
                      </div>
                      <div className="detail-info">
                        <span className="detail-label">Product</span>
                        <span className="detail-value">{lead.product}</span>
                      </div>
                    </div>

                    <div className="context-item">
                      <div className="detail-icon">
                        <MapPin size={14} />
                      </div>
                      <div className="detail-info">
                        <span className="detail-label">City</span>
                        <span className="detail-value">{lead.city}</span>
                      </div>
                    </div>

                    <div className="context-item full-width">
                      <div className="detail-icon">
                        <Calendar size={14} />
                      </div>
                      <div className="detail-info">
                        <span className="detail-label">Created Date</span>
                        <span className="detail-value">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lead Footer */}
                <div className="lead-card-footer">
                  <div className="status-selector">
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      style={{
                        background: statusConfig.bg,
                        color: statusConfig.color,
                        borderColor: statusConfig.border
                      }}
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div className="action-buttons">
                    <button 
                      onClick={() => handleCall(lead.phone)}
                      className="action-btn call"
                      title="Call"
                    >
                      <Phone size={16} />
                      <span>Call</span>
                    </button>
                    <button 
                      onClick={() => handleWhatsApp(lead.phone)}
                      className="action-btn whatsapp"
                      title="WhatsApp"
                    >
                      <MessageCircle size={16} />
                      <span>Chat</span>
                    </button>
                    <button 
                      onClick={() => setSelectedLead(lead)}
                      className="action-btn details"
                      title="View Details"
                    >
                      <Eye size={16} />
                      <span>View</span>
                    </button>
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => setShowDeleteConfirm(lead.id)}
                        className="action-btn delete"
                        title="Delete Lead"
                      >
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Delete Confirmation Overlay */}
                {showDeleteConfirm === lead.id && (
                  <div className="delete-confirm-overlay">
                    <div className="delete-confirm-box">
                      <AlertCircle size={32} color="#f44336" />
                      <h4>Delete Lead?</h4>
                      <p>Are you sure you want to delete <strong>{lead.name}</strong>? This action cannot be undone.</p>
                      <div className="delete-confirm-actions">
                        <button 
                          onClick={() => handleDeleteLead(lead.id, lead.name)}
                          className="confirm-delete-btn"
                        >
                          Yes, Delete
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(null)}
                          className="cancel-delete-btn"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showBulkDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-box">
            <AlertCircle size={32} color="#f44336" />
            <h4>Delete Selected Leads?</h4>
            <p>
              Are you sure you want to delete <strong>{selectedLeadIds.length}</strong> selected
              lead{selectedLeadIds.length === 1 ? '' : 's'}? Related comments and follow-ups will also be removed.
            </p>
            <div className="delete-confirm-actions">
              <button 
                onClick={handleBulkDelete}
                className="confirm-delete-btn"
              >
                Yes, Delete
              </button>
              <button 
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="cancel-delete-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Details Modal */}
      {selectedLead && (
        <LeadDetails 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)}
          onUpdate={onLeadUpdate}
        />
      )}
    </div>
  );
};

export default LeadTable;
