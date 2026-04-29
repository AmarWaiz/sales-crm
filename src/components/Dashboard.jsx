// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ExcelUpload from './ExcelUpload';
import LeadTable from './LeadTable';
import NotificationBell from './NotificationBell';
import UserManagement from './UserManagement';
import EmailSettings from './EmailSettings';
import LeadDetails from './LeadDetails';
import { api } from '../services/api';
import { notificationService } from '../services/notificationService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  LogOut, 
  PhoneCall, 
  CheckCircle, 
  List, 
  Bell, 
  Upload,
  LayoutDashboard,
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  UserCog,
  Clock,
  Eye,
  FileText,
  MapPin,
  Package,
  Phone,
  Star,
  Award,
  Volume2,
  VolumeX,
  Zap,
  Mail
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [leads, setLeads] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [missedFollowUps, setMissedFollowUps] = useState([]);
  const [activeTab, setActiveTab] = useState('leads');
  const [users, setUsers] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, closed: 0 });

  useEffect(() => {
    loadData();
    loadUsers();
    
    notificationService.requestNotificationPermission();
    setSoundEnabled(notificationService.getSoundEnabled());
    startNotificationService();
    
    const interval = setInterval(() => {
      loadData();
      loadUsers();
    }, 60000);

    const openLeadDetailsListener = (event) => {
      const leadId = event?.detail?.leadId;
      if (!leadId) return;
      const matchedLead = api.getLeads().find((lead) => lead.id === leadId);
      if (matchedLead) {
        setSelectedLead(matchedLead);
      }
    };
    window.addEventListener('openLeadDetails', openLeadDetailsListener);
    
    return () => {
      clearInterval(interval);
      notificationService.stopChecking();
      window.removeEventListener('openLeadDetails', openLeadDetailsListener);
    };
  }, []);

  const startNotificationService = () => {
    const currentFollowUps = api.getFollowUps();
    const currentLeads = api.getLeads();
    
    notificationService.startChecking(
      currentFollowUps,
      currentLeads,
      (followUp, lead) => {
        loadData();
        const activityLabel = followUp.type === 'call' ? 'Call' : 'Meeting';
        toast.info(`Follow-up reminder: ${activityLabel} with ${lead?.name} at ${new Date(followUp.followUpDate).toLocaleTimeString()}`, {
          position: "top-right",
          autoClose: 10000,
        });
      },
      30
    );
  };

  const loadData = () => {
    const allLeads = api.getLeads();
    setLeads(allLeads);
    
    const allFollowUps = api.getFollowUps();
    setFollowUps(allFollowUps);
    
    const missed = api.getMissedFollowUps();
    setMissedFollowUps(missed);
    
    if (missed.length > 0 && missed.length > missedFollowUps.length) {
      toast.warning(`You have ${missed.length} missed follow-up(s).`);
    }
    
    setStats({
      total: allLeads.length,
      new: allLeads.filter(l => l.status === 'New').length,
      contacted: allLeads.filter(l => l.status === 'Contacted').length,
      closed: allLeads.filter(l => l.status === 'Closed').length
    });
    
    notificationService.stopChecking();
    startNotificationService();
  };

  const loadUsers = () => {
    const allUsers = JSON.parse(localStorage.getItem('crm_users') || '[]');
    setUsers(allUsers);
  };

  const handleLogout = () => {
    notificationService.stopChecking();
    logout();
    window.location.href = '/';
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    notificationService.setSoundEnabled(newState);
    toast.info(newState ? '🔊 Sound notifications enabled' : '🔇 Sound notifications disabled');
  };

  const statCards = [
    {
      id: 'total',
      label: 'Total Leads',
      value: stats.total,
      icon: <LayoutDashboard size={22} />,
      color: '#06D889',
      bgGradient: 'linear-gradient(135deg, #06D889 0%, #05b873 100%)',
      trend: '+12%',
      trendUp: true,
      progress: stats.total > 0 ? 100 : 0
    },
    {
      id: 'new',
      label: 'New Leads',
      value: stats.new,
      icon: <Star size={22} />,
      color: '#FF9800',
      bgGradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
      trend: '+8%',
      trendUp: true,
      progress: stats.total > 0 ? (stats.new / stats.total) * 100 : 0
    },
    {
      id: 'contacted',
      label: 'Contacted',
      value: stats.contacted,
      icon: <PhoneCall size={22} />,
      color: '#2196F3',
      bgGradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
      trend: '0%',
      trendUp: false,
      progress: stats.total > 0 ? (stats.contacted / stats.total) * 100 : 0
    },
    {
      id: 'closed',
      label: 'Closed Deals',
      value: stats.closed,
      icon: <Award size={22} />,
      color: '#4CAF50',
      bgGradient: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
      trend: '+5%',
      trendUp: true,
      progress: stats.total > 0 ? (stats.closed / stats.total) * 100 : 0
    }
  ];

  return (
    <div className="dashboard-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-area">
            <div className="header-logo-icon">
              <img src="/logo.svg" alt="Logo" className="header-logo-img" />
            </div>
            <div>
              <h1 className="logo-text">Sales CRM</h1>
              <p className="logo-subtext">Multi-Agent System</p>
            </div>
          </div>
          
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">
                {user?.name?.charAt(0)}
              </div>
              <div>
                <div className="user-name">{user?.name}</div>
                <div className="user-role">{user?.role === 'admin' ? 'Administrator' : 'Sales Agent'}</div>
              </div>
            </div>
            
            <button onClick={toggleSound} className="sound-toggle-header" title={soundEnabled ? 'Disable sound' : 'Enable sound'}>
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            
            <NotificationBell onNotificationClick={loadData} />
            <button onClick={handleLogout} className="logout-button">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Stats Cards */}
      <div className="stats-wrapper">
        <div className="stats-grid">
          {statCards.map((card) => (
            <div key={card.id} className="stat-card-modern">
              <div className="stat-card-header">
                <div className="stat-icon-container" style={{ background: `${card.color}10` }}>
                  <div className="stat-icon" style={{ color: card.color }}>
                    {card.icon}
                  </div>
                </div>
                <div className={`stat-trend-badge ${card.trendUp ? 'up' : 'neutral'}`}>
                  {card.trendUp ? '↑' : '→'} {card.trend}
                </div>
              </div>
              <div className="stat-card-body">
                <div className="stat-value">{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
              <div className="stat-card-footer">
                <div className="stat-progress">
                  <div className="stat-progress-bar" style={{ background: `${card.color}20` }}>
                    <div 
                      className="stat-progress-fill" 
                      style={{ 
                        width: `${card.progress}%`,
                        background: card.bgGradient
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs-wrapper">
          <button 
            onClick={() => setActiveTab('leads')}
            className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
          >
            <List size={18} />
            <span>All Leads</span>
            <span className="tab-count">{leads.length}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('followups')}
            className={`tab-btn ${activeTab === 'followups' ? 'active' : ''}`}
          >
            <Calendar size={18} />
            <span>Follow-ups</span>
            {followUps.length > 0 && <span className="tab-badge">{followUps.length}</span>}
          </button>

          {user?.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('upload')}
              className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            >
              <Upload size={18} />
              <span>Upload Excel</span>
            </button>
          )}

          {user?.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            >
              <UserCog size={18} />
              <span>Users</span>
              <span className="tab-count">{users.length}</span>
            </button>
          )}

          {/* Email Settings Tab - Only for Admin */}
          {user?.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('email')}
              className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
            >
              <Mail size={18} />
              <span>Email Settings</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="dashboard-content">
        {activeTab === 'leads' && (
          <>
            {user?.role === 'admin' && leads.length === 0 && (
              <div className="welcome-banner">
                <div className="welcome-icon">
                  <FileSpreadsheet size={32} color="#06D889" />
                </div>
                <div className="welcome-text">
                  <h3>Welcome to Sales CRM!</h3>
                  <p>Get started by uploading your first leads file</p>
                </div>
                <button onClick={() => setActiveTab('upload')} className="welcome-btn">
                  <Upload size={18} />
                  Upload Excel
                </button>
              </div>
            )}
            <LeadTable leads={leads} onLeadUpdate={loadData} />
          </>
        )}
        
        {activeTab === 'followups' && (
          <div className="followups-container">
            <div className="followups-header">
              <div className="followups-title">
                <div className="title-badge">
                  <Calendar size={20} color="#06D889" />
                </div>
                <div>
                  <h2>Upcoming Follow-ups</h2>
                  <p>Manage your scheduled calls and meetings</p>
                </div>
              </div>
              <div className="followups-stats">
                <div className="stat-pill pending">
                  <Clock size={14} />
                  <span>{followUps.length} Pending</span>
                </div>
                <div className="stat-pill overdue">
                  <AlertCircle size={14} />
                  <span>{followUps.filter(f => new Date(f.followUpDate) < new Date()).length} Overdue</span>
                </div>
              </div>
            </div>

            {followUps.length === 0 ? (
              <div className="empty-followups">
                <Bell size={64} strokeWidth={1} />
                <h3>No scheduled follow-ups</h3>
                <p>Schedule follow-ups from lead details to see them here</p>
                <button className="btn-primary" onClick={() => setActiveTab('leads')}>
                  Browse Leads
                </button>
              </div>
            ) : (
              <div className="followups-grid">
                {followUps.map(followUp => {
                  const lead = leads.find(l => l.id === followUp.leadId);
                  const isMissed = new Date(followUp.followUpDate) < new Date();
                  const followUpDate = new Date(followUp.followUpDate);
                  const isToday = followUpDate.toDateString() === new Date().toDateString();
                  
                  if (!lead) return null;
                  
                  return (
                    <div key={followUp.id} className={`followup-card ${isMissed ? 'missed' : ''} ${isToday ? 'today' : ''}`}>
                      <div className="followup-card-header">
                        <div className="followup-type">
                          {followUp.type === 'call' ? (
                            <span className="type-badge call"><Phone size={12} /> Call</span>
                          ) : (
                            <span className="type-badge meeting"><UserCog size={12} /> Meeting</span>
                          )}
                        </div>
                        <div className="followup-status">
                          {isMissed && <span className="status overdue">Overdue</span>}
                          {isToday && !isMissed && <span className="status today">Today</span>}
                        </div>
                      </div>

                      <div className="followup-lead-info">
                        <div className="lead-avatar">
                          {lead.name.charAt(0)}
                        </div>
                        <div className="lead-info">
                          <h4>{lead.name}</h4>
                          <a href={`tel:${lead.phone}`} className="lead-phone">
                            <Phone size={12} /> {lead.phone}
                          </a>
                          <div className="lead-meta">
                            <span><Package size={12} /> {lead.product}</span>
                            <span><MapPin size={12} /> {lead.city}</span>
                          </div>
                        </div>
                      </div>

                      <div className="followup-datetime">
                        <div className="datetime-card">
                          <div className="date">
                            <span className="date-day">{followUpDate.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <span className="date-number">{followUpDate.getDate()}</span>
                            <span className="date-month">{followUpDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                          </div>
                          <div className="time">
                            <Clock size={14} />
                            <span>{followUpDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>

                      {followUp.notes && (
                        <div className="followup-notes">
                          <FileText size={14} />
                          <p>{followUp.notes}</p>
                        </div>
                      )}

                      <div className="followup-actions">
                        <button 
                          onClick={() => {
                            api.completeFollowUp(followUp.id);
                            loadData();
                            toast.success('Follow-up completed successfully.');
                          }}
                          className="btn-complete"
                        >
                          <CheckCircle size={16} />
                          Mark Complete
                        </button>
                        <button 
                          onClick={() => setSelectedLead(lead)}
                          className="btn-view"
                        >
                          <Eye size={16} />
                          View Lead
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'upload' && user?.role === 'admin' && (
          <ExcelUpload onUploadComplete={() => {
            loadData();
            setActiveTab('leads');
            toast.success('Leads imported successfully!');
          }} />
        )}

        {activeTab === 'users' && user?.role === 'admin' && (
          <UserManagement onUserUpdate={() => {
            loadUsers();
            loadData();
          }} />
        )}

        {/* Email Settings Tab */}
        {activeTab === 'email' && user?.role === 'admin' && (
          <EmailSettings user={user} />
        )}
      </div>

      {/* Lead Details Modal */}
      {selectedLead && (
        <LeadDetails 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
};

export default Dashboard;