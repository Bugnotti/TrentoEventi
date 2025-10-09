<template>
  <div class="share-container">
    <!-- Bottone per aprire la condivisione -->
    <button 
      class="share-button" 
      @click="openShareModal"
      :title="'Condividi: ' + title"
    >
      <span class="share-icon">📤</span>
      <span class="share-text">Condividi</span>
    </button>

    <!-- Modal di condivisione -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Condividi evento</h3>
          <button class="close-button" @click="closeModal">✕</button>
        </div>
        
        <div class="modal-body">
          <p class="event-title">{{ title }}</p>
          
          <div class="share-options">
            <!-- WhatsApp -->
            <a 
              :href="whatsappUrl" 
              target="_blank" 
              rel="noopener noreferrer"
              class="share-option whatsapp"
            >
              <span class="option-icon">💬</span>
              <span class="option-text">WhatsApp</span>
            </a>

            <!-- Telegram -->
            <a 
              :href="telegramUrl" 
              target="_blank" 
              rel="noopener noreferrer"
              class="share-option telegram"
            >
              <span class="option-icon">✈️</span>
              <span class="option-text">Telegram</span>
            </a>

            <!-- Copia link -->
            <button 
              class="share-option copy-link"
              @click="copyLink"
            >
              <span class="option-icon">{{ copied ? '✓' : '🔗' }}</span>
              <span class="option-text">{{ copied ? 'Copiato!' : 'Copia link' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  text: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['shared']);

const showModal = ref(false);
const copied = ref(false);

// URL per WhatsApp
const whatsappUrl = computed(() => {
  const message = `${props.title}\n${props.text}\n${props.url}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
});

// URL per Telegram
const telegramUrl = computed(() => {
  const message = `${props.title}\n${props.text}`;
  return `https://t.me/share/url?url=${encodeURIComponent(props.url)}&text=${encodeURIComponent(message)}`;
});

// Apre il modal
const openShareModal = () => {
  showModal.value = true;
};

// Chiude il modal
const closeModal = () => {
  showModal.value = false;
  copied.value = false;
};

// Copia il link
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(props.url);
    copied.value = true;
    emit('shared', 'clipboard');
    
    // Reset dopo 2 secondi
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error('Errore copia link:', error);
    // Fallback per browser vecchi
    fallbackCopyTextToClipboard(props.url);
  }
};

// Fallback per browser che non supportano clipboard API
const fallbackCopyTextToClipboard = (text) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    copied.value = true;
    emit('shared', 'clipboard');
    
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error('Fallback copy failed:', error);
  }
  
  document.body.removeChild(textArea);
};
</script>

<style scoped>
.share-container {
  position: relative;
}

.share-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.share-button:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.share-button:active {
  transform: translateY(0);
}

.share-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.share-text {
  font-size: 0.9rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.close-button {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #e5e7eb;
  color: #111827;
}

.modal-body {
  padding: 1.5rem;
}

.event-title {
  margin: 0 0 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  text-align: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.share-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.share-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border: 2px solid;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 600;
}

.option-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.option-text {
  flex: 1;
}

/* WhatsApp */
.share-option.whatsapp {
  border-color: #25d366;
  color: #25d366;
}

.share-option.whatsapp:hover {
  background: #25d366;
  color: white;
}

/* Telegram */
.share-option.telegram {
  border-color: #0088cc;
  color: #0088cc;
}

.share-option.telegram:hover {
  background: #0088cc;
  color: white;
}

/* Copia link */
.share-option.copy-link {
  border-color: #6b7280;
  color: #6b7280;
}

.share-option.copy-link:hover {
  background: #6b7280;
  color: white;
}

/* Responsive */
@media (max-width: 600px) {
  .modal-content {
    max-width: 100%;
    margin: 0 0.5rem;
  }

  .modal-header {
    padding: 1rem 1.25rem;
  }

  .modal-header h3 {
    font-size: 1.1rem;
  }

  .modal-body {
    padding: 1.25rem;
  }

  .share-option {
    padding: 0.9rem 1rem;
    font-size: 0.95rem;
  }

  .option-icon {
    font-size: 1.3rem;
  }

  .share-button {
    padding: 0.45rem 0.85rem;
    font-size: 0.85rem;
  }
}
</style>
