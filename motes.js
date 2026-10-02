// ============================================================================
// Pulviscolo.
//
// Un canvas a tutto schermo con punti di luce che salgono lentamente, come
// particelle sospese nell'aria ferma di una notte di laguna. Vale per la home
// e per il gioco: la stessa aria, gli stessi punti.
//
// Scelte che tengono conto di chi gioca:
//
//  - Nessuna libreria. Il progetto non ha dipendenze e non deve continuare ad
//    averne: un file, due dozzine di righe, nulla da aggiornare.
//  - `pointer-events: none` sul canvas, cosi' non ruba un solo clic.
//  - Chi ha `prefers-reduced-motion` non vede nulla: non si disegna affatto.
//  - Il ciclo smette di disegnare quando la scheda e' nascosta. In pausa il
//    browser continua a chiamare il frame, ma non si disegna e non si sposta
//    nulla, quindi la batteria non ne risente.
//  - Il numero di punti scala con l'area dello schermo e resta sotto un tetto:
//    su un monitor grande non devono essere trecento particelle.
//  - L'alone e' un gradiente radiale riusato invece di `shadowBlur`, che e'
//    l'operazione piu' lenta del canvas e farebbe cadere il frame rate.
// ============================================================================

const motes = {
  particles: [],
  canvas: null,
  context: null,
  frame: 0,
  lastFrameAt: 0,
  paused: false,
  // Il delta e' limitato a 48ms: se la scheda e' stata in background e torna
  // in primo piano, il salto di tempo vero sarebbe enorme e tutte le particelle
  // attraverserebbero lo schermo di colpo. Tagliandolo, si riprende come se
  // fosse passato un solo istante.
  maxDeltaMs: 48,
  // Tetto assoluto: oltre questo il guadagno estetico e' nullo e il costo per
  // il processore si sente.
  maxParticles: 130,
  // Densita' sulla superficie. Con 100000px quadrati si ha circa una particella
  // ogni 90x90px: abbastanza da sentire l'aria mossa senza nascondere nulla.
  particlesPerPixel: 0.0013,

  start() {
    this.canvas = document.getElementById('motesCanvas');
    if (!this.canvas) return false;
    if (typeof this.canvas.getContext !== 'function') return false;
    this.context = this.canvas.getContext('2d');
    if (!this.context) return false;
    // Senza gradienti non si puo' disegnare l'alone, e senza alone si avrebbe
    // solo una macchia piatta: meglio non animate.
    if (typeof this.context.createRadialGradient !== 'function') return false;
    if (this.prefersReducedMotion()) return false;

    this.loop = this.loop.bind(this);
    this.measure();
    this.seed();
    this.lastFrameAt = 0;
    this.frame = window.requestAnimationFrame(this.loop);
    document.addEventListener('visibilitychange', () => this.handleVisibility());
    window.addEventListener('resize', () => this.handleResize());
    return true;
  },

  // Vero quando l'utente ha chiesto al sistema di ridurre le animazioni.
  prefersReducedMotion() {
    if (typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Il canvas ha dimensioni in pixel, che con un display ad alta densita' non
  // coincidono con i pixel CSS. Senza questo, su un portatile Retina le
  // particelle risulterebbero minuscole e sfocate.
  measure() {
    const ratio = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.ratio = ratio;
  },

  // Una particella. Salgono lentissime e appena sballano di lato, con una
  // pulsazione di opacita' disallineata fra loro: senza la pulsazione sembrerebbe
  // uno sfondo statico con dei punti sopra.
  spawn(atBottom = false) {
    const gold = Math.random() < 0.26;
    return {
      x: Math.random() * this.width,
      y: atBottom ? this.height + Math.random() * 40 : Math.random() * this.height,
      radius: 0.6 + Math.random() * 1.7,
      // Velocita' in px al secondo. Sotto i 18 px/s il moto non si percepisce ma
      // il ricalcolo resta: spesa inutile.
      rise: 6 + Math.random() * 13,
      drift: (Math.random() - 0.5) * 7,
      // Frequenza della pulsazione in radianti al secondo. Valori bassi e diversi
      // per ogni particella evitano qualunque effetto di gruppo.
      pulseSpeed: 0.25 + Math.random() * 0.6,
      pulsePhase: Math.random() * Math.PI * 2,
      peak: gold ? 0.5 + Math.random() * 0.24 : 0.22 + Math.random() * 0.3,
      gold
    };
  },

  seed() {
    const target = Math.min(
      this.maxParticles,
      Math.round(this.width * this.height * this.particlesPerPixel)
    );
    this.particles = [];
    for (let index = 0; index < target; index += 1) {
      this.particles.push(this.spawn(true));
    }
  },
// L'alone e' un gradiente radiale che va dal colore pieno al centro al
  // completamente trasparente sul bordo. Va ricostruito solo quando cambia il
  // rapporto di densita', non a ogni frame.
  buildHalo(gold) {
    const gradient = this.context.createRadialGradient(0, 0, 0, 0, 0, 10);
    if (gold) {
      gradient.addColorStop(0, 'rgba(232, 190, 128, 0.95)');
      gradient.addColorStop(0.4, 'rgba(214, 154, 56, 0.34)');
      gradient.addColorStop(1, 'rgba(214, 154, 56, 0)');
    } else {
      gradient.addColorStop(0, 'rgba(255, 246, 224, 0.9)');
      gradient.addColorStop(0.45, 'rgba(255, 238, 205, 0.32)');
      gradient.addColorStop(1, 'rgba(255, 238, 205, 0)');
    }
    return gradient;
  },

  halos() {
    if (this.cachedHalos && this.cachedRatio === this.ratio) return this.cachedHalos;
    this.cachedHalos = { gold: this.buildHalo(true), pale: this.buildHalo(false) };
    this.cachedRatio = this.ratio;
    return this.cachedHalos;
  },

  drawMote(particle, opacity, halos) {
    const context = this.context;
    const size = particle.radius * 6;
    context.save();
    context.globalAlpha = opacity;
    context.fillStyle = particle.gold ? halos.gold : halos.pale;
    // L'alone e' un cerchio di raggio fisso, portato sulla particella con la
    // trasformazione. E' il trucco che tiene il frame rate alto: costruire un
    // gradiente per ogni particella e forse il collo di bottiglia.
    context.translate(particle.x, particle.y);
    context.scale(size / 10, size / 10);
    context.beginPath();
    context.arc(0, 0, 10, 0, Math.PI * 2);
    context.fill();
    context.restore();
  },

  loop(now) {
    this.frame = window.requestAnimationFrame(this.loop);
    if (this.paused) {
      // Scheda nascosta: si tiene il frame senza disegnare. Il tempo verra'
      // ricalcolato al ritorno, cosi' non si accumula un salto.
      return;
    }
    if (!this.lastFrameAt) {
      this.lastFrameAt = now;
      return;
    }
    const delta = Math.min(now - this.lastFrameAt, this.maxDeltaMs);
    this.lastFrameAt = now;
    const seconds = delta / 1000;
    const secondsNow = now / 1000;
    const halos = this.halos();

    this.context.clearRect(0, 0, this.width, this.height);

    this.particles.forEach((particle) => {
      particle.y -= particle.rise * seconds;
      particle.x += particle.drift * seconds;
      // Chi esce dal fondo ricomincia dall'alto; chi esce di lato viene rimesso
      // dal lato opposto, cosi' nessuna scompare per sempre.
      if (particle.y + particle.radius < 0) {
        particle.y = this.height + particle.radius;
        particle.x = Math.random() * this.width;
      }
      if (particle.x < -20) particle.x = this.width + 20;
      else if (particle.x > this.width + 20) particle.x = -20;
      const pulse = 0.55 + 0.45 * Math.sin(secondsNow * particle.pulseSpeed + particle.pulsePhase);
      this.drawMote(particle, particle.peak * pulse, halos);
    });
  },

  // Scheda nascosta: si smette di disegnare. Il frame resta registrato e costa
  // quasi nulla, ma il processore resta libero.
  handleVisibility() {
    this.paused = Boolean(document.hidden);
    if (!this.paused) {
      // Il tempo riparte da adesso: senza questo, il primo delta dopo la pausa
      // sarebbe enorme e le particelle farebbero un balzo.
      this.lastFrameAt = 0;
    }
  },

  // La finestra e' cambiata dimensione: si rimisura e si riempe di particelle per
  // la nuova superficie. Il debounce evita di rifarlo a ogni pixel durante un
  // ridimensionamento continuo.
  handleResize() {
    if (this.resizeTimer) window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      this.measure();
      this.seed();
    }, 220);
  }
};