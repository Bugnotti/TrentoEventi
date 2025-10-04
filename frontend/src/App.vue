<template>
  <Navbar />
  <template v-if="isHome">
    <section class="hero">
      <div class="hero-content">
        <h1>Contribuisci anche tu: tutti gli eventi di Trento</h1>
        <p>Scopri cosa succede in città e aggiungi gli eventi che conosci: aiutiamo insieme la community a restare aggiornata.</p>
        <div class="hero-actions">
          <button class="btn cta wide" @click="openAddEvent">
            <span class="icon">＋</span>
            Aggiungo Evento
          </button>
        </div>
      </div>
    </section>
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

const showAddEvent = ref(false);
const openAddEvent = () => { showAddEvent.value = true; };

// User Profile Modal
const showProfileModal = ref(false);
const selectedUsername = ref('');

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

@media (max-width: 640px) {
  .hero { padding: 1.6rem 1rem; }
  .hero h1 { font-size: 1.4rem; line-height: 1.2; }
  .hero p { font-size: 0.95rem; }
  .events-grid { grid-template-columns: 1fr; padding: 0.8rem; gap: 0.8rem; }
  .pagination { padding: 0 1rem; }
  
  .loading-section {
    padding: 3rem 1rem;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
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
