<template>
  <div class="my-events-page">
    <div class="container">
      <div class="page-header">
        <h1>I Tuoi Eventi</h1>
        <p>Gestisci gli eventi che hai segnalato</p>
      </div>
      
      <div v-if="userEventsLoading" class="loading">
        <p>Caricamento eventi...</p>
      </div>
      
      <div v-else-if="userEvents.length === 0" class="no-events">
        <div class="no-events-icon">📅</div>
        <h3>Nessun evento segnalato</h3>
        <p>Non hai ancora segnalato nessun evento. Vai alla home page per aggiungere il tuo primo evento!</p>
        <router-link to="/" class="btn primary">
          🏠 Vai alla Home
        </router-link>
      </div>
      
      <div v-else class="events-grid">
        <div 
          v-for="event in userEvents" 
          :key="event._id" 
          class="user-event-card"
          :class="{ 'pending': event.approved === 'pending', 'approved': event.approved === 'approved', 'rejected': event.approved === 'rejected' }"
        >
          <div class="event-header">
            <h3>{{ event.name }}</h3>
            <div class="event-status">
              <span v-if="event.approved === 'pending'" class="status-badge pending">
                ⏳ In attesa
              </span>
              <span v-else-if="event.approved === 'approved'" class="status-badge approved">
                ✅ Approvato
              </span>
              <span v-else-if="event.approved === 'rejected'" class="status-badge rejected">
                ❌ Rifiutato
              </span>
            </div>
          </div>
          
          <div class="event-details">
            <p class="event-date">📅 {{ formatDate(event.date) }}</p>
            <p class="event-location">📍 {{ event.location }}</p>
            <p class="event-category">🏷️ {{ event.category }}</p>
            <p v-if="event.link" class="event-link">
              🔗 <a :href="event.link" target="_blank">Vedi su Instagram</a>
            </p>
          </div>
          
          <div class="event-actions">
            <button 
              v-if="event.approved === 'pending'" 
              @click="editEvent(event)"
              class="btn edit-btn"
            >
              ✏️ Modifica
            </button>
            <button 
              v-else-if="event.approved === 'approved' && !event.hasPendingModifications" 
              @click="requestModification(event)"
              class="btn modify-btn"
            >
              🔄 Richiedi Modifica
            </button>
            <span v-else-if="event.approved === 'approved' && event.hasPendingModifications" class="action-disabled">
              ⏳ Modifica in attesa di approvazione
            </span>
            <span v-else class="action-disabled">
              Evento rifiutato
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Edit Event Modal -->
    <EditEventModal 
      :show="showEditEventModal" 
      :event="selectedEvent"
      @close="showEditEventModal = false" 
      @event-updated="refreshUserEvents" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import EditEventModal from '../components/EditEventModal.vue';

const userEvents = ref([]);
const userEventsLoading = ref(false);
const showEditEventModal = ref(false);
const selectedEvent = ref(null);

// Funzione per caricare gli eventi dell'utente
const loadUserEvents = async () => {
  try {
    userEventsLoading.value = true;
    const response = await api.get('/events/my-events');
    userEvents.value = response.data;
  } catch (error) {
    console.error('Errore caricamento eventi utente:', error);
    userEvents.value = [];
  } finally {
    userEventsLoading.value = false;
  }
};

// Funzione per aggiornare gli eventi dell'utente
const refreshUserEvents = async () => {
  await loadUserEvents();
};

// Funzione per formattare la data
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

// Funzione per aprire il modal di modifica evento
const editEvent = (event) => {
  selectedEvent.value = event;
  showEditEventModal.value = true;
};

// Funzione per richiedere modifica di un evento approvato
const requestModification = (event) => {
  selectedEvent.value = event;
  showEditEventModal.value = true;
};

onMounted(async () => {
  await loadUserEvents();
});
</script>

<style scoped>
.my-events-page {
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
  margin-bottom: 3rem;
  color: white;
}

.page-header h1 {
  margin: 0 0 1rem 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.page-header p {
  margin: 0;
  font-size: 1.2rem;
  opacity: 0.9;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: white;
  font-size: 1.1rem;
}

.no-events {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  margin: 0 auto;
  max-width: 500px;
}

.no-events-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
}

.no-events h3 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.8rem;
}

.no-events p {
  margin: 0 0 2rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: #6b7280;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.user-event-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.user-event-card.pending {
  border-color: #f59e0b;
  background: #fefbf3;
}

.user-event-card.approved {
  border-color: #10b981;
  background: #f0fdf4;
}

.user-event-card.rejected {
  border-color: #ef4444;
  background: #fef2f2;
}

.user-event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.event-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.2rem;
  font-weight: 600;
  flex: 1;
  margin-right: 1rem;
}

.event-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.approved {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.event-details {
  margin-bottom: 1rem;
}

.event-details p {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 0.9rem;
}

.event-details p:last-child {
  margin-bottom: 0;
}

.event-link a {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.event-link a:hover {
  text-decoration: underline;
}

.event-actions {
  text-align: center;
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
  text-decoration: none;
  display: inline-block;
}

.btn.primary {
  background: #2563eb;
  color: white;
}

.btn.primary:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.edit-btn {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.edit-btn:hover {
  background: #d97706;
  transform: translateY(-1px);
}

.modify-btn {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.modify-btn:hover {
  background: #7c3aed;
  transform: translateY(-1px);
}

.action-disabled {
  color: #6b7280;
  font-size: 0.9rem;
  font-style: italic;
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 2rem;
  }
  
  .page-header p {
    font-size: 1rem;
  }
  
  .events-grid {
    grid-template-columns: 1fr;
  }
  
  .event-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .event-header h3 {
    margin-right: 0;
    margin-bottom: 0.5rem;
  }
}
</style>

