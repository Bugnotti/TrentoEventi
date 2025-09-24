<template>
  <nav class="navbar">
    <a href="/" class="logo" @click.prevent="goHome">TrentoEventi</a>
    
    <!-- Mobile Auth Buttons (visible only on mobile when not logged in) -->
    <div class="mobile-auth-buttons" v-if="!user">
      <router-link to="/login" class="btn-mobile linklike">Login</router-link>
      <router-link to="/register" class="btn-mobile primary">Registrati</router-link>
    </div>
    
    <!-- Hamburger Menu Button -->
    <button class="hamburger" @click="toggleMobileMenu" :class="{ 'active': showMobileMenu }">
      <span></span>
      <span></span>
      <span></span>
    </button>
    
    <!-- Desktop Menu -->
    <div class="actions desktop-menu">
      <router-link to="/" class="btn home-btn">🏠 Home</router-link>
      <router-link to="/mission-vision" class="btn">Mission</router-link>
      <router-link to="/leaderboard" class="btn leaderboard-btn">🏆 Classifica</router-link>
      <router-link v-if="user && (user.role === 'reviewer' || user.role === 'admin')" to="/review" class="btn review-btn">🔍 Revisione</router-link>
      <template v-if="user">
        <div class="user-menu">
          <button class="user-button" @click="toggleDropdown">
            {{ user.username }}
            <span class="dropdown-arrow" :class="{ 'open': showDropdown }">▼</span>
          </button>
          <div v-if="showDropdown" class="dropdown-menu">
            <router-link to="/profile" class="dropdown-item" @click="closeDropdown">
              Profilo
            </router-link>
            <router-link v-if="user.role === 'admin'" to="/admin" class="dropdown-item admin-dashboard" @click="closeDropdown">
              📊 Dashboard Admin
            </router-link>
            <router-link to="/notifications" class="dropdown-item notifications" @click="closeDropdown">
              🔔 Notifiche
              <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
            </router-link>
            <button type="button" class="dropdown-item logout" @click="logout">
              Logout
            </button>
          </div>
        </div>
      </template>
      <template v-else>
        <router-link to="/login" class="btn linklike">Login</router-link>
        <router-link to="/register" class="btn primary">Registrati</router-link>
      </template>
    </div>
    
    <!-- Mobile Menu Overlay -->
    <div v-if="showMobileMenu" class="mobile-menu-overlay" @click="closeMobileMenu"></div>
    
    <!-- Mobile Menu -->
    <div class="mobile-menu" :class="{ 'active': showMobileMenu }">
      <div class="mobile-menu-content">
        <router-link to="/" class="mobile-menu-item" @click="closeMobileMenu">
          <span class="icon">🏠</span>
          <span>Home</span>
        </router-link>
        <router-link to="/mission-vision" class="mobile-menu-item" @click="closeMobileMenu">
          <span class="icon">🎯</span>
          <span>Mission</span>
        </router-link>
        <router-link to="/leaderboard" class="mobile-menu-item" @click="closeMobileMenu">
          <span class="icon">🏆</span>
          <span>Classifica</span>
        </router-link>
        <router-link v-if="user && (user.role === 'reviewer' || user.role === 'admin')" to="/review" class="mobile-menu-item" @click="closeMobileMenu">
          <span class="icon">🔍</span>
          <span>Revisione</span>
        </router-link>
        
        <div class="mobile-user-section" v-if="user">
          <div class="mobile-user-info">
            <div class="user-avatar">{{ getUserInitials() }}</div>
            <div class="user-details">
              <h4>{{ user.username }}</h4>
              <p>{{ user.firstName }} {{ user.lastName }}</p>
            </div>
          </div>
          <div class="mobile-user-actions">
            <router-link to="/profile" class="mobile-menu-item" @click="closeMobileMenu">
              <span class="icon">👤</span>
              <span>Profilo</span>
            </router-link>
            <router-link v-if="user.role === 'admin'" to="/admin" class="mobile-menu-item" @click="closeMobileMenu">
              <span class="icon">📊</span>
              <span>Dashboard Admin</span>
            </router-link>
            <router-link to="/notifications" class="mobile-menu-item" @click="closeMobileMenu">
              <span class="icon">🔔</span>
              <span>Notifiche</span>
              <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
            </router-link>
            <button type="button" class="mobile-menu-item logout" @click="logout">
              <span class="icon">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
        
      </div>
    </div>
  </nav>
  
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import auth from '../services/auth';
import api from '../services/api';

