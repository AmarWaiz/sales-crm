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
      { id: 'admin1', name: 'Admin User', email: 'admin@example.com', role: 'admin', password: 'admin123' },
      { id: 'agent1', name: 'John Agent', email: 'john.agent@example.com', role: 'agent', password: 'agent123' },
      { id: 'agent2', name: 'Sarah Smith', email: 'sarah.smith@example.com', role: 'agent', password: 'agent123' }
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
        notes: 'Interested in home installation',
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
        notes: 'Commercial client',
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
        notes: 'Looking for family coverage',
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

const getStoredArray = (storageKey) => {
  return JSON.parse(localStorage.getItem(storageKey) || '[]');
};

const normalizeAgentIds = (agentIds) => {
  if (!agentIds) return [];
  return Array.isArray(agentIds) ? agentIds.filter(Boolean) : [agentIds].filter(Boolean);
};

const canCurrentUserAccessLead = (leadId) => {
  const currentUser = api.getCurrentUser();
  if (currentUser?.role === 'admin') {
    return true;
  }

  return api.getLeads().some((lead) => lead.id === leadId);
};

const getAssignedAgentId = (index, totalLeads, agentIds, mode) => {
  if (agentIds.length === 0) {
    return null;
  }

  if (mode === 'balanced') {
    const baseCount = Math.floor(totalLeads / agentIds.length);
    const remainder = totalLeads % agentIds.length;
    let startIndex = 0;

    for (let agentIndex = 0; agentIndex < agentIds.length; agentIndex += 1) {
      const chunkSize = baseCount + (agentIndex < remainder ? 1 : 0);
      if (index < startIndex + chunkSize) {
        return agentIds[agentIndex];
      }
      startIndex += chunkSize;
    }

    return agentIds[agentIds.length - 1];
  }

  return agentIds[index % agentIds.length];
};

