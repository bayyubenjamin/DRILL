'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { impact } from '@/lib/telegram/haptic';

interface DrillSceneProps {
  active: boolean;
  onError?: () => void;
}

const LIME = 0xb6ff14;
const LIME_DEEP = 0x8fd400;
const STEEL = 0xd7dae0;
const STEEL_DARK = 0x9aa0a6;
const METAL_DARK = 0x2a2e35;
const ROCK = 0x242818;

/** Fixed rock layout so the scene is identical on every mount. */
const ROCKS: Array<{ x: number; z: number; s: number; ry: number }> = [
  { x: -1.7, z: 0.5, s: 0.34, ry: 0.4 },
  { x: -1.2, z: -0.9, s: 0.24, ry: 1.2 },
  { x: 1.9, z: -0.6, s: 0.3, ry: 2.1 },
  { x: 2.1, z: 0.7, s: 0.2, ry: 0.9 },
  { x: 0.9, z: -1.4, s: 0.18, ry: 2.8 },
  { x: -0.6, z: 1.5, s: 0.22, ry: 1.7 },
];

const CRYSTALS: Array<{ x: number; z: number; s: number; ry: number }> = [
  { x: -0.75, z: 0.85, s: 0.2, ry: 0.3 },
  { x: 0.85, z: 0.95, s: 0.16, ry: 1.1 },
  { x: 0.15, z: -1.1, s: 0.13, ry: 2.4 },
];

const SPARK_COUNT = 70;

function helixCurve(turns: number, height: number, radius: number, yTop: number) {
  const points: THREE.Vector3[] = [];
  const steps = 180;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const a = t * turns * Math.PI * 2;
    points.push(
      new THREE.Vector3(Math.cos(a) * radius, yTop - t * height, Math.sin(a) * radius),
    );
  }
  return new THREE.CatmullRomCurve3(points);
}

