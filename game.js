/**
 * ===================================================================
 * GTA 1v1 SHOWDOWN - ADVANCED TOP-DOWN MULTIPLAYER ACTION GAME
 * Features:
 *  - 2D Canvas GTA-style Open World City (roads, buildings, trees, sidewalks)
 *  - Drivable Vehicles (Sports, Police with sirens, Muscle, SUV)
 *  - Arsenal: Fists, Pistol, Shotgun, AK-47, Rocket Launcher (RPG)
 *  - 1v1 Real-Time Peer-to-Peer Multiplayer (WebRTC via PeerJS)
 *  - Intelligent AI Bot 1v1 Mode for Solo Practice
 *  - Full Mobile Touch Controls (Dual Joysticks + Action Buttons)
 *  - Procedural Web Audio API Sound Effects (Zero external assets needed)
 *  - Mini-map Radar, Car Physics, Drifting, Skidmarks, Explosions, Pickups
 * ===================================================================
 */

// Canvas roundRect Polyfill for universal cross-browser / mobile support
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r = 0) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

// --- SOUND ENGINE (Web Audio API) ---
class SoundController {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.carEngineOsc = null;
    this.carEngineGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playShoot(type = 'pistol') {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';

      if (type === 'shotgun') {
        filter.frequency.setValueAtTime(550, t);
        filter.Q.setValueAtTime(1.5, t);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        whiteNoise.start(t);
        whiteNoise.stop(t + 0.22);
      } else if (type === 'rocket') {
        filter.frequency.setValueAtTime(320, t);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        whiteNoise.start(t);
        whiteNoise.stop(t + 0.35);
      } else if (type === 'ak47') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.09);
        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.09);
      } else {
        // Pistol
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(360, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        gain.gain.setValueAtTime(0.32, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
      }
    } catch (e) {}
  }

  playPunch() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch(e) {}
  }

  playExplosion() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.8);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.25));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, t);
      filter.frequency.linearRampToValueAtTime(60, t + 0.8);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(t);
      noise.stop(t + 0.8);
    } catch (e) {}
  }

  playHit() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.1);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    } catch (e) {}
  }

  playPickup() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.setValueAtTime(660, t + 0.08);
      osc.frequency.setValueAtTime(880, t + 0.16);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.28);
    } catch(e) {}
  }

  playCarHorn() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc1.type = 'triangle';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(440, t);
      osc2.frequency.setValueAtTime(554, t);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.4);
      osc2.stop(t + 0.4);
    } catch(e) {}
  }

  playCarCrash() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.22);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch(e) {}
  }

  updateEngineSound(isDriving, speedRatio) {
    if (this.muted || !this.ctx) return;
    try {
      if (isDriving) {
        if (!this.carEngineOsc) {
          this.carEngineOsc = this.ctx.createOscillator();
          this.carEngineGain = this.ctx.createGain();
          this.carEngineOsc.type = 'sawtooth';
          this.carEngineGain.gain.setValueAtTime(0.035, this.ctx.currentTime);
          this.carEngineOsc.connect(this.carEngineGain);
          this.carEngineGain.connect(this.ctx.destination);
          this.carEngineOsc.start();
        }
        const freq = 55 + Math.min(speedRatio, 1.2) * 110;
        this.carEngineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
      } else {
        if (this.carEngineOsc) {
          this.carEngineGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.05);
          setTimeout(() => {
            if (this.carEngineOsc && !isDriving) {
              try { this.carEngineOsc.stop(); } catch(e){}
              this.carEngineOsc = null;
            }
          }, 80);
        }
      }
    } catch(e) {}
  }
}

const sounds = new SoundController();

// --- CONSTANTS & WEAPONS DEFINITION ---
const MAP_WIDTH = 3200;
const MAP_HEIGHT = 3200;
const WINNING_SCORE = 5;

const WEAPONS = {
  fists: {
    name: 'Musht',
    icon: '👊',
    damage: 18,
    fireRate: 350,
    range: 65,
    bulletSpeed: 0,
    ammo: Infinity,
    isMelee: true
  },
  pistol: {
    name: 'Pistol 9mm',
    icon: '🔫',
    damage: 24,
    fireRate: 260,
    range: 750,
    bulletSpeed: 17,
    ammo: 60,
    maxAmmo: 120
  },
  shotgun: {
    name: 'Shotgun',
    icon: '💥',
    damage: 16,
    pellets: 5,
    spread: 0.26,
    fireRate: 650,
    range: 480,
    bulletSpeed: 14,
    ammo: 24,
    maxAmmo: 48
  },
  ak47: {
    name: 'AK-47',
    icon: '⚡',
    damage: 22,
    fireRate: 110,
    range: 850,
    bulletSpeed: 20,
    ammo: 90,
    maxAmmo: 180
  },
  rocket: {
    name: 'Bazuka (RPG)',
    icon: '🚀',
    damage: 95,
    radius: 120,
    fireRate: 1100,
    range: 900,
    bulletSpeed: 11,
    ammo: 6,
    maxAmmo: 12,
    isRocket: true
  }
};

// --- GAME STATE ---
let canvas, ctx;
let minimapCanvas, minimapCtx;
let gameRunning = false;
let isHost = false;
let peer = null;
let peerConn = null;
let isBotMatch = false;

let localPlayer = null;
let remotePlayer = null;
let botPlayer = null;

let buildings = [];
let cars = [];
let pickups = [];
let bullets = [];
let particles = [];
let skidmarks = [];

let camera = { x: 0, y: 0 };
let input = {
  up: false,
  down: false,
  left: false,
  right: false,
  sprint: false,
  shoot: false,
  enterCar: false,
  aimAngle: 0,
  touchAimActive: false
};

let scores = { local: 0, remote: 0 };
let lastShootTime = 0;
let lastNetSyncTime = 0;