export const api = {
  // Auth
  login: (id, password) => {
    initializeData();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    const user = users.find(u => u.id === id && u.password === password);
    
    if (user) {
      // Don't store password in current user
      const { password, ...userWithoutPassword } = user;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userWithoutPassword));
      return { success: true, user: userWithoutPassword };
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

  // Users
  getAllUsers: () => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    // Remove passwords for security
    return users.map(({ password, ...user }) => user);
  },

  getUserById: (userId) => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    const user = users.find(u => u.id === userId);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  },

  addUser: (userData) => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    const newUser = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },

  deleteUser: (userId) => {
    if (userId === 'admin1') {
      return { success: false, error: 'Cannot delete main admin account' };
    }
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    return { success: true };
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

  getLeadById: (leadId) => {
    const leads = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEADS));
    return leads.find(l => l.id === leadId) || null;
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
      
      // Create notification for assignment change
      if (updates.assignedTo && updates.assignedTo !== leads[index].assignedTo) {
        const assignedUser = api.getUserById(updates.assignedTo);
        if (assignedUser && assignedUser.email) {
          api.createNotification(leadId, `Lead "${leads[index].name}" assigned to you`);
        }
      }
      
      return leads[index];
    }
    return null;
  },

  uploadLeads: (leadsData, agentIds = [], mode = 'round-robin') => {
    const currentUser = api.getCurrentUser();
    const leads = getStoredArray(STORAGE_KEYS.LEADS);
    const selectedAgentIds = normalizeAgentIds(agentIds);
    const validMode = mode === 'balanced' ? 'balanced' : 'round-robin';
    
    const newLeads = leadsData.map((lead, index) => {
      const assignedAgentId = getAssignedAgentId(index, leadsData.length, selectedAgentIds, validMode);

      return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: lead.Name || lead.name,
        phone: lead.Phone || lead.phone,
        product: lead.Product || lead.product,
        city: lead.City || lead.city,
        notes: lead.Notes || lead.notes || '',
        status: 'New',
        assignedTo: assignedAgentId || (currentUser?.role === 'admin' ? 'unassigned' : currentUser?.id),
        createdAt: new Date().toISOString()
      };
    });
    
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify([...leads, ...newLeads]));
    
    // Create notifications for assigned agents
    newLeads
      .filter((lead) => lead.assignedTo && lead.assignedTo !== 'unassigned')
      .forEach((lead) => {
        const assignedUser = api.getUserById(lead.assignedTo);
        if (assignedUser) {
          api.createNotification(lead.id, `New lead "${lead.name}" assigned to you`);
        }
      });
    
    return newLeads;
  },

  deleteLead: (leadId) => {
    const currentUser = api.getCurrentUser();
    if (currentUser?.role !== 'admin') {
      throw new Error('Only administrators can delete leads.');
    }

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
  },

  deleteLeads: (leadIds) => {
    const currentUser = api.getCurrentUser();
    if (currentUser?.role !== 'admin') {
      throw new Error('Only administrators can delete leads.');
    }

    const idsToDelete = new Set(leadIds);
    const leads = getStoredArray(STORAGE_KEYS.LEADS);
    const comments = getStoredArray(STORAGE_KEYS.COMMENTS);
    const followUps = getStoredArray(STORAGE_KEYS.FOLLOW_UPS);
    const notifications = getStoredArray(STORAGE_KEYS.NOTIFICATIONS);

    localStorage.setItem(
      STORAGE_KEYS.LEADS,
      JSON.stringify(leads.filter((lead) => !idsToDelete.has(lead.id)))
    );
    localStorage.setItem(
      STORAGE_KEYS.COMMENTS,
      JSON.stringify(comments.filter((comment) => !idsToDelete.has(comment.leadId)))
    );
    localStorage.setItem(
      STORAGE_KEYS.FOLLOW_UPS,
      JSON.stringify(followUps.filter((followUp) => !idsToDelete.has(followUp.leadId)))
    );
    localStorage.setItem(
      STORAGE_KEYS.NOTIFICATIONS,
      JSON.stringify(notifications.filter((notification) => !idsToDelete.has(notification.leadId)))
    );

    return true;
  },

  // Comments
  addComment: (leadId, comment) => {
    if (!canCurrentUserAccessLead(leadId)) {
      throw new Error('You do not have permission to comment on this lead.');
    }

    const currentUser = api.getCurrentUser();
    const comments = getStoredArray(STORAGE_KEYS.COMMENTS);
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
    
    // Create notification for lead owner
    const lead = api.getLeadById(leadId);
    if (lead && lead.assignedTo !== currentUser.id) {
      api.createNotification(leadId, `New comment from ${currentUser.name} on lead "${lead.name}"`);
    }
    
    return newComment;
  },

  getComments: (leadId) => {
    const allowedLeadIds = new Set(api.getLeads().map((lead) => lead.id));
    const comments = getStoredArray(STORAGE_KEYS.COMMENTS);

    return comments.filter(c => c.leadId === leadId && allowedLeadIds.has(c.leadId)).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  },

  // Follow-ups
  setFollowUp: (leadId, followUpDate, type, notes) => {
    if (!canCurrentUserAccessLead(leadId)) {
      throw new Error('You do not have permission to schedule a follow-up for this lead.');
    }

    const currentUser = api.getCurrentUser();
    const followUps = getStoredArray(STORAGE_KEYS.FOLLOW_UPS);
    const newFollowUp = {
      id: Date.now().toString(),
      leadId,
      followUpDate,
      type,
      notes,
      completed: false,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString()
    };
    followUps.push(newFollowUp);
    localStorage.setItem(STORAGE_KEYS.FOLLOW_UPS, JSON.stringify(followUps));
    
    // Create notification
    const lead = api.getLeadById(leadId);
    api.createNotification(leadId, `Follow-up scheduled for ${new Date(followUpDate).toLocaleString()} - ${type === 'call' ? 'Call' : 'Meeting'} with ${lead?.name}`);
    
    return newFollowUp;
  },

  getFollowUps: () => {
    const currentUser = api.getCurrentUser();
    const leads = api.getLeads();
    const leadIds = leads.map(l => l.id);
    const followUps = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOW_UPS));
    
    return followUps.filter(f => leadIds.includes(f.leadId) && !f.completed);
  },

  getAllFollowUps: () => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOW_UPS));
  },

  completeFollowUp: (followUpId) => {
    const followUps = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLLOW_UPS));
    const index = followUps.findIndex(f => f.id === followUpId);
    if (index !== -1) {
      followUps[index].completed = true;
      followUps[index].completedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.FOLLOW_UPS, JSON.stringify(followUps));
      
      const lead = api.getLeadById(followUps[index].leadId);
      api.createNotification(followUps[index].leadId, `Follow-up completed for ${lead?.name}`);
      return true;
    }
    return false;
  },

  getMissedFollowUps: () => {
    const followUps = api.getFollowUps();
    const now = new Date();
    return followUps.filter(f => new Date(f.followUpDate) < now);
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
    // Keep only last 200 notifications
    if (notifications.length > 200) {
      notifications.shift();
    }
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

  markAllNotificationsRead: () => {
    const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS));
    notifications.forEach(n => n.read = true);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  clearNotifications: () => {
    const leads = api.getLeads();
    const leadIds = new Set(leads.map((lead) => lead.id));
    const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
    const remaining = notifications.filter((notification) => !leadIds.has(notification.leadId));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(remaining));
    return true;
  },

  // Users (for admin)
  getUsers: () => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    // Return users without passwords
    return users.map(({ password, ...user }) => user);
  },

  getAgents: () => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    return users.filter(u => u.role === 'agent').map(({ password, ...user }) => user);
  },

  // Dashboard Stats
  getDashboardStats: () => {
    const leads = api.getLeads();
    const followUps = api.getFollowUps();
    const missedFollowUps = api.getMissedFollowUps();
    
    return {
      totalLeads: leads.length,
      newLeads: leads.filter(l => l.status === 'New').length,
      contactedLeads: leads.filter(l => l.status === 'Contacted').length,
      closedLeads: leads.filter(l => l.status === 'Closed').length,
      pendingFollowUps: followUps.length,
      missedFollowUps: missedFollowUps.length
    };
  }
};
