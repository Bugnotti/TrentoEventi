<template>
  <div class="leaderboard-page">
    <div class="container">
      <!-- Header Section -->
      <div class="page-header">
        <button class="back-btn" @click="goBack" aria-label="Torna indietro">←</button>
        <div class="header-content">
          <h1>🏆 Classifica Top 10</h1>
          <p class="subtitle">I contributori più attivi della community di Trento</p>
        </div>
      </div>

      <!-- Leaderboard Content -->
      <div class="leaderboard-content">
        <div v-if="loading" class="loading-section">
          <div class="loading-spinner"></div>
          <p>Caricamento classifica...</p>
        </div>
        
        <div v-else-if="error" class="error-section">
          <div class="error-icon">❌</div>
          <h3>Errore nel caricamento</h3>
          <p>Non è stato possibile caricare la classifica. Riprova più tardi.</p>
          <button class="btn primary" @click="loadLeaderboard">Riprova</button>
        </div>
        
        <div v-else-if="leaderboard.length === 0" class="no-data-section">
          <div class="no-data-icon">📊</div>
          <h3>Nessuna classifica disponibile</h3>
          <p>Non ci sono ancora abbastanza eventi per creare una classifica.</p>
        </div>
        
        <div v-else class="leaderboard-container">
          <!-- Lista unificata per tutti i classificati -->
          <div class="ranking-section">
            <h2>📋 Classifica Completa</h2>
            <div class="leaderboard-list">
              <div 
                v-for="(user, index) in leaderboard" 
                :key="user._id"
                class="leaderboard-item"
                :class="{ 'current-user': isCurrentUser(user.username) }"
              >
                <div class="position">
                  <span class="position-number">{{ index + 1 }}°</span>
                  <span v-if="index < 3" class="medal">{{ getMedal(index) }}</span>
                </div>
                <div class="user-avatar">
                  {{ getInitials(user.username) }}
                </div>
                <div class="user-details">
                  <h4>
                    <a 
                      v-if="user.instagram?.showProfile && user.instagram?.username"
                      :href="getInstagramUrl(user.instagram.username)"
                      target="_blank"
                      class="username-link instagram-link"
                      :title="'Clicca per vedere il profilo Instagram di ' + user.username"
                    >
                      {{ user.username }}
                      <span class="instagram-indicator">📷</span>
                    </a>
                    <span v-else class="username-text">{{ user.username }}</span>
                  </h4>
                  <div class="stats">
                    <span class="stat approved">✅ {{ user.approvedCount }} approvati</span>
                  </div>
                </div>
                <div class="total-events">
                  <span class="event-count">{{ user.eventCount }}</span>
                  <span class="event-label">eventi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Call to Action -->
      <div class="cta-section">
        <div class="cta-card">
          <div class="cta-icon">🎯</div>
          <h3>Vuoi entrare in classifica?</h3>
          <p>Segnala eventi interessanti e contribuisci alla community di Trento!</p>
          <router-link to="/" class="btn cta-btn">
            <span class="icon">＋</span>
            Segnala un Evento
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import auth from '../services/auth';

const router = useRouter();
const leaderboard = ref([]);
const loading = ref(false);
const error = ref(false);

const loadLeaderboard = async () => {
  try {
    loading.value = true;
    error.value = false;
    const response = await api.get('/events/leaderboard');
    leaderboard.value = response.data;
  } catch (err) {
    console.error('Errore caricamento leaderboard:', err);
    error.value = true;
  } finally {
    loading.value = false;
  }
};

const getInitials = (username) => {
  if (!username) return '?';
  const words = username.split('_');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return username.substring(0, 2).toUpperCase();
};

const getInstagramUrl = (instagramUsername) => {
  if (!instagramUsername) return '#';
  // Rimuovi @ se presente e crea l'URL Instagram
  const cleanUsername = instagramUsername.replace('@', '');
  return `https://www.instagram.com/${cleanUsername}/`;
};

const getMedal = (index) => {
  const medals = ['🥇', '🥈', '🥉'];
  return medals[index] || '';
};

const isCurrentUser = (username) => {
  const currentUser = auth.getUser();
  return currentUser && currentUser.username === username;
};

const goBack = () => router.back();


onMounted(() => {
  loadLeaderboard();
});
</script>

<style scoped>
.leaderboard-page {
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
  position: relative;
  text-align: center;
  margin-bottom: 3rem;
}

.back-btn {
  position: absolute;
  top: 0;
  left: 0;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.4rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(-2px);
}

