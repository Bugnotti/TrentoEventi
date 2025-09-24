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
.error { color: #b91c1c; margin-top: 0.4rem; text-align: center; }
</style>


