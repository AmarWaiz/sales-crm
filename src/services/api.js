// src/services/api.js
const STORAGE_KEYS = {
  USERS: 'crm_users',
  LEADS: 'crm_leads',
  CURRENT_USER: 'crm_current_user',
  NOTIFICATIONS: 'crm_notifications',
  COMMENTS: 'crm_comments',
  FOLLOW_UPS: 'crm_follow_ups'
};

// Initialize demo data
const initializeData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const users = [
      { id: 'admin1', name: 'Admin User', role: 'admin', password: 'admin123' },
      { id: 'agent1', name: 'John Agent', role: 'agent', password: 'agent123' },
      { id: 'agent2', name: 'Sarah Smith', role: 'agent', password: 'agent123' }
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  if (!localStorage.getItem(STORAGE_KEYS.LEADS)) {
    const leads = [
      { 
        id: '1', 
        name: 'Ahmed Khan', 
        phone: '+923001234567', 
        product: 'Solar Panel System',
        city: 'Karachi',
        status: 'New',
        assignedTo: 'agent1',
        createdAt: new Date().toISOString()
      },
      { 
        id: '2', 
        name: 'Fatima Ali', 
        phone: '+923001234568', 
        product: 'AC Service',
        city: 'Lahore',
        status: 'Contacted',
        assignedTo: 'agent1',
        createdAt: new Date().toISOString()
      },
      { 
        id: '3', 
        name: 'Omar Sheikh', 
        phone: '+923001234569', 
        product: 'Home Insurance',
        city: 'Islamabad',
        status: 'New',
        assignedTo: 'agent2',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
  }

  if (!localStorage.getItem(STORAGE_KEYS.FOLLOW_UPS)) {
    localStorage.setItem(STORAGE_KEYS.FOLLOW_UPS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify([]));
  }
};

export const api = {
  // Auth
  login: (id, password) => {
    initializeData();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    const user = users.find(u => u.id === id && u.password === password);
    
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, error: 'Invalid credentials' };
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser: () => {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  },

  // Leads
  getLeads: () => {
    const currentUser = api.getCurrentUser();
    const leads = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEADS));
    
    if (currentUser?.role === 'admin') {
      return leads;
    }
    return leads.filter(lead => lead.assignedTo === currentUser?.id);
  },

  addLead: (lead) => {
    const leads = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEADS));
    const newLead = { ...lead, id: Date.now().toString() };
    leads.push(newLead);
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
    return newLead;
  },

  updateLead: (leadId, updates) => {
    const leads = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEADS));
    const index = leads.findIndex(l => l.id === leadId);
    if (index !== -1) {
      leads[index] = { ...leads[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
      return leads[index];
    }
    return null;
  },

 uploadLeads: (leadsData, assignedTo = null) => {
  const currentUser = api.getCurrentUser();
  const leads = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEADS));
  
  const newLeads = leadsData.map(lead => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: lead.Name || lead.name,
    phone: lead.Phone || lead.phone,
    product: lead.Product || lead.product,
    city: lead.City || lead.city,
    notes: lead.Notes || lead.notes || '',
    status: 'New',
    assignedTo: assignedTo || (currentUser.role === 'admin' ? 'unassigned' : currentUser.id),
    createdAt: new Date().toISOString()
  }));
  
  localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify([...leads, ...newLeads]));
  return newLeads;
},


  // Comments
  addComment: (leadId, comment) => {
    const currentUser = api.getCurrentUser();
    const comments = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS));
    const newComment = {
      id: Date.now().toString(),
      leadId,
      userId: currentUser.id,
      userName: currentUser.name,
      comment,
      createdAt: new Date().toISOString()
    };
    comments.push(newComment);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
    return newComment;
  },

  getComments: (leadId) => {
    const comments = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS));
    return comments.filter(c => c.leadId === leadId);
  },

  // Follow-ups
  setFollowUp: (leadId, followUpDate, type, notes) => {
    const followUps = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOW_UPS));
    const newFollowUp = {
      id: Date.now().toString(),
      leadId,
      followUpDate,
      type, // 'call' or 'meeting'
      notes,
      completed: false,
      createdAt: new Date().toISOString()
    };
    followUps.push(newFollowUp);
    localStorage.setItem(STORAGE_KEYS.FOLLOW_UPS, JSON.stringify(followUps));
    
    // Create notification
    api.createNotification(leadId, `Follow-up scheduled for ${new Date(followUpDate).toLocaleString()}`);
    return newFollowUp;
  },

  getFollowUps: () => {
    const currentUser = api.getCurrentUser();
    const leads = api.getLeads();
    const leadIds = leads.map(l => l.id);
    const followUps = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOW_UPS));
    
    return followUps.filter(f => leadIds.includes(f.leadId) && !f.completed);
  },

  completeFollowUp: (followUpId) => {
    const followUps = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOW_UPS));
    const index = followUps.findIndex(f => f.id === followUpId);
    if (index !== -1) {
      followUps[index].completed = true;
      localStorage.setItem(STORAGE_KEYS.FOLLOW_UPS, JSON.stringify(followUps));
    }
  },

  // Notifications
  createNotification: (leadId, message) => {
    const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS));
    const newNotification = {
      id: Date.now().toString(),
      leadId,
      message,
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.push(newNotification);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  getNotifications: () => {
    const currentUser = api.getCurrentUser();
    const leads = api.getLeads();
    const leadIds = leads.map(l => l.id);
    const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS));
    
    return notifications.filter(n => leadIds.includes(n.leadId)).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  },

  markNotificationRead: (notificationId) => {
    const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS));
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      notifications[index].read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    }
  },

  clearNotifications: () => {
    const leads = api.getLeads();
    const leadIds = new Set(leads.map((lead) => lead.id));
    const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
    const remaining = notifications.filter((notification) => !leadIds.has(notification.leadId));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(remaining));
    return true;
  },

  getMissedFollowUps: () => {
    const followUps = api.getFollowUps();
    const now = new Date();
    return followUps.filter(f => new Date(f.followUpDate) < now);
  },

  getUsers: () => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    return users.filter(u => u.role === 'agent');
  },

  deleteLead: (leadId) => {
  const leads = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEADS));
  const updatedLeads = leads.filter(lead => lead.id !== leadId);
  localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(updatedLeads));
  
  // Also delete related comments and follow-ups
  const comments = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS));
  const updatedComments = comments.filter(c => c.leadId !== leadId);
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updatedComments));
  
  const followUps = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOW_UPS));
  const updatedFollowUps = followUps.filter(f => f.leadId !== leadId);
  localStorage.setItem(STORAGE_KEYS.FOLLOW_UPS, JSON.stringify(updatedFollowUps));
  
  return true;
}
};