// --- MAP GENERATION ---
function generateMap() {
  buildings = [];
  cars = [];
  pickups = [];
  skidmarks = [];

  const blockSize = 500;
  const roadWidth = 140;
  const numBlocksX = Math.floor(MAP_WIDTH / (blockSize + roadWidth));
  const numBlocksY = Math.floor(MAP_HEIGHT / (blockSize + roadWidth));

  // Generate City Buildings
  for (let bx = 0; bx < numBlocksX; bx++) {
    for (let by = 0; by < numBlocksY; by++) {
      const blockX = roadWidth / 2 + bx * (blockSize + roadWidth);
      const blockY = roadWidth / 2 + by * (blockSize + roadWidth);

      // Park square on some blocks
      if ((bx + by) % 4 === 1) {
        continue;
      }

      const bW1 = blockSize * 0.46;
      const bH1 = blockSize * 0.46;
      const colors = ['#1e293b', '#334155', '#242a38', '#1f2430', '#2d3748'];

      buildings.push({
        x: blockX + 15,
        y: blockY + 15,
        w: bW1,
        h: bH1,
        color: colors[(bx * 3 + by) % colors.length],
        roofColor: '#0f172a',
        hasHelipad: (bx + by) % 3 === 0
      });

      buildings.push({
        x: blockX + bW1 + 35,
        y: blockY + 15,
        w: bW1,
        h: bH1,
        color: colors[(bx * 2 + by + 1) % colors.length],
        roofColor: '#172033',
        hasHelipad: false
      });

      buildings.push({
        x: blockX + 15,
        y: blockY + bH1 + 35,
        w: blockSize - 30,
        h: bH1 * 0.85,
        color: colors[(bx + by * 2) % colors.length],
        roofColor: '#090d16',
        hasHelipad: false
      });
    }
  }

  // Border Outer Walls
  const wallThick = 60;
  buildings.push({ x: -wallThick, y: -wallThick, w: MAP_WIDTH + wallThick * 2, h: wallThick, color: '#05070a', roofColor: '#000' });
  buildings.push({ x: -wallThick, y: MAP_HEIGHT, w: MAP_WIDTH + wallThick * 2, h: wallThick, color: '#05070a', roofColor: '#000' });
  buildings.push({ x: -wallThick, y: 0, w: wallThick, h: MAP_HEIGHT, color: '#05070a', roofColor: '#000' });
  buildings.push({ x: MAP_WIDTH, y: 0, w: wallThick, h: MAP_HEIGHT, color: '#05070a', roofColor: '#000' });

  // Spawn Cars along roads
  const carTypes = [
    { type: 'sports', color: '#ff0055', topSpeed: 13.5, accel: 0.28, turnSpeed: 0.055, name: 'Infernus Sport' },
    { type: 'police', color: '#ffffff', secondColor: '#000000', topSpeed: 12.5, accel: 0.25, turnSpeed: 0.05, isPolice: true, name: 'Police Cruiser' },
    { type: 'muscle', color: '#ffb703', topSpeed: 12.0, accel: 0.32, turnSpeed: 0.046, name: 'Stallion Muscle' },
    { type: 'suv', color: '#00e5ff', topSpeed: 10.5, accel: 0.22, turnSpeed: 0.042, name: 'Patriot SUV' }
  ];

  let carIdCounter = 1;
  for (let bx = 0; bx < numBlocksX; bx++) {
    for (let by = 0; by < numBlocksY; by++) {
      const roadX = bx * (blockSize + roadWidth) + blockSize + roadWidth / 2;
      const roadY = by * (blockSize + roadWidth) + blockSize + roadWidth / 2;

      if ((bx + by) % 2 === 0 && carIdCounter <= 16) {
        const spec = carTypes[carIdCounter % carTypes.length];
        cars.push({
          id: carIdCounter++,
          x: roadX - 30,
          y: roadY - 120,
          angle: 0,
          speed: 0,
          w: 80,
          h: 40,
          hp: 150,
          maxHp: 150,
          spec: spec,
          driverId: null,
          hornActive: false,
          sirenActive: false
        });
      }
    }
  }

  // Spawn Pickups around the map
  const pickupTypes = ['health', 'armor', 'shotgun', 'ak47', 'rocket', 'ammo'];
  for (let i = 0; i < 30; i++) {
    const rx = 150 + Math.random() * (MAP_WIDTH - 300);
    const ry = 150 + Math.random() * (MAP_HEIGHT - 300);
    if (!checkBuildingCollision(rx, ry, 25)) {
      pickups.push({
        id: i + 1,
        x: rx,
        y: ry,
        type: pickupTypes[i % pickupTypes.length],
        active: true,
        respawnTimer: 0
      });
    }
  }
}

// --- COLLISION LOGIC ---
function checkBuildingCollision(x, y, radius = 20) {
  for (const b of buildings) {
    if (
      x + radius > b.x &&
      x - radius < b.x + b.w &&
      y + radius > b.y &&
      y - radius < b.y + b.h
    ) {
      return b;
    }
  }
  return null;
}

// --- PLAYER CLASS ---
class Player {
  constructor(id, name, isLocal = false, color = '#ff0055') {
    this.id = id;
    this.name = name;
    this.isLocal = isLocal;
    this.color = color;

    this.x = 400;
    this.y = 400;
    this.angle = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 22;

    this.hp = 100;
    this.maxHp = 100;
    this.armor = 50;
    this.maxArmor = 100;

    this.currentWeapon = 'pistol';
    this.weapons = {
      fists: { ammo: Infinity },
      pistol: { ammo: 60 },
      shotgun: { ammo: 18 },
      ak47: { ammo: 60 },
      rocket: { ammo: 4 }
    };

    this.inCarId = null;
    this.isDead = false;
    this.respawnTimer = 0;
    this.score = 0;
    this.isSprinting = false;
  }

  respawn(x, y) {
    this.x = x || (200 + Math.random() * (MAP_WIDTH - 400));
    this.y = y || (200 + Math.random() * (MAP_HEIGHT - 400));
    while (checkBuildingCollision(this.x, this.y, 35)) {
      this.x = 200 + Math.random() * (MAP_WIDTH - 400);
      this.y = 200 + Math.random() * (MAP_HEIGHT - 400);
    }
    this.hp = 100;
    this.armor = 50;
    this.isDead = false;
    this.inCarId = null;
    this.vx = 0;
    this.vy = 0;
    showNotification(`${this.name} jangga qaytdi!`);
    updateHudHealth();
  }

  takeDamage(amount, attackerName = '') {
    if (this.isDead) return;

    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, amount * 0.7);
      this.armor -= absorbed;
      amount -= absorbed;
    }
    this.hp -= amount;

    createBloodParticles(this.x, this.y);
    sounds.playHit();

    if (navigator.vibrate && this.isLocal) {
      try { navigator.vibrate(80); } catch(e){}
    }

    if (this.isLocal) {
      updateHudHealth();
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.respawnTimer = 180; // 3 seconds at 60fps

      if (this.inCarId) {
        exitCar(this);
      }

      const killer = attackerName || "Raqib";
      addKillFeed(`${killer} ⚔️ ${this.name}`);

      if (this.isLocal) {
        scores.remote++;
        checkGameWin();
      } else {
        scores.local++;
        checkGameWin();
      }
      updateHudScores();
    }
  }

  update() {
    if (this.isDead) {
      this.respawnTimer--;
      if (this.respawnTimer <= 0 && this.isLocal) {
        this.respawn();
        if (peerConn && peerConn.open) {
          peerConn.send({ type: 'respawn', x: this.x, y: this.y });
        }
      }
      return;
    }

    if (this.inCarId) {
      const car = cars.find(c => c.id === this.inCarId);
      if (car) {
        this.x = car.x;
        this.y = car.y;
        this.angle = car.angle;
      } else {
        this.inCarId = null;
      }
      return;
    }

    // Foot movement physics
    let speed = this.isSprinting ? 6.2 : 4.0;
    let dx = 0;
    let dy = 0;

    if (this.isLocal) {
      if (input.up) dy -= 1;
      if (input.down) dy += 1;
      if (input.left) dx -= 1;
      if (input.right) dx += 1;

      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      this.vx = dx * speed;
      this.vy = dy * speed;

      this.angle = input.aimAngle;
    }

    // Building Collision
    const nextX = this.x + this.vx;
    const nextY = this.y + this.vy;

    if (!checkBuildingCollision(nextX, this.y, this.radius)) {
      this.x = nextX;
    }
    if (!checkBuildingCollision(this.x, nextY, this.radius)) {
      this.y = nextY;
    }

    this.x = Math.max(30, Math.min(MAP_WIDTH - 30, this.x));
    this.y = Math.max(30, Math.min(MAP_HEIGHT - 30, this.y));

    if (this.isLocal) {
      checkPlayerPickups(this);
    }
  }

  draw(context) {
    if (this.isDead || this.inCarId) return;

    context.save();
    context.translate(this.x, this.y);
    context.rotate(this.angle);

    // Shadow
    context.fillStyle = 'rgba(0,0,0,0.35)';
    context.beginPath();
    context.ellipse(3, 3, this.radius, this.radius * 0.85, 0, 0, Math.PI * 2);
    context.fill();

    // Weapon representation
    const wSpec = WEAPONS[this.currentWeapon];
    if (wSpec && !wSpec.isMelee) {
      context.fillStyle = '#1e293b';
      context.fillRect(8, 6, 24, 6);
      if (this.currentWeapon === 'rocket') {
        context.fillStyle = '#475569';
        context.fillRect(4, 4, 30, 10);
      }
    }

    // Arms
    context.fillStyle = '#f6d8ae';
    context.beginPath();
    context.arc(14, 10, 5, 0, Math.PI * 2);
    context.arc(14, -10, 5, 0, Math.PI * 2);
    context.fill();

    // Body / Shirt
    context.fillStyle = this.color;
    context.beginPath();
    context.ellipse(0, 0, 16, 14, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#fff';
    context.lineWidth = 1.5;
    context.stroke();

    // Head
    context.fillStyle = '#f6d8ae';
    context.beginPath();
    context.arc(0, 0, 9, 0, Math.PI * 2);
    context.fill();

    // Cap / Hair
    context.fillStyle = '#111827';
    context.beginPath();
    context.arc(-2, 0, 8, -Math.PI / 2, Math.PI / 2);
    context.fill();

    context.restore();

    this.drawNameTag(context);
  }

  drawNameTag(context) {
    if (this.isDead || this.inCarId) return;
    context.save();
    context.font = 'bold 12px sans-serif';
    context.textAlign = 'center';

    context.fillStyle = '#fff';
    context.shadowColor = '#000';
    context.shadowBlur = 4;
    context.fillText(this.name, this.x, this.y - 32);

    const barW = 40;
    const barH = 5;
    const barX = this.x - barW / 2;
    const barY = this.y - 28;

    context.shadowBlur = 0;
    context.fillStyle = 'rgba(0,0,0,0.6)';
    context.fillRect(barX, barY, barW, barH);

    const hpPercent = Math.max(0, this.hp / this.maxHp);
    context.fillStyle = hpPercent > 0.5 ? '#2ecc71' : hpPercent > 0.25 ? '#f39c12' : '#e74c3c';
    context.fillRect(barX, barY, barW * hpPercent, barH);

    if (this.armor > 0) {
      context.fillStyle = '#3498db';
      context.fillRect(barX, barY - 4, barW * (this.armor / this.maxArmor), 2.5);
    }

    context.restore();
  }
}

