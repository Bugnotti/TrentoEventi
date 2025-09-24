<template>
  <div class="login-page">
    <div class="login-card">
      <button class="back-btn" @click="goBack" aria-label="Torna indietro">←</button>
      <h2>Crea account</h2>
      <p class="subtitle">Registrati per aggiungere eventi</p>
      <form @submit.prevent="onSubmit" class="form">
        <div class="field">
          <label>Username</label>
          <input type="text" v-model="username" required placeholder="es. marco.rossi" />
        </div>
        <div class="field">
          <label>Email</label>
          <input type="email" v-model="email" required placeholder="nome@esempio.com" />
        </div>
        <div class="two-cols">
          <div class="field">
            <label>Nome</label>
            <input type="text" v-model="firstName" placeholder="Nome" />
          </div>
          <div class="field">
            <label>Cognome</label>
            <input type="text" v-model="lastName" placeholder="Cognome" />
          </div>
        </div>
        <div class="field">
          <label>Password</label>
          <input type="password" v-model="password" required placeholder="••••••••" />
        </div>
        
        <div class="field">
          <label>Instagram (opzionale)</label>
          <input type="text" v-model="instagramUsername" placeholder="@tuo_username" />
          <small class="help-text">Inserisci il tuo username Instagram (con o senza @)</small>
        </div>
        
        <div class="field checkbox-field">
          <label class="checkbox-label">
            <input type="checkbox" v-model="showInstagram" />
            <span class="checkmark"></span>
            Mostra il mio Instagram quando segnalo eventi
          </label>
        </div>
        
        <button class="btn primary full" type="submit" :disabled="loading">Registrati</button>
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
const username = ref('');
const email = ref('');
const firstName = ref('');
const lastName = ref('');
const password = ref('');
const instagramUsername = ref('');
const showInstagram = ref(false);
const loading = ref(false);
const error = ref('');

const onSubmit = async () => {
  error.value = '';
  loading.value = true;
  try {
    const userData = {
      username: username.value,
      email: email.value,
      password: password.value,
      firstName: firstName.value,
      lastName: lastName.value,
      instagram: {
        username: instagramUsername.value || undefined,
        showProfile: showInstagram.value
      }
    };
    
    await auth.register(userData);
    await auth.login(email.value, password.value);
    router.push('/');
  } catch (e) {
    error.value = 'Registrazione fallita';
  } finally {
    loading.value = false;
  }
}

const goBack = () => router.back();
</script>

<style scoped>
.login-page { min-height: calc(100vh - 80px); display: flex; align-items: center; justify-content: center; padding: 2rem; background: linear-gradient(135deg, #eef2ff, #f8fafc); }
.login-card { position: relative; width: 100%; max-width: 420px; padding: 2rem; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
.back-btn { position: absolute; top: 1rem; left: 1rem; background: transparent; border: none; font-size: 1.4rem; cursor: pointer; color: #6b7280; }
h2 { margin: 0.5rem 0 0.2rem; font-size: 1.6rem; text-align: center; color: #111827; }
.subtitle { margin: 0 0 1rem; text-align: center; color: #6b7280; }
.form { display: flex; flex-direction: column; gap: 1rem; }
.two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.field label { display: block; margin-bottom: 0.3rem; font-weight: 600; color: #374151; }
.field input { width: 100%; padding: 0.75rem 0.9rem; border: 1px solid #e5e7eb; border-radius: 10px; background: #f9fafb; }
.btn.full { width: 100%; }
.error { color: #b91c1c; margin-top: 0.4rem; text-align: center; }
.help-text { color: #6b7280; font-size: 0.8rem; margin-top: 0.25rem; display: block; }
.checkbox-field { margin: 0.5rem 0; }
.checkbox-label { display: flex; align-items: center; cursor: pointer; font-size: 0.9rem; color: #374151; }
.checkbox-label input[type="checkbox"] { margin-right: 0.5rem; }
</style>


