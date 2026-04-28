// src/services/notificationService.js
class NotificationService {
  constructor() {
    this.audioContext = null;
    this.audioUnlocked = false;
    this.notificationInterval = null;
    this.lastChecked = {};
    this.soundEnabled = true;
    this.handleFirstInteraction = this.handleFirstInteraction.bind(this);
    this.attachAudioUnlockListeners();
  }

  attachAudioUnlockListeners() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    document.addEventListener('click', this.handleFirstInteraction, { once: true });
    document.addEventListener('keydown', this.handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', this.handleFirstInteraction, { once: true });
  }

  handleFirstInteraction() {
    this.initAudioContext();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    this.audioUnlocked = true;
  }

  initAudioContext() {
    if (this.audioContext) return this.audioContext;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      this.audioContext = new AudioContextClass();
      return this.audioContext;
    } catch (error) {
      return null;
    }
  }

  // Play a more musical notification sound
  playNotificationSound() {
    if (!this.soundEnabled) return;

    const audioCtx = this.initAudioContext();
    if (!audioCtx) return;

    const playTone = () => {
      const now = audioCtx.currentTime;
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.type = 'sine';
      osc1.frequency.value = 523.25;
      osc2.type = 'sine';
      osc2.frequency.value = 659.25;
      gainNode.gain.value = 0.2;

      osc1.start(now);
      osc2.start(now);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 1);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    };

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(playTone).catch(() => {});
      return;
    }

    playTone();
  }

  // Show browser notification
  showBrowserNotification(title, body, leadId = null) {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }
    
    // Check permission status
    if (Notification.permission === 'granted') {
      this.createNotification(title, body, leadId);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.createNotification(title, body, leadId);
        }
      });
    }
  }

  createNotification(title, body, leadId) {
    const notification = new Notification(title, {
      body: body,
      icon: '/favicon.ico',
      tag: `followup-${leadId}`,
      requireInteraction: true,
      silent: false
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Custom event to open lead details
      if (leadId) {
        window.dispatchEvent(new CustomEvent('openLeadDetails', { detail: { leadId } }));
      }
    };
    
    notification.onclose = () => {
      console.log('Notification closed');
    };
    
    return notification;
  }

  // Check for upcoming follow-ups
  checkFollowUps(followUps, leads, onFollowUpDue) {
    const now = new Date();
    
    followUps.forEach(followUp => {
      const followUpTime = new Date(followUp.followUpDate);
      const diffMinutes = Math.floor((followUpTime - now) / 60000);
      const lead = leads.find(l => l.id === followUp.leadId);
      
      // Check if follow-up is due now or in the next minute
      if (diffMinutes <= 1 && diffMinutes >= -1 && !this.lastChecked[followUp.id]) {
        this.lastChecked[followUp.id] = true;
        
        // Play sound
        this.playNotificationSound();
        
        // Show browser notification
        const title = `Follow-up Reminder`;
        const body = `${followUp.type === 'call' ? 'Call' : 'Meeting'} with ${lead?.name} at ${followUpTime.toLocaleTimeString()}`;
        this.showBrowserNotification(title, body, followUp.leadId);
        
        // Call callback
        if (onFollowUpDue) {
          onFollowUpDue(followUp, lead);
        }
        
        // Reset after 5 minutes to allow re-notification
        setTimeout(() => {
          delete this.lastChecked[followUp.id];
        }, 300000);
      }
    });
  }

  // Request notification permission
  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  // Enable/disable sound
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    localStorage.setItem('notification_sound_enabled', enabled);
  }

  // Get sound preference
  getSoundEnabled() {
    const saved = localStorage.getItem('notification_sound_enabled');
    if (saved !== null) {
      this.soundEnabled = saved === 'true';
    }
    return this.soundEnabled;
  }

  // Start checking for follow-ups
  startChecking(followUps, leads, onFollowUpDue, intervalSeconds = 30) {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }
    
    this.notificationInterval = setInterval(() => {
      this.checkFollowUps(followUps, leads, onFollowUpDue);
    }, intervalSeconds * 1000);
    
    // Also check immediately
    this.checkFollowUps(followUps, leads, onFollowUpDue);
  }

  // Stop checking
  stopChecking() {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
      this.notificationInterval = null;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;