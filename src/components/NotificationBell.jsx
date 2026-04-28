// src/components/NotificationBell.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Bell, BellOff, CheckCircle, Clock, X, Calendar, Phone, MessageCircle, Volume2, VolumeX } from 'lucide-react';
import { notificationService } from '../services/notificationService';

const NotificationBell = ({ onNotificationClick }) => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    
    // Request notification permission on mount
    notificationService.requestNotificationPermission();
    
    // Load sound preference
    setSoundEnabled(notificationService.getSoundEnabled());
    
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    const newNotifications = api.getNotifications();
    setNotifications(newNotifications);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification) => {
    api.markNotificationRead(notification.id);
    loadNotifications();
    if (onNotificationClick) onNotificationClick();
  };

  const markAllAsRead = () => {
    notifications.forEach(n => {
      if (!n.read) api.markNotificationRead(n.id);
    });
    loadNotifications();
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    notificationService.setSoundEnabled(newState);
  };

  const clearAllNotifications = () => {
    api.clearNotifications();
    loadNotifications();
    if (onNotificationClick) onNotificationClick();
  };

  const getNotificationIcon = (message) => {
    if (message.includes('follow-up')) return <Clock size={16} color="#FF9800" />;
    if (message.includes('scheduled')) return <Calendar size={16} color="#06D889" />;
    if (message.includes('call')) return <Phone size={16} color="#2196F3" />;
    return <MessageCircle size={16} color="#06D889" />;
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="notification-modern-container">
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className={`notification-modern-bell ${unreadCount > 0 ? 'has-notifications' : ''}`}
      >
        {unreadCount > 0 ? <Bell size={20} /> : <BellOff size={20} />}
        {unreadCount > 0 && (
          <span className="notification-modern-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>
      
      {showDropdown && (
        <div className="notification-modern-dropdown">
          <div className="dropdown-modern-header">
            <div className="header-left">
              <div className="header-icon">
                <Bell size={18} />
              </div>
              <div>
                <h3>Notifications</h3>
                <p>You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="notification-header-actions">
              <button 
                onClick={toggleSound}
                className="sound-toggle-btn"
                title={soundEnabled ? 'Disable sound' : 'Enable sound'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button 
                onClick={() => setShowDropdown(false)}
                className="close-dropdown-modern"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          <div className="notifications-modern-list">
            {notifications.length === 0 ? (
              <div className="empty-notifications-modern">
                <div className="empty-icon">
                  <BellOff size={48} strokeWidth={1.5} />
                </div>
                <h4>No notifications</h4>
                <p>You're all caught up!</p>
              </div>
            ) : (
              <>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="mark-all-read-btn">
                    <CheckCircle size={14} />
                    Mark all as read
                  </button>
                )}
                {notifications.map(notification => (
                  <div 
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`notification-modern-item ${!notification.read ? 'unread' : ''}`}
                  >
                    <div className="notification-modern-icon">
                      {getNotificationIcon(notification.message)}
                    </div>
                    <div className="notification-modern-content">
                      <div className="notification-modern-message">
                        {notification.message}
                      </div>
                      <div className="notification-modern-time">
                        <Clock size={12} />
                        {getTimeAgo(notification.createdAt)}
                      </div>
                    </div>
                    {!notification.read && <div className="notification-modern-dot" />}
                  </div>
                ))}
              </>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="dropdown-modern-footer">
              <button 
                onClick={clearAllNotifications}
                className="clear-all-btn"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;