// --- CAR CLASS / HANDLING ---
function updateCar(car) {
  const driver = getCarDriver(car);

  if (driver && driver.isLocal) {
    const spec = car.spec;
    const isAccelerating = input.up;
    const isReversing = input.down;
    const isSteeringLeft = input.left;
    const isSteeringRight = input.right;

    if (isAccelerating) {
      car.speed = Math.min(car.speed + spec.accel, spec.topSpeed);
    } else if (isReversing) {
      car.speed = Math.max(car.speed - spec.accel * 0.7, -4.5);
    } else {
      car.speed *= 0.95;
      if (Math.abs(car.speed) < 0.05) car.speed = 0;
    }

    // Steering
    if (Math.abs(car.speed) > 0.3) {
      const dir = car.speed > 0 ? 1 : -1;
      if (isSteeringLeft) car.angle -= spec.turnSpeed * dir;
      if (isSteeringRight) car.angle += spec.turnSpeed * dir;
    }

    // Handbrake / Drift
    if (input.sprint && Math.abs(car.speed) > 4) {
      car.speed *= 0.96;
      createSkidMark(car);
    }

    // Sound engine rumble
    sounds.updateEngineSound(Math.abs(car.speed) > 0.3, Math.abs(car.speed) / spec.topSpeed);

    const vx = Math.cos(car.angle) * car.speed;
    const vy = Math.sin(car.angle) * car.speed;

    const nextX = car.x + vx;
    const nextY = car.y + vy;

    // Building Collision
    const hitB = checkBuildingCollision(nextX, nextY, 32);
    if (hitB) {
      if (Math.abs(car.speed) > 4) {
        sounds.playCarCrash();
        createExplosionParticles(car.x, car.y, 8);
        car.hp -= Math.floor(Math.abs(car.speed) * 3);
        if (navigator.vibrate) {
          try { navigator.vibrate(100); } catch(e){}
        }
      }
      car.speed = -car.speed * 0.4;
    } else {
      car.x = nextX;
      car.y = nextY;
    }

    car.x = Math.max(40, Math.min(MAP_WIDTH - 40, car.x));
    car.y = Math.max(40, Math.min(MAP_HEIGHT - 40, car.y));

    // Ramming opponent player on foot
    const opponent = isBotMatch ? botPlayer : remotePlayer;
    if (opponent && !opponent.isDead && !opponent.inCarId && Math.abs(car.speed) > 4.5) {
      const dist = Math.hypot(opponent.x - car.x, opponent.y - car.y);
      if (dist < 45) {
        const ramDamage = Math.floor(Math.abs(car.speed) * 6);
        opponent.takeDamage(ramDamage, driver.name + " (Moshina urishi)");
        sounds.playCarCrash();
        if (peerConn && peerConn.open) {
          peerConn.send({ type: 'hit', targetId: opponent.id, damage: ramDamage, attacker: driver.name });
        }
      }
    }

    // Car destruction
    if (car.hp <= 0 && !car.isExploded) {
      car.isExploded = true;
      sounds.playExplosion();
      createExplosionParticles(car.x, car.y, 40);
      driver.takeDamage(75, "Moshina Portlashi");
      exitCar(driver);
    }
  } else if (!driver) {
    car.speed *= 0.9;
    if (Math.abs(car.speed) < 0.05) car.speed = 0;
  }
}

function getCarDriver(car) {
  if (localPlayer && localPlayer.inCarId === car.id) return localPlayer;
  if (remotePlayer && remotePlayer.inCarId === car.id) return remotePlayer;
  if (botPlayer && botPlayer.inCarId === car.id) return botPlayer;
  return null;
}

function createSkidMark(car) {
  if (Math.random() > 0.4) return;
  skidmarks.push({
    x: car.x,
    y: car.y,
    angle: car.angle,
    alpha: 0.55
  });
  if (skidmarks.length > 250) {
    skidmarks.shift();
  }
}