.header-content h1 {
  margin: 0 0 0.5rem 0;
  color: white;
  font-size: 3rem;
  font-weight: 700;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.subtitle {
  margin: 0 0 2rem 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.2rem;
  font-weight: 500;
}


.leaderboard-content {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.loading-section, .error-section, .no-data-section {
  text-align: center;
  padding: 4rem 2rem;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon, .no-data-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-section h3, .no-data-section h3 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.5rem;
}

.error-section p, .no-data-section p {
  margin: 0 0 2rem 0;
  color: #6b7280;
  font-size: 1rem;
}

.ranking-section {
  margin-bottom: 3rem;
}

.ranking-section h2 {
  margin: 0 0 2rem 0;
  color: #1f2937;
  font-size: 1.8rem;
  font-weight: 700;
  text-align: center;
}

/* Lista classifica */
.leaderboard-list {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1rem;
  display: grid;
  gap: 0.75rem;
}

.leaderboard-item {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  padding: 1rem;
  border-radius: 10px;
  transition: all 0.2s;
  border: 2px solid transparent;
  background: white;
  gap: 1rem;
}

.leaderboard-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.leaderboard-item.current-user {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-color: #3b82f6;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.2);
}

.position {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 60px;
}

.position-number {
  font-weight: 700;
  color: #6b7280;
  font-size: 1.1rem;
}

.medal {
  font-size: 1.2rem;
  animation: bounce 2s infinite;
}

.user-avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
}

.user-details {
  min-width: 0; /* Permette al testo di essere troncato se necessario */
}

.user-details h4 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.1rem;
  font-weight: 600;
  word-break: break-word;
}

.leaderboard-item.current-user .user-details h4 {
  color: #1d4ed8;
}

.user-details .username-link {
  color: #2563eb;
  text-decoration: none;
  transition: all 0.2s;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  background: rgba(37, 99, 235, 0.05);
  border: 1px solid rgba(37, 99, 235, 0.2);
  cursor: pointer;
}

.user-details .username-link:hover {
  color: #e1306c;
  text-decoration: none;
  background: rgba(225, 48, 108, 0.05);
  border-color: rgba(225, 48, 108, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(225, 48, 108, 0.2);
}

.instagram-indicator {
  font-size: 0.8rem;
  opacity: 0.7;
  transition: all 0.2s;
}

.user-details .username-link:hover .instagram-indicator {
  opacity: 1;
  transform: scale(1.1);
}

.user-details .username-text {
  color: inherit;
}

.stats {
  margin-top: 0.25rem;
}

.stat {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
  display: inline-block;
}

.stat.approved {
  background: #d1fae5;
  color: #065f46;
}

.total-events {
  text-align: right;
  flex-shrink: 0;
  min-width: 80px;
}

.total-events .event-count {
  display: block;
  font-size: 1.4rem;
  font-weight: 700;
  color: #3b82f6;
}

.total-events .event-label {
  font-size: 0.9rem;
  color: #6b7280;
}

.cta-section {
  text-align: center;
}

.cta-card {
  background: white;
  border-radius: 20px;
  padding: 3rem 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  margin: 0 auto;
}

.cta-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.cta-card h3 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.8rem;
  font-weight: 700;
}

.cta-card p {
  margin: 0 0 2rem 0;
  color: #6b7280;
  font-size: 1.1rem;
  line-height: 1.6;
}

.cta-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
}

.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
}

.cta-btn .icon {
  font-size: 1.2rem;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-15px);
  }
  60% {
    transform: translateY(-8px);
  }
}

@media (max-width: 768px) {
  .leaderboard-page {
    padding: 1rem 0;
  }
  
  .container {
    padding: 0 0.5rem;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  
  .leaderboard-content {
    padding: 1rem;
  }
  
  .leaderboard-item {
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    gap: 0.75rem;
    padding: 1rem;
  }
  
  .position {
    grid-column: 1;
    grid-row: 1 / 3;
    flex-direction: row;
    gap: 0.5rem;
    min-width: auto;
  }
  
  .user-avatar {
    grid-column: 2;
    grid-row: 1;
    width: 40px;
    height: 40px;
    font-size: 0.9rem;
  }
  
  .user-details {
    grid-column: 2;
    grid-row: 2;
  }
  
  .total-events {
    grid-column: 1 / 3;
    grid-row: 3;
    text-align: center;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .cta-card {
    padding: 2rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .header-content h1 {
    font-size: 1.5rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  
  .ranking-section h2 {
    font-size: 1.5rem;
  }
  
  .leaderboard-list {
    padding: 0.5rem;
    gap: 0.5rem;
  }
  
  .leaderboard-item {
    padding: 0.75rem;
    gap: 0.5rem;
  }
  
  .position-number {
    font-size: 1rem;
  }
  
  .medal {
    font-size: 1rem;
  }
  
  .user-details h4 {
    font-size: 1rem;
  }
  
  .total-events .event-count {
    font-size: 1.2rem;
  }
  
  .cta-card h3 {
    font-size: 1.5rem;
  }
  
  .cta-btn {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }
}
</style>
