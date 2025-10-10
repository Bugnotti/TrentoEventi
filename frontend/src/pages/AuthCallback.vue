<template>
  <div class="callback-page">
    <div class="callback-card">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Accesso in corso...</p>
      </div>
      <div v-else-if="error" class="error-message">
        <h2>❌ Errore</h2>
        <p>{{ error }}</p>
        <button @click="goToLogin" class="btn primary">Torna al login</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import auth from '../services/auth';

const router = useRouter();
const route = useRoute();
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    const token = route.query.token;
    
    if (!token) {
      error.value = 'Token non valido';
      loading.value = false;
      return;
    }

    // Salva il token e recupera i dati utente
    localStorage.setItem('token', token);
    
    // Recupera i dati dell'utente
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect alla home
      setTimeout(() => {
        router.push('/');
      }, 500);
    } else {
      error.value = 'Errore durante il recupero dei dati utente';
      loading.value = false;
    }
  } catch (err) {
    console.error('Errore callback Google:', err);
    error.value = 'Errore durante l\'autenticazione';
    loading.value = false;
  }
});

const goToLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
.callback-page {
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #eef2ff, #f8fafc);
}

.callback-card {
  width: 100%;
  max-width: 420px;
  padding: 3rem 2rem;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  text-align: center;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message h2 {
  color: #b91c1c;
  margin-bottom: 1rem;
}

.error-message p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.btn.primary {
  background: #2563eb;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

.btn.primary:hover {
  background: #1d4ed8;
}
</style>

