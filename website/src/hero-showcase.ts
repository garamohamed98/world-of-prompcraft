import * as THREE from 'three';
import { buildMesh, hasMesh } from '../../client/src/meshes/core/MeshRegistry';

import '../../client/src/meshes/buildings';
import '../../client/src/meshes/props';
import '../../client/src/meshes/vegetation';
import '../../client/src/meshes/npcs';
import '../../client/src/meshes/players';

const SHOWCASE_TYPES = [
  'npc_individual_wandering_knight_01',
  'npc_creature_treant',
  'player_human',
  'player_night_elf',
  'player_orc',
  'npc_creature_frost_wraith',
  'npc_creature_lava_hound',
  'npc_individual_guard_malaka_01',
  'npc_individual_merchant_malaka_01',
  'npc_creature_spider',
];

const Phase = { Enter: 0, Display: 1, Exit: 2 } as const;
type Phase = (typeof Phase)[keyof typeof Phase];

interface ShowcaseState {
  group: THREE.Group | null;
  phase: Phase;
  timer: number;
  targetScale: number;
  yBase: number;
}

export function createHeroShowcase(container: HTMLElement): () => void {
  const rect = container.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.prepend(renderer.domElement);
  Object.assign(renderer.domElement.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  });

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100);
  camera.position.set(0, 2.5, 7);
  camera.lookAt(0, 1.0, 0);

  const ambient = new THREE.AmbientLight(0x404066, 1.0);
  scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0x87ceeb, 0x362d1e, 0.8);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffdd99, 2.5);
  key.position.set(5, 10, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8888ff, 0.5);
  fill.position.set(-5, 5, -7);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xff8844, 0.8);
  rim.position.set(0, 2, -10);
  scene.add(rim);

  const particleCount = 150;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(particleCount * 3);
  const pSpeeds = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 1 + Math.random() * 3;
    pPos[i * 3] = Math.cos(angle) * dist;
    pPos[i * 3 + 1] = -1 + Math.random() * 3;
    pPos[i * 3 + 2] = Math.sin(angle) * dist;
    pSpeeds[i] = 0.3 + Math.random() * 0.7;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xc9a84c,
    size: 0.06,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  let index = 0;
  const st: ShowcaseState = {
    group: null,
    phase: Phase.Enter,
    timer: 0,
    targetScale: 1,
    yBase: 0,
  };

  const ENTER_DURATION = 1.5;
  const DISPLAY_DURATION = 3.5;
  const EXIT_DURATION = 1.0;

  function loadNext() {
    if (st.group) {
      scene.remove(st.group);
    }
    const type = SHOWCASE_TYPES[index % SHOWCASE_TYPES.length];
    index++;
    if (!hasMesh(type)) { loadNext(); return; }

    const obj = buildMesh(type, { position: new THREE.Vector3(0, 0, 0), scale: 1 });
    if (!obj || !(obj instanceof THREE.Group)) { loadNext(); return; }

    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 2.2;
    const s = (maxDim > targetSize || maxDim < 1)
      ? targetSize / Math.max(maxDim, 0.1)
      : 1;

    const center = box.getCenter(new THREE.Vector3());
    obj.position.set(-center.x * s, 1.0 - center.y * s, -center.z * s);

    obj.scale.set(0.001, 0.001, 0.001);
    scene.add(obj);

    st.group = obj;
    st.phase = Phase.Enter;
    st.timer = 0;
    st.targetScale = s;
    st.yBase = 1.0 - center.y * s;
  }

  let time = 0;
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    time += dt;

    if (st.group) {
      st.timer += dt;

      if (st.phase === Phase.Enter) {
        const t = Math.min(st.timer / ENTER_DURATION, 1);
        const c1 = 1.70158;
        const c3 = c1 + 1;
        const ease = t < 1
          ? 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
          : 1;
        st.group.scale.setScalar(ease * st.targetScale);
        st.group.rotation.y += dt * (1 + (1 - ease) * 4);
        st.group.position.y = st.yBase - 0.5 + ease * 0.5;
        if (t >= 1) {
          st.phase = Phase.Display;
          st.timer = 0;
          st.group.scale.setScalar(st.targetScale);
          st.group.position.y = st.yBase;
        }
      } else if (st.phase === Phase.Display) {
        st.group.rotation.y += dt * 0.4;
        st.group.position.y = st.yBase + Math.sin(time * 0.6) * 0.12;
        if (st.timer >= DISPLAY_DURATION) {
          st.phase = Phase.Exit;
          st.timer = 0;
        }
      } else if (st.phase === Phase.Exit) {
        const t = Math.min(st.timer / EXIT_DURATION, 1);
        const ease = t * t;
        st.group.scale.setScalar((1 - ease) * st.targetScale);
        st.group.rotation.y += dt * 2.5;
        st.group.position.y = st.yBase + Math.sin(time * 0.6) * 0.12 * (1 - t) - ease * 0.3;
        if (t >= 1) {
          loadNext();
        }
      }
    }

    const posAttr = particles.geometry.attributes.position;
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      posAttr.array[i3 + 1] += Math.sin(time * pSpeeds[i] + i) * 0.003;
    }
    posAttr.needsUpdate = true;

    renderer.render(scene, camera);
  }

  loadNext();
  animate();

  function onResize() {
    const r = container.getBoundingClientRect();
    const nw = r.width;
    const nh = r.height;
    if (nw === 0 || nh === 0) return;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  }
  window.addEventListener('resize', onResize);

  return () => {
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
}
