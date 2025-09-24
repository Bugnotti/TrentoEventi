<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1>📊 Dashboard Amministratore</h1>
      <p>Panoramica completa del sistema TrentoEventi</p>
    </div>

    <!-- Statistiche principali -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <h3>{{ stats.totalUsers }}</h3>
          <p>Utenti Registrati</p>
          <span class="stat-change positive">+{{ stats.newUsersThisMonth }} questo mese</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-content">
          <h3>{{ stats.totalEvents }}</h3>
          <p>Eventi Totali</p>
          <span class="stat-change positive">+{{ stats.newEventsThisMonth }} questo mese</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <h3>{{ stats.approvedEvents }}</h3>
          <p>Eventi Approvati</p>
          <span class="stat-change">{{ Math.round((stats.approvedEvents / stats.totalEvents) * 100) || 0 }}% del totale</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <h3>{{ stats.pendingEvents }}</h3>
          <p>In Attesa di Approvazione</p>
          <span class="stat-change warning">{{ Math.round((stats.pendingEvents / stats.totalEvents) * 100) || 0 }}% del totale</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">👆</div>
        <div class="stat-content">
          <h3>{{ stats.totalClicks }}</h3>
          <p>Click Totali Eventi</p>
          <span class="stat-change positive">Interazioni utenti</span>
        </div>
      </div>
    </div>

    <!-- Grafici e analisi -->
    <div class="charts-grid">
      <div class="chart-card">
        <h3>📈 Eventi per Mese</h3>
        <div class="chart-container">
          <canvas ref="eventsChart" width="400" height="200"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <h3>🏷️ Eventi per Categoria</h3>
        <div class="chart-container">
          <canvas ref="categoriesChart" width="400" height="200"></canvas>
        </div>
      </div>
    </div>

    <!-- Tabelle dettagliate -->
    <div class="tables-grid">
      <div class="table-card">
        <h3>👤 Ultimi Utenti Registrati</h3>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Data Registrazione</th>
                <th>Eventi Segnalati</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in recentUsers" :key="user._id">
                <td>{{ user.username }}</td>
                <td>{{ user.firstName }} {{ user.lastName }}</td>
                <td>{{ user.email }}</td>
                <td>{{ formatDate(user.createdAt) }}</td>
                <td>{{ user.eventsCount || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="table-card">
        <h3>📅 Eventi Recenti</h3>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome Evento</th>
                <th>Categoria</th>
                <th>Segnalato da</th>
                <th>Data Evento</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="event in recentEvents" :key="event._id">
                <td>{{ event.name }}</td>
                <td>{{ event.category }}</td>
                <td>{{ event.reportedBy }}</td>
                <td>{{ formatDate(event.date) }}</td>
                <td>
                  <span :class="`status-badge ${event.approved}`">
                    {{ getStatusText(event.approved) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Eventi più cliccati -->
    <div class="click-stats-section">
      <div class="table-card">
        <h3>🔥 Eventi Più Cliccati</h3>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome Evento</th>
                <th>Categoria</th>
                <th>Segnalato da</th>
                <th>Click Totali</th>
                <th>Utenti Unici</th>
                <th>Data Creazione</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="event in mostClickedEvents" :key="event._id">
                <td>{{ event.name }}</td>
                <td>{{ event.category }}</td>
                <td>{{ event.reporter?.username || event.reportedBy }}</td>
                <td>
                  <span class="click-count">{{ event.clickCount }}</span>
                </td>
                <td>
                  <span class="unique-users">{{ getUniqueUsersCount(event) }}</span>
                </td>
                <td>{{ formatDate(event.createdAt) }}</td>
                <td>
                  <button @click="viewEventClickDetails(event._id)" class="details-btn">
                    📊 Dettagli
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Azioni rapide -->
    <div class="actions-card">
      <h3>⚡ Azioni Rapide</h3>
      <div class="actions-grid">
        <button @click="refreshData" class="action-btn" :disabled="loading">
          🔄 Aggiorna Dati
        </button>
        <button @click="exportData" class="action-btn">
          📊 Esporta Statistiche
        </button>
        <button @click="viewPendingEvents" class="action-btn">
          ⏳ Gestisci Eventi in Attesa
        </button>
        <button @click="viewAllUsers" class="action-btn">
          👥 Gestisci Utenti
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">⏳</div>
      <p>Caricamento dati...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import auth from '../services/auth';
import api from '../services/api';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const router = useRouter();
const loading = ref(false);
const stats = ref({
  totalUsers: 0,
  newUsersThisMonth: 0,
  totalEvents: 0,
  newEventsThisMonth: 0,
  approvedEvents: 0,
  pendingEvents: 0,
  totalClicks: 0
});
const recentUsers = ref([]);
const recentEvents = ref([]);
const mostClickedEvents = ref([]);
const eventsChart = ref(null);
const categoriesChart = ref(null);
const eventsChartInstance = ref(null);
const categoriesChartInstance = ref(null);

// Verifica che l'utente sia admin
const checkAdminAccess = () => {
  const user = auth.getUser();
  console.log('Current user:', user);
  if (!user) {
    console.log('No user found, redirecting to login');
    router.push('/login');
    return false;
  }
  if (user.role !== 'admin') {
    console.log('User is not admin, role:', user.role);
    alert('Accesso negato. Solo gli amministratori possono accedere a questa pagina.');
    router.push('/');
    return false;
  }
  return true;
};

// Carica le statistiche
const loadStats = async () => {
  try {
    const response = await api.get('/admin/stats');
    stats.value = response.data;
  } catch (error) {
    console.error('Errore caricamento statistiche:', error);
    if (error.response?.status === 403) {
      alert('Accesso negato. Verifica di essere loggato come amministratore.');
      router.push('/login');
    }
  }
};

// Carica gli utenti recenti
const loadRecentUsers = async () => {
  try {
    const response = await api.get('/admin/users/recent');
    recentUsers.value = response.data;
  } catch (error) {
    console.error('Errore caricamento utenti:', error);
    if (error.response?.status === 403) {
      alert('Accesso negato. Verifica di essere loggato come amministratore.');
      router.push('/login');
    }
  }
};

// Carica gli eventi recenti
const loadRecentEvents = async () => {
  try {
    const response = await api.get('/admin/events/recent');
    recentEvents.value = response.data;
  } catch (error) {
    console.error('Errore caricamento eventi:', error);
    if (error.response?.status === 403) {
      alert('Accesso negato. Verifica di essere loggato come amministratore.');
      router.push('/login');
    }
  }
};

// Carica gli eventi più cliccati
const loadMostClickedEvents = async () => {
  try {
    const response = await api.get('/admin/events/click-stats?limit=10');
    mostClickedEvents.value = response.data.events;
  } catch (error) {
    console.error('Errore caricamento eventi più cliccati:', error);
    if (error.response?.status === 403) {
      alert('Accesso negato. Verifica di essere loggato come amministratore.');
      router.push('/login');
    }
  }
};

// Formatta le date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('it-IT');
};

// Ottieni il testo dello stato
const getStatusText = (status) => {
  const statusMap = {
    'approved': 'Approvato',
    'pending': 'In Attesa',
    'rejected': 'Rifiutato'
  };
  return statusMap[status] || status;
};

// Aggiorna tutti i dati
const refreshData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      loadStats(),
      loadRecentUsers(),
      loadRecentEvents(),
      loadMostClickedEvents()
    ]);
    await nextTick();
    createCharts();
  } finally {
    loading.value = false;
  }
};