function drawCar(context, car) {
  context.save();
  context.translate(car.x, car.y);
  context.rotate(car.angle);

  // Shadow
  context.fillStyle = 'rgba(0,0,0,0.45)';
  context.fillRect(-car.w / 2 + 5, -car.h / 2 + 5, car.w, car.h);

  // Wheels
  context.fillStyle = '#111';
  context.fillRect(-car.w / 2 + 10, -car.h / 2 - 4, 16, 6);
  context.fillRect(car.w / 2 - 26, -car.h / 2 - 4, 16, 6);
  context.fillRect(-car.w / 2 + 10, car.h / 2 - 2, 16, 6);
  context.fillRect(car.w / 2 - 26, car.h / 2 - 2, 16, 6);

  // Body
  context.fillStyle = car.spec.color;
  context.beginPath();
  context.roundRect(-car.w / 2, -car.h / 2, car.w, car.h, 8);
  context.fill();
  context.strokeStyle = '#1e293b';
  context.lineWidth = 1.5;
  context.stroke();

  // Roof & Windshield
  context.fillStyle = '#0f172a';
  context.beginPath();
  context.roundRect(-car.w / 4, -car.h / 2 + 5, car.w / 2, car.h - 10, 4);
  context.fill();

  context.fillStyle = '#38bdf8';
  context.fillRect(car.w / 6, -car.h / 2 + 7, 7, car.h - 14);
  context.fillRect(-car.w / 4 - 3, -car.h / 2 + 7, 5, car.h - 14);

  // Headlights
  if (Math.abs(car.speed) > 0.1 || getCarDriver(car)) {
    context.fillStyle = 'rgba(255, 255, 200, 0.4)';
    context.beginPath();
    context.moveTo(car.w / 2, -12);
    context.lineTo(car.w / 2 + 120, -45);
    context.lineTo(car.w / 2 + 120, 45);
    context.lineTo(car.w / 2, 12);
    context.closePath();
    context.fill();

    if (car.speed < 0 || input.down) {
      context.fillStyle = 'rgba(255, 0, 0, 0.7)';
      context.fillRect(-car.w / 2 - 4, -car.h / 2 + 4, 5, 8);
      context.fillRect(-car.w / 2 - 4, car.h / 2 - 12, 5, 8);
    }
  }

  // Police Siren Flash
  if (car.spec.isPolice && getCarDriver(car)) {
    const flash = Math.floor(Date.now() / 150) % 2 === 0;
    context.fillStyle = flash ? '#ef4444' : '#3b82f6';
    context.beginPath();
    context.arc(0, 0, 7, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();

  // Floating Driver Badge & Car Health
  const driver = getCarDriver(car);
  if (driver) {
    context.save();
    context.font = 'bold 12px sans-serif';
    context.textAlign = 'center';
    context.fillStyle = '#ffb703';
    context.shadowColor = '#000';
    context.shadowBlur = 4;
    context.fillText(`🚗 ${driver.name} [${car.spec.name}]`, car.x, car.y - 36);

    const barW = 48;
    const barH = 5;
    context.fillStyle = 'rgba(0,0,0,0.6)';
    context.fillRect(car.x - barW / 2, car.y - 30, barW, barH);
    context.fillStyle = '#f59e0b';
    context.fillRect(car.x - barW / 2, car.y - 30, barW * (car.hp / car.maxHp), barH);
    context.restore();
  }
}

// --- CAR ENTRY / EXIT ---
function toggleCarEntry(player) {
  if (player.inCarId) {
    exitCar(player);
  } else {
    let closestCar = null;
    let minDist = 80;
    for (const car of cars) {
      if (getCarDriver(car) === null) {
        const d = Math.hypot(car.x - player.x, car.y - player.y);
        if (d < minDist) {
          minDist = d;
          closestCar = car;
        }
      }
    }

    if (closestCar) {
      player.inCarId = closestCar.id;
      closestCar.driverId = player.id;
      sounds.playCarHorn();
      showNotification(`${closestCar.spec.name} ga mindingiz!`);

      if (peerConn && peerConn.open) {
        peerConn.send({ type: 'carEnter', playerId: player.id, carId: closestCar.id });
      }
    }
  }
}

function exitCar(player) {
  if (!player.inCarId) return;
  const car = cars.find(c => c.id === player.inCarId);
  if (car) {
    car.driverId = null;
    player.x = car.x + Math.cos(car.angle + Math.PI / 2) * 45;
    player.y = car.y + Math.sin(car.angle + Math.PI / 2) * 45;
    if (checkBuildingCollision(player.x, player.y, player.radius)) {
      player.x = car.x;
      player.y = car.y;
    }
  }
  const oldCarId = player.inCarId;
  player.inCarId = null;

  sounds.updateEngineSound(false, 0);

  if (peerConn && peerConn.open) {
    peerConn.send({ type: 'carExit', playerId: player.id, carId: oldCarId });
  }
}

// --- WEAPONS & COMBAT ---
function shootWeapon(player) {
  if (player.isDead) return;

  const wKey = player.currentWeapon;
  const w = WEAPONS[wKey];
  const now = performance.now();

  if (now - lastShootTime < w.fireRate) return;
  if (w.ammo !== Infinity && player.weapons[wKey].ammo <= 0) {
    showNotification("O'q tugadi! Qurol almashtiring.");
    return;
  }

  lastShootTime = now;

  if (w.ammo !== Infinity) {
    player.weapons[wKey].ammo--;
    updateHudWeapon();
  }

  const spawnDist = player.inCarId ? 45 : 28;
  const muzzleX = player.x + Math.cos(player.angle) * spawnDist;
  const muzzleY = player.y + Math.sin(player.angle) * spawnDist;

  if (w.isMelee) {
    sounds.playPunch();
    createPunchImpact(muzzleX, muzzleY, player.angle);

    const target = isBotMatch ? botPlayer : remotePlayer;
    if (target && !target.isDead) {
      const d = Math.hypot(target.x - muzzleX, target.y - muzzleY);
      if (d < w.range) {
        target.takeDamage(w.damage, player.name);
        if (peerConn && peerConn.open) {
          peerConn.send({ type: 'hit', targetId: target.id, damage: w.damage, attacker: player.name });
        }
      }
    }
  } else if (wKey === 'shotgun') {
    sounds.playShoot('shotgun');
    for (let i = 0; i < w.pellets; i++) {
      const spreadAngle = player.angle + (Math.random() - 0.5) * w.spread;
      spawnBullet(muzzleX, muzzleY, spreadAngle, wKey, player.id);
    }
  } else if (wKey === 'rocket') {
    sounds.playShoot('rocket');
    spawnBullet(muzzleX, muzzleY, player.angle, wKey, player.id);
  } else {
    sounds.playShoot(wKey);
    spawnBullet(muzzleX, muzzleY, player.angle, wKey, player.id);
  }

  if (peerConn && peerConn.open) {
    peerConn.send({
      type: 'shoot',
      weapon: wKey,
      x: muzzleX,
      y: muzzleY,
      angle: player.angle,
      shooterId: player.id
    });
  }
}

function spawnBullet(x, y, angle, weaponKey, ownerId) {
  const w = WEAPONS[weaponKey];
  bullets.push({
    x: x,
    y: y,
    vx: Math.cos(angle) * w.bulletSpeed,
    vy: Math.sin(angle) * w.bulletSpeed,
    angle: angle,
    distanceTraveled: 0,
    maxRange: w.range,
    damage: w.damage,
    weaponKey: weaponKey,
    ownerId: ownerId,
    isRocket: !!w.isRocket
  });
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    b.distanceTraveled += Math.hypot(b.vx, b.vy);

    if (b.isRocket) {
      particles.push({
        x: b.x - Math.cos(b.angle) * 10,
        y: b.y - Math.sin(b.angle) * 10,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: 4 + Math.random() * 4,
        alpha: 0.6,
        color: '#94a3b8',
        life: 25
      });
    }

    if (checkBuildingCollision(b.x, b.y, 6)) {
      if (b.isRocket) {
        triggerRocketExplosion(b.x, b.y, b.ownerId);
      } else {
        createSparkParticles(b.x, b.y);
      }
      bullets.splice(i, 1);
      continue;
    }

    let hitCar = false;
    for (const car of cars) {
      const d = Math.hypot(car.x - b.x, car.y - b.y);
      if (d < 38) {
        car.hp -= b.damage;
        createSparkParticles(b.x, b.y);
        hitCar = true;
        if (b.isRocket) {
          triggerRocketExplosion(b.x, b.y, b.ownerId);
        }
        break;
      }
    }
    if (hitCar) {
      bullets.splice(i, 1);
      continue;
    }

    const targets = [localPlayer, remotePlayer, botPlayer].filter(p => p && !p.isDead && p.id !== b.ownerId);
    let hitPlayer = false;

    for (const target of targets) {
      const d = Math.hypot(target.x - b.x, target.y - b.y);
      if (d < target.radius) {
        if (b.isRocket) {
          triggerRocketExplosion(b.x, b.y, b.ownerId);
        } else {
          target.takeDamage(b.damage, b.ownerId === localPlayer.id ? localPlayer.name : "Raqib");
          if (localPlayer.id === b.ownerId && peerConn && peerConn.open) {
            peerConn.send({ type: 'hit', targetId: target.id, damage: b.damage, attacker: localPlayer.name });
          }
        }
        hitPlayer = true;
        break;
      }
    }

    if (hitPlayer || b.distanceTraveled >= b.maxRange) {
      if (b.isRocket && b.distanceTraveled >= b.maxRange) {
        triggerRocketExplosion(b.x, b.y, b.ownerId);
      }
      bullets.splice(i, 1);
    }
  }
}

function triggerRocketExplosion(x, y, ownerId) {
  sounds.playExplosion();
  createExplosionParticles(x, y, 50);

  const targets = [localPlayer, remotePlayer, botPlayer].filter(p => p && !p.isDead);
  for (const t of targets) {
    const d = Math.hypot(t.x - x, t.y - y);
    if (d < 140) {
      const dmg = Math.floor((1 - d / 140) * 95);
      t.takeDamage(dmg, ownerId === localPlayer.id ? localPlayer.name : "Raqib (RPG)");
    }
  }
}

function drawBullets(context) {
  for (const b of bullets) {
    context.save();
    context.translate(b.x, b.y);
    context.rotate(b.angle);

    if (b.isRocket) {
      context.fillStyle = '#f97316';
      context.fillRect(-12, -4, 24, 8);
      context.fillStyle = '#ef4444';
      context.beginPath();
      context.moveTo(12, -4);
      context.lineTo(18, 0);
      context.lineTo(12, 4);
      context.fill();
    } else {
      context.fillStyle = '#ffb703';
      context.shadowColor = '#fb8500';
      context.shadowBlur = 8;
      context.fillRect(-6, -2, 12, 4);
    }

    context.restore();
  }
}

// --- PARTICLES & FX ---
function createBloodParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      radius: 2 + Math.random() * 3,
      alpha: 0.9,
      color: '#dc2626',
      life: 20
    });
  }
}

