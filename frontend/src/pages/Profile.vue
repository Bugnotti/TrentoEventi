<template>
  <div class="profile-page">
    <div class="container">
      <div class="profile-header">
        <div class="avatar">
          <div class="avatar-icon">👤</div>
        </div>
        <div class="user-info">
          <h1>{{ user?.username || 'Utente' }}</h1>
          <div class="user-details">
            <div class="detail-item">
              <span class="label">Nome:</span>
              <span class="value">{{ user?.firstName || 'Non specificato' }} {{ user?.lastName || '' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Eventi segnalati:</span>
              <span class="value events-count" :class="{ 'events-updated': eventsUpdated }">
                {{ eventsCount }} 📅
              </span>
            </div>
            <div class="detail-item" v-if="user?.instagram?.showProfile && user?.instagram?.username">
              <span class="label">Instagram:</span>
              <a :href="`https://instagram.com/${user.instagram.username}`" target="_blank" class="instagram-link">
                📷 @{{ user.instagram.username }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="profile-actions">
        <button @click="toggleEditForm" class="btn edit-btn">
          {{ showEditForm ? 'Annulla' : 'Modifica Profilo' }}
        </button>
      </div>

      <div v-if="showEditForm" class="edit-form-container">
        <h2>Modifica Profilo</h2>
        <form @submit.prevent="updateProfile" class="edit-form">
          <div class="form-group">
            <label for="firstName">Nome</label>
            <input 
              type="text" 
              id="firstName" 
              v-model="editForm.firstName" 
              placeholder="Il tuo nome"
            />
          </div>
          
          <div class="form-group">
            <label for="lastName">Cognome</label>
            <input 
              type="text" 
              id="lastName" 
              v-model="editForm.lastName" 
              placeholder="Il tuo cognome"
            />
          </div>
          
          <div class="form-group">
            <label class="checkbox-label" @click="toggleInstagram">
              <span class="checkmark" :class="{ 'checked': editForm.showInstagram }"></span>
              Mostra il mio profilo Instagram
            </label>
          </div>
          
          <div v-if="editForm.showInstagram" class="form-group">
            <label for="instagramUsername">Username Instagram</label>
            <input 
              type="text" 
              id="instagramUsername" 
              v-model="editForm.instagramUsername" 
              placeholder=""
            />
          </div>
          
          <div class="form-actions">
            <button type="button" @click="resetForm" class="btn secondary">
              Reset
            </button>
            <button type="submit" class="btn primary" :disabled="loading">
              {{ loading ? 'Salvataggio...' : 'Salva Modifiche' }}
            </button>
          </div>
          
          <div v-if="message" class="message" :class="{ 'error': isError }">
            {{ message }}
          </div>
        </form>
      </div>

      <!-- Sezione Eventi dell'Utente -->
      <div class="user-events-section">
        <div class="section-header">
          <h2>I Tuoi Eventi</h2>
          <p>Gestisci gli eventi che hai segnalato</p>
        </div>
        
        <div v-if="userEventsLoading" class="loading">
          <p>Caricamento eventi...</p>
        </div>
        
        <div v-else-if="userEvents.length === 0" class="no-events">
          <div class="no-events-icon">📅</div>
          <h3>Nessun evento segnalato</h3>
          <p>Non hai ancora segnalato nessun evento. Vai alla home page per aggiungere il tuo primo evento!</p>
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
              <span v-else class="action-disabled">
                {{ event.approved === 'approved' ? 'Evento pubblicato' : 'Evento rifiutato' }}
              </span>
            </div>
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
import { ref, onMounted, onBeforeUnmount } from 'vue';
import auth from '../services/auth';
import api from '../services/api';
import EditEventModal from '../components/EditEventModal.vue';

const user = ref(auth.getUser());
const loading = ref(false);
const message = ref('');
const isError = ref(false);
const showEditForm = ref(false);
const eventsUpdated = ref(false);
const eventsCount = ref(0);

// Nuove variabili per la gestione eventi
const userEvents = ref([]);
const userEventsLoading = ref(false);
const showEditEventModal = ref(false);
const selectedEvent = ref(null);

const editForm = ref({
  firstName: '',
  lastName: '',
  showInstagram: false,
  instagramUsername: ''
});

const resetForm = () => {
  editForm.value = {
    firstName: user.value?.firstName || '',
    lastName: user.value?.lastName || '',
    showInstagram: user.value?.instagram?.showProfile || false,
    instagramUsername: user.value?.instagram?.username || ''
  };
  message.value = '';
};

const toggleEditForm = () => {
  showEditForm.value = !showEditForm.value;
  if (showEditForm.value) {
    resetForm();
  }
};

const toggleInstagram = () => {
  editForm.value.showInstagram = !editForm.value.showInstagram;
  if (!editForm.value.showInstagram) {
    editForm.value.instagramUsername = '';
  }
};

const updateProfile = async () => {
  loading.value = true;
  message.value = '';
  isError.value = false;
  
  try {
    const instagramData = editForm.value.showInstagram ? {
      showProfile: true,
      username: editForm.value.instagramUsername
    } : { showProfile: false, username: '' };
    
    await auth.updateProfile({
      firstName: editForm.value.firstName,
      lastName: editForm.value.lastName,
      instagram: instagramData
    });
    
    message.value = 'Profilo aggiornato con successo!';
    isError.value = false;
    
    // Aggiorna i dati locali
    const refreshedUser = await auth.refreshUser();
    if (refreshedUser) {
      user.value = refreshedUser;
    }
    
    // Riconta gli eventi dopo l'aggiornamento
    await countUserEvents();
    
    // Chiudi il form dopo 2 secondi
    setTimeout(() => {
      showEditForm.value = false;
    }, 2000);
    
  } catch (error) {
    console.error('Errore aggiornamento profilo:', error);
    message.value = 'Errore durante l\'aggiornamento del profilo';
    isError.value = true;
  } finally {
    loading.value = false;
  }
};

// Funzione per contare gli eventi dell'utente
const countUserEvents = async () => {
  try {
    if (!user.value?.username) return;
    
    const response = await api.get('/events');
    const allEvents = response.data;
    
    // Conta gli eventi segnalati dall'utente corrente
    const userEvents = allEvents.filter(event => 
      event.reportedBy === user.value.username
    );
    
    const oldCount = eventsCount.value;
    eventsCount.value = userEvents.length;
    
    // Mostra animazione se il numero di eventi è aumentato
    if (eventsCount.value > oldCount && oldCount > 0) {
      eventsUpdated.value = true;
      setTimeout(() => {
        eventsUpdated.value = false;
      }, 2000);
    }
  } catch (error) {
    console.error('Errore conteggio eventi:', error);
  }
};

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
  await countUserEvents();
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

onMounted(async () => {
  const refreshedUser = await auth.refreshUser();
  if (refreshedUser) {
    user.value = refreshedUser;
  }
  resetForm();
  
  // Carica gli eventi dell'utente
  await loadUserEvents();
  
  // Conta gli eventi dell'utente
  await countUserEvents();
  
  // Aggiorna il conteggio eventi ogni 30 secondi
  const eventsInterval = setInterval(countUserEvents, 30000);
  
  // Pulisci l'intervallo quando il componente viene smontato
  onBeforeUnmount(() => {
    clearInterval(eventsInterval);
  });
});
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

.profile-header {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.avatar {
  flex-shrink: 0;
}

.avatar-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
}

.user-info h1 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 2rem;
  font-weight: 700;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.label {
  font-weight: 600;
  color: #6b7280;
  min-width: 80px;
}

.value {
  color: #1f2937;
}

.events-count {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.events-updated {
  animation: eventsPulse 2s ease-in-out;
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
}

@keyframes eventsPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(59, 130, 246, 0.6);
  }
  50% {
    transform: scale(1.15);
    box-shadow: 0 0 25px rgba(59, 130, 246, 0.8);
  }
  100% {
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
  }
}

.instagram-link {
  color: #e1306c;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.instagram-link:hover {
  color: #c13584;
}

.profile-actions {
  text-align: center;
  margin-bottom: 2rem;
}

.edit-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #1d4ed8;
  transform: translateY(-2px);
}

.edit-form-container {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.edit-form-container h2 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.5rem;
  text-align: center;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.form-group input {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: 600;
  color: #374151;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.checkmark.checked {
  background: #2563eb;
  border-color: #2563eb;
}

.checkmark.checked::after {
  content: '✓';
  color: white;
  font-weight: bold;
  font-size: 12px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
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

.btn.primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn.secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn.secondary:hover {
  background: #e5e7eb;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message {
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  margin-top: 1rem;
}

.message:not(.error) {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.message.error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
  }
  
  .user-details {
    align-items: center;
  }
  
  .detail-item {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .label {
    min-width: auto;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}

/* Stili per la sezione eventi utente */
.user-events-section {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.section-header {
  text-align: center;
  margin-bottom: 2rem;
}

.section-header h2 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.8rem;
  font-weight: 700;
}

.section-header p {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.no-events {
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
}

.no-events-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.no-events h3 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.5rem;
}

.no-events p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.user-event-card {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
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

.action-disabled {
  color: #6b7280;
  font-size: 0.9rem;
  font-style: italic;
}

@media (max-width: 768px) {
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