export default function DrillScene({ active, onError }: DrillSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  const errorRef = useRef(onError);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    errorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;

    const reducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    let renderer: THREE.WebGLRenderer;
    try {
      if (!window.WebGLRenderingContext) throw new Error('WebGL unavailable');
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      errorRef.current?.();
      return;
    }

    // Adaptive quality: start sharp, step the pixel ratio down if the
    // device cannot hold the frame rate (see the loop below).
    let currentRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(currentRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.touchAction = 'pan-y';
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // Camera frames the rig's visual centre (mast at x=0, body at x=1.18)
    // — not the mast alone — so the model sits dead-centre on a phone.
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(1.0, 2.4, 8.6);
    camera.lookAt(0.6, 1.4, 0);

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    // Everything visible lives in one group shifted left so the mast+body
    // composition is centred on x=0 (the camera's lookAt point).
    const world = new THREE.Group();
    world.position.x = -0.6;
    scene.add(world);

    // The turntable rotates the WHOLE diorama — platform, rocks, crystals,
    // particles, rim ring — not just the rig, so the scene turns as one.
    const turntable = new THREE.Group();
    world.add(turntable);

    // ---- lights -----------------------------------------------------------
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(4, 6, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9dff00, 0.9);
    rim.position.set(-5, 3, -4);
    scene.add(rim);
    // Stays in `world` (not the turntable) so the lighting never swings
    // around while the diorama rotates beneath it.
    const glowLight = new THREE.PointLight(LIME, 9, 9, 1.6);
    glowLight.position.set(0, 0.6, 1.6);
    world.add(glowLight);

    // ---- ground -----------------------------------------------------------
    const groundMat = track(
      new THREE.MeshStandardMaterial({ color: 0x0a0c08, roughness: 1, metalness: 0 }),
    );
    const ground = new THREE.Mesh(track(new THREE.CircleGeometry(2.7, 48)), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    turntable.add(ground);

    const glowMat = track(
      new THREE.MeshBasicMaterial({
        color: LIME,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const groundGlow = new THREE.Mesh(track(new THREE.CircleGeometry(1.5, 48)), glowMat);
    groundGlow.rotation.x = -Math.PI / 2;
    groundGlow.position.y = 0.0;
    turntable.add(groundGlow);

    // ---- rim ring: the circle that turns with the scene --------------------
    const rimRingMat = track(
      new THREE.MeshBasicMaterial({
        color: LIME,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const rimRing = new THREE.Mesh(
      track(new THREE.TorusGeometry(2.55, 0.018, 8, 96)),
      rimRingMat,
    );
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = 0.03;
    turntable.add(rimRing);

    // Tick marks around the rim — they make the rotation visible.
    const tickMat = track(
      new THREE.MeshBasicMaterial({
        color: LIME,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const tickGeo = track(new THREE.BoxGeometry(0.05, 0.02, 0.2));
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.position.set(Math.cos(a) * 2.55, 0.03, Math.sin(a) * 2.55);
      tick.rotation.y = -a;
      turntable.add(tick);
    }

    // A glowing orb riding the rim — the clearest sign the whole circle turns.
    const orb = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.07, 16, 12)),
      track(
        new THREE.MeshStandardMaterial({
          color: 0x1d3300,
          emissive: LIME,
          emissiveIntensity: 2.2,
          roughness: 0.3,
        }),
      ),
    );
    orb.position.set(2.55, 0.08, 0);
    turntable.add(orb);

    // ---- rocks + ore crystals ---------------------------------------------
    const rockMat = track(
      new THREE.MeshStandardMaterial({ color: ROCK, roughness: 0.95, metalness: 0.05 }),
    );
    const rockGeo = track(new THREE.DodecahedronGeometry(1, 0));
    for (const r of ROCKS) {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(r.x, 0.06 * r.s + 0.02, r.z);
      rock.scale.setScalar(r.s);
      rock.rotation.set(0.4, r.ry, 0.2);
      turntable.add(rock);
    }

    const crystalMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x1d3300,
        emissive: LIME,
        emissiveIntensity: 1.4,
        roughness: 0.25,
        metalness: 0.1,
      }),
    );
    const crystalGeo = track(new THREE.OctahedronGeometry(1, 0));
    for (const c of CRYSTALS) {
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.set(c.x, 0.12 * c.s + 0.03, c.z);
      crystal.scale.set(c.s, c.s * 1.6, c.s);
      crystal.rotation.set(0.2, c.ry, 0.15);
      turntable.add(crystal);
    }

    // ---- rig (bobbing + tilting machine, rides the turntable) --------------
    const rig = new THREE.Group();
    rig.position.y = 0;
    turntable.add(rig);

    const railMat = track(
      new THREE.MeshStandardMaterial({ color: METAL_DARK, metalness: 0.85, roughness: 0.35 }),
    );
    const railGeo = track(new THREE.BoxGeometry(0.09, 3.3, 0.09));
    for (const x of [-0.52, 0.52]) {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(x, 1.85, 0);
      rig.add(rail);
    }
    const beam = new THREE.Mesh(track(new THREE.BoxGeometry(1.14, 0.1, 0.1)), railMat);
    beam.position.set(0, 3.52, 0);
    rig.add(beam);

    const ringMat = track(
      new THREE.MeshStandardMaterial({ color: 0x6b7280, metalness: 0.9, roughness: 0.3 }),
    );
    const ringGeo = track(new THREE.TorusGeometry(0.42, 0.032, 12, 40));
    for (const y of [1.3, 2.1, 2.9]) {
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = y;
      ring.rotation.x = Math.PI / 2;
      rig.add(ring);
    }

    // ---- spinning bit: shaft + helix + tip ---------------------------------
    const bit = new THREE.Group();
    bit.position.y = 0;
    rig.add(bit);

    const shaft = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.085, 0.085, 3.1, 20)),
      track(
        new THREE.MeshStandardMaterial({ color: STEEL, metalness: 0.9, roughness: 0.25 }),
      ),
    );
    shaft.position.y = 1.75;
    bit.add(shaft);

    const helix = new THREE.Mesh(
      track(new THREE.TubeGeometry(helixCurve(4, 2.6, 0.26, 3.0), 220, 0.05, 8, false)),
      track(
        new THREE.MeshStandardMaterial({ color: 0xe8eaee, metalness: 0.9, roughness: 0.22 }),
      ),
    );
    bit.add(helix);

    const tip = new THREE.Mesh(
      track(new THREE.ConeGeometry(0.15, 0.5, 20)),
      track(
        new THREE.MeshStandardMaterial({ color: STEEL_DARK, metalness: 0.9, roughness: 0.3 }),
      ),
    );
    tip.position.y = 0.12;
    tip.rotation.x = Math.PI;
    bit.add(tip);

    const tipCore = new THREE.Mesh(
      track(new THREE.ConeGeometry(0.07, 0.32, 12)),
      track(
        new THREE.MeshStandardMaterial({
          color: 0x1d3300,
          emissive: LIME,
          emissiveIntensity: 1.8,
          roughness: 0.3,
        }),
      ),
    );
    tipCore.position.y = 0.08;
    tipCore.rotation.x = Math.PI;
    bit.add(tipCore);

    // ---- engine body --------------------------------------------------------
    const body = new THREE.Group();
    body.position.set(1.18, 1.62, 0);
    rig.add(body);

    const frame = new THREE.Mesh(
      track(new THREE.BoxGeometry(1.56, 1.86, 1.0)),
      track(
        new THREE.MeshStandardMaterial({ color: 0x1a1d22, metalness: 0.6, roughness: 0.45 }),
      ),
    );
    body.add(frame);

    const shell = new THREE.Mesh(
      track(new THREE.BoxGeometry(1.5, 1.8, 1.06)),
      track(
        new THREE.MeshStandardMaterial({ color: LIME_DEEP, metalness: 0.25, roughness: 0.38 }),
      ),
    );
    shell.position.z = 0.02;
    body.add(shell);

    const panel = new THREE.Mesh(
      track(new THREE.BoxGeometry(1.34, 1.64, 0.06)),
      track(
        new THREE.MeshStandardMaterial({ color: LIME, metalness: 0.2, roughness: 0.3 }),
      ),
    );
    panel.position.set(0, 0, 0.56);
    body.add(panel);

    const windowPane = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.56, 0.72, 0.05)),
      track(
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.4, roughness: 0.2 }),
      ),
    );
    windowPane.position.set(-0.28, 0.32, 0.6);
    body.add(windowPane);

    const lightMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x222222,
        emissive: 0xffffff,
        emissiveIntensity: 1.6,
        roughness: 0.3,
      }),
    );
    const lightGeo = track(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16));
    for (const x of [-0.38, -0.18]) {
      const lamp = new THREE.Mesh(lightGeo, lightMat);
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(x, 0.32, 0.62);
      body.add(lamp);
    }

    const ventMat = track(
      new THREE.MeshStandardMaterial({ color: 0x4d7a00, metalness: 0.4, roughness: 0.5 }),
    );
    const ventGeo = track(new THREE.BoxGeometry(1.1, 0.09, 0.04));
    for (let i = 0; i < 3; i += 1) {
      const vent = new THREE.Mesh(ventGeo, ventMat);
      vent.position.set(0, -0.55 - i * 0.16, 0.6);
      body.add(vent);
    }

    const arm = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.62, 0.24, 0.34)),
      track(
        new THREE.MeshStandardMaterial({ color: LIME_DEEP, metalness: 0.3, roughness: 0.4 }),
      ),
    );
    arm.position.set(-0.95, 0.55, 0);
    body.add(arm);

    // ---- ambient dust ---------------------------------------------------------
    const PARTICLE_COUNT = 110;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const speeds = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.15 + Math.random() * 0.85;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = Math.random() * 3.2;
      positions[i * 3 + 2] = Math.sin(a) * r;
      speeds[i] = 0.4 + Math.random() * 1.1;
    }
    const particleGeo = track(new THREE.BufferGeometry());
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = track(
      new THREE.PointsMaterial({
        color: 0xc8ff3a,
        size: 0.05,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const particles = new THREE.Points(particleGeo, particleMat);
    turntable.add(particles);

    // ---- sparks: burst from the bit tip ---------------------------------------
    const sparkPos = new Float32Array(SPARK_COUNT * 3);
    const sparkVel = new Float32Array(SPARK_COUNT * 3);
    const sparkLife = new Float32Array(SPARK_COUNT);
    const sparkMaxLife = new Float32Array(SPARK_COUNT);
    const sparkCol = new Float32Array(SPARK_COUNT * 3);
    for (let i = 0; i < SPARK_COUNT; i += 1) {
      sparkPos[i * 3 + 1] = -10; // parked below the scene until spawned
    }
    const sparkGeo = track(new THREE.BufferGeometry());
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkCol, 3));
    const sparkMat = track(
      new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    turntable.add(sparks);

    let sparkCursor = 0;
    const spawnSpark = (burst: boolean) => {
      const i = sparkCursor;
      sparkCursor = (sparkCursor + 1) % SPARK_COUNT;
      sparkPos[i * 3] = (Math.random() - 0.5) * 0.14;
      sparkPos[i * 3 + 1] = 0.15 + Math.random() * 0.1;
      sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 0.14;
      const a = Math.random() * Math.PI * 2;
      const speed = burst ? 1.2 + Math.random() * 2.2 : 0.5 + Math.random() * 1.2;
      sparkVel[i * 3] = Math.cos(a) * speed;
      sparkVel[i * 3 + 1] = 1.0 + Math.random() * (burst ? 2.0 : 1.2);
      sparkVel[i * 3 + 2] = Math.sin(a) * speed;
      sparkMaxLife[i] = sparkLife[i] = burst ? 0.5 + Math.random() * 0.5 : 0.6 + Math.random() * 0.7;
    };
    const burstSparks = (n: number) => {
      for (let k = 0; k < n; k += 1) spawnSpark(true);
    };

    // ---- shockwave ring: expands from the impact point while mining ----------
    const shockMat = track(
      new THREE.MeshBasicMaterial({
        color: LIME,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    const shockwave = new THREE.Mesh(
      track(new THREE.RingGeometry(0.32, 0.42, 48)),
      shockMat,
    );
    shockwave.rotation.x = -Math.PI / 2;
    shockwave.position.y = 0.03;
    turntable.add(shockwave);

    // ---- sizing ---------------------------------------------------------------
    const resize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      // updateStyle=true: the canvas must fill its container exactly.
      // Without it the canvas falls back to its 300x150 default size and
      // the scene renders squeezed / off-centre on phones.
      renderer.setSize(w, h, true);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // ---- drag to rotate (with inertia) + tap for a spark burst -----------------
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let downX = 0;
    let downY = 0;
    let downAt = 0;
    let velY = 0;
    // Start at a 3/4 angle so the first paint already reads as 3D
    // (body angled, depth visible) instead of a flat side-on view.
    let targetRotY = -0.55;
    let targetTilt = 0;
    let currentRotY = -0.55;
    let currentTilt = 0;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      velY = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      downX = e.clientX;
      downY = e.clientY;
      downAt = performance.now();
      renderer.domElement.style.cursor = 'grabbing';
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      targetRotY += dx * 0.006;
      velY = dx * 0.006;
      targetTilt = THREE.MathUtils.clamp(targetTilt + dy * 0.002, -0.14, 0.14);
    };
    const endDrag = (e: PointerEvent) => {
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      const quick = performance.now() - downAt < 350;
      dragging = false;
      renderer.domElement.style.cursor = 'grab';
      // A tap (not a drag) fires a spark burst with a light haptic.
      if (moved < 8 && quick) {
        burstSparks(25);
        impact('light');
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', endDrag);
    renderer.domElement.addEventListener('pointercancel', endDrag);

    // ---- loop -------------------------------------------------------------------
    let raf = 0;
    let visible = true;
    let running = true;
    let emaDt = 1 / 60;
    let frameCount = 0;
    let spawnAcc = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      if (!running) return;
      raf = requestAnimationFrame(animate);
      if (!visible || document.hidden) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const isActive = activeRef.current;
      frameCount += 1;

      // Adaptive quality: if frames run slow for a while, step the pixel
      // ratio down (1.5 -> 1.25 -> 1.0) to keep the scene smooth.
      emaDt = emaDt * 0.95 + dt * 0.05;
      if (frameCount % 120 === 0 && emaDt > 0.026 && currentRatio > 1) {
        currentRatio = Math.max(1, currentRatio - 0.25);
        renderer.setPixelRatio(currentRatio);
        resize();
      }

      if (!reducedMotion) {
        if (!dragging) {
          targetRotY += dt * (isActive ? 0.1 : 0.22);
          // Inertia: keep spinning briefly after a flick.
          targetRotY += velY;
          velY *= 0.93;
          if (Math.abs(velY) < 0.0001) velY = 0;
        }
        currentRotY += (targetRotY - currentRotY) * 0.12;
        currentTilt += (targetTilt - currentTilt) * 0.12;
        turntable.rotation.y = currentRotY;
        rig.rotation.x = currentTilt;
        rig.position.y = isActive
          ? -0.1 + Math.sin(t * 8) * 0.045
          : Math.sin(t * 1.4) * 0.035;
      } else {
        turntable.rotation.y = currentRotY;
      }

      // The bit spins fast while mining, faster still while being dragged.
      const bitSpeed = (isActive ? 16 : reducedMotion ? 0 : 1.5) + (dragging ? 6 : 0);
      bit.rotation.y += dt * bitSpeed;
      glowLight.intensity = isActive
        ? 14 + Math.sin(t * 6) * 5
        : 8 + Math.sin(t * 1.8) * 1.5;
      glowMat.opacity = isActive ? 0.2 + Math.sin(t * 6) * 0.05 : 0.1;
      crystalMat.emissiveIntensity = 1.2 + Math.sin(t * 2.2) * 0.45;

      // Shockwave: a ring expanding from the impact point, looping while mining.
      if (isActive && !reducedMotion) {
        const phase = (t % 2) / 2;
        shockwave.scale.setScalar(0.6 + phase * 3.2);
        shockMat.opacity = (1 - phase) * 0.45;
      } else if (shockMat.opacity !== 0) {
        shockMat.opacity = 0;
      }

      // Ambient dust drifting up.
      const pos = particleGeo.attributes.position as THREE.BufferAttribute;
      const rise = dt * (isActive ? 1.7 : 0.28);
      for (let i = 0; i < PARTICLE_COUNT; i += 1) {
        let y = pos.getY(i) + rise * speeds[i];
        if (y > 3.2) y = 0;
        pos.setY(i, y);
        if (!reducedMotion) {
          pos.setX(i, pos.getX(i) + Math.sin(t * 2 + i) * 0.0006);
        }
      }
      pos.needsUpdate = true;

      // Sparks: steady trickle while mining, rare flickers while idle.
      spawnAcc += dt * (isActive ? 42 : 6);
      while (spawnAcc >= 1) {
        spawnAcc -= 1;
        spawnSpark(false);
      }
      const sparkPosAttr = sparkGeo.attributes.position as THREE.BufferAttribute;
      const sparkColAttr = sparkGeo.attributes.color as THREE.BufferAttribute;
      for (let i = 0; i < SPARK_COUNT; i += 1) {
        if (sparkLife[i] <= 0) continue;
        sparkLife[i] -= dt;
        if (sparkLife[i] <= 0 || sparkPos[i * 3 + 1] < 0) {
          sparkLife[i] = 0;
          sparkPos[i * 3 + 1] = -10;
          sparkCol[i * 3] = 0;
          sparkCol[i * 3 + 1] = 0;
          sparkCol[i * 3 + 2] = 0;
          continue;
        }
        sparkVel[i * 3 + 1] -= 4.5 * dt;
        sparkPos[i * 3] += sparkVel[i * 3] * dt;
        sparkPos[i * 3 + 1] += sparkVel[i * 3 + 1] * dt;
        sparkPos[i * 3 + 2] += sparkVel[i * 3 + 2] * dt;
        const fade = sparkLife[i] / sparkMaxLife[i];
        sparkCol[i * 3] = 1.0 * fade;
        sparkCol[i * 3 + 1] = 0.91 * fade;
        sparkCol[i * 3 + 2] = 0.66 * fade;
      }
      sparkPosAttr.needsUpdate = true;
      sparkColAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 },
    );
    io.observe(container);

    const onVisibility = () => {
      if (!document.hidden) clock.getDelta();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', endDrag);
      renderer.domElement.removeEventListener('pointercancel', endDrag);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          const mesh = obj as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose?.();
          }
        }
      });
      disposables.forEach((d) => {
        try {
          d.dispose();
        } catch {
          // ignore
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="drill-scene h-[240px] w-full" aria-hidden />;
}
