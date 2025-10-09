<template>
  <div class="filters">
    <div class="filter-group date-group">
      <span>📅 Data:</span>
      <button 
        v-for="option in dateOptions" 
        :key="option" 
        @click="handleDateClick(option)" 
        :class="['filter-btn', { active: option === selectedDate }]"
      >
        {{ option }}
      </button>
      <div class="date-picker-container">
        <input 
          id="date-input"
          type="date" 
          class="date-input"
          @change="$emit('update-date', $event.target.value)" 
        />
      </div>
      <button class="filter-btn reset-btn desktop-reset" @click="$emit('reset', true)">Reset filtri</button>
    </div>

    <div class="filter-group category-group">
      <div class="category-filter-container">
        <span class="category-label">🔎 Categoria:</span>
        <div class="category-filter-wrapper">
          <select @change="$emit('update-category', $event.target.value)">
            <option value="">Tutte le categorie</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- Reset button per mobile - alla fine -->
    <button class="filter-btn reset-btn mobile-reset" @click="$emit('reset', true)">🔄 Reset filtri</button>
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

/* Gestione visibilità reset button desktop/mobile */
.mobile-reset {
  display: none; /* Nascosto su desktop */
}

.desktop-reset {
  display: inline-block; /* Visibile su desktop */
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

/* Stili base per il date input - mantiene layout originale su desktop */
.date-input {
  padding: 0.5rem 0.7rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.85rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.date-input:focus {
  outline: none;
  border-color: #2563eb;
}

/* Stili desktop per categoria */
.category-filter-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.8rem;
}

.category-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0;
  text-align: left;
}

.category-filter-wrapper {
  background: transparent;
  padding: 0;
  border: none;
  box-shadow: none;
}

/* 🔹 Media query per mobile */
@media (max-width: 600px) {
  .filters {
    flex-direction: column; /* impila i gruppi */
    align-items: flex-start;
    margin: 0;
    padding: 0.8rem;
    box-sizing: border-box;
    overflow-x: hidden;
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
  
  /* Su mobile: nascondi reset desktop, mostra reset mobile */
  .desktop-reset {
    display: none !important;
  }
  
  .mobile-reset {
    display: block;
    width: 100%;
    background: #dc2626; /* Rosso per distinguerlo */
    color: white;
    border: 2px solid #dc2626;
    padding: 0.8rem 1rem;
    font-size: 1rem;
    font-weight: 700;
    margin-top: 1rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
  }
  
  .mobile-reset:hover {
    background: #b91c1c;
    border-color: #b91c1c;
    transform: scale(0.98);
  }
  
  /* Su mobile, aggiungi etichetta prima dell'input date */
  .date-picker-container::before {
    content: "📅 Scegli data specifica:";
    display: block;
    font-size: 1rem;
    font-weight: 700;
    color: #1f2937;
    text-align: center;
    margin-bottom: 0.5rem;
    background: #f8fafc;
    padding: 0.8rem;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
  
  .date-picker-container {
    width: calc(100% - 40px);
    margin: 0 auto;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .date-input {
    width: 100%;
    padding: 0.8rem;
    font-size: 1rem;
    text-align: center;
    border: 2px solid #2563eb;
    border-radius: 6px;
    background: white;
  }
  
  select {
    width: 100%;
    padding: 0.8rem;
    font-size: 1rem;
    border-radius: 10px;
    border: 2px solid #cbd5e1;
    background: white;
    cursor: pointer;
  }
  
  select:focus {
    outline: none;
    border-color: #2563eb;
  }
  
  .category-filter-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
  
  .category-label {
    font-size: 1rem;
    font-weight: 700;
    color: #1f2937;
    text-align: center;
    margin-bottom: 0.3rem;
  }
  
  .category-filter-wrapper {
    background: #f8fafc;
    padding: 0.8rem;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
}
</style>
