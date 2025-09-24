<template>
  <div class="leaderboard-section">
    <div class="section-header">
      <h2>🏆 Classifica Top 10</h2>
      <p>I contributori più attivi della community</p>
    </div>
    
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Caricamento classifica...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      <p>❌ Errore nel caricamento della classifica</p>
    </div>
    
    <div v-else-if="leaderboard.length === 0" class="no-data">
      <div class="no-data-icon">📊</div>
      <p>Nessuna classifica disponibile</p>
    </div>
    
    <div v-else class="leaderboard-container">
      <div class="podium">
        <!-- Podio per i primi 3 -->
        <div class="podium-place" v-if="leaderboard[2]">
          <div class="podium-position third">
            <div class="medal">🥉</div>
            <div class="position-number">3°</div>
          </div>
          <div class="user-info">
            <div class="avatar">{{ getInitials(leaderboard[2].username) }}</div>
            <h3>{{ leaderboard[2].username }}</h3>
            <p class="event-count">{{ leaderboard[2].eventCount }} eventi</p>
            <div class="stats">
              <span class="stat approved">✅ {{ leaderboard[2].approvedCount }}</span>
              <span class="stat pending">⏳ {{ leaderboard[2].pendingCount }}</span>
            </div>
          </div>
        </div>
        
        <div class="podium-place first">
          <div class="podium-position first">
            <div class="medal">🥇</div>
            <div class="position-number">1°</div>
          </div>
          <div class="user-info">
            <div class="avatar">{{ getInitials(leaderboard[0].username) }}</div>
            <h3>{{ leaderboard[0].username }}</h3>
            <p class="event-count">{{ leaderboard[0].eventCount }} eventi</p>
            <div class="stats">
              <span class="stat approved">✅ {{ leaderboard[0].approvedCount }}</span>
              <span class="stat pending">⏳ {{ leaderboard[0].pendingCount }}</span>
            </div>
          </div>
        </div>
        
        <div class="podium-place" v-if="leaderboard[1]">
          <div class="podium-position second">
            <div class="medal">🥈</div>
            <div class="position-number">2°</div>
          </div>
          <div class="user-info">
            <div class="avatar">{{ getInitials(leaderboard[1].username) }}</div>
            <h3>{{ leaderboard[1].username }}</h3>
            <p class="event-count">{{ leaderboard[1].eventCount }} eventi</p>
            <div class="stats">
              <span class="stat approved">✅ {{ leaderboard[1].approvedCount }}</span>
              <span class="stat pending">⏳ {{ leaderboard[1].pendingCount }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Lista per le posizioni 4-10 -->
      <div class="leaderboard-list" v-if="leaderboard.length > 3">
        <div 
          v-for="(user, index) in leaderboard.slice(3)" 
          :key="user._id"
          class="leaderboard-item"
          :class="{ 'current-user': isCurrentUser(user.username) }"
        >
          <div class="position">
            <span class="position-number">{{ index + 4 }}°</span>
          </div>
          <div class="user-avatar">
            {{ getInitials(user.username) }}
          </div>
          <div class="user-details">
            <h4>{{ user.username }}</h4>
            <div class="stats">
              <span class="stat approved">✅ {{ user.approvedCount }} approvati</span>
              <span class="stat pending">⏳ {{ user.pendingCount }} in attesa</span>
            </div>
          </div>
          <div class="total-events">
            <span class="event-count">{{ user.eventCount }}</span>
            <span class="event-label">eventi</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="leaderboard-footer">
      <p>Contribuisci anche tu per entrare in classifica! 🎯</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import auth from '../services/auth';

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

const isCurrentUser = (username) => {
  const currentUser = auth.getUser();
  return currentUser && currentUser.username === username;
};

onMounted(() => {
  loadLeaderboard();
});
</script>

<style scoped>
.leaderboard-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.section-header {
  text-align: center;
  margin-bottom: 2rem;
}

.section-header h2 {
  margin: 0 0 0.5rem 0;
  color: white;
  font-size: 2rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.section-header p {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: white;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  padding: 2rem;
  color: white;
}

.no-data {
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.8);
}

.no-data-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.leaderboard-container {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

/* Podio */
.podium {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1rem 0;
}

.podium-place {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.podium-position {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
}

.podium-position.first {
  order: 2;
}

.podium-position.second {
  order: 1;
}

.podium-position.third {
  order: 3;
}

.medal {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  animation: bounce 2s infinite;
}

.position-number {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1f2937;
}

.user-info {
  text-align: center;
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  min-width: 200px;
  transition: all 0.3s ease;
}

.user-info:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.podium .user-info {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
}

.avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  margin: 0 auto 1rem;
}

.user-info h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.1rem;
  font-weight: 600;
}

.event-count {
  margin: 0 0 1rem 0;
  color: #3b82f6;
  font-weight: 700;
  font-size: 1.1rem;
}

.stats {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.stat {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
}

.stat.approved {
  background: #d1fae5;
  color: #065f46;
}

.stat.pending {
  background: #fef3c7;
  color: #92400e;
}

/* Lista classifica */
.leaderboard-list {
  border-top: 2px solid #e5e7eb;
  padding-top: 1.5rem;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.leaderboard-item:hover {
  background: #f8fafc;
  transform: translateX(5px);
}

.leaderboard-item.current-user {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.position {
  width: 40px;
  text-align: center;
}

.position-number {
  font-weight: 700;
  color: #6b7280;
  font-size: 0.9rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  margin: 0 1rem;
}

.user-details {
  flex: 1;
}

.user-details h4 {
  margin: 0 0 0.25rem 0;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 600;
}

.leaderboard-item.current-user .user-details h4 {
  color: #1d4ed8;
}

.total-events {
  text-align: right;
}

.total-events .event-count {
  display: block;
  font-size: 1.2rem;
  font-weight: 700;
  color: #3b82f6;
}

.total-events .event-label {
  font-size: 0.8rem;
  color: #6b7280;
}

.leaderboard-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.leaderboard-footer p {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@media (max-width: 768px) {
  .leaderboard-section {
    padding: 1.5rem;
    margin: 1rem 0;
  }
  
  .section-header h2 {
    font-size: 1.5rem;
  }
  
  .podium {
    flex-direction: column;
    gap: 1rem;
  }
  
  .podium-position.first {
    order: 1;
  }
  
  .podium-position.second {
    order: 2;
  }
  
  .podium-position.third {
    order: 3;
  }
  
  .user-info {
    min-width: auto;
    width: 100%;
  }
  
  .leaderboard-item {
    padding: 0.75rem;
  }
  
  .stats {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>

