import api from './api';

const TOKEN_KEY = 'te_token';
const USER_KEY = 'te_user';

function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearUser() {
  localStorage.removeItem(USER_KEY);
}

async function login(email, password) {
  const res = await api.post('/auth/login', { email, password });
  saveToken(res.data.token);
  saveUser(res.data.user);
  window.dispatchEvent(new Event('auth-changed'));
  return res.data;
}

async function register(payload) {
  // payload: { username, email, password, firstName?, lastName?, instagram? }
  const res = await api.post('/auth/register', payload);
  if (res.data.token) {
    saveToken(res.data.token);
    saveUser(res.data.user);
    window.dispatchEvent(new Event('auth-changed'));
  }
  return res.data;
}

function logout() {
  clearToken();
  clearUser();
  window.dispatchEvent(new Event('auth-changed'));
}

async function updateProfile(profileData) {
  const res = await api.put('/auth/profile', profileData);
  saveUser(res.data.user);
  window.dispatchEvent(new Event('auth-changed'));
  return res.data;
}

async function refreshUser() {
  try {
    const res = await api.get('/auth/me');
    saveUser(res.data.user);
    window.dispatchEvent(new Event('auth-changed'));
    return res.data.user;
  } catch (error) {
    console.error('Error refreshing user:', error);
    return null;
  }
}

export default { login, register, updateProfile, refreshUser, getToken, clearToken, getUser, logout };



