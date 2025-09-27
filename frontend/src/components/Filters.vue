<template>
  <div class="filters">
    <div class="filter-group">
      <span>📅 Data:</span>
      <button 
        v-for="option in dateOptions" 
        :key="option" 
        @click="handleDateClick(option)" 
        :class="['filter-btn', { active: option === selectedDate }]"
      >
        {{ option }}
      </button>
      <input type="date" @change="$emit('update-date', $event.target.value)" />
      <button class="filter-btn" @click="$emit('reset')">Reset filtri</button>
    </div>

    <div class="filter-group">
      <span>🔎 Categoria:</span>
      <select @change="$emit('update-category', $event.target.value)">
        <option value="">Tutte le categorie</option>
        <option v-for="cat in categories" :key="cat">{{ cat }}</option>
      </select>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  selectedDate: String,
  categories: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update-date', 'update-category', 'reset']);

const dateOptions = ["Oggi", "Domani", "Venerdì", "Sabato"];
const categories = props.categories;

// Funzione per gestire il click sui filtri di data
const handleDateClick = (option) => {
  emit('update-date', option);
  
  // Aggiungi un feedback visivo al bottone cliccato
  const button = event.target;
  button.style.transform = 'scale(0.95)';
  setTimeout(() => {
    button.style.transform = 'scale(1)';
  }, 150);
};
</script>
<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap; /* permette di andare a capo */
  gap: 1rem;
  padding: 0.8rem 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

/* Ogni gruppo (Data, Categoria) */
.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: center;
  font-weight: 500;
  color: #374151;
}

/* Bottoni */
.filter-btn {
  padding: 0.45rem 0.9rem;
  border-radius: 18px;
  border: 1px solid #2563eb;
  background: white;
  color: #2563eb;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  transform: scale(1);
}
.filter-btn:hover,
.filter-btn.active {
  background: #2563eb;
  color: white;
}

/* Input e select */
select, input[type="date"] {
  padding: 0.5rem 0.7rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.9rem;
  outline: none;
  background: white;
  cursor: pointer;
  transition: border 0.2s;
}
select:focus, input[type="date"]:focus {
  border: 1px solid #2563eb;
}

/* 🔹 Media query per mobile */
@media (max-width: 600px) {
  .filters {
    flex-direction: column; /* impila i gruppi */
    align-items: flex-start;
  }
  .filter-group {
    flex-direction: column; /* Data e Categoria vanno in colonna */
    align-items: flex-start;
    width: 100%;
    gap: 0.6rem;
  }
  .filter-btn {
    width: 100%; /* bottoni larghi quanto lo schermo */
    text-align: center;
    padding: 0.55rem 0.9rem;
    font-weight: 600;
  }
  .filter-btn:hover {
    transform: scale(0.98);
  }
  select, input[type="date"] {
    width: 100%;
  }
}
</style>
