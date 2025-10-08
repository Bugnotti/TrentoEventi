<template>
  <div 
    class="event-card" 
    @click="openEventInstagram"
    @touchend.prevent="handleCardTouch"
    role="button"
    tabindex="0"
  >
    <h3 class="event-title">{{ event.name }}</h3>
    <div class="event-date">
      <span class="date-icon">📅</span>
      <span class="date-text">
        <span class="date-bold">{{ formatDate(event.date) }}</span>
        <span class="date-time">{{ formatTime(event.date) }}</span>
      </span>
    </div>
    <p class="event-location">📍 {{ event.location }}</p>
    <div class="reported-by">
      <span>Evento segnalato da</span>
      <span 
        v-if="shouldShowInstagram()" 
        class="reporter-name clickable"
        @click.stop="openReporterInstagram"
        @touchend.stop.prevent="handleReporterTouch"
        :title="'Clicca per vedere il profilo Instagram di ' + getReporterDisplayName()"
        role="button"
        tabindex="0"
      >
        📸 {{ getReporterDisplayName() }}
      </span>
      <span v-else class="reporter-name">
        {{ getReporterDisplayName() }}
      </span>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import authService from '../services/auth';
import api from '../services/api';

const props = defineProps({
  event: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['show-user-profile']);

const user = ref(authService.getUser());

const openEventInstagram = async () => {
  if (props.event.link) {
    // Traccia il click se l'utente è loggato
    if (user.value) {
      try {
        await api.post(`/events/${props.event._id}/click`);
      } catch (error) {
        console.error('Errore nel tracking del click:', error);
      }
    }
    
    // Apri il post Instagram dell'evento
    window.open(props.event.link, '_blank');
  } else {
    console.log('Nessun link Instagram disponibile per questo evento');
  }
};

// Handler per touch events sulla card (per iOS)
const handleCardTouch = (event) => {
  openEventInstagram();
};

const openReporterInstagram = () => {
  // Controlla se l'utente ha un username Instagram nel suo profilo
  if (props.event.reporter?.instagram?.username) {
    // Rimuovi @ se presente e aggiungi il link Instagram
    const cleanHandle = props.event.reporter.instagram.username.replace('@', '');
    const instagramUrl = `https://www.instagram.com/${cleanHandle}/`;
    window.open(instagramUrl, '_blank');
  } else if (props.event.reporterInstagram) {
    // Fallback: usa il reporterInstagram dell'evento se disponibile
    const cleanHandle = props.event.reporterInstagram.replace('@', '');
    const instagramUrl = `https://www.instagram.com/${cleanHandle}/`;
    window.open(instagramUrl, '_blank');
  }
};

// Handler per touch events sul nome reporter (per iOS)
const handleReporterTouch = (event) => {
  openReporterInstagram();
};

const getReporterDisplayName = () => {
  // Se c'è un reporter popolato con dati utente, usa l'username
  if (props.event.reporter && props.event.reporter.username) {
    return props.event.reporter.username;
  }
  // Altrimenti usa il reportedBy (username o "Anonimo")
  return props.event.reportedBy || 'Anonimo';
};

const shouldShowInstagram = () => {
  // Mostra Instagram solo se:
  // 1. L'utente ha scelto di mostrare il suo profilo (showProfile: true)
  // 2. Ha un username Instagram nel suo profilo
  // OPPURE se c'è un reporterInstagram nell'evento (fallback)
  return (props.event.reporter?.instagram?.showProfile && 
          props.event.reporter?.instagram?.username) ||
         props.event.reporterInstagram;
};

const showUserProfile = (username) => {
  console.log('Cliccato su username:', username);
  console.log('User loggato:', user.value);
  emit('show-user-profile', username);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
.event-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  /* Migliora il touch su iOS */
  -webkit-tap-highlight-color: rgba(59, 130, 246, 0.1);
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}
.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
.event-card:active {
  transform: translateY(-2px);
  box-shadow: 0 3px 12px rgba(0,0,0,0.08);
}
.event-title {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
  font-weight: 800;
  color: #111827;
  line-height: 1.3;
}

.event-date {
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #4b5563;
}

.date-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.date-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.date-bold {
  font-weight: 700;
  color: #1f2937;
  font-size: 0.95rem;
}

.date-time {
  font-weight: 500;
  color: #6b7280;
  font-size: 0.85rem;
}

.event-location {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #4b5563;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.reported-by {
  margin: 0.5rem 0;
  font-size: 0.85rem;
  color: #6b7280;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.reporter-name {
  color: #6b7280;
}

.reporter-name.clickable {
  color: #e91e63;
  cursor: pointer;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
  border-radius: 4px;
  padding: 2px 4px;
  background: rgba(233, 30, 99, 0.1);
  /* Migliora il touch su iOS */
  -webkit-tap-highlight-color: rgba(233, 30, 99, 0.2);
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

.reporter-name.clickable:hover {
  color: #ad1457;
  background: rgba(233, 30, 99, 0.2);
  transform: scale(1.05);
}

.reporter-name.clickable:active {
  color: #ad1457;
  background: rgba(233, 30, 99, 0.25);
  transform: scale(1.02);
}

/* Responsive styles */
@media (max-width: 768px) {
  .event-title {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }
  
  .event-date {
    margin: 0.4rem 0;
    gap: 0.4rem;
  }
  
  .date-bold {
    font-size: 0.9rem;
  }
  
  .date-time {
    font-size: 0.8rem;
  }
  
  .event-location {
    font-size: 0.85rem;
    margin: 0.4rem 0;
  }
  
  .reported-by {
    font-size: 0.8rem;
    margin: 0.4rem 0;
  }
}

@media (max-width: 480px) {
  .event-card {
    padding: 1rem;
  }
  
  .event-title {
    font-size: 1rem;
    line-height: 1.2;
  }
  
  .date-text {
    gap: 0.05rem;
  }
  
  .date-bold {
    font-size: 0.85rem;
  }
  
  .date-time {
    font-size: 0.75rem;
  }
}
</style>
