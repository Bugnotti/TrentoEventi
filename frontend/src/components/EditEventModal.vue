<template>
  <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <button class="close" @click="$emit('close')">×</button>
      
      <div class="modal-header">
        <div class="illustration">✏️</div>
        <h3>Modifica Evento</h3>
        <p>Aggiorna le informazioni del tuo evento</p>
      </div>
      
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
        
        <div class="status-info">
          <div class="status-badge pending">
            <span class="status-icon">⏳</span>
            <span>In attesa di approvazione</span>
          </div>
          <small>Puoi modificare questo evento solo finché è in attesa di approvazione</small>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn secondary" @click="$emit('close')">
            Annulla
          </button>
          <button type="submit" class="btn primary" :disabled="loading">
            {{ loading ? 'Salvataggio...' : 'Salva Modifiche' }}
          </button>
        </div>
        
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
    
    <!-- Success Popup -->
    <SuccessPopup 
      :show="showSuccessPopup" 
      title="Evento aggiornato con successo!"
      message="Le modifiche al tuo evento sono state salvate."
      @close="handleSuccessClose" 
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import api from '../services/api';
import SuccessPopup from './SuccessPopup.vue';

const props = defineProps({ 
  show: Boolean,
  event: Object
});

const emit = defineEmits(['close', 'event-updated']);

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

// Aggiorna il form quando cambia l'evento prop
watch(() => props.event, (newEvent) => {
  if (newEvent) {
    form.value = {
      name: newEvent.name || '',
      category: newEvent.category || '',
      date: newEvent.date ? new Date(newEvent.date).toISOString().slice(0, 16) : '',
      location: newEvent.location || '',
      link: newEvent.link || ''
    };
  }
}, { immediate: true });

const onSubmit = async () => {
  error.value = '';
  loading.value = true;
  
  try {
    const eventData = {
      ...form.value,
      date: new Date(form.value.date).toISOString()
    };
    
    await api.put(`/events/${props.event._id}`, eventData);
    
    // Mostra il popup di successo
    showSuccessPopup.value = true;
    
  } catch (e) {
    console.error('Errore aggiornamento evento:', e);
    if (e.response?.data?.error) {
      error.value = e.response.data.error;
    } else {
      error.value = 'Errore nell\'aggiornamento dell\'evento. Riprova più tardi.';
    }
  } finally {
    loading.value = false;
  }
};

const handleSuccessClose = () => {
  showSuccessPopup.value = false;
  emit('event-updated');
  emit('close');
};
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

.status-info {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.status-badge.pending {
  color: #92400e;
}

.status-icon {
  font-size: 1.2rem;
}

.status-info small {
  color: #92400e;
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