/**
 * ===================================================================
 * TURBO DRIFT 3D - ASOSIY O'YIN MOTORASI (GAME.JS)
 * - 3D Poyga (Three.js)
 * - 12 kishilik poyga (Odamlar + Aqlli Botlar)
 * - WebRTC Onlayn Multiplayer (PeerJS, 12 o'yinchigacha)
 * - 5 xil Poyga Zonalari (Shahar, Sahro, Qor, Vulqon, O'rmon)
 * - Avto Bozor & Garaj (6 xil mashinalar, Upgradelar, Bo'yash)
 * - Web Audio API bilan haqiqiy motor va drift tovushlari
 * - Mobil telefonlar uchun to'liq sensorli boshqaruv
 * ===================================================================
 */

(function () {
  'use strict';

  // -------------------------------------------------------------
  // 1. O'YIN SOZLAMALARI VA STATISTIKASI (LOCALSTORAGE)
  // -------------------------------------------------------------
  const STORAGE_KEYS = {
    COINS: 'turbo_drift_coins',
    UNLOCKED: 'turbo_drift_unlocked_cars',
    CURRENT_CAR: 'turbo_drift_current_car',
    CAR_COLORS: 'turbo_drift_car_colors',
    UPGRADES: 'turbo_drift_upgrades',
    SETTINGS: 'turbo_drift_settings'
  };

  const GameData = {
    coins: 1000,
    unlockedCars: ['car_gt'],
    selectedCarId: 'car_gt',
    selectedZoneId: 'cyber',
    carColors: {
      car_gt: '#eab308',
      car_monza: '#ef4444',
      car_venom: '#10b981',
      car_phantom: '#8b5cf6',
      car_hyperion: '#06b6d4',
      car_zenith: '#f8fafc'
    },
    upgrades: {
      engine: 1,
      accel: 1,
      handling: 1,
      nitro: 1
    },
    settings: {
      sound: true,
      touchControls: true,
      cameraMode: 'chase', // chase, hood, top
      graphics: 'high'
    },

    load() {
      try {
        const savedCoins = localStorage.getItem(STORAGE_KEYS.COINS);
        if (savedCoins !== null) this.coins = parseInt(savedCoins, 10);

        const savedUnlocked = localStorage.getItem(STORAGE_KEYS.UNLOCKED);
        if (savedUnlocked) {
          this.unlockedCars = JSON.parse(savedUnlocked);
          if (!this.unlockedCars.includes('car_gt')) this.unlockedCars.unshift('car_gt');
        }

        const savedCar = localStorage.getItem(STORAGE_KEYS.CURRENT_CAR);
        if (savedCar) {
          this.selectedCarId = savedCar === 'car_starter' ? 'car_gt' : savedCar;
        }

        const savedColors = localStorage.getItem(STORAGE_KEYS.CAR_COLORS);
        if (savedColors) this.carColors = Object.assign(this.carColors, JSON.parse(savedColors));

        const savedUpgrades = localStorage.getItem(STORAGE_KEYS.UPGRADES);
        if (savedUpgrades) this.upgrades = Object.assign(this.upgrades, JSON.parse(savedUpgrades));

        const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (savedSettings) this.settings = Object.assign(this.settings, JSON.parse(savedSettings));
      } catch (e) {
        console.warn('LocalStorage yuklashda xatolik:', e);
      }
    },

    save() {
      try {
        localStorage.setItem(STORAGE_KEYS.COINS, this.coins.toString());
        localStorage.setItem(STORAGE_KEYS.UNLOCKED, JSON.stringify(this.unlockedCars));
        localStorage.setItem(STORAGE_KEYS.CURRENT_CAR, this.selectedCarId);
        localStorage.setItem(STORAGE_KEYS.CAR_COLORS, JSON.stringify(this.carColors));
        localStorage.setItem(STORAGE_KEYS.UPGRADES, JSON.stringify(this.upgrades));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      } catch (e) {
        console.warn('LocalStorage saqlashda xatolik:', e);
      }
    },

    addCoins(amount) {
      this.coins += amount;
      this.save();
      updateCoinDisplay();
    }
  };

  // -------------------------------------------------------------
  // 2. MASHINALAR VA BOZOR KATALOGI (6 TA 3D SUPERKAR)
  // -------------------------------------------------------------
  const CAR_CATALOG = [
    {
      id: 'car_gt',
      name: 'Apex GT 3D',
      carClass: 'V8 Superkar (Rasmdagi)',
      price: 0,
      baseSpeed: 235,
      baseAccel: 3.2,
      baseHandling: 82,
      baseNitro: 110,
      color: '#eab308', // Rasmdagi yorqin sariq 3D rang
      desc: '3D-modellashtirilgan afsonaviy sariq V8 superkar'
    },
    {
      id: 'car_monza',
      name: 'Monza Spyder',
      carClass: 'Twin-Turbo Roadster',
      price: 1800,
      baseSpeed: 260,
      baseAccel: 2.8,
      baseHandling: 86,
      baseNitro: 125,
      color: '#ef4444',
      desc: 'Rosso qizil rangdagi poyga versiyasi'
    },
    {
      id: 'car_venom',
      name: 'Venom GTS',
      carClass: 'Aero Track Edition',
      price: 4500,
      baseSpeed: 285,
      baseAccel: 2.4,
      baseHandling: 89,
      baseNitro: 140,
      color: '#10b981',
      desc: 'Katta burilish barqarorligiga ega superkar'
    },
    {
      id: 'car_phantom',
      name: 'Phantom Stealth',
      carClass: 'Carbon Special',
      price: 8500,
      baseSpeed: 310,
      baseAccel: 2.0,
      baseHandling: 92,
      baseNitro: 155,
      color: '#8b5cf6',
      desc: 'Binafsha supportlar va to\'q uglerodli korpus'
    },
    {
      id: 'car_hyperion',
      name: 'Hyperion SV',
      carClass: 'V12 Hyper Series',
      price: 14000,
      baseSpeed: 335,
      baseAccel: 1.7,
      baseHandling: 95,
      baseNitro: 175,
      color: '#06b6d4',
      desc: 'Ekstremal tezlik va chaqqon boshqaruv'
    },
    {
      id: 'car_zenith',
      name: 'Zenith Ultimate',
      carClass: 'Hypercar Afsonasi',
      price: 22000,
      baseSpeed: 365,
      baseAccel: 1.4,
      baseHandling: 99,
      baseNitro: 195,
      color: '#f8fafc',
      desc: 'Maksimal ko\'rsatkichlarga ega mutlaq chempion'
    }
  ];

  const COLOR_PALETTE = [
    '#eab308', '#ef4444', '#10b981', '#8b5cf6', 
    '#06b6d4', '#f8fafc', '#171717', '#f97316', 
    '#3b82f6', '#ec4899'
  ];

  // -------------------------------------------------------------
  // 3. POYGA ZONALARI (5 TA XARITA)
  // -------------------------------------------------------------
  const ZONES = [
    {
      id: 'cyber',
      name: 'Kiber Neon Shahar',
      badge: 'Tungi Trassa',
      desc: 'Yaltiroq asfalt, neon osmono\'par binolar va yuqori tezlik ko\'prigi',
      cssClass: 'zone-cyber',
      skyColor: 0x050814,
      fogColor: 0x0b132b,
      groundColor: 0x070b19,
      roadColor: 0x141b2d,
      curbColor: 0x00f3ff,
      ambientColor: 0x223355,
      sunColor: 0x00f3ff,
      sunIntensity: 1.2,
      particleType: 'cyberGrid'
    },
    {
      id: 'desert',
      name: 'Sahro Bo\'roni',
      badge: 'Qumli Kanyon',
      desc: 'Oltin qum barxanlari, piramidalar va issiq shamolli burilishlar',
      cssClass: 'zone-desert',
      skyColor: 0xfb8b24,
      fogColor: 0x9a031e,
      groundColor: 0xd48b3c,
      roadColor: 0x3d2c1d,
      curbColor: 0xffbe0b,
      ambientColor: 0x5a3214,
      sunColor: 0xffe29a,
      sunIntensity: 1.6,
      particleType: 'sandDust'
    },
    {
      id: 'snow',
      name: 'Qorli Cho\'qqilar',
      badge: 'Muzli Tog\'',
      desc: 'Muzlagan ko\'l, qalin qor archalari va sirpanchiq ajoyib drift',
      cssClass: 'zone-snow',
      skyColor: 0x457b9d,
      fogColor: 0x1d3557,
      groundColor: 0xe0f2fe,
      roadColor: 0x64748b,
      curbColor: 0x00f3ff,
      ambientColor: 0x334e68,
      sunColor: 0xffffff,
      sunIntensity: 1.4,
      particleType: 'snowFlakes'
    },
    {
      id: 'volcano',
      name: 'Vulqon Qonuni',
      badge: 'Lava Halqasi',
      desc: 'Olovli lava daryolari, vulqon qoyalari va ekstremal olov yo\'li',
      cssClass: 'zone-volcano',
      skyColor: 0x2b0606,
      fogColor: 0x470808,
      groundColor: 0x1c1010,
      roadColor: 0x241a1a,
      curbColor: 0xff3b30,
      ambientColor: 0x661818,
      sunColor: 0xff5400,
      sunIntensity: 1.5,
      particleType: 'fireEmbers'
    },
    {
      id: 'forest',
      name: 'Yashil Vodiy',
      badge: 'Klassik Ralli',
      desc: 'Yam-yashil adirlar, archa o\'rmonlari va musaffo quyoshli osmon',
      cssClass: 'zone-forest',
      skyColor: 0x38b000,
      fogColor: 0x1b4332,
      groundColor: 0x2d6a4f,
      roadColor: 0x212529,
      curbColor: 0xffffff,
      ambientColor: 0x2d4a3e,
      sunColor: 0xfffae0,
      sunIntensity: 1.8,
      particleType: 'fallingLeaves'
    }
  ];

  // Botlar uchun 11 ta maxsus nikneymlar va xarakterlar (Rasmdagi superkarlar bilan)
  const BOT_PROFILES = [
    { name: 'Temur Poygachi', carId: 'car_monza', color: '#ef4444', skill: 0.95 },
    { name: 'Speedy_Uz', carId: 'car_gt', color: '#eab308', skill: 0.92 },
    { name: 'Vortex_99', carId: 'car_phantom', color: '#8b5cf6', skill: 0.96 },
    { name: 'Drift_Master', carId: 'car_zenith', color: '#f8fafc', skill: 0.98 },
    { name: 'Falcon_X', carId: 'car_gt', color: '#eab308', skill: 0.88 },
    { name: 'Blaze_Tashkent', carId: 'car_venom', color: '#10b981', skill: 0.90 },
    { name: 'Shadow_Samarkand', carId: 'car_phantom', color: '#171717', skill: 0.93 },
    { name: 'Titan_Rider', carId: 'car_hyperion', color: '#06b6d4', skill: 0.89 },
    { name: 'Ghost_Phantom', carId: 'car_zenith', color: '#ffffff', skill: 0.94 },
    { name: 'Thunder_Bukhara', carId: 'car_monza', color: '#f97316', skill: 0.97 },
    { name: 'Nitro_Boy', carId: 'car_gt', color: '#3b82f6', skill: 0.87 }
  ];

  // -------------------------------------------------------------
  // 4. WEB AUDIO SINTESATOR (ENGINE, DRIFT, NITRO, COIN, CRASH)
  // -------------------------------------------------------------
  class SoundSynthesizer {
    constructor() {
      this.ctx = null;
      this.engineOsc1 = null;
      this.engineOsc2 = null;
      this.engineGain = null;
      this.driftNoise = null;
      this.driftGain = null;
      this.isStarted = false;
    }

    init() {
      if (this.ctx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.createEngineSound();
      this.createDriftSound();
      this.isStarted = true;
    }

    createEngineSound() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0, now);

      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(55, now);

      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(110, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      this.engineOsc1.connect(filter);
      this.engineOsc2.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc1.start();
      this.engineOsc2.start();
    }

    createDriftSound() {
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1200, this.ctx.currentTime);
      bandpass.Q.setValueAtTime(3.0, this.ctx.currentTime);

      this.driftGain = this.ctx.createGain();
      this.driftGain.gain.setValueAtTime(0, this.ctx.currentTime);

      whiteNoise.connect(bandpass);
      bandpass.connect(this.driftGain);
      this.driftGain.connect(this.ctx.destination);

      whiteNoise.start();
    }

    updateEngine(speedKmh, isGas, isNitro) {
      if (!this.ctx || !GameData.settings.sound) {
        if (this.engineGain) this.engineGain.gain.setValueAtTime(0, this.ctx ? this.ctx.currentTime : 0);
        return;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const speedRatio = Math.min(speedKmh / 300, 1);
      const baseFreq = 50 + speedRatio * 180 + (isNitro ? 50 : 0);
      const now = this.ctx.currentTime;

      this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
      this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.05);

      const targetGain = isGas ? 0.14 : 0.06;
      this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);
    }

    setDrift(active) {
      if (!this.ctx || !GameData.settings.sound || !this.driftGain) return;
      const targetGain = active ? 0.18 : 0;
      this.driftGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.06);
    }

    playNitroSound() {
      if (!this.ctx || !GameData.settings.sound) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    }

    playCoinSound() {
      if (!this.ctx || !GameData.settings.sound) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.32);
    }

    playCountdownBeep(isFinal) {
      if (!this.ctx || !GameData.settings.sound) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isFinal ? 880 : 440, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + (isFinal ? 0.6 : 0.25));

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + (isFinal ? 0.65 : 0.28));
    }

    playVictorySound() {
      if (!this.ctx || !GameData.settings.sound) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(now + 0.42);
        }, idx * 140);
      });
    }
  }

  const audioSynth = new SoundSynthesizer();

  // -------------------------------------------------------------
  // 5. 3D MASHINA YARATISH YORDAMCHISI (PROCEDURAL 3D MESHES)
  // -------------------------------------------------------------
  function create3DCarMesh(carConfig, colorHex) {
    const carGroup = new THREE.Group();
    const primaryColor = new THREE.Color(colorHex || carConfig.color || '#eab308');

    // Asosiy kuzov materiali (3D modellashtirishdagi silliq sariq metallik)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.28,
      metalness: 0.55
    });

    const blackTrimMat = new THREE.MeshStandardMaterial({
      color: 0x11161d,
      roughness: 0.8,
      metalness: 0.2
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.1
    });

    const brakeRotorMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      metalness: 0.9,
      roughness: 0.25
    });

    const caliperMat = new THREE.MeshStandardMaterial({
      color: 0xd946ef, // Rasmdagi pushti-binafsha (magenta) tormoz supporti
      roughness: 0.35,
      metalness: 0.6
    });

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      roughness: 0.3,
      metalness: 0.85
    });

    // Qora CAD kontur chizig'i qo'shish yordamchisi (Rasmdagi kabi barcha qirralar chizig'i)
    function addCADLines(mesh, threshold = 22) {
      if (!mesh || !mesh.geometry) return;
      const edges = new THREE.EdgesGeometry(mesh.geometry, threshold);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x050505,
        linewidth: 1.5,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
      });
      const lines = new THREE.LineSegments(edges, lineMat);
      mesh.add(lines);
    }

    // 1. Asosiy Markaziy Kuzov (Main Center Monocoque)
    const mainBodyGeo = new THREE.BoxGeometry(1.94, 0.48, 4.3);
    const mainBody = new THREE.Mesh(mainBodyGeo, bodyMat);
    mainBody.position.set(0, 0.44, 0);
    mainBody.castShadow = true;
    addCADLines(mainBody, 20);
    carGroup.add(mainBody);

    // 2. Old Tumshuq va Kapot (Sloping Aerodynamic Hood)
    const hoodGeo = new THREE.BoxGeometry(1.86, 0.32, 1.45);
    const hoodMesh = new THREE.Mesh(hoodGeo, bodyMat);
    hoodMesh.position.set(0, 0.48, 1.4);
    hoodMesh.rotation.x = -0.14; // Oldinga nishab
    addCADLines(hoodMesh, 18);
    carGroup.add(hoodMesh);

    // Kapot o'rtasidagi qavariq shtampovka (Rasmdagi kapot naqshi)
    const hoodBadgeGeo = new THREE.BoxGeometry(1.15, 0.04, 0.95);
    const hoodBadge = new THREE.Mesh(hoodBadgeGeo, bodyMat);
    hoodBadge.position.set(0, 0.58, 1.4);
    hoodBadge.rotation.x = -0.14;
    addCADLines(hoodBadge, 15);
    carGroup.add(hoodBadge);

    // Old bamper va radiator panjarasi (Front lower air intake)
    const frontGrilleGeo = new THREE.BoxGeometry(1.1, 0.16, 0.1);
    const frontGrille = new THREE.Mesh(frontGrilleGeo, blackTrimMat);
    frontGrille.position.set(0, 0.28, 2.18);
    addCADLines(frontGrille, 15);
    carGroup.add(frontGrille);

    // Old yon tormoz havo teshiklari (Brake cooling ducts)
    const leftDuct = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.08), blackTrimMat);
    leftDuct.position.set(-0.76, 0.32, 2.1);
    addCADLines(leftDuct, 15);
    carGroup.add(leftDuct);

    const rightDuct = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.08), blackTrimMat);
    rightDuct.position.set(0.76, 0.32, 2.1);
    addCADLines(rightDuct, 15);
    carGroup.add(rightDuct);

    // 3. Kabina (Sleek Teardrop Greenhouse Cockpit)
    const cabinGeo = new THREE.BoxGeometry(1.52, 0.58, 1.85);
    const cabinMesh = new THREE.Mesh(cabinGeo, glassMat);
    cabinMesh.position.set(0, 0.92, -0.15);
    addCADLines(cabinMesh, 20);
    carGroup.add(cabinMesh);

    // Tom paneli (Body colored roof strip)
    const roofGeo = new THREE.BoxGeometry(1.24, 0.06, 1.1);
    const roofMesh = new THREE.Mesh(roofGeo, bodyMat);
    roofMesh.position.set(0, 1.22, -0.18);
    addCADLines(roofMesh, 15);
    carGroup.add(roofMesh);

    // Yon oynalar va qora ustunlar (A-pillars)
    const aPillarLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.08), blackTrimMat);
    aPillarLeft.position.set(-0.72, 0.88, 0.65);
    aPillarLeft.rotation.x = -0.45;
    carGroup.add(aPillarLeft);

    const aPillarRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.08), blackTrimMat);
    aPillarRight.position.set(0.72, 0.88, 0.65);
    aPillarRight.rotation.x = -0.45;
    carGroup.add(aPillarRight);

    // Oyna tozalagichlar (Windshield Wipers)
    const wiperLeft = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.04), blackTrimMat);
    wiperLeft.position.set(-0.25, 0.68, 0.82);
    wiperLeft.rotation.z = 0.2;
    carGroup.add(wiperLeft);

    // Yon ko'zgular (Aerodynamic Side Mirrors on stalks)
    const mirrorStemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.16, 8);
    const mirrorGeo = new THREE.BoxGeometry(0.24, 0.12, 0.12);

    const leftStem = new THREE.Mesh(mirrorStemGeo, blackTrimMat);
    leftStem.position.set(-0.95, 0.78, 0.45);
    leftStem.rotation.z = 0.4;
    const leftMirror = new THREE.Mesh(mirrorGeo, blackTrimMat);
    leftMirror.position.set(-1.05, 0.84, 0.45);
    addCADLines(leftMirror, 15);
    carGroup.add(leftStem);
    carGroup.add(leftMirror);

    const rightStem = new THREE.Mesh(mirrorStemGeo, blackTrimMat);
    rightStem.position.set(0.95, 0.78, 0.45);
    rightStem.rotation.z = -0.4;
    const rightMirror = new THREE.Mesh(mirrorGeo, blackTrimMat);
    rightMirror.position.set(1.05, 0.84, 0.45);
    addCADLines(rightMirror, 15);
    carGroup.add(rightStem);
    carGroup.add(rightMirror);

    // 4. Yon Havo Yutkichlar (McLaren uslubidagi katta qora havo teshiklari - rasmdagidek)
    const scoopGeo = new THREE.BoxGeometry(0.12, 0.52, 0.8);
    const leftScoop = new THREE.Mesh(scoopGeo, blackTrimMat);
    leftScoop.position.set(-0.97, 0.54, -0.65);
    addCADLines(leftScoop, 15);
    carGroup.add(leftScoop);

    const rightScoop = new THREE.Mesh(scoopGeo, blackTrimMat);
    rightScoop.position.set(0.97, 0.54, -0.65);
    addCADLines(rightScoop, 15);
    carGroup.add(rightScoop);

    // Eshik o'ymasi (Sculpted Door insets)
    const doorInsetLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 1.2), bodyMat);
    doorInsetLeft.position.set(-0.95, 0.50, 0.2);
    addCADLines(doorInsetLeft, 15);
    carGroup.add(doorInsetLeft);

    const doorInsetRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 1.2), bodyMat);
    doorInsetRight.position.set(0.95, 0.50, 0.2);
    addCADLines(doorInsetRight, 15);
    carGroup.add(doorInsetRight);

    // 5. Old Chiroqlar (Dual Projector Lenses inside Swept-back casing)
    const headlightGeo = new THREE.BoxGeometry(0.38, 0.14, 0.65);
    const lampGeo = new THREE.SphereGeometry(0.06, 12, 12);
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xeff6ff });

    // Chap fara
    const leftHeadlight = new THREE.Mesh(headlightGeo, glassMat);
    leftHeadlight.position.set(-0.64, 0.58, 1.7);
    leftHeadlight.rotation.y = -0.15;
    leftHeadlight.rotation.x = -0.18;
    addCADLines(leftHeadlight, 15);
    const leftLamp1 = new THREE.Mesh(lampGeo, lampMat);
    leftLamp1.position.set(-0.62, 0.58, 1.82);
    const leftLamp2 = new THREE.Mesh(lampGeo, lampMat);
    leftLamp2.position.set(-0.66, 0.59, 1.62);
    carGroup.add(leftHeadlight);
    carGroup.add(leftLamp1);
    carGroup.add(leftLamp2);

    // O'ng fara
    const rightHeadlight = new THREE.Mesh(headlightGeo, glassMat);
    rightHeadlight.position.set(0.64, 0.58, 1.7);
    rightHeadlight.rotation.y = 0.15;
    rightHeadlight.rotation.x = -0.18;
    addCADLines(rightHeadlight, 15);
    const rightLamp1 = new THREE.Mesh(lampGeo, lampMat);
    rightLamp1.position.set(0.62, 0.58, 1.82);
    const rightLamp2 = new THREE.Mesh(lampGeo, lampMat);
    rightLamp2.position.set(0.66, 0.59, 1.62);
    carGroup.add(rightHeadlight);
    carGroup.add(rightLamp1);
    carGroup.add(rightLamp2);

    // 6. Orqa Qism, Spoyler va Diffuzor (Rear Deck, Lip Spoiler & Diffuser)
    const rearDeckGeo = new THREE.BoxGeometry(1.92, 0.44, 1.2);
    const rearDeck = new THREE.Mesh(rearDeckGeo, bodyMat);
    rearDeck.position.set(0, 0.56, -1.6);
    addCADLines(rearDeck, 18);
    carGroup.add(rearDeck);

    // Orqa Daktell Spoyler (Ducktail Spoiler)
    const spoilerGeo = new THREE.BoxGeometry(1.78, 0.08, 0.35);
    const spoilerMesh = new THREE.Mesh(spoilerGeo, blackTrimMat);
    spoilerMesh.position.set(0, 0.82, -2.1);
    spoilerMesh.rotation.x = 0.2;
    addCADLines(spoilerMesh, 15);
    carGroup.add(spoilerMesh);

    // Orqa qizil LED stop chiroqlar (Taillights)
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const tailGeo = new THREE.BoxGeometry(0.7, 0.06, 0.05);
    const leftTail = new THREE.Mesh(tailGeo, tailMat);
    leftTail.position.set(-0.55, 0.62, -2.16);
    const rightTail = new THREE.Mesh(tailGeo, tailMat);
    rightTail.position.set(0.55, 0.62, -2.16);
    carGroup.add(leftTail);
    carGroup.add(rightTail);

    // Ikkita Dumaloq Xrom Glushitel (Dual High-Mount Chrome Exhaust Pipes)
    const exhaustGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.18, 16);
    exhaustGeo.rotateX(Math.PI / 2);
    const leftExhaust = new THREE.Mesh(exhaustGeo, chromeMat);
    leftExhaust.position.set(-0.25, 0.62, -2.16);
    const rightExhaust = new THREE.Mesh(exhaustGeo, chromeMat);
    rightExhaust.position.set(0.25, 0.62, -2.16);
    carGroup.add(leftExhaust);
    carGroup.add(rightExhaust);

    // Orqa diffuzor (Rear Aero Diffuser)
    const diffuserGeo = new THREE.BoxGeometry(1.6, 0.16, 0.4);
    const diffuserMesh = new THREE.Mesh(diffuserGeo, blackTrimMat);
    diffuserMesh.position.set(0, 0.22, -2.05);
    addCADLines(diffuserMesh, 15);
    carGroup.add(diffuserMesh);

    // 7. G'ildiraklar va Disklar (5-Spoke Star Alloy Wheels with Brake Rotors & Calipers)
    const wheelRadius = 0.44;
    const wheelWidth = 0.32;
    const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24);
    tireGeo.rotateZ(Math.PI / 2);

    const wheels = [];
    const wheelPositions = [
      { x: -0.98, y: wheelRadius, z: 1.35, isFront: true },
      { x: 0.98, y: wheelRadius, z: 1.35, isFront: true },
      { x: -1.02, y: wheelRadius, z: -1.35, isFront: false },
      { x: 1.02, y: wheelRadius, z: -1.35, isFront: false }
    ];

    wheelPositions.forEach((pos) => {
      const wheelHub = new THREE.Group();
      wheelHub.position.set(pos.x, pos.y, pos.z);

      // Shina (Rubber tire with CAD outline)
      const tireMesh = new THREE.Mesh(tireGeo, blackTrimMat);
      tireMesh.castShadow = true;
      addCADLines(tireMesh, 35);
      wheelHub.add(tireMesh);

      // Tormoz Diski (Perforated Silver Brake Rotor)
      const rotorGeo = new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, 0.04, 16);
      rotorGeo.rotateZ(Math.PI / 2);
      const rotorMesh = new THREE.Mesh(rotorGeo, brakeRotorMat);
      wheelHub.add(rotorMesh);

      // Tormoz Supporti (Pushti/Binafsha Caliper)
      const caliperGeo = new THREE.BoxGeometry(0.12, 0.18, 0.2);
      const caliperMesh = new THREE.Mesh(caliperGeo, caliperMat);
      caliperMesh.position.set(pos.x > 0 ? 0.08 : -0.08, wheelRadius * 0.3, 0);
      addCADLines(caliperMesh, 20);
      wheelHub.add(caliperMesh);

      // 5-Spoke Yulduzli Qora Disk (5-Spoke Star Rim)
      const rimGroup = new THREE.Group();
      for (let s = 0; s < 5; s++) {
        const spokeGeo = new THREE.BoxGeometry(0.04, wheelRadius * 0.7, 0.06);
        const spokeMesh = new THREE.Mesh(spokeGeo, rimMat);
        spokeMesh.rotation.x = (s * Math.PI * 2) / 5;
        spokeMesh.position.x = pos.x > 0 ? wheelWidth / 2 - 0.02 : -wheelWidth / 2 + 0.02;
        rimGroup.add(spokeMesh);
      }

      // Markaziy boltlar va qopqoq
      const capGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.08, 12);
      capGeo.rotateZ(Math.PI / 2);
      const capMesh = new THREE.Mesh(capGeo, chromeMat);
      capMesh.position.x = pos.x > 0 ? wheelWidth / 2 : -wheelWidth / 2;
      rimGroup.add(capMesh);

      wheelHub.add(rimGroup);
      carGroup.add(wheelHub);

      wheels.push({ group: wheelHub, mesh: tireMesh, rimGroup, isFront: pos.isFront });
    });

    // Nitro olov alanga mesh
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0 });
    const flameGeo = new THREE.ConeGeometry(0.18, 0.7, 8);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.set(0, 0.62, -2.45);
    carGroup.add(flameMesh);

    // 8. Mashina ostidagi qora kontakt soyasi
    const shadowGeo = new THREE.PlaneGeometry(2.3, 4.6);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 64;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(32, 64, 4, 32, 64, 45);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.55)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 64, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = 0.02;
    carGroup.add(shadowMesh);

    // Obyekt havolalari
    carGroup.userData = {
      wheels,
      flameMesh,
      flameMat,
      mainBody,
      bodyMat,
      config: carConfig
    };

    return carGroup;
  }

  // -------------------------------------------------------------
  // 6. GARAJ VA BOZOR KANVASI (3D TURNTABLE PREVIEW)
  // -------------------------------------------------------------
  let garageScene, garageCamera, garageRenderer, garageCarGroup;
  let garageCurrentIdx = 0;

  function initGarageViewer() {
    const canvas = document.getElementById('garage-canvas');
    if (!canvas) return;

    garageScene = new THREE.Scene();
    garageScene.background = new THREE.Color(0x0a0f1d);

    const width = canvas.clientWidth || 400;
    const height = canvas.clientHeight || 280;

    garageCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    garageCamera.position.set(5.5, 3.2, 5.5);
    garageCamera.lookAt(0, 0.6, 0);

    garageRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    garageRenderer.setSize(width, height);
    garageRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Yoritish (Rasmdagi sariq superkarni chiroyli ko'rsatish uchun studiya chiroqlari)
    const ambLight = new THREE.AmbientLight(0xffffff, 1.1);
    garageScene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.6);
    dirLight.position.set(6, 10, 6);
    garageScene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.9);
    fillLight.position.set(-6, 5, -6);
    garageScene.add(fillLight);

    // Pol doirasi (Podium)
    const platformGeo = new THREE.CylinderGeometry(3.2, 3.4, 0.2, 32);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x141b2d,
      roughness: 0.3,
      metalness: 0.7
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -0.1;
    garageScene.add(platform);

    // Neon halqa
    const ringGeo = new THREE.RingGeometry(3.1, 3.25, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.01;
    garageScene.add(ringMesh);

    // Boshlang'ich tanlangan mashinani yuklash
    garageCurrentIdx = CAR_CATALOG.findIndex(c => c.id === GameData.selectedCarId);
    if (garageCurrentIdx < 0) garageCurrentIdx = 0;
    updateGarageCar();

    // Animatsiya tsikli
    function animateGarage() {
      requestAnimationFrame(animateGarage);
      if (garageCarGroup) {
        garageCarGroup.rotation.y += 0.012;
      }
      garageRenderer.render(garageScene, garageCamera);
    }
    animateGarage();
  }

  function updateGarageCar() {
    const carConfig = CAR_CATALOG[garageCurrentIdx];
    if (!carConfig) return;

    if (garageCarGroup) {
      garageScene.remove(garageCarGroup);
    }

    const savedColor = GameData.carColors[carConfig.id] || carConfig.color;
    garageCarGroup = create3DCarMesh(carConfig, savedColor);
    garageScene.add(garageCarGroup);

    // UI ma'lumotlarini yangilash
    document.getElementById('preview-car-name').innerText = carConfig.name;
    document.getElementById('preview-car-class').innerText = carConfig.carClass;

    // Stat bar qiymatlari (Upgradelarni hisobga olgan holda)
    const isOwned = GameData.unlockedCars.includes(carConfig.id);
    const isSelected = GameData.selectedCarId === carConfig.id;

    const speedBonus = isSelected ? (GameData.upgrades.engine - 1) * 15 : 0;
    const accelBonus = isSelected ? (GameData.upgrades.accel - 1) * 0.3 : 0;
    const handlingBonus = isSelected ? (GameData.upgrades.handling - 1) * 4 : 0;
    const nitroBonus = isSelected ? (GameData.upgrades.nitro - 1) * 12 : 0;

    const curSpeed = carConfig.baseSpeed + speedBonus;
    const curAccel = Math.max(1.2, (carConfig.baseAccel - accelBonus)).toFixed(1);
    const curHandling = Math.min(100, carConfig.baseHandling + handlingBonus);
    const curNitro = carConfig.baseNitro + nitroBonus;

    document.getElementById('stat-speed-val').innerText = `${curSpeed} km/soat`;
    document.getElementById('stat-speed-bar').style.width = `${Math.min(100, (curSpeed / 350) * 100)}%`;

    document.getElementById('stat-accel-val').innerText = `${curAccel} s`;
    document.getElementById('stat-accel-bar').style.width = `${Math.min(100, ((4.5 - curAccel) / 3.0) * 100)}%`;

    document.getElementById('stat-handling-val').innerText = `${curHandling}%`;
    document.getElementById('stat-handling-bar').style.width = `${curHandling}%`;

    document.getElementById('stat-nitro-val').innerText = `${curNitro}%`;
    document.getElementById('stat-nitro-bar').style.width = `${Math.min(100, (curNitro / 200) * 100)}%`;

    // Tanlash yoki Sotib olish tugmasi
    const actionBtn = document.getElementById('btn-car-action');
    if (isSelected) {
      actionBtn.innerText = '✓ TANLANGAN';
      actionBtn.className = 'btn btn-primary';
      actionBtn.disabled = true;
    } else if (isOwned) {
      actionBtn.innerText = 'BU MASHINANI TANLASH';
      actionBtn.className = 'btn btn-primary';
      actionBtn.disabled = false;
    } else {
      actionBtn.innerText = `SOTIB OLISH ($${carConfig.price.toLocaleString()})`;
      actionBtn.className = 'btn btn-gold';
      actionBtn.disabled = GameData.coins < carConfig.price;
    }

    renderGarageThumbnails();
    renderColorSwatches();
    updateUpgradeButtons();
  }

  function renderGarageThumbnails() {
    const container = document.getElementById('garage-thumbs-container');
    if (!container) return;
    container.innerHTML = '';

    CAR_CATALOG.forEach((car, idx) => {
      const isOwned = GameData.unlockedCars.includes(car.id);
      const isSelected = idx === garageCurrentIdx;

      const card = document.createElement('div');
      card.className = `car-thumb-card ${isSelected ? 'active' : ''}`;
      card.innerHTML = `
        <span style="font-size: 1.2rem;">${isOwned ? '🏎️' : '🔒'}</span>
        <span class="car-thumb-name">${car.name}</span>
      `;
      card.addEventListener('click', () => {
        garageCurrentIdx = idx;
        updateGarageCar();
      });
      container.appendChild(card);
    });
  }

  function renderColorSwatches() {
    const container = document.getElementById('car-color-swatches');
    if (!container) return;
    container.innerHTML = '';

    const carConfig = CAR_CATALOG[garageCurrentIdx];
    const currentColor = GameData.carColors[carConfig.id] || carConfig.color;

    COLOR_PALETTE.forEach(color => {
      const swatch = document.createElement('div');
      swatch.className = `color-swatch ${color.toLowerCase() === currentColor.toLowerCase() ? 'active' : ''}`;
      swatch.style.backgroundColor = color;
      swatch.addEventListener('click', () => {
        GameData.carColors[carConfig.id] = color;
        GameData.save();
        if (garageCarGroup && garageCarGroup.userData.bodyMat) {
          garageCarGroup.userData.bodyMat.color.set(color);
        }
        renderColorSwatches();
        showToast(`Mashina rangi yangilandi!`);
      });
      container.appendChild(swatch);
    });
  }

  function updateUpgradeButtons() {
    const upgradeCosts = {
      engine: GameData.upgrades.engine * 500,
      accel: GameData.upgrades.accel * 500,
      handling: GameData.upgrades.handling * 400,
      nitro: GameData.upgrades.nitro * 600
    };

    const maxLevel = 5;

    ['engine', 'accel', 'handling', 'nitro'].forEach(type => {
      const btn = document.getElementById(`btn-up-${type}`);
      const costEl = document.getElementById(`cost-up-${type}`);
      if (!btn || !costEl) return;

      const lvl = GameData.upgrades[type];
      if (lvl >= maxLevel) {
        costEl.innerText = 'MAKS (MAX)';
        btn.disabled = true;
      } else {
        const cost = upgradeCosts[type];
        costEl.innerText = `$${cost}`;
        btn.disabled = GameData.coins < cost;
      }
    });
  }

  // -------------------------------------------------------------
  // 7. ZONALAR VA XARITALAR KARTALARI
  // -------------------------------------------------------------
  function renderZonesSelection() {
    const container = document.getElementById('zones-container');
    if (!container) return;
    container.innerHTML = '';

    ZONES.forEach(zone => {
      const isSelected = zone.id === GameData.selectedZoneId;
      const card = document.createElement('div');
      card.className = `zone-card ${zone.cssClass} ${isSelected ? 'active' : ''}`;
      card.innerHTML = `
        <div class="zone-card-content">
          <span class="zone-badge">${zone.badge}</span>
          <h3 class="zone-title">${zone.name}</h3>
          <p class="zone-desc">${zone.desc}</p>
        </div>
      `;
      card.addEventListener('click', () => {
        GameData.selectedZoneId = zone.id;
        GameData.save();
        renderZonesSelection();
        showToast(`Tanlangan zona: ${zone.name}`);
        setTimeout(() => closeModal('zones-modal'), 300);
      });
      container.appendChild(card);
    });
  }

  // -------------------------------------------------------------
  // 8. TEKSTURALAR VA 3D TRASSA YARATISH MOTORASI
  // -------------------------------------------------------------
  function createAsphaltRoadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // To'q qora asfalt foni
    ctx.fillStyle = '#1c222e';
    ctx.fillRect(0, 0, 512, 512);

    // Asfalt donadorligi (Realistik don)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 4000; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillRect(rx, ry, 2, 2);
    }

    // Yon chekka mustahkam sariq chiziqlar (Bordyur bo'yi)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(22, 0); ctx.lineTo(22, 512);
    ctx.moveTo(512 - 22, 0); ctx.lineTo(512 - 22, 512);
    ctx.stroke();

    // O'rtadagi oq uzuq-yuluq poyga chizig'i (Dashed Centerline)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.setLineDash([48, 36]);
    ctx.beginPath();
    ctx.moveTo(256, 0); ctx.lineTo(256, 512);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 35);
    return texture;
  }

  function createCurbTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#e11d48'; // Qizil
    ctx.fillRect(0, 0, 128, 64);
    ctx.fillStyle = '#ffffff'; // Oq
    ctx.fillRect(0, 64, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 45);
    return texture;
  }

  class RaceTrackManager {
    constructor(scene, zoneConfig) {
      this.scene = scene;
      this.zone = zoneConfig;
      this.curve = null;
      this.trackMesh = null;
      this.curbsMesh = null;
      this.barrierMesh = null;
      this.groundMesh = null;
      this.archGroup = null;
      this.coins = [];
      this.boostPads = [];
      this.environmentProps = [];
      this.trackPointsCount = 200;
      this.trackWidth = 14;
      this.totalLength = 0;
      this.generateCircuit();
    }

    generateCircuit() {
      // Trassa egri chiziq nazorat nuqtalari (To'liq tekis, qat'iy yer sathidagi yo'l: y = 0)
      const points = [
        new THREE.Vector3(0, 0, -250),
        new THREE.Vector3(120, 0, -200),
        new THREE.Vector3(220, 0, -100),
        new THREE.Vector3(260, 0, 40),
        new THREE.Vector3(200, 0, 180),
        new THREE.Vector3(90, 0, 260),
        new THREE.Vector3(-60, 0, 270),
        new THREE.Vector3(-180, 0, 200),
        new THREE.Vector3(-250, 0, 80),
        new THREE.Vector3(-270, 0, -80),
        new THREE.Vector3(-180, 0, -220),
        new THREE.Vector3(-70, 0, -260)
      ];

      this.curve = new THREE.CatmullRomCurve3(points, true);
      this.curve.curveType = 'catmullrom';
      this.curve.tension = 0.5;
      this.totalLength = this.curve.getLength();

      this.buildGround();
      this.buildRoadMesh();
      this.buildStartFinishArch();
      this.spawnBoostPads();
      this.spawnCoins();
      this.buildEnvironment();
    }

    buildGround() {
      const groundGeo = new THREE.PlaneGeometry(1600, 1600);
      groundGeo.rotateX(-Math.PI / 2);
      const groundMat = new THREE.MeshStandardMaterial({
        color: this.zone.groundColor,
        roughness: 0.95
      });
      this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
      this.groundMesh.position.y = 0;
      this.groundMesh.receiveShadow = true;
      this.scene.add(this.groundMesh);
    }

    buildRoadMesh() {
      const segments = this.trackPointsCount;
      const roadGeo = new THREE.BufferGeometry();
      const vertices = [];
      const uvs = [];
      const indices = [];

      const leftCurbsVerts = [];
      const rightCurbsVerts = [];
      const curbIndices = [];

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const pt = this.curve.getPointAt(t);
        const tangent = this.curve.getTangentAt(t).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

        const halfW = this.trackWidth / 2;

        const leftPos = new THREE.Vector3().copy(pt).addScaledVector(normal, -halfW);
        const rightPos = new THREE.Vector3().copy(pt).addScaledVector(normal, halfW);

        // Asfalt sathi (y = 0.05)
        vertices.push(leftPos.x, 0.05, leftPos.z);
        vertices.push(rightPos.x, 0.05, rightPos.z);

        uvs.push(0, t * 35);
        uvs.push(1, t * 35);

        if (i < segments) {
          const base = i * 2;
          // Normal yuqoriga qarashi uchun to'g'ri burchak tartibi:
          indices.push(base, base + 2, base + 1);
          indices.push(base + 1, base + 2, base + 3);
        }

        // Yon bordyurlar (Qizil-oq poyga bordyuri)
        const curbW = 1.4;
        const curbLeftInner = leftPos;
        const curbLeftOuter = new THREE.Vector3().copy(pt).addScaledVector(normal, -halfW - curbW);
        leftCurbsVerts.push(curbLeftOuter.x, 0.12, curbLeftOuter.z);
        leftCurbsVerts.push(curbLeftInner.x, 0.06, curbLeftInner.z);

        const curbRightInner = rightPos;
        const curbRightOuter = new THREE.Vector3().copy(pt).addScaledVector(normal, halfW + curbW);
        rightCurbsVerts.push(curbRightInner.x, 0.06, curbRightInner.z);
        rightCurbsVerts.push(curbRightOuter.x, 0.12, curbRightOuter.z);
      }

      roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      roadGeo.setIndex(indices);
      roadGeo.computeVertexNormals();

      const roadMat = new THREE.MeshStandardMaterial({
        map: createAsphaltRoadTexture(),
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide
      });

      this.trackMesh = new THREE.Mesh(roadGeo, roadMat);
      this.trackMesh.receiveShadow = true;
      this.scene.add(this.trackMesh);

      // Bordyurlar
      const curbGeo = new THREE.BufferGeometry();
      const allCurbVerts = leftCurbsVerts.concat(rightCurbsVerts);
      curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(allCurbVerts, 3));

      const curbUvs = [];
      for (let i = 0; i <= segments; i++) {
        curbUvs.push(0, (i / segments) * 45);
        curbUvs.push(1, (i / segments) * 45);
      }
      for (let i = 0; i <= segments; i++) {
        curbUvs.push(0, (i / segments) * 45);
        curbUvs.push(1, (i / segments) * 45);
      }
      curbGeo.setAttribute('uv', new THREE.Float32BufferAttribute(curbUvs, 2));

      for (let i = 0; i < segments; i++) {
        const base = i * 2;
        curbIndices.push(base, base + 2, base + 1);
        curbIndices.push(base + 1, base + 2, base + 3);
      }
      const offset = (segments + 1) * 2;
      for (let i = 0; i < segments; i++) {
        const base = offset + i * 2;
        curbIndices.push(base, base + 2, base + 1);
        curbIndices.push(base + 1, base + 2, base + 3);
      }
      curbGeo.setIndex(curbIndices);
      curbGeo.computeVertexNormals();

      const curbMat = new THREE.MeshStandardMaterial({
        map: createCurbTexture(),
        roughness: 0.4,
        side: THREE.DoubleSide
      });

      this.curbsMesh = new THREE.Mesh(curbGeo, curbMat);
      this.curbsMesh.receiveShadow = true;
      this.scene.add(this.curbsMesh);

      this.buildBarriers();
    }

    buildBarriers() {
      // Trassa ikki cheti bo'ylab metall to'siqlar (Guardrails)
      const segments = this.trackPointsCount;
      const barrierGeo = new THREE.BufferGeometry();
      const barrierVerts = [];
      const barrierIndices = [];

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const pt = this.curve.getPointAt(t);
        const tangent = this.curve.getTangentAt(t).normalize();
        const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
        const barrierDist = this.trackWidth / 2 + 1.6;

        // Chap to'siq
        const leftBottom = new THREE.Vector3().copy(pt).addScaledVector(normal, -barrierDist);
        barrierVerts.push(leftBottom.x, 0.05, leftBottom.z);
        barrierVerts.push(leftBottom.x, 0.85, leftBottom.z);

        // O'ng to'siq
        const rightBottom = new THREE.Vector3().copy(pt).addScaledVector(normal, barrierDist);
        barrierVerts.push(rightBottom.x, 0.05, rightBottom.z);
        barrierVerts.push(rightBottom.x, 0.85, rightBottom.z);

        if (i < segments) {
          const b1 = i * 4;
          // Chap to'siq
          barrierIndices.push(b1, b1 + 1, b1 + 4);
          barrierIndices.push(b1 + 1, b1 + 5, b1 + 4);
          barrierIndices.push(b1, b1 + 4, b1 + 1);
          barrierIndices.push(b1 + 1, b1 + 4, b1 + 5);

          // O'ng to'siq
          const b2 = b1 + 2;
          barrierIndices.push(b2, b2 + 1, b2 + 4);
          barrierIndices.push(b2 + 1, b2 + 5, b2 + 4);
          barrierIndices.push(b2, b2 + 4, b2 + 1);
          barrierIndices.push(b2 + 1, b2 + 4, b2 + 5);
        }
      }

      barrierGeo.setAttribute('position', new THREE.Float32BufferAttribute(barrierVerts, 3));
      barrierGeo.setIndex(barrierIndices);
      barrierGeo.computeVertexNormals();

      const barrierMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.85,
        roughness: 0.25,
        side: THREE.DoubleSide
      });

      this.barrierMesh = new THREE.Mesh(barrierGeo, barrierMat);
      this.scene.add(this.barrierMesh);
    }

    buildStartFinishArch() {
      const startPt = this.curve.getPointAt(0);
      const tangent = this.curve.getTangentAt(0).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

      const archGroup = new THREE.Group();
      const postGeo = new THREE.BoxGeometry(0.8, 8, 0.8);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });

      const leftPost = new THREE.Mesh(postGeo, postMat);
      leftPost.position.copy(startPt).addScaledVector(normal, -this.trackWidth / 2 - 1);
      leftPost.position.y += 4;

      const rightPost = new THREE.Mesh(postGeo, postMat);
      rightPost.position.copy(startPt).addScaledVector(normal, this.trackWidth / 2 + 1);
      rightPost.position.y += 4;

      const crossGeo = new THREE.BoxGeometry(this.trackWidth + 3, 1.2, 1.2);
      const crossMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
      const crossbar = new THREE.Mesh(crossGeo, crossMat);
      crossbar.position.copy(startPt);
      crossbar.position.y += 8;
      crossbar.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), normal);

      archGroup.add(leftPost);
      archGroup.add(rightPost);
      archGroup.add(crossbar);
      this.scene.add(archGroup);
    }

    spawnBoostPads() {
      const padPositions = [0.15, 0.42, 0.68, 0.88];
      const padGeo = new THREE.PlaneGeometry(5, 3);
      padGeo.rotateX(-Math.PI / 2);
      const padMat = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        side: THREE.DoubleSide
      });

      padPositions.forEach(t => {
        const pt = this.curve.getPointAt(t);
        const tangent = this.curve.getTangentAt(t).normalize();
        const padMesh = new THREE.Mesh(padGeo, padMat);
        padMesh.position.copy(pt);
        padMesh.position.y += 0.08;
        padMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
        this.scene.add(padMesh);
        this.boostPads.push({ mesh: padMesh, t });
      });
    }

    spawnCoins() {
      const coinGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16);
      coinGeo.rotateX(Math.PI / 2);
      const coinMat = new THREE.MeshStandardMaterial({
        color: 0xffbe0b,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0xffbe0b,
        emissiveIntensity: 0.3
      });

      for (let i = 1; i < 35; i++) {
        const t = (i / 35);
        const pt = this.curve.getPointAt(t);
        const tangent = this.curve.getTangentAt(t).normalize();
        const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
        const laneOffset = Math.sin(i * 1.5) * (this.trackWidth * 0.3);

        const coinMesh = new THREE.Mesh(coinGeo, coinMat);
        coinMesh.position.copy(pt).addScaledVector(normal, laneOffset);
        coinMesh.position.y += 1.2;
        this.scene.add(coinMesh);
        this.coins.push({ mesh: coinMesh, collected: false });
      }
    }

    buildEnvironment() {
      // Zona turiga mos dekoratsiyalar (Osmono'par binolar, daraxtlar, qoyalar, vulqonlar)
      const count = 45;
      for (let i = 0; i < count; i++) {
        const t = (i / count);
        const pt = this.curve.getPointAt(t);
        const tangent = this.curve.getTangentAt(t).normalize();
        const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
        const side = i % 2 === 0 ? 1 : -1;
        const dist = 22 + Math.random() * 40;

        const propPos = new THREE.Vector3().copy(pt).addScaledVector(normal, side * dist);

        if (this.zone.id === 'cyber') {
          // Kiber binolar
          const h = 25 + Math.random() * 50;
          const w = 10 + Math.random() * 14;
          const bGeo = new THREE.BoxGeometry(w, h, w);
          const bMat = new THREE.MeshStandardMaterial({
            color: 0x090d18,
            roughness: 0.2,
            metalness: 0.8
          });
          const building = new THREE.Mesh(bGeo, bMat);
          building.position.set(propPos.x, h / 2, propPos.z);
          this.scene.add(building);
          this.environmentProps.push(building);
        } else if (this.zone.id === 'snow' || this.zone.id === 'forest') {
          // Archalar va daraxtlar
          const treeGroup = new THREE.Group();
          const trunkGeo = new THREE.CylinderGeometry(0.6, 0.9, 3, 8);
          const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18 });
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.y = 1.5;
          treeGroup.add(trunk);

          const foliageColor = this.zone.id === 'snow' ? 0xd0e8f2 : 0x1b4332;
          const foliageGeo = new THREE.ConeGeometry(3.5, 7, 8);
          const foliageMat = new THREE.MeshStandardMaterial({ color: foliageColor });
          const foliage = new THREE.Mesh(foliageGeo, foliageMat);
          foliage.position.y = 6;
          treeGroup.add(foliage);

          treeGroup.position.set(propPos.x, propPos.y, propPos.z);
          this.scene.add(treeGroup);
          this.environmentProps.push(treeGroup);
        } else if (this.zone.id === 'desert') {
          // Qum piramidalari va qoyalar
          const rockGeo = new THREE.ConeGeometry(12, 16, 4);
          const rockMat = new THREE.MeshStandardMaterial({ color: 0xb5651d, roughness: 0.9 });
          const rock = new THREE.Mesh(rockGeo, rockMat);
          rock.position.set(propPos.x, 8, propPos.z);
          this.scene.add(rock);
          this.environmentProps.push(rock);
        } else if (this.zone.id === 'volcano') {
          // Vulqon qoyalari
          const vGeo = new THREE.DodecahedronGeometry(8 + Math.random() * 8, 1);
          const vMat = new THREE.MeshStandardMaterial({
            color: 0x1b0a0a,
            emissive: 0xff3b30,
            emissiveIntensity: 0.15
          });
          const vMesh = new THREE.Mesh(vGeo, vMat);
          vMesh.position.set(propPos.x, 4, propPos.z);
          this.scene.add(vMesh);
          this.environmentProps.push(vMesh);
        }
      }
    }

    destroy() {
      if (this.trackMesh) this.scene.remove(this.trackMesh);
      if (this.curbsMesh) this.scene.remove(this.curbsMesh);
      if (this.barrierMesh) this.scene.remove(this.barrierMesh);
      if (this.groundMesh) this.scene.remove(this.groundMesh);
      if (this.archGroup) this.scene.remove(this.archGroup);
      this.boostPads.forEach(b => this.scene.remove(b.mesh));
      this.coins.forEach(c => this.scene.remove(c.mesh));
      this.environmentProps.forEach(p => this.scene.remove(p));
    }

    update(delta) {
      // Tangalarni aylantirish
      this.coins.forEach(c => {
        if (!c.collected && c.mesh) {
          c.mesh.rotation.z += 2.5 * delta;
        }
      });
    }

    getClosestTrackPoint(pos) {
      // Mashinaning trassaga nisbatan t progressini hisoblash
      let closestT = 0;
      let minDistSq = Infinity;
      const steps = 150;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const pt = this.curve.getPointAt(t);
        const distSq = pt.distanceToSquared(pos);
        if (distSq < minDistSq) {
          minDistSq = distSq;
          closestT = t;
        }
      }
      return { t: closestT, dist: Math.sqrt(minDistSq) };
    }
  }

  // -------------------------------------------------------------
  // 9. O'YINCHI VA BOTLAR MASHINASI SINF (VEHICLE CONTROLLER)
  // -------------------------------------------------------------
  class VehicleEntity {
    constructor(id, name, carConfig, isHuman, scene, trackManager, startGridIndex) {
      this.id = id;
      this.name = name;
      this.carConfig = carConfig;
      this.isHuman = isHuman;
      this.scene = scene;
      this.track = trackManager;
      this.gridIndex = startGridIndex;

      this.speed = 0; // m/s
      this.maxSpeed = (carConfig.baseSpeed / 3.6); // m/s ga o'tkazamiz
      this.acceleration = carConfig.baseAccel;
      this.handling = carConfig.baseHandling;
      this.nitroPower = carConfig.baseNitro;

      this.nitroGauge = 100;
      this.isNitroActive = false;
      this.isDrifting = false;
      this.driftPoints = 0;

      this.trackProgress = 0; // 0..1
      this.lap = 1;
      this.maxLaps = 3;
      this.finished = false;
      this.finishTime = 0;

      // Bot boshqaruv o'zgaruvchilari
      this.botLaneOffset = (Math.random() - 0.5) * 6;
      this.botTargetT = 0;
      this.botNitroCooldown = 5 + Math.random() * 8;

      // Mashina 3D modelini yaratamiz
      const color = isHuman ? (GameData.carColors[carConfig.id] || carConfig.color) : carConfig.color;
      this.mesh = create3DCarMesh(carConfig, color);
      this.scene.add(this.mesh);

      this.placeOnStartGrid();
    }

    placeOnStartGrid() {
      // 12 ta start katakchasiga joylashtirish (qat'iy yo'l ustida)
      const startT = 0.005 - (this.gridIndex * 0.006);
      const normT = (startT + 1) % 1;
      const pt = this.track.curve.getPointAt(normT);
      const tangent = this.track.curve.getTangentAt(normT).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

      const laneSide = this.gridIndex % 2 === 0 ? -2.8 : 2.8;
      this.mesh.position.set(pt.x + normal.x * laneSide, 0.05, pt.z + normal.z * laneSide);
      
      const flatTangent = new THREE.Vector3(tangent.x, 0, tangent.z).normalize();
      this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), flatTangent);
      this.mesh.rotation.x = 0;
      this.mesh.rotation.z = 0;

      this.trackProgress = normT;
    }

    update(delta, inputState) {
      if (this.finished) return;

      if (this.isHuman) {
        this.updateHumanPhysics(delta, inputState);
      } else {
        this.updateBotAI(delta);
      }

      // G'ildiraklarni aylantirish
      const forwardDist = this.speed * delta;
      if (this.mesh.userData && this.mesh.userData.wheels) {
        this.mesh.userData.wheels.forEach(w => {
          w.mesh.rotation.x -= forwardDist * 2.2;
          if (w.isFront) {
            // Rul burilganda old g'ildiraklar burchagi
            const steerAngle = this.isHuman ? (inputState.steer * 0.45) : (this.botSteer || 0);
            w.group.rotation.y = steerAngle;
          }
        });
      }

      // Nitro olovini yangilash
      if (this.mesh.userData && this.mesh.userData.flameMat) {
        this.mesh.userData.flameMat.opacity = this.isNitroActive ? 0.9 : 0;
      }

      // Trassadagi progress va lap tekshiruvi
      this.updateTrackPosition();
    }

    updateHumanPhysics(delta, input) {
      // Upgradelarni qo'shamiz
      const speedUpgradeMultiplier = 1 + (GameData.upgrades.engine - 1) * 0.06;
      const accelUpgradeMultiplier = 1 + (GameData.upgrades.accel - 1) * 0.08;
      const handlingUpgradeMultiplier = 1 + (GameData.upgrades.handling - 1) * 0.05;

      const effectiveMaxSpeed = this.maxSpeed * speedUpgradeMultiplier;

      // Nitro
      if (input.nitro && this.nitroGauge > 5) {
        this.isNitroActive = true;
        this.nitroGauge -= delta * 25;
      } else {
        this.isNitroActive = false;
        if (this.nitroGauge < 100) {
          this.nitroGauge += delta * 6; // Sekin to'ladi
        }
      }

      // Tezlanish va Tormoz
      let targetAccel = 0;
      if (input.gas) {
        targetAccel = (this.acceleration * 4.5 * accelUpgradeMultiplier);
        if (this.isNitroActive) targetAccel *= 1.8;
      } else if (input.brake) {
        targetAccel = -this.acceleration * 5.0; // Kuchli tormoz
      } else {
        targetAccel = -this.speed * 0.8; // Asfalt ishqalanishi
      }

      this.speed += targetAccel * delta;
      const maxAllowedSpeed = this.isNitroActive ? (effectiveMaxSpeed * 1.35) : effectiveMaxSpeed;
      this.speed = Math.max(-12, Math.min(this.speed, maxAllowedSpeed));

      // Drift va Boshqaruv
      this.isDrifting = input.drift && Math.abs(this.speed) > 15;
      const steerFactor = (this.handling / 100) * handlingUpgradeMultiplier;
      let turnSpeed = input.steer * steerFactor * 2.2 * delta;

      if (this.isDrifting) {
        turnSpeed *= 1.35;
        this.driftPoints += Math.floor(Math.abs(this.speed) * delta * 25);
        this.nitroGauge = Math.min(100, this.nitroGauge + delta * 14); // Drift paytida nitro tezroq to'ladi!
      }

      this.mesh.rotateY(-turnSpeed);

      // Harakat yo'nalishi (qat'iy gorizontal tekislikda, mashina aslo havoga uchmaydi)
      const forwardVec = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
      forwardVec.y = 0;
      forwardVec.normalize();
      this.mesh.position.addScaledVector(forwardVec, this.speed * delta);
      this.mesh.position.y = 0.05; // G'ildiraklar doim yo'l sirtida qat'iy turadi
      this.mesh.rotation.x = 0; // Osmonga ko'tarilmaydi
      this.mesh.rotation.z = 0; // Yonboshlab ketmaydi

      // Yo'l chegarasidan chiqmaslik va to'siqlar
      const closest = this.track.getClosestTrackPoint(this.mesh.position);
      const roadLimit = this.track.trackWidth / 2 + 0.6;
      if (closest.dist > roadLimit) {
        // Yo'l chetidagi bordyur/to'siqqa urilib sekinlashadi va yo'l ichiga tortiladi
        this.speed *= 0.8;
        const trackCenter = this.track.curve.getPointAt(closest.t);
        const toCenter = new THREE.Vector3(trackCenter.x - this.mesh.position.x, 0, trackCenter.z - this.mesh.position.z).normalize();
        this.mesh.position.addScaledVector(toCenter, 0.4);
        if (Math.abs(this.speed) > 10 && Math.random() < 0.05) {
          showDriftBadge('🚧 YO\'L CHEGARASI!');
        }
      }

      // Tovush yangilash
      const speedKmh = Math.abs(Math.round(this.speed * 3.6));
      audioSynth.updateEngine(speedKmh, input.gas, this.isNitroActive);
      audioSynth.setDrift(this.isDrifting);

      // Tangalarni yig'ish tekshiruvi
      this.track.coins.forEach(c => {
        if (!c.collected && c.mesh.position.distanceTo(this.mesh.position) < 2.5) {
          c.collected = true;
          this.scene.remove(c.mesh);
          GameData.addCoins(25);
          audioSynth.playCoinSound();
          showDriftBadge('+ $25 TEGA OLINDI! 💰');
        }
      });

      // Tezlashtiruvchi pad tekshiruvi
      this.track.boostPads.forEach(pad => {
        if (pad.mesh.position.distanceTo(this.mesh.position) < 3.2) {
          this.speed = effectiveMaxSpeed * 1.45;
          this.nitroGauge = 100;
          audioSynth.playNitroSound();
          showDriftBadge('🚀 SUPER TEZLANISH!');
        }
      });
    }

    updateBotAI(delta) {
      // Bot trassa markazi bo'ylab harakatlanadi
      this.botTargetT = (this.trackProgress + 0.012) % 1;
      const targetPt = this.track.curve.getPointAt(this.botTargetT);
      const tangent = this.track.curve.getTangentAt(this.botTargetT).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

      const finalTarget = new THREE.Vector3().copy(targetPt).addScaledVector(normal, this.botLaneOffset);

      // Bot burilish burchagini hisoblash
      const dirToTarget = new THREE.Vector3().subVectors(finalTarget, this.mesh.position).normalize();
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);

      const cross = new THREE.Vector3().crossVectors(forward, dirToTarget);
      const steer = Math.max(-1, Math.min(1, cross.y * 3.5));
      this.botSteer = steer;

      // Nitro ishlatish
      this.botNitroCooldown -= delta;
      if (this.botNitroCooldown <= 0) {
        this.isNitroActive = true;
        setTimeout(() => { this.isNitroActive = false; }, 2000);
        this.botNitroCooldown = 6 + Math.random() * 8;
      }

      // Bot tezligi
      const maxSpd = this.isNitroActive ? (this.maxSpeed * 1.25) : (this.maxSpeed * 0.95);
      this.speed = THREE.MathUtils.lerp(this.speed, maxSpd, delta * 1.8);

      // Bot harakati (faqat yo'l tekisligida, aslo havoga uchmaydi)
      this.mesh.rotateY(steer * 2.2 * delta);
      const moveVec = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
      moveVec.y = 0;
      moveVec.normalize();
      this.mesh.position.addScaledVector(moveVec, this.speed * delta);
      this.mesh.position.y = 0.05; // Botlar ham doim yo'l ustida yuradi
      this.mesh.rotation.x = 0;
      this.mesh.rotation.z = 0;
    }

    updateTrackPosition() {
      const closest = this.track.getClosestTrackPoint(this.mesh.position);
      const oldT = this.trackProgress;
      const newT = closest.t;

      // Aylana (Lap) hisoblash (Finish chizig'ini kesib o'tish)
      if (oldT > 0.85 && newT < 0.15) {
        this.lap++;
        if (this.isHuman) {
          document.getElementById('hud-lap').innerText = `${this.lap}/${this.maxLaps}`;
          showDriftBadge(`AYLANA ${this.lap}/${this.maxLaps}!`);
        }
        if (this.lap > this.maxLaps) {
          this.finished = true;
          this.finishTime = Date.now();
        }
      }

      this.trackProgress = newT;
    }

    respawnOnTrack() {
      const pt = this.track.curve.getPointAt(this.trackProgress);
      const tangent = this.track.curve.getTangentAt(this.trackProgress).normalize();
      this.mesh.position.set(pt.x, 0.05, pt.z); // Aniq yerda
      const flatTangent = new THREE.Vector3(tangent.x, 0, tangent.z).normalize();
      this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), flatTangent);
      this.mesh.rotation.x = 0;
      this.mesh.rotation.z = 0;
      this.speed = 0;
      showToast('Mashina yo\'lga qaytarildi!');
    }
  }

  // -------------------------------------------------------------
  // 10. REAL VAQTDAGI MULTIPLAYER (PEERJS BILAN 12 O'YINCHI)
  // -------------------------------------------------------------
  class MultiplayerNetwork {
    constructor() {
      this.peer = null;
      this.isHost = false;
      this.roomCode = '';
      this.connections = []; // Hostda ulangan barcha mijozlar
      this.hostConn = null;  // Mehmonlarda Host bilan aloqa
      this.remotePlayers = new Map(); // id -> remote player data
      this.onPlayerJoined = null;
      this.onGameStarted = null;
    }

    createRoom(roomCode, hostName) {
      this.isHost = true;
      this.roomCode = roomCode;
      try {
        if (typeof Peer !== 'undefined') {
          this.peer = new Peer(`turbo_${roomCode}`, { debug: 1 });
          this.peer.on('open', (id) => {
            console.log('Host xonasi tayyor, ID:', id);
          });
          this.peer.on('connection', (conn) => {
            if (this.connections.length >= 11) {
              conn.close();
              return;
            }
            this.connections.push(conn);
            conn.on('data', (data) => this.handleData(conn, data));
            conn.on('close', () => {
              this.connections = this.connections.filter(c => c !== conn);
            });
          });
        }
      } catch (e) {
        console.warn('PeerJS ishga tushirishda xatolik:', e);
      }
    }

    joinRoom(roomCode, playerName, onSuccess, onError) {
      this.isHost = false;
      this.roomCode = roomCode;
      try {
        if (typeof Peer !== 'undefined') {
          this.peer = new Peer({ debug: 1 });
          this.peer.on('open', () => {
            const hostPeerId = `turbo_${roomCode}`;
            this.hostConn = this.peer.connect(hostPeerId);
            this.hostConn.on('open', () => {
              this.hostConn.send({
                type: 'JOIN',
                name: playerName,
                carId: GameData.selectedCarId,
                color: GameData.carColors[GameData.selectedCarId]
              });
              if (onSuccess) onSuccess();
            });
            this.hostConn.on('data', (data) => this.handleData(this.hostConn, data));
            this.hostConn.on('error', (err) => { if (onError) onError(err); });
          });
        } else {
          if (onError) onError('PeerJS kutubxonasi mavjud emas');
        }
      } catch (e) {
        if (onError) onError(e);
      }
    }

    broadcast(data) {
      if (this.isHost) {
        this.connections.forEach(conn => {
          if (conn.open) conn.send(data);
        });
      } else if (this.hostConn && this.hostConn.open) {
        this.hostConn.send(data);
      }
    }

    handleData(conn, data) {
      if (data.type === 'START_RACE') {
        if (this.onGameStarted) this.onGameStarted(data);
      } else if (data.type === 'JOIN') {
        if (this.onPlayerJoined) this.onPlayerJoined(data);
      }
    }
  }

  const network = new MultiplayerNetwork();

  // -------------------------------------------------------------
  // 11. ASOSIY O'YIN DARAJASI VA SIKLI (GAME CORE ENGINE)
  // -------------------------------------------------------------
  let scene, camera, renderer;
  let trackManager;
  let playerVehicle = null;
  let racers = []; // Jami 12 ta qatnashchilar (O'yinchi + Botlar/Odamlar)
  let isRaceActive = false;
  let raceStartTime = 0;
  let maxRaceParticipants = 12;

  const inputState = {
    gas: false,
    brake: false,
    steer: 0,
    drift: false,
    nitro: false
  };

  function initGameEngine() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050814);
    scene.fog = new THREE.FogExp2(0x0c142c, 0.0035);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 800);
    camera.position.set(0, 5, -12);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Yoritish (Mashinalarning haqiqiy rangi va CAD chiziqlari aniq ko'rinishi uchun)
    const ambLight = new THREE.AmbientLight(0xffffff, 1.35);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xfff8ee, 1.5);
    dirLight.position.set(80, 140, 60);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.6);
    scene.add(hemiLight);

    window.addEventListener('resize', onWindowResize);
    setupDesktopKeyboard();
    setupTouchControls();
  }

  function startRace(botCount = 11) {
    audioSynth.init();

    // Zonaga mos muhitni qo'llash
    const currentZone = ZONES.find(z => z.id === GameData.selectedZoneId) || ZONES[0];
    scene.background.set(currentZone.skyColor);
    scene.fog.color.set(currentZone.fogColor);

    // Eski trassa va mashinalarni tozalash
    if (trackManager) {
      trackManager.destroy();
    }
    racers.forEach(r => scene.remove(r.mesh));
    racers = [];

    // Yangi trassa qurish
    trackManager = new RaceTrackManager(scene, currentZone);

    // 1. Asosiy o'yinchi mashinasini yaratish (Pole position #0)
    const playerConfig = CAR_CATALOG.find(c => c.id === GameData.selectedCarId) || CAR_CATALOG[0];
    playerVehicle = new VehicleEntity('player_1', 'Siz (Poygachi)', playerConfig, true, scene, trackManager, 0);
    racers.push(playerVehicle);

    // 2. Botlarni yaratish (Jami 12 nafargacha to'ldirish)
    const actualBots = Math.min(11, Math.max(0, botCount));
    for (let i = 0; i < actualBots; i++) {
      const profile = BOT_PROFILES[i % BOT_PROFILES.length];
      const botConfig = CAR_CATALOG.find(c => c.id === profile.carId) || CAR_CATALOG[0];
      const botVehicle = new VehicleEntity(
        `bot_${i}`,
        profile.name,
        botConfig,
        false,
        scene,
        trackManager,
        i + 1
      );
      racers.push(botVehicle);
    }

    // Kamerani DARHOL o'yinchi mashinasi orqasiga joylashtirish (uzoqdan uchib kelmasin!)
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(playerVehicle.mesh.quaternion);
    camera.position.copy(playerVehicle.mesh.position).addScaledVector(forward, -7.5).add(new THREE.Vector3(0, 3.2, 0));
    const lookTarget = new THREE.Vector3().copy(playerVehicle.mesh.position).addScaledVector(forward, 8).add(new THREE.Vector3(0, 1.2, 0));
    camera.lookAt(lookTarget);

    // UI Overlaylarni almashtirish
    document.getElementById('main-menu-overlay').classList.add('hidden');
    document.getElementById('multiplayer-modal').classList.add('hidden');
    document.getElementById('victory-modal').classList.add('hidden');
    document.getElementById('hud-overlay').classList.remove('hidden');

    if (GameData.settings.touchControls) {
      document.getElementById('touch-controls').style.display = 'block';
    }

    // Start hisoblash (Countdown 3, 2, 1, BOSING!)
    startRaceCountdown();
  }

  function startRaceCountdown() {
    isRaceActive = false;
    const countdownEl = document.getElementById('hud-countdown');
    let count = 3;

    countdownEl.innerText = count;
    audioSynth.playCountdownBeep(false);

    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        countdownEl.innerText = count;
        audioSynth.playCountdownBeep(false);
      } else if (count === 0) {
        countdownEl.innerText = 'BOSING! 🏁';
        audioSynth.playCountdownBeep(true);
        isRaceActive = true;
        raceStartTime = Date.now();
      } else {
        countdownEl.innerText = '';
        clearInterval(timer);
      }
    }, 1000);
  }

  // -------------------------------------------------------------
  // 12. HAR FRAME ASOSIY CHIZISH (GAME LOOP 60 FPS)
  // -------------------------------------------------------------
  let lastTime = performance.now();

  function gameLoop(now) {
    requestAnimationFrame(gameLoop);
    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (trackManager) trackManager.update(delta);

    if (isRaceActive) {
      racers.forEach(r => r.update(delta, inputState));
      updateLeaderboardAndRankings();
      updateHUD();
      drawMinimap();
      checkRaceFinish();
    }

    // Kamera dinamikasi (O'yinchini ta'qib qilish)
    if (playerVehicle && camera) {
      updateCamera();
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  function updateCamera() {
    const carPos = playerVehicle.mesh.position;
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(playerVehicle.mesh.quaternion);

    if (GameData.settings.cameraMode === 'hood') {
      // Kapon ko'rinishi
      camera.position.copy(carPos).add(new THREE.Vector3(0, 1.2, 0)).addScaledVector(forward, 1.2);
      const lookTarget = new THREE.Vector3().copy(carPos).addScaledVector(forward, 25);
      camera.lookAt(lookTarget);
    } else if (GameData.settings.cameraMode === 'top') {
      // Yuqoridan ko'rinish
      camera.position.set(carPos.x, carPos.y + 24, carPos.z);
      camera.lookAt(carPos);
    } else {
      // Klassik 3D orqadan ko'rinish (Chase Cam)
      const fovBonus = playerVehicle.isNitroActive ? 12 : 0;
      camera.fov = THREE.MathUtils.lerp(camera.fov, 60 + fovBonus, 0.1);
      camera.updateProjectionMatrix();

      const camOffset = new THREE.Vector3().copy(carPos).addScaledVector(forward, -7.5).add(new THREE.Vector3(0, 3.2, 0));
      camera.position.lerp(camOffset, 0.15);

      const lookTarget = new THREE.Vector3().copy(carPos).addScaledVector(forward, 8).add(new THREE.Vector3(0, 1.2, 0));
      camera.lookAt(lookTarget);
    }
  }

  function updateLeaderboardAndRankings() {
    // 12 ta poygachilarni trassadagi o'rniga qarab saralash
    racers.sort((a, b) => {
      if (a.lap !== b.lap) return b.lap - a.lap;
      return b.trackProgress - a.trackProgress;
    });

    const playerRank = racers.findIndex(r => r.isHuman) + 1;
    document.getElementById('hud-rank').innerText = playerRank;

    // HUD Leaderboard ro'yxatini yangilash
    const lbContainer = document.getElementById('hud-leaderboard');
    if (lbContainer) {
      lbContainer.innerHTML = '';
      racers.slice(0, 8).forEach((r, idx) => {
        const row = document.createElement('div');
        row.className = `lb-entry ${r.isHuman ? 'player' : ''}`;
        row.innerHTML = `
          <span class="lb-rank">${idx + 1}</span>
          <span class="lb-name">${r.name}</span>
          <span style="font-size: 0.7rem; color: var(--gold);">${Math.round(r.speed * 3.6)} km/s</span>
        `;
        lbContainer.appendChild(row);
      });
    }
  }

  function updateHUD() {
    if (!playerVehicle) return;
    const speedKmh = Math.abs(Math.round(playerVehicle.speed * 3.6));
    document.getElementById('hud-speed').innerText = speedKmh;

    const nitroPct = Math.round(playerVehicle.nitroGauge);
    document.getElementById('hud-nitro-val').innerText = `${nitroPct}%`;
    const nitroFill = document.getElementById('hud-nitro-fill');
    if (nitroFill) {
      nitroFill.style.width = `${nitroPct}%`;
      if (playerVehicle.isNitroActive) {
        nitroFill.classList.add('active');
      } else {
        nitroFill.classList.remove('active');
      }
    }
  }

  function drawMinimap() {
    const canvas = document.getElementById('minimap-canvas');
    if (!canvas || !trackManager) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.2;

    // Trassani chizish
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();

    const ptsCount = 60;
    for (let i = 0; i <= ptsCount; i++) {
      const t = i / ptsCount;
      const pt = trackManager.curve.getPointAt(t);
      const mx = cx + pt.x * scale;
      const my = cy + pt.z * scale;
      if (i === 0) ctx.moveTo(mx, my);
      else ctx.lineTo(mx, my);
    }
    ctx.closePath();
    ctx.stroke();

    // 12 ta poygachilar nuqtalari
    racers.forEach(r => {
      const rx = cx + r.mesh.position.x * scale;
      const ry = cy + r.mesh.position.z * scale;
      ctx.beginPath();
      if (r.isHuman) {
        ctx.fillStyle = '#00f3ff';
        ctx.arc(rx, ry, 4.5, 0, Math.PI * 2);
      } else {
        ctx.fillStyle = '#ff3b30';
        ctx.arc(rx, ry, 2.8, 0, Math.PI * 2);
      }
      ctx.fill();
    });
  }

  function checkRaceFinish() {
    if (playerVehicle && playerVehicle.finished) {
      isRaceActive = false;
      const playerRank = racers.findIndex(r => r.isHuman) + 1;

      // Mukofot hisoblash
      let prizeCoins = 200;
      if (playerRank === 1) prizeCoins = 1250;
      else if (playerRank === 2) prizeCoins = 750;
      else if (playerRank === 3) prizeCoins = 450;

      prizeCoins += Math.floor(playerVehicle.driftPoints / 10);
      GameData.addCoins(prizeCoins);

      audioSynth.playVictorySound();

      // Natija ekranini chiqarish
      const totalSeconds = Math.round((Date.now() - raceStartTime) / 1000);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      document.getElementById('victory-rank-text').innerText = `${playerRank}-O'RIN! ${playerRank === 1 ? "G'ALABA!" : "POYGA YAKUNLANDI"}`;
      document.getElementById('victory-coins-won').innerText = prizeCoins.toLocaleString();
      document.getElementById('victory-time').innerText = timeStr;
      document.getElementById('victory-max-speed').innerText = `${Math.round(playerVehicle.maxSpeed * 3.6)} km/s`;
      document.getElementById('victory-drift').innerText = playerVehicle.driftPoints;

      document.getElementById('hud-overlay').classList.add('hidden');
      const tc = document.getElementById('touch-controls');
      if (tc) tc.style.display = 'none';
      document.getElementById('victory-modal').classList.remove('hidden');
    }
  }

  // -------------------------------------------------------------
  // 13. BOSHQARUV TIZIMI (KLAVIATURA VA MOBIL SENSOR)
  // -------------------------------------------------------------
  function setupDesktopKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') inputState.gas = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') inputState.brake = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') inputState.steer = -1;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') inputState.steer = 1;
      if (e.code === 'Space') inputState.drift = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyN') {
        inputState.nitro = true;
        if (playerVehicle && playerVehicle.nitroGauge > 10) audioSynth.playNitroSound();
      }
      if (e.code === 'KeyR') {
        if (playerVehicle) playerVehicle.respawnOnTrack();
      }
      if (e.code === 'KeyC') {
        cycleCameraMode();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') inputState.gas = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') inputState.brake = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        if (inputState.steer === -1) inputState.steer = 0;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        if (inputState.steer === 1) inputState.steer = 0;
      }
      if (e.code === 'Space') inputState.drift = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyN') inputState.nitro = false;
    });
  }

  function setupTouchControls() {
    function bindTouch(btnId, onDown, onUp) {
      const btn = document.getElementById(btnId);
      if (!btn) return;

      const handleDown = (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        onDown();
      };
      const handleUp = (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        onUp();
      };

      btn.addEventListener('touchstart', handleDown, { passive: false });
      btn.addEventListener('touchend', handleUp, { passive: false });
      btn.addEventListener('touchcancel', handleUp, { passive: false });
      btn.addEventListener('mousedown', handleDown);
      btn.addEventListener('mouseup', handleUp);
      btn.addEventListener('mouseleave', handleUp);
    }

    bindTouch('t-btn-left', () => { inputState.steer = -1; }, () => { if (inputState.steer === -1) inputState.steer = 0; });
    bindTouch('t-btn-right', () => { inputState.steer = 1; }, () => { if (inputState.steer === 1) inputState.steer = 0; });
    bindTouch('t-btn-gas', () => { inputState.gas = true; }, () => { inputState.gas = false; });
    bindTouch('t-btn-brake', () => { inputState.brake = true; }, () => { inputState.brake = false; });
    bindTouch('t-btn-nitro', () => {
      inputState.nitro = true;
      if (playerVehicle && playerVehicle.nitroGauge > 10) audioSynth.playNitroSound();
    }, () => { inputState.nitro = false; });

    document.getElementById('t-btn-respawn')?.addEventListener('click', () => {
      if (playerVehicle) playerVehicle.respawnOnTrack();
    });

    document.getElementById('t-btn-camera')?.addEventListener('click', () => {
      cycleCameraMode();
    });

    document.getElementById('t-btn-exit')?.addEventListener('click', () => {
      isRaceActive = false;
      document.getElementById('hud-overlay').classList.add('hidden');
      document.getElementById('touch-controls').style.display = 'none';
      document.getElementById('main-menu-overlay').classList.remove('hidden');
    });
  }

  function cycleCameraMode() {
    const modes = ['chase', 'hood', 'top'];
    const curIdx = modes.indexOf(GameData.settings.cameraMode);
    GameData.settings.cameraMode = modes[(curIdx + 1) % modes.length];
    GameData.save();
    showToast(`Kamera ko'rinishi: ${GameData.settings.cameraMode.toUpperCase()}`);
  }

  // -------------------------------------------------------------
  // 14. UI VA MODAL BOSHQARUVI
  // -------------------------------------------------------------
  function openModal(modalId) {
    document.getElementById(modalId)?.classList.remove('hidden');
  }

  function closeModal(modalId) {
    document.getElementById(modalId)?.classList.add('hidden');
  }

  function updateCoinDisplay() {
    const el = document.getElementById('coin-display');
    if (el) el.innerText = GameData.coins.toLocaleString();
  }

  function showToast(msg) {
    const toast = document.getElementById('toast-message');
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  function showDriftBadge(text) {
    const badge = document.getElementById('hud-drift-badge');
    if (!badge) return;
    badge.innerText = text;
    badge.classList.add('active');
    setTimeout(() => {
      badge.classList.remove('active');
    }, 1800);
  }

  function onWindowResize() {
    if (camera && renderer) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  // -------------------------------------------------------------
  // 15. DOM HODISALARI VA BOSH MENYU ULASHLARI
  // -------------------------------------------------------------
  function setupDOMEvents() {
    // Menyu tugmalari
    document.getElementById('btn-menu-solo')?.addEventListener('click', () => {
      startRace(7); // Standart 7 ta bot bilan qiziqarli poyga
    });

    document.getElementById('btn-menu-garage')?.addEventListener('click', () => {
      openModal('garage-modal');
      updateGarageCar();
    });

    document.getElementById('btn-menu-zones')?.addEventListener('click', () => {
      renderZonesSelection();
      openModal('zones-modal');
    });

    document.getElementById('btn-menu-multiplayer')?.addEventListener('click', () => {
      setupMultiplayerLobby();
      openModal('multiplayer-modal');
    });

    // Modalni yopish (X) tugmalari
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetModal = btn.getAttribute('data-close');
        if (targetModal) closeModal(targetModal);
      });
    });

    // Garaj prev/next
    document.getElementById('btn-garage-prev')?.addEventListener('click', () => {
      garageCurrentIdx = (garageCurrentIdx - 1 + CAR_CATALOG.length) % CAR_CATALOG.length;
      updateGarageCar();
    });
    document.getElementById('btn-garage-next')?.addEventListener('click', () => {
      garageCurrentIdx = (garageCurrentIdx + 1) % CAR_CATALOG.length;
      updateGarageCar();
    });

    // Mashina sotib olish / tanlash
    document.getElementById('btn-car-action')?.addEventListener('click', () => {
      const curCar = CAR_CATALOG[garageCurrentIdx];
      const isOwned = GameData.unlockedCars.includes(curCar.id);

      if (!isOwned) {
        if (GameData.coins >= curCar.price) {
          GameData.coins -= curCar.price;
          GameData.unlockedCars.push(curCar.id);
          GameData.selectedCarId = curCar.id;
          GameData.save();
          updateCoinDisplay();
          updateGarageCar();
          showToast(`Tabriklaymiz! "${curCar.name}" sotib olindi! 🏎️`);
        } else {
          showToast(`Mablag' yetarli emas! Poygalarda qatnashib pul ishlang!`);
        }
      } else {
        GameData.selectedCarId = curCar.id;
        GameData.save();
        updateGarageCar();
        showToast(`"${curCar.name}" tanlandi!`);
      }
    });

    // Tyuning Upgradelari
    ['engine', 'accel', 'handling', 'nitro'].forEach(type => {
      document.getElementById(`btn-up-${type}`)?.addEventListener('click', () => {
        const costMultipliers = { engine: 500, accel: 500, handling: 400, nitro: 600 };
        const cost = GameData.upgrades[type] * costMultipliers[type];
        if (GameData.coins >= cost && GameData.upgrades[type] < 5) {
          GameData.coins -= cost;
          GameData.upgrades[type]++;
          GameData.save();
          updateCoinDisplay();
          updateGarageCar();
          showToast(`Yangilandi! ${type.toUpperCase()} hozirgi bosqich: ${GameData.upgrades[type]}`);
        }
      });
    });

    // Yuqori panel tezkor tugmalari
    document.getElementById('btn-sound-toggle')?.addEventListener('click', () => {
      GameData.settings.sound = !GameData.settings.sound;
      GameData.save();
      document.getElementById('btn-sound-toggle').innerText = GameData.settings.sound ? '🔊' : '🔇';
      showToast(GameData.settings.sound ? 'Ovoz yoqildi' : 'Ovoz o\'chirildi');
    });

    document.getElementById('btn-touch-toggle')?.addEventListener('click', () => {
      GameData.settings.touchControls = !GameData.settings.touchControls;
      GameData.save();
      const tc = document.getElementById('touch-controls');
      if (tc) tc.style.display = GameData.settings.touchControls ? 'block' : 'none';
      showToast(GameData.settings.touchControls ? 'Mobil boshqaruv yoqildi' : 'Mobil boshqaruv yashirildi');
    });

    document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen();
      }
    });

    document.getElementById('btn-settings-open')?.addEventListener('click', () => {
      openModal('settings-modal');
    });

    // Finish modal tugmalari
    document.getElementById('btn-victory-restart')?.addEventListener('click', () => {
      closeModal('victory-modal');
      startRace(racers.length > 1 ? racers.length - 1 : 7);
    });
    document.getElementById('btn-victory-garage')?.addEventListener('click', () => {
      closeModal('victory-modal');
      isRaceActive = false;
      document.getElementById('hud-overlay').classList.add('hidden');
      const tc = document.getElementById('touch-controls');
      if (tc) tc.style.display = 'none';
      document.getElementById('main-menu-overlay').classList.remove('hidden');
      openModal('garage-modal');
      updateGarageCar();
    });
  }

  // -------------------------------------------------------------
  // 16. MULTIPLAYER LOBBY (12 NAFAR VA BOTLAR SLIDERI)
  // -------------------------------------------------------------
  function setupMultiplayerLobby() {
    const hostCode = 'UZB-' + Math.floor(100 + Math.random() * 900);
    document.getElementById('host-room-code').innerText = hostCode;

    // Botlar slideri
    const slider = document.getElementById('bot-slider');
    const label = document.getElementById('bot-count-label');
    const updateLobby = () => {
      const val = parseInt(slider.value, 10);
      label.innerText = `${val} ta bot`;
      renderLobbySlots(val);
      const countEl = document.getElementById('connected-count');
      if (countEl) countEl.innerText = 1 + val;
    };
    slider.addEventListener('input', updateLobby);
    updateLobby();

    // Tablar (Host / Join)
    const tabHost = document.getElementById('tab-btn-host');
    const tabJoin = document.getElementById('tab-btn-join');
    const secHost = document.getElementById('mp-host-section');
    const secJoin = document.getElementById('mp-join-section');

    tabHost.addEventListener('click', () => {
      tabHost.classList.add('active');
      tabJoin.classList.remove('active');
      secHost.classList.remove('hidden');
      secJoin.classList.add('hidden');
    });

    tabJoin.addEventListener('click', () => {
      tabJoin.classList.add('active');
      tabHost.classList.remove('active');
      secJoin.classList.remove('hidden');
      secHost.classList.add('hidden');
    });

    // Kodni nusxalash
    document.getElementById('btn-copy-room-code')?.addEventListener('click', () => {
      navigator.clipboard.writeText(hostCode).then(() => {
        showToast('Xona kodi nusxalandi! Do\'stlaringizga yuboring!');
      });
    });

    // Multiplayer poygani boshlash
    document.getElementById('btn-start-multiplayer-race')?.addEventListener('click', () => {
      const bots = parseInt(slider.value, 10);
      network.createRoom(hostCode, document.getElementById('host-player-name').value);
      startRace(bots);
    });

    // Join submit
    document.getElementById('btn-submit-join')?.addEventListener('click', () => {
      const code = document.getElementById('join-room-code-input').value.trim();
      const name = document.getElementById('join-player-name').value.trim() || 'Mehmon';
      if (!code) {
        showToast('Iltimos xona kodini kiriting!');
        return;
      }
      showToast(`Xonaga ulanilmoqda: ${code}...`);
      network.joinRoom(code, name, () => {
        showToast('Xonaga muvaffaqiyatli ulandingiz! Xost kutilyapti...');
        document.getElementById('join-waiting-status').classList.remove('hidden');
      }, (err) => {
        showToast(`Ulanishda xatolik yuz berdi. Botlar bilan o'ynashingiz mumkin!`);
      });
    });
  }

  function renderLobbySlots(botCount) {
    const container = document.getElementById('host-lobby-players');
    if (!container) return;
    container.innerHTML = '';

    // Slot 1: Host o'yinchi
    const hostSlot = document.createElement('div');
    hostSlot.className = 'lobby-player-slot filled';
    hostSlot.innerHTML = `
      <div class="lobby-player-avatar">👑</div>
      <div class="lobby-player-name">${document.getElementById('host-player-name').value}</div>
      <div class="lobby-player-car">Host</div>
      <span class="lobby-badge" style="color: var(--primary);">TAYYOR</span>
    `;
    container.appendChild(hostSlot);

    // Qolgan slotlar: Botlar va Bo'sh joylar (Jami 12 ta)
    for (let i = 1; i < 12; i++) {
      const slot = document.createElement('div');
      if (i <= botCount) {
        const botName = BOT_PROFILES[(i - 1) % BOT_PROFILES.length].name;
        slot.className = 'lobby-player-slot bot';
        slot.innerHTML = `
          <div class="lobby-player-avatar">🤖</div>
          <div class="lobby-player-name">${botName}</div>
          <div class="lobby-player-car">AI Bot</div>
          <span class="lobby-badge" style="color: var(--secondary);">BOT</span>
        `;
      } else {
        slot.className = 'lobby-player-slot';
        slot.innerHTML = `
          <div class="lobby-player-avatar" style="opacity: 0.3;">👤</div>
          <div class="lobby-player-name" style="color: var(--text-muted);">Bo'sh joy</div>
          <div class="lobby-player-car">#${i + 1}</div>
          <span class="lobby-badge">KUTILYAPTI</span>
        `;
      }
      container.appendChild(slot);
    }
  }

  // -------------------------------------------------------------
  // 17. O'YINNI ISHGA TUSHIRISH (BOOTSTRAP)
  // -------------------------------------------------------------
  window.addEventListener('DOMContentLoaded', () => {
    GameData.load();
    updateCoinDisplay();
    initGameEngine();
    initGarageViewer();
    setupDOMEvents();
    renderZonesSelection();

    // Mobil qurilmani aniqlash
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);
    if (isMobile) {
      GameData.settings.touchControls = true;
    }

    // Animatsiya siklini yurgizish
    requestAnimationFrame(gameLoop);
  });

})();