// Crea i grafici
const createCharts = () => {
  createEventsChart();
  createCategoriesChart();
};

// Grafico eventi per mese
const createEventsChart = () => {
  if (eventsChartInstance.value) {
    eventsChartInstance.value.destroy();
  }

  const ctx = eventsChart.value?.getContext('2d');
  if (!ctx) return;

  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu'];
  const eventsData = new Array(6).fill(0);
  
  // Popola i dati degli ultimi 6 mesi
  if (stats.value.eventsByMonth) {
    stats.value.eventsByMonth.forEach(item => {
      const monthIndex = item._id.month - 1;
      if (monthIndex >= 0 && monthIndex < 6) {
        eventsData[monthIndex] = item.count;
      }
    });
  }

  eventsChartInstance.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Eventi Creati',
        data: eventsData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
};

// Grafico eventi per categoria
const createCategoriesChart = () => {
  if (categoriesChartInstance.value) {
    categoriesChartInstance.value.destroy();
  }

  const ctx = categoriesChart.value?.getContext('2d');
  if (!ctx) return;

  const categories = stats.value.eventsByCategory?.map(item => item._id) || [];
  const counts = stats.value.eventsByCategory?.map(item => item.count) || [];
  
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ];

  categoriesChartInstance.value = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: counts,
        backgroundColor: colors.slice(0, categories.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        }
      }
    }
  });
};

