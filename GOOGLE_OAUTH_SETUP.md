# 🔐 Guida Setup Google OAuth 2.0

## 📝 Cosa abbiamo implementato

L'autenticazione con Google è stata completamente integrata nell'applicazione TrentoEventi. Gli utenti possono ora:
- Registrarsi con il proprio account Google
- Accedere con il proprio account Google
- Collegare un account Google a un account esistente

## 🚀 Come configurare Google OAuth

### 1. Creare un progetto Google Cloud

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Clicca su "Seleziona progetto" in alto
3. Clicca su "Nuovo progetto"
4. Inserisci il nome del progetto (es. "TrentoEventi")
5. Clicca su "Crea"

### 2. Abilitare Google+ API

1. Nel menu laterale, vai su "API e servizi" > "Libreria"
2. Cerca "Google+ API"
3. Clicca su "Google+ API"
4. Clicca su "Abilita"

### 3. Configurare la schermata del consenso OAuth

1. Nel menu laterale, vai su "API e servizi" > "Schermata consenso OAuth"
2. Seleziona "Esterno" (o "Interno" se hai un'organizzazione Google Workspace)
3. Clicca su "Crea"
4. Compila i campi obbligatori:
   - **Nome applicazione**: TrentoEventi
   - **Email assistenza utente**: la tua email
   - **Logo applicazione** (opzionale)
   - **Domini autorizzati**: aggiungi il tuo dominio (es. `trentomorta.it`)
   - **Email contatti sviluppatore**: la tua email
5. Clicca su "Salva e continua"
6. Nella sezione "Ambiti", clicca su "Aggiungi o rimuovi ambiti" e seleziona:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
7. Clicca su "Salva e continua"
8. Aggiungi utenti di test (se necessario per sviluppo)
9. Clicca su "Salva e continua"

### 4. Creare le credenziali OAuth 2.0

1. Nel menu laterale, vai su "API e servizi" > "Credenziali"
2. Clicca su "Crea credenziali" in alto
3. Seleziona "ID client OAuth 2.0"
4. Seleziona "Applicazione web" come tipo di applicazione
5. Configura i campi:
   - **Nome**: TrentoEventi Web Client
   - **Origini JavaScript autorizzate**:
     - `http://localhost:5173` (per sviluppo)
     - `http://localhost:3000` (per sviluppo)
     - `https://tuo-dominio.com` (per produzione)
   - **URI di reindirizzamento autorizzati**:
     - `http://localhost:3000/api/auth/google/callback` (per sviluppo)
     - `https://tuo-dominio.com/api/auth/google/callback` (per produzione)
6. Clicca su "Crea"
7. **IMPORTANTE**: Copia il **Client ID** e il **Client secret** che appaiono

### 5. Configurare le variabili d'ambiente

#### Backend

Crea un file `.env` nella cartella `backend/` (se non esiste già) e aggiungi:

```env
# Google OAuth
GOOGLE_CLIENT_ID=il_tuo_client_id_qui
GOOGLE_CLIENT_SECRET=il_tuo_client_secret_qui
GOOGLE_CALLBACK_URL=/api/auth/google/callback

# Frontend URL (importante per il redirect dopo l'autenticazione)
FRONTEND_URL=http://localhost:5173
```

**Per produzione su Render.com:**

1. Vai su Render.com > Il tuo servizio backend
2. Vai su "Environment"
3. Aggiungi le variabili:
   - `GOOGLE_CLIENT_ID`: il tuo Client ID
   - `GOOGLE_CLIENT_SECRET`: il tuo Client Secret
   - `GOOGLE_CALLBACK_URL`: `/api/auth/google/callback`
   - `FRONTEND_URL`: `https://tuo-dominio-frontend.com`

#### Frontend

Crea un file `.env` nella cartella `frontend/` (se non esiste già) e aggiungi:

```env
VITE_API_URL=http://localhost:3000
```

**Per produzione:**

```env
VITE_API_URL=https://tuo-dominio-backend.com
```

### 6. Testare l'autenticazione

1. Avvia il backend: `cd backend && npm start`
2. Avvia il frontend: `cd frontend && npm run dev`
3. Vai su `http://localhost:5173/login`
4. Clicca su "Continua con Google"
5. Dovresti essere reindirizzato alla pagina di login di Google
6. Dopo aver effettuato il login, dovresti essere reindirizzato alla home dell'app

## 🔧 File modificati

### Backend

- ✅ `backend/src/models/User.js` - Aggiunto supporto per `googleId`, `authProvider`, `profilePicture`
- ✅ `backend/src/controllers/authController.js` - Nuovo controller per Google OAuth
- ✅ `backend/src/routes/authRoutes.js` - Aggiunte route `/api/auth/google` e `/api/auth/google/callback`
- ✅ `backend/src/app.js` - Configurato Passport.js
- ✅ `backend/package.json` - Aggiunte dipendenze `passport` e `passport-google-oauth20`

### Frontend

- ✅ `frontend/src/pages/Login.vue` - Aggiunto pulsante "Continua con Google"
- ✅ `frontend/src/pages/Register.vue` - Aggiunto pulsante "Continua con Google"
- ✅ `frontend/src/pages/AuthCallback.vue` - Nuova pagina per gestire il callback di Google
- ✅ `frontend/src/router/index.js` - Aggiunta route `/auth/callback`

## 📊 Flusso di autenticazione

1. **Utente clicca "Continua con Google"** → Redirect a `/api/auth/google`
2. **Backend** → Redirect a Google OAuth
3. **Utente autentica su Google** → Google redirect a `/api/auth/google/callback`
4. **Backend**:
   - Riceve i dati da Google
   - Cerca utente esistente con `googleId`
   - Se non esiste, cerca per email e collega l'account
   - Se non esiste nemmeno, crea nuovo utente
   - Genera JWT token
5. **Backend** → Redirect al frontend `/auth/callback?token=...`
6. **Frontend**:
   - Riceve il token
   - Salva in localStorage
   - Recupera i dati utente
   - Redirect alla home

## 🔒 Sicurezza

- ✅ I token JWT hanno scadenza di 7 giorni
- ✅ Le password degli utenti Google non vengono salvate
- ✅ Il `googleId` è unico per ogni utente
- ✅ Il callback URL è protetto e validato
- ✅ Gli scope OAuth sono limitati a `profile` e `email`

## 🐛 Troubleshooting

### "redirect_uri_mismatch"
- Verifica che l'URL di redirect nella Google Cloud Console corrisponda esattamente a quello usato dall'app
- Controlla che includa lo schema (http/https) e non ci siano slash finali extra

### "Access blocked: This app's request is invalid"
- Assicurati di aver configurato la schermata del consenso OAuth
- Verifica che l'applicazione non sia in "Modalità test" senza utenti di test aggiunti

### L'utente viene reindirizzato ma non fa login
- Controlla i log del backend per errori
- Verifica che la variabile `FRONTEND_URL` sia configurata correttamente
- Controlla la console del browser per errori JavaScript

### "Invalid credentials"
- Verifica che `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` siano corretti
- Assicurati di non avere spazi extra nelle variabili d'ambiente

## 📚 Risorse utili

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
- [Google Cloud Console](https://console.cloud.google.com/)

## ✨ Caratteristiche implementate

- ✅ Login con Google
- ✅ Registrazione con Google
- ✅ Collegamento account esistente
- ✅ Gestione automatica username univoco
- ✅ Salvataggio foto profilo Google
- ✅ UI moderna con logo Google ufficiale
- ✅ Gestione errori e redirect

---

**Fatto! 🎉** Ora gli utenti possono accedere comodamente con il loro account Google!

