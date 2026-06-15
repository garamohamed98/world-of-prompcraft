import * as THREE from 'three';

const COLORS = {
  skyTop: 0x0f0a1a,
  skyBottom: 0x2a1f3d,
  horizon: 0xd4a84c,
  ground1: 0x3a4a2a,
  ground2: 0x5a6a3a,
  trunk: 0x4a3a2a,
  foliage: 0x2a5a2a,
  foliage2: 0x3a6a2a,
  building: 0xf0e8d0,
  roof: 0xc07030,
  accent: 0xc9a84c,
  particle: 0xffdd88,
};

export function createHeroScene(container) {
  const rect = container.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(COLORS.skyTop, 0.0035);

  const camera = new THREE.PerspectiveCamera(45, w / h, 1, 400);
  camera.position.set(40, 25, 55);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    alpha: false,
    antialias: true,
  });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(COLORS.skyTop, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.prepend(renderer.domElement);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.pointerEvents = 'none';

  // --- SKY ---
  const skyGeo = new THREE.SphereGeometry(380, 32, 32);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      uColorTop: { value: new THREE.Color(COLORS.skyTop) },
      uColorMid: { value: new THREE.Color(0x1a1530) },
      uColorHorizon: { value: new THREE.Color(COLORS.horizon) },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColorTop;
      uniform vec3 uColorMid;
      uniform vec3 uColorHorizon;
      varying vec3 vPos;
      void main() {
        float h = normalize(vPos).y;
        float t = smoothstep(-0.05, 0.4, h);
        float b = smoothstep(-0.4, -0.05, h);
        vec3 col = mix(uColorHorizon, uColorMid, b);
        col = mix(col, uColorTop, t);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  // --- STARS ---
  const starCount = 800;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.7 + 0.3);
    const r = 350 + Math.random() * 30;
    starPos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
    starPos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
    starPos[i * 3 + 2] = Math.cos(phi) * r;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.4,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
  });
  scene.add(new THREE.Points(starGeo, starMat));

  // --- LIGHTS ---
  const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffdd99, 2.0);
  sunLight.position.set(-30, 40, 30);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 120;
  sunLight.shadow.camera.left = -60;
  sunLight.shadow.camera.right = 60;
  sunLight.shadow.camera.top = 60;
  sunLight.shadow.camera.bottom = -60;
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4);
  fillLight.position.set(20, 20, -30);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xff8844, 0.6);
  rimLight.position.set(0, 10, -40);
  scene.add(rimLight);

  // --- GROUND ---
  const groundGeo = new THREE.PlaneGeometry(120, 120, 64, 64);
  groundGeo.rotateX(-Math.PI / 2);
  const posAttr = groundGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const dist = Math.sqrt(x * x + z * z);
    let y = 0;
    y += Math.sin(x * 0.08) * Math.cos(z * 0.1) * 2.5;
    y += Math.sin(x * 0.15 + z * 0.12) * 1.2;
    y += Math.cos(x * 0.2 - z * 0.18) * 0.8;
    y -= Math.max(0, dist - 45) * 0.5;
    posAttr.setY(i, y);
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    color: COLORS.ground1,
    roughness: 0.9,
    metalness: 0.0,
    flatShading: false,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  scene.add(ground);

  // --- TREES ---
  function createTree(x, z, scale) {
    const g = new THREE.Group();
    const heightOffset = getHeightAt(x, z);

    const trunkGeo = new THREE.CylinderGeometry(0.2 * scale, 0.35 * scale, 2.5 * scale, 5);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: COLORS.trunk,
      roughness: 0.9,
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = heightOffset + 1.25 * scale;
    trunk.castShadow = true;
    g.add(trunk);

    const foliageMat = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.5 ? COLORS.foliage : COLORS.foliage2,
      roughness: 0.8,
    });

    const layers = Math.floor(2 + Math.random() * 2);
    for (let i = 0; i < layers; i++) {
      const r = (2 - i * 0.5) * scale;
      const h = (2.5 - i * 0.5) * scale;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(r, h, 6),
        foliageMat
      );
      cone.position.y = heightOffset + 2.5 * scale + i * 1.8 * scale;
      cone.castShadow = true;
      g.add(cone);
    }

    g.position.set(x, 0, z);
    const rot = Math.random() * 0.2 - 0.1;
    g.rotation.y = rot * 2;
    return g;
  }

  function getHeightAt(x, z) {
    let y = 0;
    y += Math.sin(x * 0.08) * Math.cos(z * 0.1) * 2.5;
    y += Math.sin(x * 0.15 + z * 0.12) * 1.2;
    y += Math.cos(x * 0.2 - z * 0.18) * 0.8;
    const dist = Math.sqrt(x * x + z * z);
    y -= Math.max(0, dist - 45) * 0.5;
    return y;
  }

  const treePositions = [];
  for (let i = 0; i < 120; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 8 + Math.random() * 40;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const scale = 0.6 + Math.random() * 1.0;
    treePositions.push({ x, z, scale });
  }
  treePositions.sort((a, b) => a.z - b.z);

  for (const t of treePositions) {
    const tree = createTree(t.x, t.z, t.scale);
    tree.renderOrder = 1;
    scene.add(tree);
  }

  // --- BUILDINGS (Fort Malaka inspired) ---
  function createBuilding(x, z, w, d, h, color, roofColor) {
    const g = new THREE.Group();
    const height = getHeightAt(x, z);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
    );
    body.position.y = height + h / 2;
    body.castShadow = true;
    g.add(body);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(Math.max(w, d) * 0.75, h * 0.5, 4),
      new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.7 })
    );
    roof.position.y = height + h + h * 0.25;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    g.add(roof);

    g.position.set(x, 0, z);
    g.rotation.y = Math.random() * Math.PI * 2;
    return g;
  }

  const buildings = [
    { x: -8, z: -6, w: 4, d: 4, h: 3.5 },
    { x: -3, z: -10, w: 3, d: 3, h: 2.8 },
    { x: -12, z: -12, w: 5, d: 5, h: 4.0 },
    { x: -5, z: -17, w: 3.5, d: 3.5, h: 3.0 },
    { x: -15, z: -4, w: 2.5, d: 2.5, h: 2.2 },
  ];
  for (const b of buildings) {
    const building = createBuilding(
      b.x, b.z, b.w, b.d, b.h,
      COLORS.building, COLORS.roof
    );
    scene.add(building);
  }

  // --- WALL section ---
  function createWallSegment(x1, z1, x2, z2) {
    const mx = (x1 + x2) / 2;
    const mz = (z1 + z2) / 2;
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);
    const h = getHeightAt(mx, mz);

    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 2.0, len),
      new THREE.MeshStandardMaterial({
        color: 0xd4c8a8,
        roughness: 0.8,
      })
    );
    wall.position.set(mx, h + 1.0, mz);
    wall.rotation.y = angle;
    wall.castShadow = true;
    return wall;
  }

  const wallPoints = [
    [-4, -4], [-10, -8], [-14, -14], [-10, -20], [-4, -22],
    [0, -20], [2, -14], [0, -8], [-4, -4],
  ];
  for (let i = 0; i < wallPoints.length - 1; i++) {
    const seg = createWallSegment(
      wallPoints[i][0], wallPoints[i][1],
      wallPoints[i + 1][0], wallPoints[i + 1][1]
    );
    scene.add(seg);
  }

  // --- PARTICLES (fireflies / magic dust) ---
  const particleCount = 400;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(particleCount * 3);
  const pSizes = new Float32Array(particleCount);
  const pPhases = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * 45;
    pPos[i * 3] = Math.cos(angle) * dist;
    pPos[i * 3 + 1] = 1 + Math.random() * 8;
    pPos[i * 3 + 2] = Math.sin(angle) * dist;
    pSizes[i] = 0.15 + Math.random() * 0.35;
    pPhases[i] = Math.random() * Math.PI * 2;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('size', new THREE.BufferAttribute(pSizes, 1));

  const pMat = new THREE.PointsMaterial({
    color: COLORS.particle,
    size: 0.3,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  const particlePositions = pPos;

  // --- ANIMATION ---
  let time = 0;
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    time += dt;

    const lookX = Math.sin(time * 0.04) * 8;
    const lookZ = Math.cos(time * 0.04) * 8;

    const cx = Math.sin(time * 0.025) * 50;
    const cz = Math.cos(time * 0.025) * 55 + 10;
    const cy = 20 + Math.sin(time * 0.015) * 5;

    camera.position.set(cx, cy, cz);
    camera.lookAt(lookX, 0, lookZ);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      particlePositions[i3 + 1] += Math.sin(time * 0.5 + pPhases[i]) * 0.003;
      particlePositions[i3 + 1] += Math.sin(time + pPhases[i] * 2) * 0.001;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }

  animate();

  // --- RESIZE ---
  function onResize() {
    const r = container.getBoundingClientRect();
    const ww = r.width;
    const wh = r.height;
    camera.aspect = ww / wh;
    camera.updateProjectionMatrix();
    renderer.setSize(ww, wh);
  }

  window.addEventListener('resize', onResize);

  return () => {
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
}