function createSparkParticles(x, y) {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      radius: 1.5 + Math.random() * 2,
      alpha: 1,
      color: '#facc15',
      life: 15
    });
  }
}

function createPunchImpact(x, y, angle) {
  for (let i = 0; i < 5; i++) {
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle + (Math.random() - 0.5)) * 4,
      vy: Math.sin(angle + (Math.random() - 0.5)) * 4,
      radius: 3,
      alpha: 0.8,
      color: '#ffffff',
      life: 12
    });
  }
}

function createExplosionParticles(x, y, count = 35) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 8;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 4 + Math.random() * 8,
      alpha: 1,
      color: Math.random() > 0.4 ? '#ff0055' : Math.random() > 0.5 ? '#f59e0b' : '#334155',
      life: 30 + Math.random() * 20
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 1 / p.life;
    if (p.alpha <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles(context) {
  for (const p of particles) {
    context.save();
    context.globalAlpha = Math.max(0, p.alpha);
    context.fillStyle = p.color;
    context.beginPath();
    context.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

// --- ITEM PICKUPS ---
function checkPlayerPickups(player) {
  for (const p of pickups) {
    if (!p.active) {
      p.respawnTimer--;
      if (p.respawnTimer <= 0) p.active = true;
      continue;
    }

    const d = Math.hypot(p.x - player.x, p.y - player.y);
    if (d < 35) {
      p.active = false;
      p.respawnTimer = 900;
      sounds.playPickup();

      if (p.type === 'health') {
        player.hp = Math.min(player.maxHp, player.hp + 50);
        showNotification("❤️ +50 Sog'lik olindi!");
      } else if (p.type === 'armor') {
        player.armor = Math.min(player.maxArmor, player.armor + 50);
        showNotification("🛡️ +50 Zirh olindi!");
      } else if (p.type === 'ammo') {
        for (const w of Object.keys(player.weapons)) {
          if (WEAPONS[w].ammo !== Infinity) {
            player.weapons[w].ammo = Math.min(WEAPONS[w].maxAmmo, player.weapons[w].ammo + 30);
          }
        }
        showNotification("📦 O'q-dorilar to'ldirildi!");
      } else if (p.type === 'shotgun') {
        player.weapons.shotgun.ammo = Math.min(WEAPONS.shotgun.maxAmmo, player.weapons.shotgun.ammo + 12);
        player.currentWeapon = 'shotgun';
        showNotification("💥 Shotgun topildi!");
      } else if (p.type === 'ak47') {
        player.weapons.ak47.ammo = Math.min(WEAPONS.ak47.maxAmmo, player.weapons.ak47.ammo + 45);
        player.currentWeapon = 'ak47';
        showNotification("⚡ AK-47 topildi!");
      } else if (p.type === 'rocket') {
        player.weapons.rocket.ammo = Math.min(WEAPONS.rocket.maxAmmo, player.weapons.rocket.ammo + 3);
        player.currentWeapon = 'rocket';
        showNotification("🚀 Bazuka (RPG) topildi!");
      }

      updateHudWeapon();
      updateHudHealth();
    }
  }
}

function drawPickups(context) {
  for (const p of pickups) {
    if (!p.active) continue;

    context.save();
    context.translate(p.x, p.y);

    const pulse = 1 + Math.sin(Date.now() / 200) * 0.15;
    context.scale(pulse, pulse);

    let color = '#2ecc71';
    let icon = '❤️';
    if (p.type === 'armor') { color = '#3498db'; icon = '🛡️'; }
    if (p.type === 'ammo') { color = '#ffb703'; icon = '📦'; }
    if (p.type === 'shotgun') { color = '#e67e22'; icon = '💥'; }
    if (p.type === 'ak47') { color = '#9b59b6'; icon = '⚡'; }
    if (p.type === 'rocket') { color = '#e74c3c'; icon = '🚀'; }

    context.fillStyle = color;
    context.beginPath();
    context.arc(0, 0, 16, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#fff';
    context.lineWidth = 2;
    context.stroke();

    context.font = '14px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(icon, 0, 1);

    context.restore();
  }
}

// --- AI BOT 1V1 (Practice mode) ---
function updateBot() {
  if (!botPlayer || botPlayer.isDead) {
    if (botPlayer && botPlayer.isDead) botPlayer.update();
    return;
  }

  const distToLocal = Math.hypot(localPlayer.x - botPlayer.x, localPlayer.y - botPlayer.y);
  let targetAngle = Math.atan2(localPlayer.y - botPlayer.y, localPlayer.x - botPlayer.x);
  botPlayer.angle = targetAngle;

  if (botPlayer.hp < 40) {
    const medkit = pickups.find(p => p.active && p.type === 'health');
    if (medkit) {
      targetAngle = Math.atan2(medkit.y - botPlayer.y, medkit.x - botPlayer.x);
      botPlayer.angle = targetAngle;
    }
  }

  const moveSpeed = botPlayer.isSprinting ? 5.5 : 3.8;
  const vx = Math.cos(targetAngle) * moveSpeed;
  const vy = Math.sin(targetAngle) * moveSpeed;

  const nextX = botPlayer.x + vx;
  const nextY = botPlayer.y + vy;

  if (!checkBuildingCollision(nextX, botPlayer.y, botPlayer.radius)) {
    botPlayer.x = nextX;
  }
  if (!checkBuildingCollision(botPlayer.x, nextY, botPlayer.radius)) {
    botPlayer.y = nextY;
  }

  if (distToLocal < 550 && !localPlayer.isDead) {
    if (distToLocal < 80) {
      botPlayer.currentWeapon = 'fists';
    } else if (distToLocal < 300 && botPlayer.weapons.shotgun.ammo > 0) {
      botPlayer.currentWeapon = 'shotgun';
    } else if (botPlayer.weapons.ak47.ammo > 0) {
      botPlayer.currentWeapon = 'ak47';
    } else {
      botPlayer.currentWeapon = 'pistol';
    }

    if (Math.random() < 0.08) {
      shootWeapon(botPlayer);
    }
  }
}

// --- RENDERING MAP & WORLD ---
function drawWorld() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  // Asphalt roads
  drawRoadNetwork(ctx);

  // Tire Skidmarks
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 14;
  for (const sm of skidmarks) {
    ctx.save();
    ctx.globalAlpha = sm.alpha;
    ctx.translate(sm.x, sm.y);
    ctx.rotate(sm.angle);
    ctx.strokeRect(-15, -12, 30, 24);
    ctx.restore();
  }

  // Pickups
  drawPickups(ctx);

  // Cars
  for (const car of cars) {
    drawCar(ctx, car);
  }

  // Players
  if (localPlayer) localPlayer.draw(ctx);
  if (remotePlayer) remotePlayer.draw(ctx);
  if (botPlayer) botPlayer.draw(ctx);

  // Bullets & Particles
  drawBullets(ctx);
  drawParticles(ctx);

  // Buildings (Depth on top)
  drawBuildings(ctx);

  ctx.restore();

  drawMinimap();
}

function drawRoadNetwork(context) {
  const blockSize = 500;
  const roadWidth = 140;
  const numBlocksX = Math.floor(MAP_WIDTH / (blockSize + roadWidth));
  const numBlocksY = Math.floor(MAP_HEIGHT / (blockSize + roadWidth));

  context.fillStyle = '#1e293b';
  for (let bx = 0; bx <= numBlocksX; bx++) {
    const rx = bx * (blockSize + roadWidth);
    context.fillRect(rx, 0, roadWidth, MAP_HEIGHT);
  }
  for (let by = 0; by <= numBlocksY; by++) {
    const ry = by * (blockSize + roadWidth);
    context.fillRect(0, ry, MAP_WIDTH, roadWidth);
  }

  // Yellow dashed lane lines
  context.strokeStyle = '#facc15';
  context.lineWidth = 3;
  context.setLineDash([20, 20]);

  for (let bx = 0; bx <= numBlocksX; bx++) {
    const rx = bx * (blockSize + roadWidth) + roadWidth / 2;
    context.beginPath();
    context.moveTo(rx, 0);
    context.lineTo(rx, MAP_HEIGHT);
    context.stroke();
  }
  for (let by = 0; by <= numBlocksY; by++) {
    const ry = by * (blockSize + roadWidth) + roadWidth / 2;
    context.beginPath();
    context.moveTo(0, ry);
    context.lineTo(MAP_WIDTH, ry);
    context.stroke();
  }
  context.setLineDash([]);
}

function drawBuildings(context) {
  for (const b of buildings) {
    // Drop shadow
    context.fillStyle = 'rgba(0,0,0,0.5)';
    context.fillRect(b.x + 8, b.y + 8, b.w, b.h);

    // Wall structure
    context.fillStyle = b.color;
    context.fillRect(b.x, b.y, b.w, b.h);

    // Roof
    context.fillStyle = b.roofColor;
    context.fillRect(b.x + 8, b.y + 8, b.w - 16, b.h - 16);

    // Helipad
    if (b.hasHelipad) {
      context.strokeStyle = '#facc15';
      context.lineWidth = 3;
      context.beginPath();
      context.arc(b.x + b.w / 2, b.y + b.h / 2, 28, 0, Math.PI * 2);
      context.stroke();
      context.font = 'bold 24px sans-serif';
      context.fillStyle = '#facc15';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('H', b.x + b.w / 2, b.y + b.h / 2);
    }
  }
}

// --- MINIMAP RADAR ---
function drawMinimap() {
  if (!minimapCtx || !localPlayer) return;
  const mW = minimapCanvas.width;
  const mH = minimapCanvas.height;

  minimapCtx.fillStyle = '#0b0f19';
  minimapCtx.fillRect(0, 0, mW, mH);

  const scaleX = mW / MAP_WIDTH;
  const scaleY = mH / MAP_HEIGHT;

  minimapCtx.fillStyle = '#1e293b';
  for (const b of buildings) {
    minimapCtx.fillRect(b.x * scaleX, b.y * scaleY, b.w * scaleX, b.h * scaleY);
  }

  minimapCtx.fillStyle = '#f59e0b';
  for (const car of cars) {
    minimapCtx.fillRect(car.x * scaleX - 1.5, car.y * scaleY - 1.5, 3, 3);
  }

  const opp = isBotMatch ? botPlayer : remotePlayer;
  if (opp && !opp.isDead) {
    minimapCtx.fillStyle = '#00e5ff';
    minimapCtx.beginPath();
    minimapCtx.arc(opp.x * scaleX, opp.y * scaleY, 4, 0, Math.PI * 2);
    minimapCtx.fill();
  }

  minimapCtx.fillStyle = '#ff0055';
  minimapCtx.beginPath();
  minimapCtx.arc(localPlayer.x * scaleX, localPlayer.y * scaleY, 4.5, 0, Math.PI * 2);
  minimapCtx.fill();
}

// --- CAMERA FOLLOW ---
function updateCamera() {
  if (!localPlayer) return;
  const targetX = localPlayer.x - canvas.width / 2;
  const targetY = localPlayer.y - canvas.height / 2;

  camera.x += (targetX - camera.x) * 0.12;
  camera.y += (targetY - camera.y) * 0.12;

  camera.x = Math.max(0, Math.min(MAP_WIDTH - canvas.width, camera.x));
  camera.y = Math.max(0, Math.min(MAP_HEIGHT - canvas.height, camera.y));
}

// --- MAIN LOOP ---
function gameLoop() {
  if (!gameRunning) return;

  if (localPlayer) {
    localPlayer.update();

    if (input.shoot) {
      shootWeapon(localPlayer);
    }
    updateHudHealth();
  }

  if (isBotMatch) {
    updateBot();
  }

  for (const car of cars) {
    updateCar(car);
  }

  updateBullets();
  updateParticles();
  updateCamera();
  drawWorld();

  const now = performance.now();
  if (peerConn && peerConn.open && now - lastNetSyncTime > 33) {
    lastNetSyncTime = now;
    broadcastPlayerState();
  }

  updateActionTips();

  requestAnimationFrame(gameLoop);
}

function updateActionTips() {
  const tipEl = document.getElementById('action-tip');
  const carBtn = document.getElementById('btn-touch-car');
  if (!tipEl || !localPlayer) return;

  if (localPlayer.inCarId) {
    tipEl.style.display = 'block';
    tipEl.innerText = "🚗 Moshinadan tushish: [F] yoki [Moshina tugmasi]";
    if (carBtn) carBtn.classList.add('highlight');
  } else {
    let near = false;
    for (const car of cars) {
      if (Math.hypot(car.x - localPlayer.x, car.y - localPlayer.y) < 80) {
        near = true;
        break;
      }
    }
    if (near) {
      tipEl.style.display = 'block';
      tipEl.innerText = "🚗 Moshinaga minish: [F] yoki [Moshina tugmasi]";
      if (carBtn) carBtn.classList.add('highlight');
    } else {
      tipEl.style.display = 'none';
      if (carBtn) carBtn.classList.remove('highlight');
    }
  }
}

// --- PEER-TO-PEER MULTIPLAYER ENGINE (PeerJS) ---
function initPeerHost(playerName) {
  sounds.init();
  if (typeof Peer === 'undefined') {
    alert("Internetga ulanish zarur (WebRTC serveri uchun). Agar oflayn bo'lsangiz, 'Mashq (Bot bilan)' rejimida o'ynashingiz mumkin!");
    return;
  }

  const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  const peerId = 'gta1v1-' + roomCode;

  try {
    peer = new Peer(peerId, { debug: 1 });

    peer.on('open', (id) => {
      isHost = true;
      document.getElementById('display-room-code').innerText = roomCode;
      document.getElementById('host-waiting-box').classList.remove('hidden');
      document.getElementById('main-menu-card').classList.add('hidden');
      showNotification(`Xona yaratildi! Kod: ${roomCode}`);
    });

    peer.on('connection', (conn) => {
      peerConn = conn;
      setupPeerHandlers(conn, playerName);
    });

    peer.on('error', (err) => {
      console.error("Peer error:", err);
      alert("Xona yaratishda xatolik yuz berdi: " + err.type);
    });
  } catch(e) {
    alert("Xatolik: " + e.message);
  }
}

function joinPeerRoom(roomCode, playerName) {
  sounds.init();
  if (typeof Peer === 'undefined') {
    alert("Internetga ulanish zarur (WebRTC serveri uchun). Agar oflayn bo'lsangiz, 'Mashq (Bot bilan)' rejimida o'ynashingiz mumkin!");
    return;
  }

  const cleanCode = roomCode.trim().toUpperCase();
  const targetId = 'gta1v1-' + cleanCode;

  try {
    peer = new Peer(null, { debug: 1 });

    peer.on('open', (id) => {
      peerConn = peer.connect(targetId);
      setupPeerHandlers(peerConn, playerName);
    });

    peer.on('error', (err) => {
      console.error("Join error:", err);
      alert("Ulanish amalga oshmadi. Kodni to'g'ri kiritganingizni tekshiring!");
    });
  } catch(e) {
    alert("Ulanishda xatolik: " + e.message);
  }
}

function setupPeerHandlers(conn, playerName) {
  conn.on('open', () => {
    document.getElementById('overlay-lobby').classList.add('hidden');

    conn.send({
      type: 'handshake',
      name: playerName || "O'yinchi",
      isHost: isHost
    });

    startGame(false);
  });

  conn.on('data', (data) => {
    handleNetworkMessage(data);
  });

  conn.on('close', () => {
    showNotification("Raqib o'yindan chiqdi!");
    addKillFeed("Raqib tark etdi");
  });
}

function broadcastPlayerState() {
  if (!localPlayer || !peerConn) return;

  peerConn.send({
    type: 'state',
    x: localPlayer.x,
    y: localPlayer.y,
    angle: localPlayer.angle,
    vx: localPlayer.vx,
    vy: localPlayer.vy,
    hp: localPlayer.hp,
    armor: localPlayer.armor,
    weapon: localPlayer.currentWeapon,
    inCarId: localPlayer.inCarId,
    score: scores.local
  });
}

function handleNetworkMessage(msg) {
  if (!msg) return;

  if (msg.type === 'handshake') {
    if (!remotePlayer) {
      remotePlayer = new Player('remote_p2', msg.name, false, '#00e5ff');
      remotePlayer.respawn(800, 800);
      document.getElementById('p2-hud-name').innerText = msg.name;
    }
  } else if (msg.type === 'state') {
    if (!remotePlayer) {
      remotePlayer = new Player('remote_p2', "Raqib", false, '#00e5ff');
    }
    remotePlayer.x += (msg.x - remotePlayer.x) * 0.4;
    remotePlayer.y += (msg.y - remotePlayer.y) * 0.4;
    remotePlayer.angle = msg.angle;
    remotePlayer.hp = msg.hp;
    remotePlayer.armor = msg.armor;
    remotePlayer.currentWeapon = msg.weapon;
    remotePlayer.inCarId = msg.inCarId;
  } else if (msg.type === 'shoot') {
    if (msg.shooterId !== localPlayer.id) {
      sounds.playShoot(msg.weapon);
      spawnBullet(msg.x, msg.y, msg.angle, msg.weapon, msg.shooterId);
    }
  } else if (msg.type === 'hit') {
    if (msg.targetId === localPlayer.id) {
      localPlayer.takeDamage(msg.damage, msg.attacker);
    }
  } else if (msg.type === 'carEnter') {
    if (remotePlayer) remotePlayer.inCarId = msg.carId;
  } else if (msg.type === 'carExit') {
    if (remotePlayer) remotePlayer.inCarId = null;
  } else if (msg.type === 'respawn') {
    if (remotePlayer) remotePlayer.respawn(msg.x, msg.y);
  }
}

// --- START GAME & GAME OVER ---
function startGame(isSoloBot = false) {
  sounds.init();
  isBotMatch = isSoloBot;
  document.getElementById('overlay-lobby').classList.add('hidden');
  document.getElementById('game-over-modal').classList.add('hidden');

  generateMap();

  const playerName = document.getElementById('player-nickname').value.trim() || "O'yinchi 1";
  localPlayer = new Player('local_p1', playerName, true, '#ff0055');
  localPlayer.respawn(400, 400);

  scores = { local: 0, remote: 0 };
  updateHudScores();
  updateHudHealth();
  updateHudWeapon();

  document.getElementById('p1-hud-name').innerText = playerName;

  if (isSoloBot) {
    botPlayer = new Player('bot_p2', 'Pro Bot [AI]', false, '#00e5ff');
    botPlayer.respawn(1200, 1200);
    document.getElementById('p2-hud-name').innerText = "Pro Bot [AI]";
  }

  gameRunning = true;
  requestAnimationFrame(gameLoop);
}

function checkGameWin() {
  if (scores.local >= WINNING_SCORE || scores.remote >= WINNING_SCORE) {
    gameRunning = false;
    const modal = document.getElementById('game-over-modal');
    const winnerText = document.getElementById('winner-announcement');
    const statsText = document.getElementById('final-stats-text');

    if (scores.local >= WINNING_SCORE) {
      winnerText.innerText = `🏆 TABRIKLAYMIZ! G'ALABA QOZONDINGIZ!`;
      winnerText.style.color = '#2ecc71';
      statsText.innerText = `Hisob: ${scores.local} - ${scores.remote}`;
    } else {
      winnerText.innerText = `💀 MAG'LUB BO'LDINGIZ!`;
      winnerText.style.color = '#e74c3c';
      statsText.innerText = `Hisob: ${scores.remote} - ${scores.local}`;
    }
    modal.classList.remove('hidden');
  }
}

// --- HUD & NOTIFICATIONS ---
function updateHudHealth() {
  if (!localPlayer) return;
  const hpPercent = Math.max(0, (localPlayer.hp / localPlayer.maxHp) * 100);
  const armorPercent = Math.max(0, (localPlayer.armor / localPlayer.maxArmor) * 100);

  const hpFill = document.getElementById('hud-health-fill');
  const hpVal = document.getElementById('hud-health-val');
  if (hpFill) hpFill.style.width = hpPercent + '%';
  if (hpVal) hpVal.innerText = Math.round(localPlayer.hp);

  const armorFill = document.getElementById('hud-armor-fill');
  const armorVal = document.getElementById('hud-armor-val');
  if (armorFill) armorFill.style.width = armorPercent + '%';
  if (armorVal) armorVal.innerText = Math.round(localPlayer.armor);

  const carWrap = document.getElementById('hud-car-wrap');
  if (carWrap) {
    if (localPlayer.inCarId) {
      const c = cars.find(car => car.id === localPlayer.inCarId);
      if (c) {
        carWrap.style.display = 'flex';
        const cHp = Math.max(0, (c.hp / c.maxHp) * 100);
        document.getElementById('hud-car-fill').style.width = cHp + '%';
        document.getElementById('hud-car-val').innerText = Math.round(c.hp);
      }
    } else {
      carWrap.style.display = 'none';
    }
  }
}

function updateHudWeapon() {
  if (!localPlayer) return;
  const wKey = localPlayer.currentWeapon;
  const w = WEAPONS[wKey];

  const iconEl = document.getElementById('hud-weapon-icon');
  const nameEl = document.getElementById('hud-weapon-name');
  const ammoEl = document.getElementById('hud-ammo-val');

  if (iconEl) iconEl.innerText = w.icon;
  if (nameEl) nameEl.innerText = w.name;

  if (ammoEl) {
    if (w.ammo === Infinity) {
      ammoEl.innerText = '∞';
    } else {
      ammoEl.innerText = localPlayer.weapons[wKey].ammo;
    }
  }
}

function updateHudScores() {
  const p1El = document.getElementById('score-p1');
  const p2El = document.getElementById('score-p2');
  if (p1El) p1El.innerText = scores.local;
  if (p2El) p2El.innerText = scores.remote;
}

function showNotification(text) {
  const note = document.createElement('div');
  note.className = 'killfeed-item';
  note.innerText = text;
  const feed = document.getElementById('killfeed');
  if (feed) {
    feed.appendChild(note);
    setTimeout(() => note.remove(), 4000);
  }
}

function addKillFeed(text) {
  showNotification(text);
}

function cycleWeapon() {
  if (!localPlayer) return;
  const keys = Object.keys(WEAPONS);
  const curIdx = keys.indexOf(localPlayer.currentWeapon);
  const nextIdx = (curIdx + 1) % keys.length;
  localPlayer.currentWeapon = keys[nextIdx];
  updateHudWeapon();
  sounds.playPickup();
}

// --- CONTROLS SETUP: KEYBOARD, MOUSE & TOUCH ---
function setupControls() {
  // Keyboard
  window.addEventListener('keydown', (e) => {
    sounds.init();
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') input.up = true;
    if (k === 's' || k === 'arrowdown') input.down = true;
    if (k === 'a' || k === 'arrowleft') input.left = true;
    if (k === 'd' || k === 'arrowright') input.right = true;
    if (e.key === 'Shift') input.sprint = true;
    if (k === 'f' || e.key === 'Enter') {
      if (localPlayer) toggleCarEntry(localPlayer);
    }
    if (k === 'q' || k === 'e') {
      cycleWeapon();
    }
    if (k === 'h') {
      if (localPlayer && localPlayer.inCarId) sounds.playCarHorn();
    }
  });

  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') input.up = false;
    if (k === 's' || k === 'arrowdown') input.down = false;
    if (k === 'a' || k === 'arrowleft') input.left = false;
    if (k === 'd' || k === 'arrowright') input.right = false;
    if (e.key === 'Shift') input.sprint = false;
  });

  // Mouse Aiming & Shooting
  window.addEventListener('mousemove', (e) => {
    if (!localPlayer || input.touchAimActive) return;
    const playerScreenX = localPlayer.x - camera.x;
    const playerScreenY = localPlayer.y - camera.y;
    input.aimAngle = Math.atan2(e.clientY - playerScreenY, e.clientX - playerScreenX);
  });

  window.addEventListener('mousedown', (e) => {
    if (e.target.closest('#hud') || e.target.closest('.overlay-screen')) return;
    sounds.init();
    if (e.button === 0) input.shoot = true;
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) input.shoot = false;
  });

  // Mobile Virtual Joystick (Left side: Movement)
  setupMobileJoystick();

  // Mobile Action Buttons (Right side)
  setupMobileButtons();
}

