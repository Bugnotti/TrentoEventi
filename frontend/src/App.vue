<template>
  <Navbar />
  <template v-if="isHome">
    <section class="hero">
      <div class="hero-content">
        <h1>Contribuisci anche tu: tutti gli eventi di Trento</h1>
        
        <!-- Desktop: descrizione sempre visibile -->
        <p class="hero-description desktop-only">Scopri cosa succede in città e aggiungi gli eventi che conosci: aiutiamo insieme la community a restare aggiornata.</p>
        
        <!-- Mobile: descrizione espandibile -->
        <div v-if="showDescription" class="hero-description mobile-expandable">
          Scopri cosa succede in città e aggiungi gli eventi che conosci: aiutiamo insieme la community a restare aggiornata.
        </div>
        
        <div class="hero-actions">
          <!-- Desktop: pulsante singolo -->
          <button class="btn cta wide desktop-only" @click="openAddEvent">
            <span class="icon">＋</span>
            Aggiungo Evento
          </button>
          
          <!-- Mobile: pulsanti affiancati -->
          <div class="mobile-actions">
            <button class="btn secondary" @click="toggleDescription">
              <span class="icon">ℹ️</span>
              Scopri di più
            </button>
            <button class="btn primary" @click="openAddEvent">
              <span class="icon">＋</span>
              Aggiungi Evento
            </button>
          </div>
        </div>
      </div>
    </section>
    
    <!-- FAB (Floating Action Button) per mobile -->
    <button class="fab" @click="openAddEvent" title="Aggiungi Evento">
      <span class="fab-icon">＋</span>
    </button>
    <Filters 
      :key="`filters-${availableCategories.length}`"
      :selectedDate="selectedDate" 
      :categories="availableCategories"
      @update-date="setDate" 
      @update-category="setCategory" 
      @reset="(shouldScroll) => resetFilters(shouldScroll)"
    />

    <div class="selected-day" v-if="selectedDayLabel">
      <h2>{{ selectedDayLabel }}</h2>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner"></div>
      <p>Caricamento eventi...</p>
    </div>

    <!-- Events Grid -->
    <div v-else id="events" class="events-grid">
      <EventCard 
        v-for="event in paginatedEvents" 
        :key="event.id" 
        :event="event"
        @show-user-profile="showUserProfile" />
    </div>

    <div class="pagination" v-if="totalPages > 1">
      <button class="btn" :disabled="currentPage === 1" @click="prevPage">Precedente</button>
      <span>Pagina {{ currentPage }} di {{ totalPages }}</span>
      <button class="btn primary" :disabled="currentPage === totalPages" @click="nextPage">Successiva</button>
    </div>
    
    <AddEventModal :show="showAddEvent" @close="showAddEvent=false" @event-created="refreshEvents" />
    
    <!-- User Profile Modal -->
    <UserProfileModal 
      :show="showProfileModal" 
      :username="selectedUsername"
      @close="closeUserProfile" 
    />
  </template>
  <router-view v-else />
</template>

<script setup>
import Navbar from "./components/Navbar.vue";
import Filters from "./components/Filters.vue";
import EventCard from "./components/EventCard.vue";
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import api from "./services/api";
import AddEventModal from "./components/AddEventModal.vue";
import UserProfileModal from "./components/UserProfileModal.vue";
const route = useRoute();
const isHome = computed(() => route.path === "/");

const selectedDate = ref("");
const selectedCategory = ref("");
const pageSize = ref(8);
const currentPage = ref(1);
const events = ref([]);
const availableCategories = ref([]);
const loading = ref(true);
const showAddEvent = ref(false);
const showProfileModal = ref(false);
const selectedUsername = ref('');
const showDescription = ref(false);

onMounted(async () => {
  try {
    loading.value = true;
    const res = await api.get("/events");
    // Normalizza id per v-for
    events.value = res.data.map(e => ({
      ...e,
      id: e._id || e.id
    }));
    // Deriva categorie uniche dal backend
    const set = new Set(events.value.map(e => e.category).filter(Boolean));
    const baseCategories = Array.from(set).sort();
    
    // Se non ci sono categorie dagli eventi, usa categorie di default
    const defaultCategories = [
      "Musica", "Sport", "Cultura", "Shopping", "Gastronomia", 
      "Cinema", "Cucina", "Fiere", "Intrattenimento", "Mostre", 
      "Formazione", "DJ set", "Nightlife", "Discoteche"
    ];
    
    const finalCategories = baseCategories.length > 0 ? baseCategories : defaultCategories;
    
    // Aggiungi categoria combinata se presente una delle tre
    const nightlifeAliases = ["DJ set", "Nightlife", "Discoteche", "DJ set / Nightlife / Discoteche"];
    const hasNightlife = finalCategories.some(c => nightlifeAliases.includes(c));
    availableCategories.value = hasNightlife
      ? [...finalCategories, "DJ set / Nightlife / Discoteche"]
      : finalCategories;
  } catch (err) {
    console.error("Errore caricamento eventi:", err);
  } finally {
    loading.value = false;
  }
});

