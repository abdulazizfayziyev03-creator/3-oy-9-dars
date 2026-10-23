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
    unlockedCars: ['car_starter'],
    selectedCarId: 'car_starter',
    selectedZoneId: 'cyber',
    carColors: {
      car_starter: '#00f3ff',
      car_muscle: '#ff3b30',
      car_offroad: '#ff9e00',
      car_cyber: '#b026ff',
      car_hyper: '#ffbe0b',
      car_f1: '#00ff88'
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
        if (savedUnlocked) this.unlockedCars = JSON.parse(savedUnlocked);

        const savedCar = localStorage.getItem(STORAGE_KEYS.CURRENT_CAR);
        if (savedCar) this.selectedCarId = savedCar;

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
  // 2. MASHINALAR VA BOZOR KATALOGI (6 TA MASHINA)
  // -------------------------------------------------------------
  const CAR_CATALOG = [
    {
      id: 'car_starter',
      name: 'Racer One',
      carClass: 'Sport Sedan',
      price: 0,
      baseSpeed: 180,
      baseAccel: 3.8,
      baseHandling: 72,
      baseNitro: 100,
      bodyStyle: 'sedan',
      color: '#00f3ff',
      desc: 'Boshlang\'ich engil va qulay sport mashinasi'
    },
    {
      id: 'car_muscle',
      name: 'Nitro Viper',
      carClass: 'Muscle GT',
      price: 1500,
      baseSpeed: 215,
      baseAccel: 3.2,
      baseHandling: 68,
      baseNitro: 120,
      bodyStyle: 'muscle',
      color: '#ff3b30',
      desc: 'Katta quvvat va baland tezlanishga ega mushakdor GT'
    },
    {
      id: 'car_offroad',
      name: 'Sahara Rover',
      carClass: '4x4 Trophy Buggy',
      price: 3200,
      baseSpeed: 200,
      baseAccel: 3.0,
      baseHandling: 88,
      baseNitro: 110,
      bodyStyle: 'buggy',
      color: '#ff9e00',
      desc: 'Qum va qor zonalarida mukammal boshqaruv'
    },
    {
      id: 'car_cyber',
      name: 'Cyber Phantom',
      carClass: 'Cyber Concept',
      price: 6500,
      baseSpeed: 250,
      baseAccel: 2.5,
      baseHandling: 82,
      baseNitro: 140,
      bodyStyle: 'cyber',
      color: '#b026ff',
      desc: 'Futuristik neon giperkar, juda tezkor va chaqqon'
    },
    {
      id: 'car_hyper',
      name: 'Hyper Lightning',
      carClass: 'Exotic Hypercar',
      price: 12000,
      baseSpeed: 285,
      baseAccel: 2.1,
      baseHandling: 90,
      baseNitro: 160,
      bodyStyle: 'hyper',
      color: '#ffbe0b',
      desc: 'Eng yuqori maksimal tezlikka ega afsonaviy avtomobil'
    },
    {
      id: 'car_f1',
      name: 'Apex Formula',
      carClass: 'Formula Legend',
      price: 20000,
      baseSpeed: 320,
      baseAccel: 1.7,
      baseHandling: 98,
      baseNitro: 180,
      bodyStyle: 'formula',
      color: '#00ff88',
      desc: 'Trassalarning mutlaq chempioni - Formula 1 monstri'
    }
  ];

  const COLOR_PALETTE = [
    '#00f3ff', '#ff3b30', '#00ff88', '#ffbe0b', 
    '#b026ff', '#ffffff', '#111111', '#ff5400', 
    '#0077b6', '#e024c3'
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

  // Botlar uchun 11 ta maxsus nikneymlar va xarakterlar
  const BOT_PROFILES = [
    { name: 'Temur Poygachi', carId: 'car_muscle', color: '#ff3b30', skill: 0.95 },
    { name: 'Speedy_Uz', carId: 'car_cyber', color: '#b026ff', skill: 0.92 },
    { name: 'Vortex_99', carId: 'car_hyper', color: '#ffbe0b', skill: 0.96 },
    { name: 'Drift_Master', carId: 'car_f1', color: '#00ff88', skill: 0.98 },
    { name: 'Falcon_X', carId: 'car_starter', color: '#00f3ff', skill: 0.88 },
    { name: 'Blaze_Tashkent', carId: 'car_muscle', color: '#ff5400', skill: 0.90 },
    { name: 'Shadow_Samarkand', carId: 'car_cyber', color: '#111111', skill: 0.93 },
    { name: 'Titan_Rider', carId: 'car_offroad', color: '#ff9e00', skill: 0.89 },
    { name: 'Ghost_Phantom', carId: 'car_hyper', color: '#ffffff', skill: 0.94 },
    { name: 'Thunder_Bukhara', carId: 'car_f1', color: '#e024c3', skill: 0.97 },
    { name: 'Nitro_Boy', carId: 'car_starter', color: '#0077b6', skill: 0.87 }
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
    const bodyColor = new THREE.Color(colorHex || carConfig.color);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.2,
      metalness: 0.8
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x111625,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85
    });
    const blackMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.7
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xdde5ed,
      metalness: 0.9,
      roughness: 0.1
    });
    const glowCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const glowRedMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });

    let bodyLength = 4.2;
    let bodyWidth = 1.9;
    let bodyHeight = 0.85;

    if (carConfig.bodyStyle === 'formula') {
      bodyLength = 4.8;
      bodyWidth = 1.6;
      bodyHeight = 0.55;
    } else if (carConfig.bodyStyle === 'buggy') {
      bodyLength = 3.9;
      bodyWidth = 2.1;
      bodyHeight = 1.2;
    }

    // 1. Asosiy kuzov (Chassis)
    const chassisGeo = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyLength);
    const chassisMesh = new THREE.Mesh(chassisGeo, bodyMat);
    chassisMesh.position.y = bodyHeight / 2 + 0.35;
    chassisMesh.castShadow = true;
    chassisMesh.receiveShadow = true;
    carGroup.add(chassisMesh);

    // 2. Kabina va oynalar
    if (carConfig.bodyStyle !== 'formula') {
      const cabinGeo = new THREE.BoxGeometry(bodyWidth * 0.82, bodyHeight * 0.75, bodyLength * 0.45);
      const cabinMesh = new THREE.Mesh(cabinGeo, glassMat);
      cabinMesh.position.set(0, bodyHeight + 0.25, -0.2);
      carGroup.add(cabinMesh);
    } else {
      // Formula Cockpit + Halo
      const haloGeo = new THREE.TorusGeometry(0.35, 0.05, 8, 16, Math.PI);
      const haloMesh = new THREE.Mesh(haloGeo, blackMat);
      haloMesh.position.set(0, bodyHeight + 0.3, -0.1);
      haloMesh.rotation.x = Math.PI / 2;
      carGroup.add(haloMesh);
    }

    // 3. Spoyler / Qanot
    if (carConfig.bodyStyle === 'formula' || carConfig.bodyStyle === 'hyper' || carConfig.bodyStyle === 'muscle') {
      const wingGeo = new THREE.BoxGeometry(bodyWidth * 1.05, 0.08, 0.5);
      const wingMesh = new THREE.Mesh(wingGeo, blackMat);
      wingMesh.position.set(0, bodyHeight + 0.55, -bodyLength / 2 + 0.2);

      const standGeo = new THREE.BoxGeometry(0.08, 0.35, 0.1);
      const standLeft = new THREE.Mesh(standGeo, blackMat);
      standLeft.position.set(-0.6, bodyHeight + 0.35, -bodyLength / 2 + 0.2);
      const standRight = new THREE.Mesh(standGeo, blackMat);
      standRight.position.set(0.6, bodyHeight + 0.35, -bodyLength / 2 + 0.2);

      carGroup.add(wingMesh);
      carGroup.add(standLeft);
      carGroup.add(standRight);
    }

    // 4. Old fara chiroqlari (Headlights)
    const lightGeo = new THREE.BoxGeometry(0.35, 0.12, 0.08);
    const leftLight = new THREE.Mesh(lightGeo, glowCyanMat);
    leftLight.position.set(-bodyWidth / 2 + 0.3, bodyHeight / 2 + 0.4, bodyLength / 2 + 0.01);
    const rightLight = new THREE.Mesh(lightGeo, glowCyanMat);
    rightLight.position.set(bodyWidth / 2 - 0.3, bodyHeight / 2 + 0.4, bodyLength / 2 + 0.01);
    carGroup.add(leftLight);
    carGroup.add(rightLight);

    // 5. Orqa stop-chiroqlar (Taillights)
    const tailLightGeo = new THREE.BoxGeometry(0.4, 0.1, 0.08);
    const leftTail = new THREE.Mesh(tailLightGeo, glowRedMat);
    leftTail.position.set(-bodyWidth / 2 + 0.35, bodyHeight / 2 + 0.4, -bodyLength / 2 - 0.01);
    const rightTail = new THREE.Mesh(tailLightGeo, glowRedMat);
    rightTail.position.set(bodyWidth / 2 - 0.35, bodyHeight / 2 + 0.4, -bodyLength / 2 - 0.01);
    carGroup.add(leftTail);
    carGroup.add(rightTail);

    // 6. G'ildiraklar (4 ta aylantiriluvchi g'ildiraklar)
    const wheelRadius = carConfig.bodyStyle === 'buggy' ? 0.52 : 0.42;
    const wheelWidth = carConfig.bodyStyle === 'formula' ? 0.38 : 0.3;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
    wheelGeo.rotateZ(Math.PI / 2);

    const wheels = [];
    const wheelPositions = [
      { x: -bodyWidth / 2 - 0.05, y: wheelRadius, z: bodyLength / 2 - 0.8, isFront: true },
      { x: bodyWidth / 2 + 0.05, y: wheelRadius, z: bodyLength / 2 - 0.8, isFront: true },
      { x: -bodyWidth / 2 - 0.05, y: wheelRadius, z: -bodyLength / 2 + 0.8, isFront: false },
      { x: bodyWidth / 2 + 0.05, y: wheelRadius, z: -bodyLength / 2 + 0.8, isFront: false }
    ];

    wheelPositions.forEach((pos) => {
      const wheelHub = new THREE.Group();
      wheelHub.position.set(pos.x, pos.y, pos.z);

      const tireMesh = new THREE.Mesh(wheelGeo, blackMat);
      tireMesh.castShadow = true;
      wheelHub.add(tireMesh);

      const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.6, wheelRadius * 0.6, wheelWidth + 0.02, 8);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      wheelHub.add(rimMesh);

      carGroup.add(wheelHub);
      wheels.push({ group: wheelHub, mesh: tireMesh, isFront: pos.isFront });
    });

    // 7. Nitro Olov Chiqaruvchi Trubalar (Exhaust flame particles)
    const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 8);
    exhaustGeo.rotateX(Math.PI / 2);
    const leftExhaust = new THREE.Mesh(exhaustGeo, blackMat);
    leftExhaust.position.set(-0.35, 0.35, -bodyLength / 2 - 0.1);
    const rightExhaust = new THREE.Mesh(exhaustGeo, blackMat);
    rightExhaust.position.set(0.35, 0.35, -bodyLength / 2 - 0.1);
    carGroup.add(leftExhaust);
    carGroup.add(rightExhaust);

    // Nitro olov alanga mesh
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0 });
    const flameGeo = new THREE.ConeGeometry(0.18, 0.7, 8);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.set(0, 0.35, -bodyLength / 2 - 0.45);
    carGroup.add(flameMesh);

    // Mashina obyektiga ichki havolalarni biriktiramiz
    carGroup.userData = {
      wheels,
      flameMesh,
      flameMat,
      chassisMesh,
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

    // Yoritish
    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    garageScene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0x00f3ff, 1.2);
    dirLight.position.set(5, 8, 5);
    garageScene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xb026ff, 0.8);
    backLight.position.set(-5, 4, -5);
    garageScene.add(backLight);

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
  // 8. 3D TRASSA YARATISH MOTORASI (CIRCUIT, PROPS, COINS, BOOSTS)
  // -------------------------------------------------------------
  class RaceTrackManager {
    constructor(scene, zoneConfig) {
      this.scene = scene;
      this.zone = zoneConfig;
      this.curve = null;
      this.trackMesh = null;
      this.curbsMesh = null;
      this.coins = [];
      this.boostPads = [];
      this.environmentProps = [];
      this.trackPointsCount = 200;
      this.trackWidth = 14;
      this.totalLength = 0;
      this.generateCircuit();
    }

    generateCircuit() {
      // Trassa egri chiziq nazorat nuqtalari (To'liq tekis, qat'iy yer sathidagi yo'l)
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

      this.buildRoadMesh();
      this.buildStartFinishArch();
      this.spawnBoostPads();
      this.spawnCoins();
      this.buildEnvironment();
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

        vertices.push(leftPos.x, 0.04, leftPos.z);
        vertices.push(rightPos.x, 0.04, rightPos.z);

        uvs.push(0, t * 40);
        uvs.push(1, t * 40);

        if (i < segments) {
          const base = i * 2;
          indices.push(base, base + 1, base + 2);
          indices.push(base + 1, base + 3, base + 2);
        }

        // Yon bordyurlar
        const curbW = 1.2;
        const curbLeftInner = leftPos;
        const curbLeftOuter = new THREE.Vector3().copy(pt).addScaledVector(normal, -halfW - curbW);
        leftCurbsVerts.push(curbLeftOuter.x, 0.12, curbLeftOuter.z);
        leftCurbsVerts.push(curbLeftInner.x, 0.05, curbLeftInner.z);

        const curbRightInner = rightPos;
        const curbRightOuter = new THREE.Vector3().copy(pt).addScaledVector(normal, halfW + curbW);
        rightCurbsVerts.push(curbRightInner.x, 0.05, curbRightInner.z);
        rightCurbsVerts.push(curbRightOuter.x, 0.12, curbRightOuter.z);
      }

      roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      roadGeo.setIndex(indices);
      roadGeo.computeVertexNormals();

      const roadMat = new THREE.MeshStandardMaterial({
        color: this.zone.roadColor,
        roughness: 0.6,
        metalness: 0.2
      });

      this.trackMesh = new THREE.Mesh(roadGeo, roadMat);
      this.trackMesh.receiveShadow = true;
      this.scene.add(this.trackMesh);

      // Bordyurlar
      const curbGeo = new THREE.BufferGeometry();
      const allCurbVerts = leftCurbsVerts.concat(rightCurbsVerts);
      curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(allCurbVerts, 3));

      for (let i = 0; i < segments; i++) {
        const base = i * 2;
        curbIndices.push(base, base + 1, base + 2);
        curbIndices.push(base + 1, base + 3, base + 2);
      }
      const offset = (segments + 1) * 2;
      for (let i = 0; i < segments; i++) {
        const base = offset + i * 2;
        curbIndices.push(base, base + 1, base + 2);
        curbIndices.push(base + 1, base + 3, base + 2);
      }
      curbGeo.setIndex(curbIndices);
      curbGeo.computeVertexNormals();

      const curbMat = new THREE.MeshStandardMaterial({
        color: this.zone.curbColor,
        roughness: 0.4,
        emissive: this.zone.curbColor,
        emissiveIntensity: 0.2
      });

      this.curbsMesh = new THREE.Mesh(curbGeo, curbMat);
      this.scene.add(this.curbsMesh);
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
        } else if (this.zone.id === 'desert') {
          // Qum piramidalari va qoyalar
          const rockGeo = new THREE.ConeGeometry(12, 16, 4);
          const rockMat = new THREE.MeshStandardMaterial({ color: 0xb5651d, roughness: 0.9 });
          const rock = new THREE.Mesh(rockGeo, rockMat);
          rock.position.set(propPos.x, 8, propPos.z);
          this.scene.add(rock);
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
        }
      }
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
      this.mesh.position.set(pt.x + normal.x * laneSide, 0, pt.z + normal.z * laneSide);
      
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

      // Harakat yo'nalishi
      const forwardVec = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
      this.mesh.position.addScaledVector(forwardVec, this.speed * delta);

      // Yo'ldan chiqib ketish tekshiruvi (Off-road sekinlashuvi)
      const closest = this.track.getClosestTrackPoint(this.mesh.position);
      if (closest.dist > (this.track.trackWidth / 2 + 0.8)) {
        this.speed *= 0.96;
        if (Math.abs(this.speed) > 15 && Math.random() < 0.05) {
          showDriftBadge('⚠️ YO\'LDAN CHIQIB KETDINGIZ!');
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

      this.mesh.rotateY(steer * 2.2 * delta);
      const moveVec = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
      this.mesh.position.addScaledVector(moveVec, this.speed * delta);
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
      this.mesh.position.copy(pt);
      this.mesh.position.y += 0.3;
      this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
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

    // Yoritish
    const ambLight = new THREE.AmbientLight(0x223355, 1.2);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0x00f3ff, 1.4);
    dirLight.position.set(100, 150, 50);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Katta zamin tekisligi
    const groundGeo = new THREE.PlaneGeometry(1600, 1600);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x070b19,
      roughness: 0.9
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

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
      if (trackManager.trackMesh) scene.remove(trackManager.trackMesh);
      if (trackManager.curbsMesh) scene.remove(trackManager.curbsMesh);
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
