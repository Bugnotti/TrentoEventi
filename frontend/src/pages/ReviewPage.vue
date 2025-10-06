<template>
  <div class="review-page">
    <div class="container">
      <div class="page-header">
        <h1>🔍 Pannello di Revisione</h1>
        <p>Gestisci gli eventi in attesa di approvazione e le modifiche richieste</p>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button 
          @click="activeTab = 'events'"
          :class="['tab-btn', { active: activeTab === 'events' }]"
        >
          ⏳ Eventi in Attesa
        </button>
        <button 
          @click="activeTab = 'modifications'"
          :class="['tab-btn', { active: activeTab === 'modifications' }]"
        >
          🔄 Modifiche in Attesa
        </button>
      </div>

      <!-- Stats per Eventi -->
      <div v-if="activeTab === 'events'" class="stats-grid">
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

      <!-- Stats per Modifiche -->
      <div v-if="activeTab === 'modifications'" class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🔄</div>
          <div class="stat-content">
            <div class="stat-number">{{ modificationStats.pending }}</div>
            <div class="stat-label">Modifiche in Attesa</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-number">{{ modificationStats.approved }}</div>
            <div class="stat-label">Modifiche Approvate</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">❌</div>
          <div class="stat-content">
            <div class="stat-number">{{ modificationStats.rejected }}</div>
            <div class="stat-label">Modifiche Rifiutate</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-number">{{ modificationStats.total }}</div>
            <div class="stat-label">Totale Modifiche</div>
          </div>
        </div>
      </div>

      <!-- Contenuto per Eventi -->
      <div v-if="activeTab === 'events'">
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

      <!-- Contenuto per Modifiche -->
      <div v-if="activeTab === 'modifications'">
        <div v-if="modificationsLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Caricamento modifiche...</p>
        </div>

        <div v-else-if="pendingModifications.length === 0" class="empty-state">
          <div class="empty-icon">✅</div>
          <h3>Nessuna modifica in attesa</h3>
          <p>Tutte le richieste di modifica sono state gestite!</p>
        </div>

        <div v-else class="modifications-list">
          <div 
            v-for="event in pendingModifications" 
            :key="event._id" 
            class="modification-card"
          >
            <div class="modification-header">
              <h3>{{ event.name }}</h3>
              <div class="modification-badge">
                <span class="badge-icon">🔄</span>
                <span>Modifica Richiesta</span>
              </div>
            </div>

            <div class="modification-details">
              <div class="current-info">
                <h4>📋 Informazioni Attuali</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">Nome:</span>
                    <span class="value">{{ event.name }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Categoria:</span>
                    <span class="value">{{ event.category }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Data:</span>
                    <span class="value">{{ formatDate(event.date) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Luogo:</span>
                    <span class="value">{{ event.location }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Link:</span>
                    <span class="value">{{ event.link || 'Nessun link' }}</span>
                  </div>
                </div>
              </div>

              <div class="requested-info">
                <h4>🔄 Modifiche Richieste</h4>
                <div class="info-grid">
                  <div v-if="isFieldModified(event, 'name')" class="info-item">
                    <span class="label">Nome:</span>
                    <span class="value new">
                      <span class="modified-indicator">🔄</span>
                      {{ event.pendingModifications.name }}
                    </span>
                  </div>
                  <div v-if="isFieldModified(event, 'category')" class="info-item">
                    <span class="label">Categoria:</span>
                    <span class="value new">
                      <span class="modified-indicator">🔄</span>
                      {{ event.pendingModifications.category }}
                    </span>
                  </div>
                  <div v-if="isFieldModified(event, 'date')" class="info-item">
                    <span class="label">Data:</span>
                    <span class="value new">
                      <span class="modified-indicator">🔄</span>
                      {{ formatDate(event.pendingModifications.date) }}
                    </span>
                  </div>
                  <div v-if="isFieldModified(event, 'location')" class="info-item">
                    <span class="label">Luogo:</span>
                    <span class="value new">
                      <span class="modified-indicator">🔄</span>
                      {{ event.pendingModifications.location }}
                    </span>
                  </div>
                  <div v-if="isFieldModified(event, 'link')" class="info-item">
                    <span class="label">Link:</span>
                    <span class="value new">
                      <span class="modified-indicator">🔄</span>
                      {{ event.pendingModifications.link || 'Nessun link' }}
                    </span>
                  </div>
                  <div v-if="!hasModifications(event)" class="no-modifications">
                    <p>Nessuna modifica specifica richiesta</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="modification-meta">
              <div class="requester-info">
                <span class="requester-label">Richiesto da:</span>
                <span class="requester-name">{{ event.reporter?.username || event.reportedBy }}</span>
              </div>
              <div class="request-date">
                <span class="date-label">Data richiesta:</span>
                <span class="date-value">{{ formatDate(event.pendingModifications.requestedAt) }}</span>
              </div>
            </div>

            <div class="modification-actions">
              <button 
                @click="approveModification(event._id)"
                class="btn approve-btn"
                :disabled="processingModification === event._id"
              >
                {{ processingModification === event._id ? '⏳' : '✅' }} Approva Modifica
              </button>
              <button 
                @click="rejectModification(event._id)"
                class="btn reject-btn"
                :disabled="processingModification === event._id"
              >
                {{ processingModification === event._id ? '⏳' : '❌' }} Rifiuta Modifica
              </button>
            </div>
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

// Tab management
const activeTab = ref('events');

// Modifications data
const pendingModifications = ref([]);
const modificationStats = ref({ pending: 0, approved: 0, rejected: 0, total: 0 });
const modificationsLoading = ref(false);
const processingModification = ref(null);

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

const loadModifications = async () => {
  modificationsLoading.value = true;
  try {
    const response = await api.get('/events/pending-modifications');
    pendingModifications.value = response.data;
    
    // Calcola le statistiche delle modifiche
    modificationStats.value = {
      pending: response.data.length,
      approved: 0, // Per ora non tracciamo le approvate
      rejected: 0, // Per ora non tracciamo le rifiutate
      total: response.data.length
    };
  } catch (error) {
    console.error('Errore caricamento modifiche:', error);
    message.value = 'Errore nel caricamento delle modifiche';
    isError.value = true;
  } finally {
    modificationsLoading.value = false;
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

const approveModification = async (eventId) => {
  processingModification.value = eventId;
  try {
    await api.post(`/events/${eventId}/modification/approve`);
    message.value = 'Modifica approvata con successo!';
    isError.value = false;
    await loadModifications(); // Ricarica le modifiche
  } catch (error) {
    console.error('Errore approvazione modifica:', error);
    message.value = 'Errore durante l\'approvazione della modifica';
    isError.value = true;
  } finally {
    processingModification.value = null;
  }
};

const rejectModification = async (eventId) => {
  if (!confirm('Sei sicuro di voler rifiutare questa modifica?')) {
    return;
  }

  processingModification.value = eventId;
  try {
    await api.post(`/events/${eventId}/modification/reject`);
    message.value = 'Modifica rifiutata con successo!';
    isError.value = false;
    await loadModifications(); // Ricarica le modifiche
  } catch (error) {
    console.error('Errore rifiuto modifica:', error);
    message.value = 'Errore durante il rifiuto della modifica';
    isError.value = true;
  } finally {
    processingModification.value = null;
  }
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

const hasModifications = (event) => {
  return isFieldModified(event, 'name') || 
         isFieldModified(event, 'category') || 
         isFieldModified(event, 'date') || 
         isFieldModified(event, 'location') || 
         isFieldModified(event, 'link');
};

const isFieldModified = (event, fieldName) => {
  const mods = event.pendingModifications;
  const original = event;
  
  switch (fieldName) {
    case 'name':
      return mods.name && mods.name !== original.name;
    case 'category':
      return mods.category && mods.category !== original.category;
    case 'date':
      return mods.date && new Date(mods.date).getTime() !== new Date(original.date).getTime();
    case 'location':
      return mods.location && mods.location !== original.location;
    case 'link':
      return mods.link !== undefined && mods.link !== original.link;
    default:
      return false;
  }
};

onMounted(() => {
  loadEvents();
  loadModifications();
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

.tab-navigation {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.tab-btn.active {
  background: white;
  color: #667eea;
  border-color: white;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.3);
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

/* Stili per le modifiche */
.modifications-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.modification-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.modification-card:hover {
  transform: translateY(-2px);
}

.modification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.modification-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 700;
  flex: 1;
  margin-right: 1rem;
}

.modification-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fef3c7;
  color: #92400e;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.badge-icon {
  font-size: 1.1rem;
}

.modification-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.current-info,
.requested-info {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.current-info h4,
.requested-info h4 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.1rem;
  font-weight: 600;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.label {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.9rem;
  min-width: 80px;
}

.value {
  color: #374151;
  font-size: 0.9rem;
  text-align: right;
  flex: 1;
}

.value.new {
  color: #dc2626;
  font-weight: 600;
  background: #fef2f2;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #fecaca;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modified-indicator {
  font-size: 0.8rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.no-modifications {
  text-align: center;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  color: #6b7280;
  font-style: italic;
}

.modification-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #bae6fd;
}

.requester-info,
.request-date {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.requester-label,
.date-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 600;
}

.requester-name,
.date-value {
  font-size: 0.9rem;
  color: #1f2937;
  font-weight: 600;
}

.modification-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

@media (max-width: 768px) {
  .tab-navigation {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .tab-btn {
    width: 100%;
    max-width: 300px;
    text-align: center;
  }
  
  .modification-details {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .modification-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .modification-header h3 {
    margin-right: 0;
    font-size: 1.3rem;
  }
  
  .modification-badge {
    align-self: flex-start;
  }
  
  .modification-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .modification-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .modification-actions .btn {
    width: 100%;
    justify-content: center;
  }
  
  .current-info,
  .requested-info {
    padding: 1rem;
  }
  
  .current-info h4,
  .requested-info h4 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .info-item:last-child {
    border-bottom: none;
  }
  
  .label {
    min-width: auto;
    font-size: 0.85rem;
    font-weight: 700;
    color: #374151;
  }
  
  .value {
    text-align: left;
    font-size: 0.85rem;
    word-break: break-word;
    line-height: 1.4;
  }
  
  .value.new {
    padding: 0.5rem;
    font-size: 0.85rem;
  }
  
  .modified-indicator {
    font-size: 0.75rem;
  }
  
  .requester-label,
  .date-label {
    font-size: 0.75rem;
  }
  
  .requester-name,
  .date-value {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .modification-card {
    padding: 1rem;
    margin: 0 -0.5rem;
  }
  
  .modification-header h3 {
    font-size: 1.1rem;
    line-height: 1.3;
  }
  
  .modification-badge {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }
  
  .current-info,
  .requested-info {
    padding: 0.75rem;
  }
  
  .current-info h4,
  .requested-info h4 {
    font-size: 0.9rem;
  }
  
  .info-grid {
    gap: 0.5rem;
  }
  
  .label {
    font-size: 0.8rem;
  }
  
  .value {
    font-size: 0.8rem;
  }
  
  .value.new {
    padding: 0.4rem;
    font-size: 0.8rem;
  }
  
  .modification-meta {
    padding: 0.75rem;
  }
  
  .modification-actions .btn {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
}

/* Tablet styles */
@media (min-width: 769px) and (max-width: 1024px) {
  .modification-details {
    gap: 1.5rem;
  }
  
  .modification-header h3 {
    font-size: 1.4rem;
  }
  
  .current-info,
  .requested-info {
    padding: 1.25rem;
  }
  
  .modification-actions {
    gap: 0.75rem;
  }
  
  .modification-actions .btn {
    padding: 0.6rem 1.25rem;
    font-size: 0.9rem;
  }
}

/* Large screens optimization */
@media (min-width: 1200px) {
  .modification-details {
    gap: 2.5rem;
  }
  
  .modification-card {
    padding: 2.5rem;
  }
  
  .current-info,
  .requested-info {
    padding: 2rem;
  }
  
  .modification-actions {
    gap: 1.5rem;
  }
  
  .modification-actions .btn {
    padding: 1rem 2rem;
    font-size: 1rem;
  }
}
</style>
