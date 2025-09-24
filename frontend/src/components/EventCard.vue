<template>
  <div class="event-card" @click="openEventInstagram">
    <h3>{{ event.name }}</h3>
    <p>📅 {{ new Date(event.date).toLocaleString() }}</p>
    <p>📍 {{ event.location }}</p>
    <div class="reported-by">
      <span>Evento segnalato da</span>
      <span 
        v-if="shouldShowInstagram()" 
        class="reporter-name clickable"
        @click.stop="openReporterInstagram"
        :title="'Clicca per vedere il profilo Instagram di ' + getReporterDisplayName()"
      >
        {{ getReporterDisplayName() }}
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

const openReporterInstagram = () => {
  if (props.event.reporterInstagram) {
    // Rimuovi @ se presente e aggiungi il link Instagram
    const cleanHandle = props.event.reporterInstagram.replace('@', '');
    const instagramUrl = `https://www.instagram.com/${cleanHandle}/`;
    window.open(instagramUrl, '_blank');
  }
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
  // 2. Ha un username Instagram
  // 3. C'è un reporterInstagram nell'evento
  return props.event.reporter?.instagram?.showProfile && 
         props.event.reporter?.instagram?.username && 
         props.event.reporterInstagram;
};

const showUserProfile = (username) => {
  console.log('Cliccato su username:', username);
  console.log('User loggato:', user.value);
  emit('show-user-profile', username);
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
}
.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
}
p {
  margin: 0.3rem 0;
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
  color: #007bff;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s ease;
}

.reporter-name.clickable:hover {
  color: #0056b3;
  text-decoration: none;
}
</style>
