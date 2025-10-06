<template>
  <div class="admin-modifications">
    <div class="page-header">
      <h1>🔄 Gestione Modifiche Eventi</h1>
      <p>Approva o rifiuta le richieste di modifica degli eventi pubblicati (Admin & Reviewer)</p>
    </div>

    <div v-if="loading" class="loading">
      <div class="loading-spinner">⏳</div>
      <p>Caricamento modifiche in attesa...</p>
    </div>

    <div v-else-if="pendingModifications.length === 0" class="no-modifications">
      <div class="no-modifications-icon">✅</div>
      <h3>Nessuna modifica in attesa</h3>
      <p>Tutte le richieste di modifica sono state gestite!</p>
    </div>

    <div v-else class="modifications-grid">
      <div 
        v-for="event in pendingModifications" 
        :key="event._id" 
        class="modification-card"
      >
        <div class="event-header">
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
              <div class="info-item">
                <span class="label">Nome:</span>
                <span class="value new">{{ event.pendingModifications.name || event.name }}</span>
              </div>
              <div class="info-item">
                <span class="label">Categoria:</span>
                <span class="value new">{{ event.pendingModifications.category || event.category }}</span>
              </div>
              <div class="info-item">
                <span class="label">Data:</span>
                <span class="value new">{{ formatDate(event.pendingModifications.date || event.date) }}</span>
              </div>
              <div class="info-item">
                <span class="label">Luogo:</span>
                <span class="value new">{{ event.pendingModifications.location || event.location }}</span>
              </div>
              <div class="info-item">
                <span class="label">Link:</span>
                <span class="value new">{{ event.pendingModifications.link !== undefined ? event.pendingModifications.link : (event.link || 'Nessun link') }}</span>
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
            :disabled="processing"
          >
            ✅ Approva Modifica
          </button>
          <button 
            @click="rejectModification(event._id)"
            class="btn reject-btn"
            :disabled="processing"
          >
            ❌ Rifiuta Modifica
          </button>
        </div>
      </div>
    </div>

    <!-- Success Popup -->
    <SuccessPopup 
      :show="showSuccessPopup" 
      :title="successTitle"
      :message="successMessage"
      @close="handleSuccessClose" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import auth from '../services/auth';
import SuccessPopup from '../components/SuccessPopup.vue';

const router = useRouter();
const loading = ref(false);
const processing = ref(false);
const pendingModifications = ref([]);
const showSuccessPopup = ref(false);
const successTitle = ref('');
const successMessage = ref('');

// Verifica che l'utente sia admin o reviewer
const checkAdminAccess = () => {
  const user = auth.getUser();
  if (!user) {
    router.push('/login');
    return false;
  }
  if (user.role !== 'admin' && user.role !== 'reviewer') {
    alert('Accesso negato. Solo gli amministratori e i reviewer possono accedere a questa pagina.');
    router.push('/');
    return false;
  }
  return true;
};

// Carica le modifiche in attesa
const loadPendingModifications = async () => {
  try {
    loading.value = true;
    const response = await api.get('/events/pending-modifications');
    pendingModifications.value = response.data;
  } catch (error) {
    console.error('Errore caricamento modifiche in attesa:', error);
    if (error.response?.status === 403) {
      alert('Accesso negato. Verifica di essere loggato come amministratore.');
      router.push('/login');
    } else {
      alert('Errore nel caricamento delle modifiche in attesa.');
    }
  } finally {
    loading.value = false;
  }
};

// Approva una modifica
const approveModification = async (eventId) => {
  try {
    processing.value = true;
    await api.post(`/events/${eventId}/modification/approve`);
    
    successTitle.value = 'Modifica Approvata!';
    successMessage.value = 'La modifica è stata applicata con successo all\'evento.';
    showSuccessPopup.value = true;
    
    // Ricarica le modifiche in attesa
    await loadPendingModifications();
  } catch (error) {
    console.error('Errore approvazione modifica:', error);
    alert('Errore nell\'approvazione della modifica. Riprova più tardi.');
  } finally {
    processing.value = false;
  }
};

// Rifiuta una modifica
const rejectModification = async (eventId) => {
  if (!confirm('Sei sicuro di voler rifiutare questa modifica?')) {
    return;
  }

  try {
    processing.value = true;
    await api.post(`/events/${eventId}/modification/reject`);
    
    successTitle.value = 'Modifica Rifiutata';
    successMessage.value = 'La richiesta di modifica è stata rifiutata.';
    showSuccessPopup.value = true;
    
    // Ricarica le modifiche in attesa
    await loadPendingModifications();
  } catch (error) {
    console.error('Errore rifiuto modifica:', error);
    alert('Errore nel rifiuto della modifica. Riprova più tardi.');
  } finally {
    processing.value = false;
  }
};

// Formatta le date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Gestisce la chiusura del popup di successo
const handleSuccessClose = () => {
  showSuccessPopup.value = false;
};

onMounted(async () => {
  if (!checkAdminAccess()) return;
  await loadPendingModifications();
});
</script>

<style scoped>
.admin-modifications {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 0;
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

.loading-spinner {
  font-size: 3rem;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.no-modifications {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  margin: 0 auto;
  max-width: 500px;
}

.no-modifications-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
}

.no-modifications h3 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.8rem;
}

.no-modifications p {
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: #6b7280;
}

.modifications-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
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

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.event-header h3 {
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
  color: #059669;
  font-weight: 600;
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

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.9rem;
  min-width: 150px;
}

.approve-btn {
  background: #10b981;
  color: white;
}

.approve-btn:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
}

.reject-btn {
  background: #ef4444;
  color: white;
}

.reject-btn:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 2rem;
  }
  
  .page-header p {
    font-size: 1rem;
  }
  
  .modifications-grid {
    grid-template-columns: 1fr;
    padding: 0 0.5rem;
  }
  
  .modification-details {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .event-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .modification-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .modification-actions {
    flex-direction: column;
  }
  
  .btn {
    min-width: auto;
  }
}
</style>
