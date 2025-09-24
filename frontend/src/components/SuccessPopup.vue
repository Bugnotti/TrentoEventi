<template>
  <div v-if="show" class="success-popup-overlay">
    <div class="success-popup">
      <div class="success-icon">✅</div>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <button class="btn-primary" @click="close">OK</button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  show: Boolean,
  title: {
    type: String,
    default: 'Successo!'
  },
  message: {
    type: String,
    default: 'Operazione completata con successo.'
  }
});

const emit = defineEmits(['close']);

const close = () => {
  emit('close');
};
</script>

<style scoped>
.success-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease-out;
}

.success-popup {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
  animation: slideIn 0.3s ease-out;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.success-popup h3 {
  margin: 0 0 1rem 0;
  color: #16a34a;
  font-size: 1.5rem;
  font-weight: 600;
}

.success-popup p {
  margin: 0 0 1.5rem 0;
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.5;
}

.btn-primary {
  background: #16a34a;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background: #15803d;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .success-popup {
    margin: 1rem;
    padding: 1.5rem;
  }
}
</style>