const user = ref(auth.getUser());
const showDropdown = ref(false);
const unreadCount = ref(0);
const showMobileMenu = ref(false);

const handleAuthChange = () => {
  user.value = auth.getUser();
  if (user.value) {
    loadUnreadCount();
  } else {
    unreadCount.value = 0;
  }
};

onMounted(() => {
  window.addEventListener('auth-changed', handleAuthChange);
  document.addEventListener('click', handleClickOutside);
  
  // Carica il contatore notifiche se l'utente è loggato
  if (user.value) {
    loadUnreadCount();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('auth-changed', handleAuthChange);
  document.removeEventListener('click', handleClickOutside);
});

const goHome = () => {
  window.location.href = '/';
};

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const closeDropdown = () => {
  showDropdown.value = false;
};

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
  // Chiudi anche il dropdown desktop se aperto
  if (showMobileMenu.value) {
    showDropdown.value = false;
  }
};

const closeMobileMenu = () => {
  showMobileMenu.value = false;
};

const getUserInitials = () => {
  if (!user.value?.username) return '?';
  const words = user.value.username.split('_');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return user.value.username.substring(0, 2).toUpperCase();
};

const loadUnreadCount = async () => {
  try {
    const response = await api.get('/notifications/unread-count');
    unreadCount.value = response.data.unreadCount;
  } catch (error) {
    console.error('Errore caricamento contatore notifiche:', error);
  }
};

const handleClickOutside = (event) => {
  const userMenu = document.querySelector('.user-menu');
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  
  // Chiudi dropdown desktop se clicchi fuori
  if (userMenu && !userMenu.contains(event.target)) {
    closeDropdown();
  }
  
  // Chiudi menu mobile se clicchi fuori
  if (hamburger && mobileMenu && 
      !hamburger.contains(event.target) && 
      !mobileMenu.contains(event.target)) {
    closeMobileMenu();
  }
};

const logout = () => {
  auth.logout();
  closeDropdown();
  goHome();
};

</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #ffffff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}
.logo {
  font-size: 1.4rem;
  font-weight: 700;
  color: #2563eb; /* blu elegante */
  cursor: pointer;
  text-decoration: none;
}
.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Mobile Auth Buttons */
.mobile-auth-buttons {
  display: none;
  gap: 0.5rem;
  align-items: center;
}

.btn-mobile {
  padding: 0.35rem 0.75rem;
  border-radius: 16px;
  border: 1px solid #2563eb;
  background: transparent;
  color: #2563eb;
  font-weight: 600;
  font-size: 0.8rem;
  text-decoration: none;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-mobile.linklike {
  background: transparent;
  color: #2563eb;
  border-color: #2563eb;
}

.btn-mobile.linklike:hover {
  background: #2563eb;
  color: white;
}

.btn-mobile.primary {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.btn-mobile.primary:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

/* Hamburger Menu */
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1001;
}

.hamburger span {
  width: 100%;
  height: 3px;
  background: #2563eb;
  border-radius: 2px;
  transition: all 0.3s ease;
  transform-origin: center;
}

.hamburger.active span:nth-child(1) {
  transform: rotate(45deg) translate(6px, 6px);
}

.hamburger.active span:nth-child(2) {
  opacity: 0;
  transform: translateX(20px);
}

.hamburger.active span:nth-child(3) {
  transform: rotate(-45deg) translate(6px, -6px);
}
.btn {
  padding: 0.45rem 0.9rem;
  border-radius: 18px;
  border: 1px solid #2563eb;
  background: transparent;
  color: #2563eb;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
}
.btn:hover {
  background: #2563eb;
  color: white;
}
.primary {
  background: #2563eb;
  color: white;
}
.primary:hover {
  background: #1e4db7;
}
.home-btn {
  background: #10b981;
  color: white;
  border-color: #10b981;
}
.home-btn:hover {
  background: #059669;
  border-color: #059669;
}
.review-btn {
  background: #8b5cf6;
  color: white;
  border-color: #8b5cf6;
}
.review-btn:hover {
  background: #7c3aed;
  border-color: #7c3aed;
}
.leaderboard-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border-color: #f59e0b;
  font-weight: 600;
  position: relative;
  overflow: hidden;
}
.leaderboard-btn:hover {
  background: linear-gradient(135deg, #d97706, #b45309);
  border-color: #d97706;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}
.leaderboard-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}
.leaderboard-btn:hover::before {
  left: 100%;
}
.welcome { margin-right: 0.5rem; color: #374151; font-weight: 600; }
.success { border-color: #16a34a; color: #16a34a; }
.success:hover { background: #16a34a; color: #fff; }

/* User Menu Styles */
.user-menu {
  position: relative;
  display: inline-block;
}

.user-button {
  padding: 0.45rem 0.9rem;
  border-radius: 18px;
  border: 1px solid #2563eb;
  background: transparent;
  color: #2563eb;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-button:hover {
  background: #2563eb;
  color: white;
}

.dropdown-arrow {
  font-size: 0.7rem;
  transition: transform 0.3s;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 180px;
  max-width: 180px;
  z-index: 1000;
  margin-top: 0.25rem;
  overflow: hidden;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  background: none;
  border: none;
  color: #374151;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
  text-decoration: none;
}

.dropdown-item:hover {
  background: #f3f4f6;
}

.dropdown-item.logout {
  color: #dc2626;
  border-top: 1px solid #e5e7eb;
}

.dropdown-item.notifications {
  position: relative;
  padding-right: 2.5rem;
}

.notification-badge {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: #ef4444;
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.1rem 0.3rem;
  border-radius: 8px;
  min-width: 16px;
  height: 16px;
  text-align: center;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dropdown-item.admin-dashboard {
  color: #7c3aed;
  font-weight: 600;
}

.dropdown-item.admin-dashboard:hover {
  background: #f3f4f6;
  color: #6d28d9;
}

.dropdown-item.logout:hover {
  background: #fef2f2;
}

/* Mobile Menu Overlay */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Mobile Menu */
.mobile-menu {
  position: fixed;
  top: 0;
  right: -100%;
  width: 100%;
  max-width: 320px;
  height: 100vh;
  background: white;
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease;
  z-index: 1000;
  overflow-y: auto;
}

.mobile-menu.active {
  right: 0;
}

.mobile-menu-content {
  padding: 5rem 0 2rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mobile-menu-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 2rem;
  color: #374151;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.mobile-menu-item:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.mobile-menu-item.primary {
  background: #2563eb;
  color: white;
  margin: 0 2rem 1rem;
  border-radius: 8px;
  justify-content: center;
}

.mobile-menu-item.primary:hover {
  background: #1d4ed8;
}

.mobile-menu-item.logout {
  color: #dc2626;
  border-top: 1px solid #e5e7eb;
  margin-top: auto;
}

.mobile-menu-item.logout:hover {
  background: #fee2e2;
}

.mobile-menu-item .icon {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
}

.mobile-user-section {
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  margin: 1rem 0;
  padding: 1rem 0;
}

.mobile-user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 2rem 1rem;
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
  font-size: 1.2rem;
}

.user-details h4 {
  margin: 0 0 0.25rem 0;
  color: #1f2937;
  font-size: 1.1rem;
  font-weight: 600;
}

.user-details p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.mobile-user-actions {
  display: flex;
  flex-direction: column;
}


/* Media Queries per Responsive */
@media (max-width: 768px) {
  .hamburger {
    display: flex;
  }
  
  .desktop-menu {
    display: none;
  }
  
  .mobile-auth-buttons {
    display: flex;
  }
  
  .logo {
    font-size: 1.3rem;
  }
  
  .navbar {
    justify-content: space-between;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .logo { 
    font-size: 1.2rem; 
  }
  
  .btn-mobile {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }
  
  .mobile-auth-buttons {
    gap: 0.4rem;
  }
  
  .mobile-menu {
    max-width: 100%;
  }
  
  .mobile-menu-content {
    padding: 4rem 0 2rem;
  }
  
  .mobile-menu-item {
    padding: 0.875rem 1.5rem;
  }
  
  .mobile-user-info {
    padding: 0 1.5rem 1rem;
  }
  
  .user-avatar {
    width: 45px;
    height: 45px;
    font-size: 1.1rem;
  }
}

@media (max-width: 360px) {
  .btn-mobile {
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
  }
  
  .mobile-auth-buttons {
    gap: 0.3rem;
  }
  
  .logo {
    font-size: 1.1rem;
  }
}
.linklike { text-decoration: none; }
</style>