const setDate = (d) => {
  selectedDate.value = d;
  // Scroll automatico verso gli eventi in versione mobile
  scrollToEvents();
};

const setCategory = (c) => (selectedCategory.value = c);

// Funzione per scroll automatico verso gli eventi
const scrollToEvents = () => {
  // Aspetta che Vue abbia aggiornato il DOM
  setTimeout(() => {
    const eventsSection = document.getElementById('events');
    if (eventsSection) {
      // Scroll smooth verso la sezione eventi
      eventsSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, 100);
};

function startOfLocalDay(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameLocalDay(a, b) {
  const da = startOfLocalDay(a);
  const db = startOfLocalDay(b);
  return da.getTime() === db.getTime();
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// weekday: 0=Dom, 1=Lun, ... 5=Ven, 6=Sab
function getUpcomingWeekday(weekday) {
  const today = new Date();
  const todayIdx = today.getDay();
  let diff = (weekday - todayIdx + 7) % 7;
  return startOfLocalDay(addDays(today, diff));
}

function matchesSelectedDate(eventDate) {
  if (!selectedDate.value) return true;

  const today = startOfLocalDay(new Date());
  const eventD = new Date(eventDate);

  const label = selectedDate.value.toLowerCase();
  if (label === "oggi") {
    return isSameLocalDay(eventD, today);
  }
  if (label === "domani") {
    const tomorrow = addDays(today, 1);
    return isSameLocalDay(eventD, tomorrow);
  }
  if (label === "venerdì" || label === "venerdi") {
    const friday = getUpcomingWeekday(5);
    return isSameLocalDay(eventD, friday);
  }
  if (label === "sabato") {
    const saturday = getUpcomingWeekday(6);
    return isSameLocalDay(eventD, saturday);
  }
  // formato input date yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(selectedDate.value)) {
    const [y, m, d] = selectedDate.value.split("-").map(Number);
    const chosen = new Date(y, m - 1, d);
    return isSameLocalDay(eventD, chosen);
  }
  return true;
}

const filteredEvents = computed(() =>
  events.value.filter((e) => {
    let matchCategory = true;
    if (selectedCategory.value) {
      if (selectedCategory.value === "DJ set / Nightlife / Discoteche") {
        const combo = new Set(["DJ set", "Nightlife", "Discoteche", "DJ set / Nightlife / Discoteche"]);
        matchCategory = combo.has(e.category || "");
      } else {
        matchCategory = (e.category || "") === selectedCategory.value;
      }
    }
    const eventTime = startOfLocalDay(e.date).getTime();
    const todayTime = startOfLocalDay(new Date()).getTime();
    const isNotPast = eventTime >= todayTime; // nascondi eventi passati
    const matchDate = matchesSelectedDate(e.date);
    return matchCategory && matchDate && isNotPast;
  })
);

const sortedEvents = computed(() => {
  const today = startOfLocalDay(new Date());
  return [...filteredEvents.value].sort((a, b) => {
    const da = startOfLocalDay(a.date).getTime();
    const db = startOfLocalDay(b.date).getTime();
    const aPast = da < today.getTime();
    const bPast = db < today.getTime();
    if (aPast !== bPast) return aPast ? 1 : -1; // futuri/oggi prima, passati dopo
    return da - db; // crescente per data
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(sortedEvents.value.length / pageSize.value)));
const paginatedEvents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return sortedEvents.value.slice(start, start + pageSize.value);
});

const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value += 1; };
const prevPage = () => { if (currentPage.value > 1) currentPage.value -= 1; };

watch([selectedDate, selectedCategory], () => { currentPage.value = 1; });

const resetFilters = (shouldScroll = true) => {
  selectedDate.value = "";
  selectedCategory.value = "";
  currentPage.value = 1;
  // Scroll automatico solo se esplicitamente richiesto
  if (shouldScroll) {
    scrollToEvents();
  }
};

const openAddEvent = () => { showAddEvent.value = true; };

const toggleDescription = () => {
  showDescription.value = !showDescription.value;
};

// User Profile Modal

const showUserProfile = (username) => {
  console.log('Mostrando profilo per:', username);
  selectedUsername.value = username;
  showProfileModal.value = true;
};

const closeUserProfile = () => {
  showProfileModal.value = false;
  selectedUsername.value = '';
};

const refreshEvents = async () => {
  try {
    loading.value = true;
    const res = await api.get("/events");
    events.value = res.data.map(e => ({
      ...e,
      id: e._id || e.id
    }));
    const set = new Set(events.value.map(e => e.category).filter(Boolean));
    const baseCategories = Array.from(set).sort();
    const nightlifeAliases = ["DJ set", "Nightlife", "Discoteche", "DJ set / Nightlife / Discoteche"];
    const hasNightlife = baseCategories.some(c => nightlifeAliases.includes(c));
    availableCategories.value = hasNightlife
      ? [...baseCategories, "DJ set / Nightlife / Discoteche"]
      : baseCategories;
  } catch (err) {
    console.error("Errore refresh eventi:", err);
  } finally {
    loading.value = false;
  }
};


const selectedDayLabel = computed(() => {
  if (!selectedDate.value) return "";
  const today = new Date();
  const fmt = (d) => d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const label = selectedDate.value.toLowerCase();
  if (label === "oggi") return `Eventi di oggi (${fmt(today)})`;
  if (label === "domani") return `Eventi di domani (${fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate()+1))})`;
  if (label === "venerdì" || label === "venerdi") {
    const friday = getUpcomingWeekday(5);
    return `Eventi di venerdì (${fmt(friday)})`;
  }
  if (label === "sabato") {
    const saturday = getUpcomingWeekday(6);
    return `Eventi di sabato (${fmt(saturday)})`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(selectedDate.value)) {
    const [y, m, d] = selectedDate.value.split("-").map(Number);
    const chosen = new Date(y, m - 1, d);
    return `Eventi del ${fmt(chosen)}`;
  }
  return "";
});
</script>
<style>
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
}
.see-more {
  text-align: center;
  margin: 2rem 0;
}
.see-more .btn {
  padding: 0.7rem 2rem;
  font-size: 1rem;
  border-radius: 30px;
}

/* Loading Styles */
.loading-section {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
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

.pagination {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  margin: 2rem 0;
}

.hero {
  background: linear-gradient(135deg, #eef2ff, #f8fafc);
  padding: 2.2rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}
.hero-content { max-width: 980px; margin: 0 auto; text-align: center; }
.hero h1 { margin: 0; font-size: 1.8rem; color: #111827; }
.hero p { margin: 0.6rem 0 1.2rem; color: #4b5563; }
.hero-actions { display: flex; gap: 0.8rem; justify-content: center; flex-wrap: wrap; }

/* Pulsanti mobile affiancati */
.mobile-actions {
  display: none;
  gap: 0.75rem;
  width: 100%;
}

.mobile-actions .btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.mobile-actions .btn.secondary {
  background: #ffffff;
  color: #2563eb;
  border: 2px solid #2563eb;
}

.mobile-actions .btn.secondary:hover {
  background: #eff6ff;
  border-color: #1d4ed8;
  color: #1d4ed8;
}

.mobile-actions .btn.primary {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.mobile-actions .btn.primary:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.hero-description.mobile-expandable {
  margin: 1rem 0;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  color: #4b5563;
  font-size: 0.9rem;
  line-height: 1.5;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* FAB (Floating Action Button) */
.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 50%;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1000;
  display: none;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
}

.fab:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 25px rgba(16, 185, 129, 0.5);
}

.fab-icon {
  font-size: 1.8rem;
  line-height: 1;
}
.btn.cta {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ffffff;
  border: none;
  padding: 0.8rem 1.2rem;
  border-radius: 999px;
  box-shadow: 0 8px 20px rgba(34,197,94,0.35);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
}
.btn.cta:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(34,197,94,0.45); }
.btn.cta:active { transform: translateY(0); }
.btn.cta .icon { font-size: 1.2rem; line-height: 1; }

.btn.cta.wide {
  padding: 0.8rem 2.5rem;
  min-width: 200px;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .events-grid { 
    grid-template-columns: 1fr; 
    padding: 1rem; 
    gap: 1rem; 
  }
  
  /* Hero più compatto su mobile */
  .hero {
    padding: 1.2rem 1rem;
  }
  
  .hero h1 {
    font-size: 1.4rem;
    line-height: 1.3;
    margin-bottom: 0.8rem;
  }
  
  /* Nascondi descrizione desktop */
  .desktop-only {
    display: none;
  }
  
  .hero-actions {
    margin-top: 1rem;
  }
  
  /* Mostra pulsanti mobile affiancati */
  .mobile-actions {
    display: flex;
  }
  
  /* Nascondi pulsante desktop */
  .hero-actions .btn.cta.desktop-only {
    display: none;
  }
  
  /* Nascondi FAB su mobile (sostituito dai pulsanti) */
  .fab {
    display: none;
  }
  
  .pagination { 
    padding: 0 1rem; 
  }
  
  .loading-section {
    padding: 3rem 1rem;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 1rem 0.8rem;
  }
  
  .hero h1 {
    font-size: 1.2rem;
    line-height: 1.2;
  }
  
  .info-toggle {
    font-size: 0.85rem;
    padding: 0.4rem 0.8rem;
  }
  
  .hero-description.mobile-expandable {
    font-size: 0.85rem;
    padding: 0.8rem;
  }
  
  .fab {
    width: 55px;
    height: 55px;
    bottom: 1.5rem;
    right: 1.5rem;
  }
  
  .fab-icon {
    font-size: 1.6rem;
  }
  
  .events-grid { 
    padding: 0.8rem; 
    gap: 0.8rem; 
  }
  
  /* Evita overflow orizzontale su mobile */
  body {
    overflow-x: hidden;
    max-width: 100vw;
  }
  
  #app {
    max-width: 100vw;
    overflow-x: hidden;
  }
}
</style>
