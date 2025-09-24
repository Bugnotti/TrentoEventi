<template>
  <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <button class="close" @click="$emit('close')">×</button>
      
      
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Caricamento profilo...</p>
        <p style="font-size: 0.8rem; color: #666;">Username: {{ username }}</p>
        <p style="font-size: 0.8rem; color: #666;">Show: {{ show }}</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h4>Errore</h4>
        <p>{{ error }}</p>
        <button @click="loadUserProfile" class="btn retry-btn">Riprova</button>
      </div>
      
      <div v-else-if="userProfile" class="profile-content">
        <div class="profile-avatar">
          <div class="avatar-icon">👤</div>
        </div>
        
        <div class="profile-info">
          <h4 class="username">{{ userProfile.username }}</h4>
          
          <div class="user-details">
            <div class="detail-item">
              <span class="label">Nome:</span>
              <span class="value">{{ userProfile.firstName || 'Non specificato' }} {{ userProfile.lastName || '' }}</span>
            </div>
            
            <div class="detail-item">
              <span class="label">Ruolo:</span>
              <span class="value role-badge" :class="userProfile.role">
                {{ getRoleLabel(userProfile.role) }}
              </span>
            </div>
            
            <div class="detail-item">
              <span class="label">Punti:</span>
              <span class="value points">{{ userProfile.points || 0 }} 🏆</span>
            </div>
            
            <div class="detail-item" v-if="userProfile.instagram?.showProfile && userProfile.instagram?.username">
              <span class="label">Instagram:</span>
              <a :href="`https://instagram.com/${userProfile.instagram.username}`" target="_blank" class="instagram-link">
                📷 @{{ userProfile.instagram.username }}
              </a>
            </div>
            
            <div class="detail-item">
              <span class="label">Membro dal:</span>
              <span class="value">{{ formatDate(userProfile.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import api from '../services/api';

const props = defineProps({ 
  show: Boolean,
  username: String
});

const emit = defineEmits(['close']);

// Debug per vedere se le props arrivano
console.log('UserProfileModal props:', props.show, props.username);

const userProfile = ref(null);
const loading = ref(false);
const error = ref('');

const loadUserProfile = async () => {
  console.log('loadUserProfile chiamato con username:', props.username);
  
  if (!props.username || props.username === 'Anonimo') {
    error.value = 'Profilo non disponibile per utenti anonimi';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    console.log('Faccio chiamata API a:', `/auth/profile/${props.username}`);
    console.log('Token attuale:', localStorage.getItem('te_token'));
    const response = await api.get(`/auth/profile/${props.username}`);
    console.log('Risposta API:', response.data);
    userProfile.value = response.data.user;
    console.log('UserProfile impostato:', userProfile.value);
  } catch (e) {
    console.error('Errore caricamento profilo:', e);
    console.error('Status:', e.response?.status);
    console.error('Dettagli errore:', e.response?.data);
    console.error('Headers:', e.response?.headers);
    error.value = `Errore nel caricamento del profilo utente: ${e.response?.data?.error || e.message}`;
  } finally {
    loading.value = false;
  }
};

const getRoleLabel = (role) => {
  const roleLabels = {
    'user': 'Utente',
    'reviewer': 'Revisore',
    'admin': 'Amministratore'
  };
  return roleLabels[role] || 'Utente';
};

const formatDate = (dateString) => {
  if (!dateString) return 'Non disponibile';
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Watch per caricare il profilo quando il modal si apre
watch(() => props.show, (newShow) => {
  console.log('Watch show triggered:', newShow, 'username:', props.username);
  if (newShow && props.username) {
    loadUserProfile();
  }
});

// Watch per ricaricare quando cambia l'username
watch(() => props.username, (newUsername) => {
  console.log('Watch username triggered:', newUsername, 'show:', props.show);
  if (props.show && newUsername) {
    loadUserProfile();
  }
});
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
  max-width: 500px;
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


.loading-state, .error-state {
  text-align: center;
  padding: 2rem 0;
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

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-state h4 {
  margin: 0 0 0.5rem 0;
  color: #dc2626;
  font-size: 1.25rem;
}

.error-state p {
  margin: 0 0 1.5rem 0;
  color: #6b7280;
}

.retry-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #1d4ed8;
}

.profile-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-top: 1rem;
}

.profile-avatar {
  margin-bottom: 1.5rem;
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

.profile-info {
  width: 100%;
}

.username {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 700;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.value {
  color: #1f2937;
  font-size: 0.9rem;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.role-badge.user {
  background: #dbeafe;
  color: #1e40af;
}

.role-badge.reviewer {
  background: #f3e8ff;
  color: #7c3aed;
}

.role-badge.admin {
  background: #fef3c7;
  color: #d97706;
}

.points {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.8rem;
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

@media (max-width: 768px) {
  .modal {
    margin: 1rem;
    padding: 1.5rem;
  }
  
  .detail-item {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  .label {
    font-size: 0.8rem;
  }
  
  .value {
    font-size: 0.85rem;
  }
}
</style>
