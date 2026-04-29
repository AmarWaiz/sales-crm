// src/components/EmailSettings.jsx
import React, { useState, useEffect } from 'react';
import { Mail, Bell, Save, TestTube, CheckCircle, AlertCircle, Settings, Send, Shield, Zap, Clock, Users, Volume2 } from 'lucide-react';
import { emailService } from '../services/emailService';
import { toast } from 'react-toastify';

const EmailSettings = ({ user }) => {
  const [settings, setSettings] = useState({
    enabled: true,
    followUpReminders: true,
    leadAssignment: true,
    welcomeEmails: true,
    dailySummary: false,
    summaryTime: '09:00'
  });

  const [testEmail, setTestEmail] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [credentials, setCredentials] = useState({
    publicKey: '',
    serviceId: '',
    templateId: ''
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('email_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    const savedCredentials = localStorage.getItem('emailjs_credentials');
    if (savedCredentials) {
      const creds = JSON.parse(savedCredentials);
      setCredentials(creds);
      setIsConfigured(true);
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('email_settings', JSON.stringify(settings));
    toast.success('Email preferences saved!');
  };

  const saveCredentials = () => {
    if (!credentials.publicKey || !credentials.serviceId || !credentials.templateId) {
      toast.error('Please fill all EmailJS credentials');
      return;
    }
    
    setSaving(true);
    localStorage.setItem('emailjs_credentials', JSON.stringify(credentials));
    
    emailService.PUBLIC_KEY = credentials.publicKey;
    emailService.SERVICE_ID = credentials.serviceId;
    emailService.TEMPLATE_ID = credentials.templateId;
    emailService.init();
    
    setIsConfigured(true);
    setSaving(false);
    toast.success('EmailJS credentials saved successfully!');
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter email address');
      return;
    }
    
    if (!isConfigured) {
      toast.error('Please configure EmailJS credentials first');
      return;
    }
    
    setTesting(true);
    toast.info('Sending test email...');
    const result = await emailService.sendTestEmail(testEmail, user?.name || 'Admin');
    setTesting(false);
    
    if (result.success) {
      toast.success('Test email sent! Check your inbox (and spam folder).');
    } else {
      toast.error('Failed to send. Check your EmailJS configuration.');
    }
  };

  return (
    <div className="email-settings-modern">
      {/* Header */}
      <div className="email-header">
        <div className="email-header-icon">
          <Mail size={28} />
        </div>
        <div>
          <h1>Email Notifications</h1>
          <p>Configure email settings for your team</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="email-two-columns">
        {/* Left Column - Configuration */}
        <div className="email-config-card">
          <div className="card-title">
            <Settings size={18} />
            <h3>EmailJS Configuration</h3>
          </div>
          <p className="card-subtitle">Get your credentials from <a href="https://dashboard.emailjs.com" target="_blank" rel="noopener noreferrer">EmailJS Dashboard</a></p>
          
          <div className="config-field">
            <label>Public Key</label>
            <input
              type="text"
              placeholder="user_xxxxxxxxxxxxx"
              value={credentials.publicKey}
              onChange={(e) => setCredentials({...credentials, publicKey: e.target.value})}
            />
          </div>
          
          <div className="config-field">
            <label>Service ID</label>
            <input
              type="text"
              placeholder="service_xxxxxxxx"
              value={credentials.serviceId}
              onChange={(e) => setCredentials({...credentials, serviceId: e.target.value})}
            />
          </div>
          
          <div className="config-field">
            <label>Template ID</label>
            <input
              type="text"
              placeholder="template_xxxxxxxx"
              value={credentials.templateId}
              onChange={(e) => setCredentials({...credentials, templateId: e.target.value})}
            />
          </div>
          
          <button className="save-creds-btn" onClick={saveCredentials} disabled={saving}>
            {saving ? <div className="spinner-small" /> : <CheckCircle size={16} />}
            {saving ? 'Saving...' : 'Save Credentials'}
          </button>
          
          {isConfigured && (
            <div className="status-badge success">
              <CheckCircle size={14} />
              EmailJS Configured
            </div>
          )}
        </div>

        {/* Right Column - Preferences */}
        <div className="email-preferences-card">
          <div className="card-title">
            <Bell size={18} />
            <h3>Notification Preferences</h3>
          </div>
          
          <div className="preference-item">
            <label className="switch-label">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({...settings, enabled: e.target.checked})}
              />
              <span className="switch-slider"></span>
              <span className="switch-text">Enable Email Notifications</span>
            </label>
          </div>
          
          <div className="preference-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.followUpReminders}
                onChange={(e) => setSettings({...settings, followUpReminders: e.target.checked})}
                disabled={!settings.enabled}
              />
              <span className="checkbox-custom"></span>
              <div>
                <strong>Send Follow-up Reminders</strong>
                <p>Get email reminders when follow-ups are scheduled</p>
              </div>
            </label>
          </div>
          
          <div className="preference-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.leadAssignment}
                onChange={(e) => setSettings({...settings, leadAssignment: e.target.checked})}
                disabled={!settings.enabled}
              />
              <span className="checkbox-custom"></span>
              <div>
                <strong>Lead Assignment Notifications</strong>
                <p>Get notified when new leads are assigned to you</p>
              </div>
            </label>
          </div>
          
          <div className="preference-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.welcomeEmails}
                onChange={(e) => setSettings({...settings, welcomeEmails: e.target.checked})}
                disabled={!settings.enabled}
              />
              <span className="checkbox-custom"></span>
              <div>
                <strong>Welcome Emails</strong>
                <p>Send welcome emails when new users are added</p>
              </div>
            </label>
          </div>
          
          <div className="preference-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.dailySummary}
                onChange={(e) => setSettings({...settings, dailySummary: e.target.checked})}
                disabled={!settings.enabled}
              />
              <span className="checkbox-custom"></span>
              <div>
                <strong>Daily Summary Report</strong>
                <p>Receive daily performance summary</p>
              </div>
            </label>
            {settings.dailySummary && settings.enabled && (
              <div className="time-selector">
                <Clock size={14} />
                <input
                  type="time"
                  value={settings.summaryTime}
                  onChange={(e) => setSettings({...settings, summaryTime: e.target.value})}
                />
              </div>
            )}
          </div>
          
          <button className="save-prefs-btn" onClick={saveSettings}>
            <Save size={16} />
            Save Preferences
          </button>
        </div>
      </div>

      {/* Test Section */}
      <div className="email-test-card">
        <div className="card-title">
          <Send size={18} />
          <h3>Test Email</h3>
        </div>
        <p>Send a test email to verify your configuration</p>
        <div className="test-input-group">
          <input
            type="email"
            placeholder="Enter email address to test"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
          <button onClick={sendTestEmail} disabled={testing || !isConfigured}>
            {testing ? <div className="spinner-small" /> : <TestTube size={16} />}
            {testing ? 'Sending...' : 'Send Test'}
          </button>
        </div>
      </div>

      {/* Setup Guide */}
      <div className="setup-guide-card">
        <div className="card-title">
          <Zap size={18} />
          <h3>Quick Setup Guide</h3>
        </div>
        <div className="guide-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div>Create <a href="https://www.emailjs.com" target="_blank">EmailJS</a> account (FREE)</div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div>Add Email Service (Gmail/Outlook/SMTP)</div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div>Create Email Template with variables: <code>{"{{to_email}}, {{lead_name}}, etc."}</code></div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div>Copy credentials above and click Save</div>
          </div>
          <div className="step">
            <div className="step-number">5</div>
            <div>Send test email to confirm</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSettings;