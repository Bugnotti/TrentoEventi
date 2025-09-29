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

    </div>
    
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import auth from '../services/auth';

const user = ref(auth.getUser());
const loading = ref(false);
const message = ref('');
const isError = ref(false);
const showEditForm = ref(false);

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


onMounted(async () => {
  const refreshedUser = await auth.refreshUser();
  if (refreshedUser) {
    user.value = refreshedUser;
  }
  resetForm();
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

</style>