function setupMobileJoystick() {
  const joyZone = document.getElementById('joystick-zone');
  const joyThumb = document.getElementById('joystick-thumb');
  if (!joyZone || !joyThumb) return;

  let touchId = null;
  let startX = 0, startY = 0;
  const maxDist = 50;

  joyZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    sounds.init();
    const t = e.changedTouches[0];
    touchId = t.identifier;
    const rect = joyZone.getBoundingClientRect();
    startX = rect.left + rect.width / 2;
    startY = rect.top + rect.height / 2;
    handleMove(t.clientX, t.clientY);
  }, { passive: false });

  joyZone.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId) {
        handleMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
      }
    }
  }, { passive: false });

  const endJoystick = (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId) {
        touchId = null;
        input.up = false;
        input.down = false;
        input.left = false;
        input.right = false;
        joyThumb.style.transform = `translate(0px, 0px)`;
      }
    }
  };

  joyZone.addEventListener('touchend', endJoystick);
  joyZone.addEventListener('touchcancel', endJoystick);

  function handleMove(clientX, clientY) {
    const dx = clientX - startX;
    const dy = clientY - startY;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    const clampedDist = Math.min(dist, maxDist);
    const thumbX = Math.cos(angle) * clampedDist;
    const thumbY = Math.sin(angle) * clampedDist;

    joyThumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;

    const threshold = 14;
    input.left = dx < -threshold;
    input.right = dx > threshold;
    input.up = dy < -threshold;
    input.down = dy > threshold;

    if (!input.touchAimActive && dist > threshold) {
      input.aimAngle = angle;
    }
  }
}

