<template>
  <div class="review-page">
    <div class="container">
      <div class="page-header">
        <h1>🔍 Pannello di Revisione</h1>
        <p>Gestisci gli eventi in attesa di approvazione</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.pending }}</div>
            <div class="stat-label">In Attesa</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.approved }}</div>
            <div class="stat-label">Approvati</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">❌</div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.rejected }}</div>
            <div class="stat-label">Rifiutati</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">Totale</div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Caricamento eventi...</p>
      </div>

      <div v-else-if="events.length === 0" class="empty-state">
        <div class="empty-icon">🎉</div>
        <h3>Nessun evento da revisionare</h3>
        <p>Tutti gli eventi sono stati processati!</p>
      </div>

      <div v-else class="events-list">
        <div 
          v-for="event in events" 
          :key="event._id"
          class="event-card"
        >
          <div class="event-header">
            <h3 class="event-title">{{ event.name }}</h3>
            <span class="event-category">{{ event.category }}</span>
          </div>
          
          <div class="event-details">
            <div class="info-item">
              <span class="info-icon">📅</span>
              <span class="info-text">{{ formatDate(event.date) }}</span>
            </div>
            <div class="info-item">
              <span class="info-icon">📍</span>
              <span class="info-text">{{ event.location }}</span>
            </div>
            <div v-if="event.link" class="info-item link-item">
              <span class="info-icon">🔗</span>
              <div class="link-content">
                <span class="link-label">Link evento:</span>
                <a :href="event.link" target="_blank" class="event-link">{{ event.link }}</a>
              </div>
            </div>
            <div class="info-item user-item">
              <span class="info-icon">👤</span>
              <div class="user-content">
                <span class="user-label">Segnalato da:</span>
                <button
                  @click="showUserProfile(event.reportedBy)"
                  class="user-button"
                  :disabled="!event.reportedBy || event.reportedBy === 'Anonimo'"
                >
                  {{ event.reportedBy || 'Anonimo' }}
                </button>
              </div>
            </div>
          </div>
          
          <div class="event-actions">
            <button
              @click="editEvent(event)"
              class="btn edit-btn"
              :disabled="processing === event._id"
            >
              {{ processing === event._id ? '⏳' : '✏️' }} Modifica
            </button>
            <button
              @click="approveEvent(event._id)"
              class="btn approve-btn"
              :disabled="processing === event._id"
            >
              {{ processing === event._id ? '⏳' : '✅' }} Approva
            </button>
            <button
              @click="rejectEvent(event._id)"
              class="btn reject-btn"
              :disabled="processing === event._id"
            >
              {{ processing === event._id ? '⏳' : '❌' }} Rifiuta
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal per modificare evento -->
    <EditEventModal 
      :show="showEditModal" 
      :event="selectedEvent"
      @close="closeEditModal"
      @event-updated="handleEventUpdated"
    />
    
    <!-- Modal per visualizzare profilo utente -->
    <UserProfileModal 
      :show="showUserProfileModal" 
      :username="selectedUsername"
      @close="closeUserProfile"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import EditEventModal from '../components/EditEventModal.vue';
import UserProfileModal from '../components/UserProfileModal.vue';

const events = ref([]);
const stats = ref({ pending: 0, approved: 0, rejected: 0, total: 0 });
const loading = ref(false);
const processing = ref(null);
const message = ref('');
const isError = ref(false);

// Modal states
const showEditModal = ref(false);
const selectedEvent = ref(null);
const showUserProfileModal = ref(false);
const selectedUsername = ref('');

const loadEvents = async () => {
  loading.value = true;
  try {
    const [eventsRes, statsRes] = await Promise.all([
      api.get('/review/events'),
      api.get('/review/stats')
    ]);
    
    events.value = eventsRes.data.events;
    stats.value = statsRes.data;
  } catch (error) {
    console.error('Errore caricamento eventi:', error);
    message.value = 'Errore nel caricamento degli eventi';
    isError.value = true;
  } finally {
    loading.value = false;
  }
};

const approveEvent = async (eventId) => {
  processing.value = eventId;
  try {
    await api.put(`/review/events/${eventId}/approve`);
    message.value = 'Evento approvato con successo!';
    isError.value = false;
    await loadEvents(); // Ricarica la lista
  } catch (error) {
    console.error('Errore approvazione evento:', error);
    message.value = 'Errore durante l\'approvazione dell\'evento';
    isError.value = true;
  } finally {
    processing.value = null;
  }
};

const rejectEvent = async (eventId) => {
  processing.value = eventId;
  try {
    await api.put(`/review/events/${eventId}/reject`);
    message.value = 'Evento rifiutato con successo!';
    isError.value = false;
    await loadEvents(); // Ricarica la lista
  } catch (error) {
    console.error('Errore rifiuto evento:', error);
    message.value = 'Errore durante il rifiuto dell\'evento';
    isError.value = true;
  } finally {
    processing.value = null;
  }
};

const showUserProfile = (username) => {
  if (!username || username === 'Anonimo') return;
  selectedUsername.value = username;
  showUserProfileModal.value = true;
};

const closeUserProfile = () => {
  showUserProfileModal.value = false;
  selectedUsername.value = '';
};

const editEvent = (event) => {
  selectedEvent.value = event;
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  selectedEvent.value = null;
};

const handleEventUpdated = () => {
  // Ricarica la lista eventi quando un evento viene aggiornato
  loadEvents();
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  loadEvents();
});
</script>

<style scoped>
.review-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: #6b7280;
  margin-top: 0.25rem;
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

.events-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.event-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.event-title {
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 600;
  flex: 1;
}

.event-category {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-left: 1rem;
}

.event-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.info-icon {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
}

.info-text {
  color: #6b7280;
  font-size: 0.95rem;
}

.link-item {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.link-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.link-label {
  font-size: 0.8rem;
  color: #9ca3af;
  font-weight: 600;
}

.event-link {
  color: #2563eb;
  text-decoration: none;
  font-size: 0.9rem;
  word-break: break-all;
}

.event-link:hover {
  text-decoration: underline;
}

.user-item {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.user-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-label {
  font-size: 0.8rem;
  color: #9ca3af;
  font-weight: 600;
}

.user-button {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.user-button:hover:not(:disabled) {
  background: #e5e7eb;
}

.user-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.event-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.edit-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.edit-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.approve-btn {
  background: #10b981;
  color: white;
}

.approve-btn:hover:not(:disabled) {
  background: #059669;
}

.reject-btn {
  background: #ef4444;
  color: white;
}

.reject-btn:hover:not(:disabled) {
  background: #dc2626;
}

@media (max-width: 768px) {
  .review-page {
    padding: 1rem 0;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .event-header {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .event-category {
    margin-left: 0;
    align-self: flex-start;
  }
  
  .event-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
