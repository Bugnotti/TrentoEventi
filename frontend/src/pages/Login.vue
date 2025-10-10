<template>
  <div class="login-page">
    <div class="login-card">
      <button class="back-btn" @click="goBack" aria-label="Torna indietro">←</button>
      <h2>Benvenuto</h2>
      <p class="subtitle">Accedi per continuare</p>
      <form @submit.prevent="onSubmit" class="form">
        <div class="field">
          <label>Email</label>
          <input type="email" v-model="email" required placeholder="nome@esempio.com" />
        </div>
        <div class="field">
          <label>Password</label>
          <input type="password" v-model="password" required placeholder="••••••••" />
        </div>
        <button class="btn primary full" type="submit" :disabled="loading">Accedi</button>
        
        <div class="separator">
          <span>oppure</span>
        </div>
        
        <button type="button" class="btn google full" @click="loginWithGoogle">
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Continua con Google
        </button>
        
        <button type="button" class="btn link" @click="recoverPassword">Recupera password</button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
  
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import auth from '../services/auth';

const router = useRouter();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const onSubmit = async () => {
  error.value = '';
  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    router.push('/');
  } catch (e) {
    error.value = 'Credenziali non valide';
  } finally {
    loading.value = false;
  }
}

const goBack = () => router.back();

const loginWithGoogle = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  window.location.href = `${apiUrl}/api/auth/google`;
};

const recoverPassword = () => {
  alert('Funzione di recupero password in arrivo. Per ora contatta il supporto.');
};
</script>

<style scoped>
.login-page { min-height: calc(100vh - 80px); display: flex; align-items: center; justify-content: center; padding: 2rem; background: linear-gradient(135deg, #eef2ff, #f8fafc); }
.login-card { position: relative; width: 100%; max-width: 420px; padding: 2rem; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
.back-btn { position: absolute; top: 1rem; left: 1rem; background: transparent; border: none; font-size: 1.4rem; cursor: pointer; color: #6b7280; }
h2 { margin: 0.5rem 0 0.2rem; font-size: 1.6rem; text-align: center; color: #111827; }
.subtitle { margin: 0 0 1rem; text-align: center; color: #6b7280; }
.form { display: flex; flex-direction: column; gap: 1rem; }
.field label { display: block; margin-bottom: 0.3rem; font-weight: 600; color: #374151; }
.field input { width: 100%; padding: 0.75rem 0.9rem; border: 1px solid #e5e7eb; border-radius: 10px; background: #f9fafb; }
.btn.full { width: 100%; }
.btn.link { background: transparent; border: none; color: #2563eb; cursor: pointer; text-decoration: underline; }
.btn.google { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 0.75rem; 
  background: white; 
  color: #374151; 
  border: 1px solid #e5e7eb; 
  font-weight: 600;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn.google:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}
.separator {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 0.5rem 0;
}
.separator::before,
.separator::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e5e7eb;
}
.separator span {
  padding: 0 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}
.error { color: #b91c1c; margin-top: 0.4rem; text-align: center; }
</style>