function setupMobileButtons() {
  const shootBtn = document.getElementById('btn-touch-shoot');
  const carBtn = document.getElementById('btn-touch-car');
  const weaponBtn = document.getElementById('btn-touch-weapon');
  const sprintBtn = document.getElementById('btn-touch-sprint');
  const hornBtn = document.getElementById('btn-touch-horn');

  if (shootBtn) {
    shootBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      sounds.init();
      input.shoot = true;
      shootBtn.classList.add('pressed');
    }, { passive: false });

    shootBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      input.shoot = false;
      shootBtn.classList.remove('pressed');
    });
  }

  if (carBtn) {
    carBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      sounds.init();
      if (localPlayer) toggleCarEntry(localPlayer);
    }, { passive: false });
  }

  if (weaponBtn) {
    weaponBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      sounds.init();
      cycleWeapon();
    }, { passive: false });
  }

  if (sprintBtn) {
    sprintBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      input.sprint = true;
      sprintBtn.classList.add('pressed');
    }, { passive: false });

    sprintBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      input.sprint = false;
      sprintBtn.classList.remove('pressed');
    });
  }

  if (hornBtn) {
    hornBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      sounds.playCarHorn();
    }, { passive: false });
  }

  // Right touch-area aim tracking
  window.addEventListener('touchstart', (e) => {
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i];
      if (t.clientX > window.innerWidth / 2 && !t.target.closest('.touch-btn') && !t.target.closest('#hud')) {
        input.touchAimActive = true;
        updateTouchAim(t.clientX, t.clientY);
      }
    }
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i];
      if (t.clientX > window.innerWidth / 2 && !t.target.closest('.touch-btn') && !t.target.closest('#hud')) {
        updateTouchAim(t.clientX, t.clientY);
      }
    }
  }, { passive: false });

  window.addEventListener('touchend', () => {
    input.touchAimActive = false;
  });

  function updateTouchAim(cx, cy) {
    if (!localPlayer) return;
    const playerScreenX = localPlayer.x - camera.x;
    const playerScreenY = localPlayer.y - camera.y;
    input.aimAngle = Math.atan2(cy - playerScreenY, cx - playerScreenX);
  }
}

