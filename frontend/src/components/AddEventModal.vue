<template>
  <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <button class="close" @click="$emit('close')">×</button>
      
      <div class="modal-header">
        <div class="illustration">🎉</div>
        <h3>Crea Evento</h3>
        <p>Aggiungi un nuovo evento alla piattaforma</p>
      </div>
      
      <template v-if="!user">
        <div class="login-prompt">
          <p>Per aggiungere eventi devi effettuare il login o registrarti.</p>
          <div class="actions">
            <router-link class="btn primary" to="/login">Login</router-link>
            <router-link class="btn success" to="/register">Registrati</router-link>
          </div>
        </div>
      </template>
      
      <template v-else>
        <form @submit.prevent="onSubmit" class="event-form">
          <div class="field">
            <label>Nome evento *</label>
            <input type="text" v-model="form.name" required placeholder="es. Concerto Jazz" />
          </div>
          
          <div class="field">
            <label>Categoria *</label>
            <select v-model="form.category" required>
              <option value="">Seleziona categoria</option>
              <option value="Musica">Musica</option>
              <option value="Sport">Sport</option>
              <option value="Cultura">Cultura</option>
              <option value="Shopping">Shopping</option>
              <option value="Gastronomia">Gastronomia</option>
              <option value="Cinema">Cinema</option>
              <option value="Cucina">Cucina</option>
              <option value="Fiere">Fiere</option>
              <option value="Intrattenimento">Intrattenimento</option>
              <option value="Mostre">Mostre</option>
              <option value="Formazione">Formazione</option>
              <option value="DJ set">DJ set</option>
              <option value="Nightlife">Nightlife</option>
              <option value="Discoteche">Discoteche</option>
            </select>
          </div>
          
          <div class="field">
            <label>Data e ora *</label>
            <input type="datetime-local" v-model="form.date" required />
          </div>
          
          <div class="field">
            <label>Luogo *</label>
            <input type="text" v-model="form.location" required placeholder="es. Piazza Duomo, Trento" />
          </div>
          
          <div class="field">
            <label>Link Instagram/Web dell'evento</label>
            <input type="url" v-model="form.link" placeholder="https://instagram.com/p/..." />
          </div>
          
          <div class="field info-field">
            <div class="info-box">
              <p><strong>Il tuo Instagram:</strong> {{ user?.instagram?.showProfile ? (user.instagram.username || 'Non impostato') : 'Nascosto' }}</p>
              <small>Per modificare le tue impostazioni Instagram, vai nel tuo profilo</small>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn secondary" @click="$emit('close')">
              Annulla
            </button>
            <button type="submit" class="btn primary" :disabled="loading">
              {{ loading ? 'Creazione...' : 'Crea Evento' }}
            </button>
          </div>
          
          <p v-if="error" class="error">{{ error }}</p>
        </form>
      </template>
    </div>
    
    <!-- Success Popup -->
    <SuccessPopup 
      :show="showSuccessPopup" 
      title="Evento creato con successo!"
      message="Il tuo evento è stato inviato per la revisione e sarà pubblicato presto."
      @close="handleSuccessClose" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import auth from '../services/auth';
import api from '../services/api';
import SuccessPopup from './SuccessPopup.vue';

const props = defineProps({ show: Boolean });
const emit = defineEmits(['close', 'event-created']);

const user = ref(auth.getUser());
const loading = ref(false);
const error = ref('');
const showSuccessPopup = ref(false);

const form = ref({
  name: '',
  category: '',
  date: '',
  location: '',
  link: ''
});

const handleAuthChange = () => { 
  user.value = auth.getUser(); 
};

const onSubmit = async () => {
  error.value = '';
  loading.value = true;
  
  try {
    const eventData = {
      ...form.value,
      date: new Date(form.value.date).toISOString(),
      reportedBy: user.value?.username || 'Anonimo',
      reporterInstagram: (user.value?.instagram?.showProfile && user.value?.instagram?.username) 
        ? user.value.instagram.username 
        : null,
      reporter: user.value?.id || null, // Aggiungi riferimento all'utente
      approved: "pending" // Eventi nuovi vanno in pending per revisione
    };
    
    await api.post('/events', eventData);
    form.value = { name: '', category: '', date: '', location: '', link: '' };
    
    // Mostra il popup di successo
    showSuccessPopup.value = true;
    
  } catch (e) {
    console.error('Errore creazione evento:', e);
    error.value = 'Errore nella creazione dell\'evento. Riprova più tardi.';
  } finally {
    loading.value = false;
  }
};

const handleSuccessClose = () => {
  showSuccessPopup.value = false;
  emit('event-created');
  emit('close');
};

onMounted(() => window.addEventListener('auth-changed', handleAuthChange));
onBeforeUnmount(() => window.removeEventListener('auth-changed', handleAuthChange));
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  position: relative;
  width: 100%;
  max-width: 600px;
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  overflow-y: auto;
}

.close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  border: none;
  background: transparent;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close:hover {
  background: #f3f4f6;
}

.modal-header {
  text-align: center;
  margin-bottom: 2rem;
}

.illustration {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.modal-header h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.5rem;
}

.modal-header p {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

.login-prompt {
  text-align: center;
  padding: 2rem 0;
}

.login-prompt p {
  margin: 0 0 1.5rem 0;
  color: #6b7280;
  font-size: 1.1rem;
}

.event-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.field input,
.field select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field input:focus,
.field select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.help-text {
  color: #6b7280;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.info-field {
  margin: 1rem 0;
}

.info-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
}

.info-box p {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.info-box small {
  color: #6b7280;
  font-size: 0.8rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
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

.btn.success {
  background: #16a34a;
  color: white;
  border: 1px solid #16a34a;
}

.btn.success:hover {
  background: #15803d;
  border-color: #15803d;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #dc2626;
  margin-top: 0.5rem;
  text-align: center;
  font-size: 0.9rem;
  padding: 0.5rem;
  background: #fef2f2;
  border-radius: 6px;
  border: 1px solid #fecaca;
}


@media (max-width: 768px) {
  .modal {
    margin: 1rem;
    padding: 1.5rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>