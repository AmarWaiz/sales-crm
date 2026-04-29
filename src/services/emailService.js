// src/services/emailService.js
import emailjs from '@emailjs/browser';

class EmailService {
  constructor() {
    // IMPORTANT: Replace these with your EmailJS credentials
    // Get these from https://dashboard.emailjs.com
    this.PUBLIC_KEY = 'd9O_Sc9coqLloc3S1';     // Get from EmailJS Dashboard
    this.SERVICE_ID = 'service_r2010sr';     // Get from EmailJS Dashboard  
    this.TEMPLATE_ID = 'template_22a55jq';   // Get from EmailJS Dashboard
    
    this.isInitialized = false;
  }

  init() {
    if (!this.isInitialized && this.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
      emailjs.init(this.PUBLIC_KEY);
      this.isInitialized = true;
      console.log('EmailJS initialized');
    }
  }

  // Send follow-up reminder email
  async sendFollowUpReminder(lead, followUp, agent) {
    this.init();
    
    const templateParams = {
      to_email: agent.email,
      to_name: agent.name,
      lead_name: lead.name,
      lead_phone: lead.phone,
      lead_product: lead.product,
      lead_city: lead.city,
      follow_up_type: followUp.type === 'call' ? '📞 Phone Call' : '👥 Meeting',
      follow_up_date: new Date(followUp.followUpDate).toLocaleDateString(),
      follow_up_time: new Date(followUp.followUpDate).toLocaleTimeString(),
      follow_up_notes: followUp.notes || 'No additional notes',
      lead_notes: lead.notes || 'No notes',
      login_url: window.location.origin,
      company_name: 'Sales CRM',
      current_year: new Date().getFullYear()
    };

    try {
      const response = await emailjs.send(
        this.SERVICE_ID,
        this.TEMPLATE_ID,
        templateParams
      );
      console.log('Email sent successfully!', response);
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, message: error.text || 'Failed to send email' };
    }
  }

  // Send lead assignment notification
  async sendLeadAssignmentNotification(lead, agent, assignedBy) {
    this.init();
    
    const templateParams = {
      to_email: agent.email,
      to_name: agent.name,
      lead_name: lead.name,
      lead_phone: lead.phone,
      lead_product: lead.product,
      lead_city: lead.city,
      lead_notes: lead.notes || 'No notes',
      assigned_by: assignedBy.name,
      login_url: window.location.origin,
      company_name: 'Sales CRM',
      current_year: new Date().getFullYear()
    };

    try {
      await emailjs.send(this.SERVICE_ID, this.TEMPLATE_ID, templateParams);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Send welcome email to new users
  async sendWelcomeEmail(user, password) {
    this.init();
    
    const templateParams = {
      to_email: user.email,
      to_name: user.name,
      user_id: user.id,
      user_password: password,
      user_role: user.role === 'admin' ? 'Administrator' : 'Sales Agent',
      login_url: window.location.origin,
      company_name: 'Sales CRM',
      current_year: new Date().getFullYear()
    };

    try {
      await emailjs.send(this.SERVICE_ID, this.TEMPLATE_ID, templateParams);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Send test email
  async sendTestEmail(email, name) {
    this.init();
    
    const templateParams = {
      to_email: email,
      to_name: name,
      lead_name: 'Test Lead',
      lead_phone: '+1234567890',
      lead_product: 'Test Product',
      lead_city: 'Test City',
      follow_up_type: '📞 Test Call',
      follow_up_date: new Date().toLocaleDateString(),
      follow_up_time: new Date().toLocaleTimeString(),
      follow_up_notes: 'This is a test email to verify your email notification settings are working correctly.',
      lead_notes: 'Test notification',
      login_url: window.location.origin,
      company_name: 'Sales CRM',
      current_year: new Date().getFullYear()
    };

    try {
      await emailjs.send(this.SERVICE_ID, this.TEMPLATE_ID, templateParams);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }
}

export const emailService = new EmailService();