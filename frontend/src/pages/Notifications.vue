<template>
  <div class="notifications-page">
    <div class="container">
      <div class="page-header">
        <h1>🔔 Le tue notifiche</h1>
        <p>Rimani aggiornato sui tuoi eventi e le attività della piattaforma</p>
      </div>

      <div class="notifications-controls">
        <div class="stats">
          <div class="stat-item">
            <span class="stat-number">{{ unreadCount }}</span>
            <span class="stat-label">Non lette</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ notifications.length }}</span>
            <span class="stat-label">Totale</span>
          </div>
        </div>
        
        <div class="actions">
          <button 
            @click="markAllAsRead" 
            class="btn secondary"
            :disabled="unreadCount === 0"
          >
            Segna tutte come lette
          </button>
          <button @click="loadNotifications" class="btn primary">
            Aggiorna
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Caricamento notifiche...</p>
      </div>

      <div v-else-if="notifications.length === 0" class="empty-state">
        <div class="empty-icon">🔔</div>
        <h3>Nessuna notifica</h3>
        <p>Non hai ancora ricevuto notifiche. Continua a segnalare eventi per ricevere aggiornamenti!</p>
      </div>

      <div v-else class="notifications-list">
        <div 
          v-for="notification in notifications" 
          :key="notification._id"
          class="notification-card"
          :class="{ 'unread': !notification.read }"
          @click="markAsRead(notification._id)"
        >
          <div class="notification-icon">
            <span v-if="notification.type === 'event_approved'">✅</span>
            <span v-else-if="notification.type === 'event_rejected'">❌</span>
            <span v-else-if="notification.type === 'event_modified'">✏️</span>
            <span v-else">🔔</span>
          </div>
          
          <div class="notification-content">
            <h3 class="notification-title">{{ notification.title }}</h3>
            <p class="notification-message">{{ notification.message }}</p>
            
            <div class="notification-meta">
              <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
              <span v-if="!notification.read" class="unread-badge">Non letta</span>
            </div>
          </div>
          
          <div class="notification-actions">
            <button 
              @click.stop="deleteNotification(notification._id)"
              class="delete-btn"
              title="Elimina notifica"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const notifications = ref([]);
const unreadCount = ref(0);
const loading = ref(false);

const loadNotifications = async () => {
  loading.value = true;
  try {
    const [notificationsRes, unreadRes] = await Promise.all([
      api.get('/notifications'),
      api.get('/notifications/unread-count')
    ]);
    
    notifications.value = notificationsRes.data.notifications;
    unreadCount.value = unreadRes.data.unreadCount;
  } catch (error) {
    console.error('Errore caricamento notifiche:', error);
  } finally {
    loading.value = false;
  }
};

const markAsRead = async (notificationId) => {
  try {
    await api.put(`/notifications/${notificationId}/read`);
    
    // Aggiorna lo stato locale
    const notification = notifications.value.find(n => n._id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      unreadCount.value--;
    }
  } catch (error) {
    console.error('Errore marcatura notifica:', error);
  }
};

const markAllAsRead = async () => {
  try {
    await api.put('/notifications/read-all');
    
    // Aggiorna lo stato locale
    notifications.value.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        notification.readAt = new Date();
      }
    });
    
    unreadCount.value = 0;
  } catch (error) {
    console.error('Errore marcatura tutte notifiche:', error);
  }
};

const deleteNotification = async (notificationId) => {
  try {
    await api.delete(`/notifications/${notificationId}`);
    
    // Rimuovi dalla lista locale
    const index = notifications.value.findIndex(n => n._id === notificationId);
    if (index !== -1) {
      const notification = notifications.value[index];
      if (!notification.read) {
        unreadCount.value--;
      }
      notifications.value.splice(index, 1);
    }
  } catch (error) {
    console.error('Errore eliminazione notifica:', error);
  }
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Ora';
  if (minutes < 60) return `${minutes} minuti fa`;
  if (hours < 24) return `${hours} ore fa`;
  if (days < 7) return `${days} giorni fa`;
  
  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  loadNotifications();
});
</script>

<style scoped>
.notifications-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
  color: white;
}

.page-header h1 {
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.page-header p {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
}

.notifications-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #2563eb;
  line-height: 1;
}

.stat-label {
  display: block;
  font-size: 0.9rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.9rem;
}

.btn.primary {
  background: #2563eb;
  color: white;
}

.btn.primary:hover {
  background: #1d4ed8;
}

.btn.secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn.secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.5rem;
}

.empty-state p {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notification-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.notification-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.notification-card.unread {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-left: 4px solid #2563eb;
}

.notification-icon {
  font-size: 2rem;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.1rem;
  font-weight: 600;
}

.notification-message {
  margin: 0 0 1rem 0;
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.5;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.notification-time {
  color: #9ca3af;
  font-size: 0.9rem;
}

.unread-badge {
  background: #2563eb;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
}

.notification-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.delete-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  font-size: 1.2rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
  opacity: 0;
}

.notification-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

@media (max-width: 768px) {
  .notifications-page {
    padding: 1rem 0;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .notifications-controls {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }
  
  .stats {
    gap: 1.5rem;
  }
  
  .actions {
    flex-direction: column;
    width: 100%;
  }
  
  .btn {
    width: 100%;
  }
  
  .notification-card {
    padding: 1rem;
  }
  
  .notification-icon {
    font-size: 1.5rem;
  }
  
  .notification-title {
    font-size: 1rem;
  }
  
  .notification-message {
    font-size: 0.9rem;
  }
}
</style>