// --- WINDOW RESIZE & INIT ---
function resizeCanvas() {
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  if (minimapCanvas) {
    minimapCanvas.width = 140;
    minimapCanvas.height = 140;
  }
}

window.addEventListener('resize', resizeCanvas);

window.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  minimapCanvas = document.getElementById('minimapCanvas');
  minimapCtx = minimapCanvas.getContext('2d');

  resizeCanvas();
  setupControls();

  const fsBtn = document.getElementById('btn-fullscreen');
  if (fsBtn) {
    fsBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  const muteBtn = document.getElementById('btn-mute');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      sounds.muted = !sounds.muted;
      muteBtn.innerText = sounds.muted ? '🔇' : '🔊';
    });
  }

  const createRoomBtn = document.getElementById('btn-create-room');
  if (createRoomBtn) {
    createRoomBtn.addEventListener('click', () => {
      const name = document.getElementById('player-nickname').value.trim() || "O'yinchi 1";
      initPeerHost(name);
    });
  }

  const joinRoomBtn = document.getElementById('btn-join-room');
  if (joinRoomBtn) {
    joinRoomBtn.addEventListener('click', () => {
      const code = document.getElementById('room-code-input').value.trim();
      if (!code) {
        alert("Iltimos, do'stingiz bergan xona kodini kiriting!");
        return;
      }
      const name = document.getElementById('player-nickname').value.trim() || "O'yinchi 2";
      joinPeerRoom(code, name);
    });
  }

  const soloBtn = document.getElementById('btn-solo-practice');
  if (soloBtn) {
    soloBtn.addEventListener('click', () => {
      startGame(true);
    });
  }

  const restartBtn = document.getElementById('btn-restart-game');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      startGame(isBotMatch);
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('room');
  if (roomParam) {
    const roomInput = document.getElementById('room-code-input');
    if (roomInput) {
      roomInput.value = roomParam;
      showNotification(`Xona kodi topildi: ${roomParam}`);
    }
  }

  const copyBtn = document.getElementById('btn-copy-code');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const code = document.getElementById('display-room-code').innerText;
      const shareUrl = `${window.location.origin}${window.location.pathname}?room=${code}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        showNotification("Havola nusxalandi! Do'stingizga yuboring.");
      }).catch(() => {
        showNotification(`Xona kodi: ${code}`);
      });
    });
  }
});
