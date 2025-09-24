<template>
  <section class="mv">
    <div class="container">
      <h1>Mission & Vision</h1>
      <p class="lead">Rendere semplice scoprire, condividere e vivere tutti gli eventi di Trento.</p>

      <div class="grid">
        <div class="card">
          <h2>La nostra Mission</h2>
          <p>
            Non immagini quante volte mi sia capitato di perdermi eventi fighi alla quale sarei voluto andare,
            ma di cui non sapevo neanche l'esistenza. Quante volte mi è capitato di aprire pagine instagram per scoprire che eventi facessero.
            Ma so che è capitato anche a te. Dicono che Trento è morta, ma io non ci credo tanto. Ho notato che 
            solitamente la gente conosce gli eventi per passaparola e ho deciso di provare a far diventare questa piattaforma quel passaparola.
            Mi farebbe molto piacere se tu volessi farne parte. Se volessi contribuire a far conoscere ai tuoi coetanei quante cose fighe si possono fare.
            Per questo ho deciso di raggrupparli tutti qui, . 
          </p>
        </div>
        <div class="card">
          <h2>La nostra Vision</h2>
          <p>
            Diventare il punto di riferimento per il tempo libero a Trento, con una community attiva
            che contribuisce a mantenere i contenuti di qualità. Trasparenza, inclusione e semplicità
            sono i nostri principi guida.
          </p>
        </div>
      </div>

      <div class="cta">
        <router-link to="/" class="btn">Torna alla Home</router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
</script>

<style scoped>
.mv { padding: 2rem 1rem; }
.container { max-width: 980px; margin: 0 auto; }
h1 { margin: 0 0 0.5rem; font-size: 2rem; color: #111827; }
.lead { color: #6b7280; margin-bottom: 1.5rem; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 1rem 1.2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.card h2 { margin: 0 0 0.5rem; font-size: 1.2rem; color: #111827; }
.card p { margin: 0; color: #374151; line-height: 1.6; }
.btn { display: inline-block; margin-top: 1.2rem; padding: 0.6rem 1rem; border-radius: 10px; border: 1px solid #2563eb; color: #2563eb; text-decoration: none; }
.btn:hover { background: #2563eb; color: #fff; }
.cta { text-align: center; }

@media (max-width: 700px) {
  .grid { grid-template-columns: 1fr; }
  h1 { font-size: 1.6rem; }
}
</style>