// Azioni rapide
const exportData = () => {
  // Implementa esportazione dati
  console.log('Esportazione dati...');
};

const viewPendingEvents = () => {
  router.push('/review');
};

const viewAllUsers = () => {
  // Implementa vista utenti
  console.log('Vista utenti...');
};


// Helper per contare utenti unici
const getUniqueUsersCount = (event) => {
  if (!event.clickedBy || !Array.isArray(event.clickedBy)) return 0;
  
  // Filtra solo i click che hanno un user popolato
  const validClicks = event.clickedBy.filter(click => click.user && click.user._id);
  
  if (validClicks.length === 0) return 0;
  
  const uniqueUsers = new Set(validClicks.map(click => click.user._id.toString()));
  return uniqueUsers.size;
};

// Visualizza dettagli click per un evento specifico
const viewEventClickDetails = async (eventId) => {
  try {
    const response = await api.get(`/admin/events/${eventId}/clicks`);
    const data = response.data;
    
    // Mostra i dettagli in un modal o alert
    const message = `
Evento: ${data.event.name}
Categoria: ${data.event.category}
Click totali: ${data.event.clickCount}
Utenti unici: ${data.uniqueUsers}

Utenti che hanno cliccato:
${data.usersWhoClicked.map(user => 
  `- ${user.user.username} (${user.user.firstName} ${user.user.lastName}) - ${user.clickCount} click`
).join('\n')}
    `;
    
    alert(message);
  } catch (error) {
    console.error('Errore nel recupero dettagli click:', error);
    alert('Errore nel recupero dei dettagli');
  }
};

onMounted(async () => {
  if (!checkAdminAccess()) return;
  
  loading.value = true;
  try {
    await refreshData();
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  if (eventsChartInstance.value) {
    eventsChartInstance.value.destroy();
  }
  if (categoriesChartInstance.value) {
    categoriesChartInstance.value.destroy();
  }
});
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 3rem;
  color: white;
}

.dashboard-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.dashboard-header p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 3rem;
  opacity: 0.8;
}

.stat-content h3 {
  font-size: 2.5rem;
  margin: 0;
  color: #1f2937;
  font-weight: 700;
}

.stat-content p {
  margin: 0.5rem 0;
  color: #6b7280;
  font-weight: 600;
}

.stat-change {
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  display: inline-block;
}

.stat-change.positive {
  background: #dcfce7;
  color: #16a34a;
}

.stat-change.warning {
  background: #fef3c7;
  color: #d97706;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.chart-card {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.chart-card h3 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.3rem;
}

.chart-container {
  position: relative;
  height: 200px;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.table-card {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.table-card h3 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.3rem;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.approved {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.pending {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.rejected {
  background: #fecaca;
  color: #dc2626;
}

.click-stats-section {
  margin-bottom: 3rem;
}

.click-count {
  background: #dbeafe;
  color: #1d4ed8;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
}

.unique-users {
  background: #dcfce7;
  color: #16a34a;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
}

.details-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.details-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.actions-card {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.actions-card h3 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.3rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-btn {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  color: white;
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

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-grid,
  .tables-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
  }
}
</style>
