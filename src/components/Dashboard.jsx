// src/components/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
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
  Mail,
  Moon,
  Sun,
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [leads, setLeads] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [, setMissedFollowUps] = useState([]);
  const [activeTab, setActiveTab] = useState('leads');
  const [users, setUsers] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('crm_theme') !== 'light');
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, closed: 0 });

  const loadUsers = useCallback(() => {
    const allUsers = JSON.parse(localStorage.getItem('crm_users') || '[]');
    setUsers(allUsers);
  }, []);

  const startNotificationService = useCallback(() => {
    const currentFollowUps = api.getFollowUps();
    const currentLeads = api.getLeads();
    
    notificationService.startChecking(
      currentFollowUps,
      currentLeads,
      (followUp, lead) => {
        const activityLabel = followUp.type === 'call' ? 'Call' : 'Meeting';
        toast.info(`Follow-up reminder: ${activityLabel} with ${lead?.name} at ${new Date(followUp.followUpDate).toLocaleTimeString()}`, {
          position: "top-right",
          autoClose: 10000,
        });
      },
      30
    );
  }, []);

  const loadData = useCallback(() => {
    const allLeads = api.getLeads();
    setLeads(allLeads);
    
    const allFollowUps = api.getFollowUps();
    setFollowUps(allFollowUps);
    
    const missed = api.getMissedFollowUps();
    setMissedFollowUps((previousMissedFollowUps) => {
      if (missed.length > 0 && missed.length > previousMissedFollowUps.length) {
        toast.warning(`You have ${missed.length} missed follow-up(s).`);
      }

      return missed;
    });
    
    setStats({
      total: allLeads.length,
      new: allLeads.filter(l => l.status === 'New').length,
      contacted: allLeads.filter(l => l.status === 'Contacted').length,
      closed: allLeads.filter(l => l.status === 'Closed').length
    });
    
    notificationService.stopChecking();
    startNotificationService();
  }, [startNotificationService]);

  useEffect(() => {
    loadData();
    loadUsers();
    
    notificationService.requestNotificationPermission();
    setSoundEnabled(notificationService.getSoundEnabled());
    
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
  }, [loadData, loadUsers]);

  useEffect(() => {
    document.body.classList.toggle('crm-light-mode', !darkMode);
    localStorage.setItem('crm_theme', darkMode ? 'dark' : 'light');

    return () => {
      document.body.classList.remove('crm-light-mode');
    };
  }, [darkMode]);

  const handleLogout = () => {
    notificationService.stopChecking();
    logout();
    window.location.href = '/';
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    notificationService.setSoundEnabled(newState);
    toast.info(newState ? 'Sound notifications enabled' : 'Sound notifications disabled');
  };

  const toggleDarkMode = () => {
    setDarkMode((currentMode) => !currentMode);
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

  const sortedFollowUps = [...followUps].sort(
    (a, b) => new Date(a.followUpDate) - new Date(b.followUpDate)
  );
  const overdueFollowUpsCount = sortedFollowUps.filter(
    (followUp) => new Date(followUp.followUpDate) < new Date()
  ).length;

  const analyticsAgents = user?.role === 'admin'
    ? users.filter((crmUser) => crmUser.role === 'agent')
    : users.filter((crmUser) => crmUser.id === user?.id);

  const agentWorkloadData = analyticsAgents
    .map((agent) => {
      const agentLeads = leads.filter((lead) => lead.assignedTo === agent.id);
      const agentLeadIds = new Set(agentLeads.map((lead) => lead.id));

      return {
        id: agent.id,
        name: agent.name,
        total: agentLeads.length,
        new: agentLeads.filter((lead) => lead.status === 'New').length,
        contacted: agentLeads.filter((lead) => lead.status === 'Contacted').length,
        closed: agentLeads.filter((lead) => lead.status === 'Closed').length,
        followUps: followUps.filter((followUp) => agentLeadIds.has(followUp.leadId)).length
      };
    })
    .sort((a, b) => b.total - a.total || b.followUps - a.followUps || b.closed - a.closed);

  const now = new Date();
  const periodMs = 30 * 24 * 60 * 60 * 1000;
  const currentPeriodStart = new Date(now.getTime() - periodMs);
  const previousPeriodStart = new Date(now.getTime() - periodMs * 2);
  const getLeadDate = (lead) => new Date(lead.createdAt || now);
  const getFollowUpCreatedDate = (followUp) => new Date(followUp.createdAt || followUp.followUpDate || now);
  const currentPeriodLeads = leads.filter((lead) => getLeadDate(lead) >= currentPeriodStart);
  const previousPeriodLeads = leads.filter((lead) => {
    const createdAt = getLeadDate(lead);
    return createdAt >= previousPeriodStart && createdAt < currentPeriodStart;
  });
  const currentPeriodFollowUps = followUps.filter((followUp) => getFollowUpCreatedDate(followUp) >= currentPeriodStart);
  const previousPeriodFollowUps = followUps.filter((followUp) => {
    const createdAt = getFollowUpCreatedDate(followUp);
    return createdAt >= previousPeriodStart && createdAt < currentPeriodStart;
  });
  const currentPeriodOverdueFollowUps = currentPeriodFollowUps.filter((followUp) => new Date(followUp.followUpDate) < now);
  const previousPeriodOverdueFollowUps = previousPeriodFollowUps.filter((followUp) => new Date(followUp.followUpDate) < currentPeriodStart);

  const getTrendLabel = (currentValue, previousValue) => {
    if (!previousValue && !currentValue) return 'No period data';
    if (!previousValue) return 'New this period';
    const delta = Math.round(((currentValue - previousValue) / previousValue) * 100);
    return `${delta > 0 ? '+' : ''}${delta}% vs previous 30 days`;
  };

  const totalLeadTrend = getTrendLabel(currentPeriodLeads.length, previousPeriodLeads.length);
  const followUpTrend = getTrendLabel(currentPeriodFollowUps.length, previousPeriodFollowUps.length);
  const overdueTrend = getTrendLabel(currentPeriodOverdueFollowUps.length, previousPeriodOverdueFollowUps.length);

  const cityChartData = Object.values(leads.reduce((cityMap, lead) => {
    const city = lead.city || 'Unknown';
    if (!cityMap[city]) {
      cityMap[city] = { city, leads: 0, followUps: 0 };
    }
    cityMap[city].leads += 1;
    cityMap[city].followUps += followUps.filter((followUp) => followUp.leadId === lead.id).length;
    return cityMap;
  }, {}))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 6);

  const productChartData = Object.values(leads.reduce((productMap, lead) => {
    const product = lead.product || 'Unknown';
    if (!productMap[product]) {
      productMap[product] = { product, leads: 0 };
    }
    productMap[product].leads += 1;
    return productMap;
  }, {}))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5);

  const statusChartData = [
    { status: 'New', value: stats.new },
    { status: 'Contacted', value: stats.contacted },
    { status: 'Closed', value: stats.closed }
  ];
  const maxStatusValue = Math.max(1, ...statusChartData.map((status) => status.value));

  const salesActivityData = [
    { name: 'Call', value: followUps.filter((followUp) => followUp.type === 'call').length, color: '#00b9aa' },
    { name: 'Meeting', value: followUps.filter((followUp) => followUp.type === 'meeting').length, color: '#12c6a2' },
    { name: 'New Lead', value: stats.new, color: '#f7b500' },
    { name: 'Contacted', value: stats.contacted, color: '#4f6372' },
    { name: 'Closed', value: stats.closed, color: '#758491' }
  ].filter((activity) => activity.value > 0);

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

            <button onClick={toggleDarkMode} className="theme-toggle-header" title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
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

      <div className="analytics-wrapper">
        <div className="analytics-board">
          <div className="analytics-kpi-column">
            <div className="analytics-kpi primary">
              <span>Total Leads</span>
              <strong>{leads.length}</strong>
              <small>{totalLeadTrend}</small>
            </div>
            <div className="analytics-kpi">
              <span>Scheduled Follow-ups</span>
              <strong>{followUps.length}</strong>
              <small>{followUpTrend}</small>
            </div>
            <div className="analytics-kpi">
              <span>Overdue Follow-ups</span>
              <strong>{overdueFollowUpsCount}</strong>
              <small>{overdueTrend}</small>
            </div>
            <div className="analytics-mini-chart">
              <div className="analytics-panel-title">
                <span>Products</span>
                <small>by lead count</small>
              </div>
              <div className="response-bars">
                {productChartData.length === 0 ? (
                  <p>No product data yet</p>
                ) : productChartData.map((product) => (
                  <div className="response-row" key={product.product}>
                    <span>{product.product}</span>
                    <div className="response-track">
                      <div style={{ width: `${(product.leads / Math.max(1, productChartData[0].leads)) * 100}%` }}></div>
                    </div>
                    <strong>{product.leads}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="analytics-main-column">
            <div className="analytics-panel source-panel">
              <div className="analytics-panel-title">
                <span>Leads by City</span>
                <small>lead count and follow-ups</small>
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={cityChartData} margin={{ top: 18, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.12)" />
                  <XAxis dataKey="city" tick={{ fill: '#c8d8d6', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#c8d8d6', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    contentStyle={{ background: '#0b1a22', border: '1px solid #20343e', borderRadius: 8, color: '#ffffff' }}
                  />
                  <Bar dataKey="leads" fill="#f7b500" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="followUps" fill="#00b9aa" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
              <div className="analytics-legend">
                <span><i className="gold"></i> Leads</span>
                <span><i className="teal"></i> Follow-ups</span>
              </div>
            </div>

            <div className="analytics-panel matrix-panel">
              <div className="analytics-panel-title">
                <span>Agent Workload</span>
                <small>leads and follow-ups by agent</small>
              </div>
              <div className="followup-matrix agent-workload-matrix">
                <div className="matrix-head">Sales Rep</div>
                <div className="matrix-head">New</div>
                <div className="matrix-head">Contacted</div>
                <div className="matrix-head">Closed</div>
                <div className="matrix-head">Follow-ups</div>
                {agentWorkloadData.length === 0 ? (
                  <div className="matrix-empty">No agent workload data yet</div>
                ) : agentWorkloadData.slice(0, 5).map((agent) => (
                  <React.Fragment key={agent.id}>
                    <div className="matrix-name">{agent.name}</div>
                    <div className="matrix-cell">{agent.new}</div>
                    <div className="matrix-cell">{agent.contacted}</div>
                    <div className="matrix-cell">{agent.closed}</div>
                    <div className="matrix-cell">{agent.followUps}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="analytics-side-column">
            <div className="analytics-panel stage-panel">
              <div className="analytics-panel-title">
                <span>Lead Status</span>
                <small>current pipeline</small>
              </div>
              <div className="stage-bars">
                {statusChartData.map((status) => (
                  <div className="stage-row" key={status.status}>
                    <span>{status.status}</span>
                    <div className="stage-track">
                      <div style={{ width: `${(status.value / maxStatusValue) * 100}%` }}>
                        {status.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-panel activity-panel">
              <div className="analytics-panel-title">
                <span>Sales Activity</span>
                <small>by type and status</small>
              </div>
              <div className="activity-content">
                {salesActivityData.length === 0 ? (
                  <div className="analytics-empty-state">No sales activity yet</div>
                ) : (
                  <>
                    <ResponsiveContainer width="58%" height={170}>
                      <PieChart>
                        <Pie
                          data={salesActivityData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={48}
                          outerRadius={70}
                          paddingAngle={1}
                        >
                          {salesActivityData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: '#0b1a22', border: '1px solid #20343e', borderRadius: 8, color: '#ffffff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="activity-legend">
                      {salesActivityData.map((item) => (
                        <span key={item.name}><i style={{ backgroundColor: item.color }}></i>{item.name}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
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
                  <span>{overdueFollowUpsCount} Overdue</span>
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
                {sortedFollowUps.map(followUp => {
                  const lead = leads.find(l => l.id === followUp.leadId);
                  const isMissed = new Date(followUp.followUpDate) < new Date();
                  const followUpDate = new Date(followUp.followUpDate);
                  const isToday = followUpDate.toDateString() === new Date().toDateString();
                  const followUpTypeLabel = followUp.type === 'call' ? 'Call' : 'Meeting';
                  
                  if (!lead) return null;
                  
                  return (
                    <div key={followUp.id} className={`followup-card ${isMissed ? 'missed' : ''} ${isToday ? 'today' : ''}`}>
                      <div className="followup-card-header">
                        <div className="lead-avatar">
                          {lead.name?.charAt(0) || '?'}
                        </div>
                        <div className="followup-lead-main">
                          <h4>{lead.name}</h4>
                          <div className="lead-subline">
                            <a href={`tel:${lead.phone}`} className="lead-phone">
                              {lead.phone}
                            </a>
                            {followUp.notes && <span className="lead-notes-badge">Has notes</span>}
                          </div>
                        </div>
                        <div className="followup-status-badges">
                          <span className={`type-badge ${followUp.type === 'call' ? 'call' : 'meeting'}`}>
                            {followUp.type === 'call' ? <Phone size={12} /> : <UserCog size={12} />}
                            {followUpTypeLabel}
                          </span>
                          {isMissed && <span className="status overdue">Overdue</span>}
                          {isToday && !isMissed && <span className="status today">Today</span>}
                        </div>
                      </div>

                      <div className="followup-card-body">
                        <div className="followup-context-grid">
                          <div className="context-item full-width">
                            <div className="detail-icon">
                              <Package size={14} />
                            </div>
                            <div className="detail-info">
                              <span className="detail-label">Product</span>
                              <span className="detail-value">{lead.product}</span>
                            </div>
                          </div>

                          <div className="context-item full-width">
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
                              <span className="detail-label">Follow-up Date</span>
                              <span className="detail-value">
                                {followUpDate.toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="context-item full-width">
                            <div className="detail-icon">
                              <Clock size={14} />
                            </div>
                            <div className="detail-info">
                              <span className="detail-label">Follow-up Time</span>
                              <span className="detail-value">
                                {followUpDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {followUp.notes && (
                          <div className="followup-notes">
                            <FileText size={14} />
                            <p>{followUp.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="followup-actions">
                        <button 
                          type="button"
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
                          type="button"
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
