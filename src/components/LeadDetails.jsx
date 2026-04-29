// src/components/LeadDetails.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { emailService } from '../services/emailService';
import { toast } from 'react-toastify';
import { 
  X, 
  Phone, 
  MapPin, 
  Package, 
  Calendar, 
  Clock, 
  User, 
  MessageCircle,
  Send,
  Bell,
  CheckCircle,
  AlertCircle,
  Star,
  TrendingUp,
  FileText,
  Mail,
  Building,
  Users,
  Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LeadDetails = ({ lead, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [followUpType, setFollowUpType] = useState('call');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // FIXED: Define loadComments BEFORE useEffect
  const loadComments = () => {
    const leadComments = api.getComments(lead.id);
    setComments(leadComments);
  };

  // FIXED: Correct useEffect with proper dependency array
  useEffect(() => {
    // Load comments when lead changes
    loadComments();
    
    // Set default date and time (tomorrow at 10 AM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0);
    setFollowUpDate(tomorrow.toISOString().split('T')[0]);
    setFollowUpTime('10:00');
  }, [lead.id]);

  const handleAddComment = () => {
    if (newComment.trim()) {
      api.addComment(lead.id, newComment);
      loadComments();
      setNewComment('');
      toast.success('Comment added successfully');
    }
  };

  const handleSetFollowUp = async () => {
    if (!followUpDate || !followUpTime) {
      toast.error('Please select date and time');
      return;
    }
    
    const followUpDateTime = new Date(`${followUpDate}T${followUpTime}`);
    if (followUpDateTime < new Date()) {
      toast.error('Please select a future date and time');
      return;
    }
    
    // Save follow-up
    api.setFollowUp(lead.id, followUpDateTime.toISOString(), followUpType, followUpNotes);
    
    // Check email settings and send notification
    const emailSettings = JSON.parse(localStorage.getItem('email_settings') || '{}');
    const emailCredentials = JSON.parse(localStorage.getItem('emailjs_credentials') || '{}');
    const isEmailConfigured = emailCredentials.publicKey && emailCredentials.serviceId && emailCredentials.templateId;
    
    if (emailSettings.enabled && emailSettings.followUpReminders && isEmailConfigured) {
      setSendingEmail(true);
      
      // Get assigned agent
      if (lead.assignedTo && lead.assignedTo !== 'unassigned') {
        const allUsers = JSON.parse(localStorage.getItem('crm_users') || '[]');
        const agent = allUsers.find(u => u.id === lead.assignedTo);
        
        if (agent && agent.email) {
          const result = await emailService.sendFollowUpReminder(lead, {
            type: followUpType,
            followUpDate: followUpDateTime,
            notes: followUpNotes
          }, agent);
          
          setSendingEmail(false);
          
          if (result.success) {
            toast.success(`✓ Follow-up scheduled! Email sent to ${agent.name}`);
          } else {
            toast.warning(`✓ Follow-up scheduled but email notification failed. Check EmailJS configuration.`);
          }
        } else {
          setSendingEmail(false);
          toast.info(`✓ Follow-up scheduled. Agent ${lead.assignedTo} has no email configured.`);
        }
      } else {
        setSendingEmail(false);
        toast.success('✓ Follow-up scheduled successfully');
      }
    } else {
      if (!isEmailConfigured) {
        toast.info('✓ Follow-up scheduled. Configure EmailJS to send email notifications.');
      } else {
        toast.success('✓ Follow-up scheduled successfully');
      }
    }
    
    onUpdate();
    setShowFollowUp(false);
    setFollowUpNotes('');
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'New': return { bg: '#06D889', color: 'white', icon: <Star size={14} /> };
      case 'Contacted': return { bg: '#FF9800', color: 'white', icon: <Phone size={14} /> };
      case 'Closed': return { bg: '#4CAF50', color: 'white', icon: <CheckCircle size={14} /> };
      default: return { bg: '#9E9E9E', color: 'white', icon: <AlertCircle size={14} /> };
    }
  };

  const statusStyle = getStatusColor(lead.status);

  return (
    <div className="lead-details-overlay" onClick={onClose}>
      <div className="lead-details-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-section">
          <div className="header-left">
            <div className="lead-avatar-large">
              {lead.name.charAt(0)}
            </div>
            <div className="header-info">
              <h2>{lead.name}</h2>
              <div className="header-meta">
                <span className="meta-item">
                  <Phone size={14} />
                  {lead.phone}
                </span>
                <span className="meta-item">
                  <Calendar size={14} />
                  Created: {new Date(lead.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body-section">
          {/* Main Info Grid */}
          <div className="info-grid">
            <div className="info-card">
              <div className="info-card-icon">
                <Package size={18} color="#06D889" />
              </div>
              <div className="info-card-content">
                <span className="info-label">Product</span>
                <span className="info-value">{lead.product}</span>
              </div>
            </div>
            <div className="info-card">
              <div className="info-card-icon">
                <MapPin size={18} color="#06D889" />
              </div>
              <div className="info-card-content">
                <span className="info-label">City</span>
                <span className="info-value">{lead.city}</span>
              </div>
            </div>
            <div className="info-card">
              <div className="info-card-icon">
                <Building size={18} color="#06D889" />
              </div>
              <div className="info-card-content">
                <span className="info-label">Status</span>
                <span className="status-badge" style={{ background: statusStyle.bg }}>
                  {statusStyle.icon}
                  {lead.status}
                </span>
              </div>
            </div>
          </div>

          {/* Assigned To Info */}
          {lead.assignedTo && lead.assignedTo !== 'unassigned' && (
            <div className="assigned-info">
              <div className="assigned-icon">
                <Users size={16} color="#06D889" />
              </div>
              <div className="assigned-text">
                <span className="assigned-label">Assigned to:</span>
                <span className="assigned-value">
                  {lead.assignedTo === user?.id ? 'You' : lead.assignedTo}
                </span>
              </div>
            </div>
          )}

          {/* Notes Section */}
          {lead.notes && (
            <div className="notes-section">
              <div className="notes-header">
                <FileText size={16} />
                <span>Notes</span>
              </div>
              <p className="notes-content">{lead.notes}</p>
            </div>
          )}

          {/* Follow-up Button */}
          {!showFollowUp && (
            <button 
              className="schedule-followup-btn"
              onClick={() => setShowFollowUp(true)}
            >
              <Bell size={18} />
              Schedule Follow-up
            </button>
          )}

          {/* Follow-up Form */}
          {showFollowUp && (
            <div className="followup-form-section">
              <div className="followup-form-header">
                <Bell size={18} color="#06D889" />
                <h3>Schedule Follow-up</h3>
              </div>
              <div className="followup-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <div className="type-buttons">
                      <button 
                        className={`type-btn ${followUpType === 'call' ? 'active' : ''}`}
                        onClick={() => setFollowUpType('call')}
                      >
                        <Phone size={14} />
                        Call
                      </button>
                      <button 
                        className={`type-btn ${followUpType === 'meeting' ? 'active' : ''}`}
                        onClick={() => setFollowUpType('meeting')}
                      >
                        <Users size={14} />
                        Meeting
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label>Time</label>
                    <input
                      type="time"
                      value={followUpTime}
                      onChange={(e) => setFollowUpTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder="Add follow-up notes..."
                    rows="3"
                  />
                </div>
                <div className="form-actions">
                  <button 
                    className="cancel-followup" 
                    onClick={() => setShowFollowUp(false)}
                    disabled={sendingEmail}
                  >
                    Cancel
                  </button>
                  <button 
                    className="submit-followup" 
                    onClick={handleSetFollowUp}
                    disabled={sendingEmail}
                  >
                    {sendingEmail ? (
                      <>
                        <Loader size={16} className="spinning" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Schedule
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="comments-section">
            <div className="comments-header">
              <MessageCircle size={18} />
              <span>Comments</span>
              <span className="comments-count">{comments.length}</span>
            </div>
            
            <div className="comments-list">
              {comments.length === 0 ? (
                <div className="empty-comments">
                  <MessageCircle size={48} strokeWidth={1} />
                  <p>No comments yet</p>
                  <span>Be the first to add a comment</span>
                </div>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-avatar">
                      {comment.userName?.charAt(0)}
                    </div>
                    <div className="comment-content">
                      <div className="comment-header">
                        <strong>{comment.userName}</strong>
                        <span className="comment-time">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="comment-text">{comment.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="add-comment">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows="2"
              />
              <button onClick={handleAddComment} disabled={!newComment.trim()}>
                <Send size={16} />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetails;