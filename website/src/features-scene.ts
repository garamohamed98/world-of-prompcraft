import * as THREE from 'three';

export function createFeaturesScene(container: HTMLElement): () => void {
  const rect = container.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.prepend(renderer.domElement);
  Object.assign(renderer.domElement.style, {
    position: 'absolute', top: '0', left: '0',
    width: '100%', height: '100%', pointerEvents: 'none',
  });

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(0, 3, 14);
  camera.lookAt(0, 0, 0);
  camera.rotation.z = 0.05;

  // ── Central ambient glow ──
  const glowGeo = new THREE.SphereGeometry(6, 24, 24);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xc9a84c,
    transparent: true,
    opacity: 0.03,
  });
  const glowSphere = new THREE.Mesh(glowGeo, glowMat);
  glowSphere.position.set(0, 0, -3);
  scene.add(glowSphere);

  const glowSphere2 = new THREE.Mesh(
    new THREE.SphereGeometry(4, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0xffdd88,
      transparent: true,
      opacity: 0.02,
    }),
  );
  glowSphere2.position.set(1, -1, -2);
  scene.add(glowSphere2);

  // ── Floating golden orbs (big, visible) ──
  const orbs: { mesh: THREE.Mesh; angle: number; radius: number; speed: number; phase: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const size = 0.8 + Math.random() * 1.2;
    const geo = new THREE.SphereGeometry(size, 16, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xc9a84c,
      transparent: true,
      opacity: 0.06 + Math.random() * 0.06,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    orbs.push({
      mesh,
      angle: Math.random() * Math.PI * 2,
      radius: 2.5 + Math.random() * 4,
      speed: 0.15 + Math.random() * 0.15,
      phase: Math.random() * Math.PI * 2,
      y: (Math.random() - 0.5) * 4,
    });
  }

  // ── Glowing ring torus ──
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xc9a84c,
    transparent: true,
    opacity: 0.04,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.04, 12, 64), ringMat);
  ring.rotation.x = Math.PI / 3;
  ring.rotation.z = 0.2;
  scene.add(ring);

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.0, 0.03, 12, 64), ringMat.clone());
  ring2.material.opacity = 0.03;
  ring2.rotation.x = -Math.PI / 4;
  ring2.rotation.z = -0.3;
  scene.add(ring2);

  // ── Floating gems (bright, visible) ──
  const gems: { mesh: THREE.Mesh; rotSpeed: THREE.Vector3; offsetY: number; phase: number }[] = [];
  const gemColors = [0xf0d060, 0xe8c860, 0xdbb95c, 0xc9a84c, 0xffdd88];
  for (let i = 0; i < 8; i++) {
    const geo = new THREE.OctahedronGeometry(0.25 + Math.random() * 0.3);
    const mat = new THREE.MeshBasicMaterial({
      color: gemColors[i % gemColors.length],
      transparent: true,
      opacity: 0.5 + Math.random() * 0.3,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.5 + Math.random() * 3.5;
    mesh.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 4,
      Math.sin(angle) * radius,
    );
    mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    scene.add(mesh);
    gems.push({
      mesh,
      rotSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8,
      ),
      offsetY: mesh.position.y,
      phase: Math.random() * Math.PI * 2,
    });
  }

  // ── Bright particles ──
  const pCount = 300;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount * 3);
  const pSpeeds = new Float32Array(pCount);
  for (let i = 0; i < pCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 8;
    pPos[i * 3] = Math.cos(angle) * dist;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    pSpeeds[i] = 0.2 + Math.random() * 0.3;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xf0d060,
    size: 0.15,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ── Sweeping light band ──
  const bandCount = 80;
  const bGeo = new THREE.BufferGeometry();
  const bPos = new Float32Array(bandCount * 3);
  for (let i = 0; i < bandCount; i++) {
    const t = i / bandCount;
    bPos[i * 3] = (t - 0.5) * 12;
    bPos[i * 3 + 1] = Math.sin(t * Math.PI * 4) * 1.5;
    bPos[i * 3 + 2] = Math.sin(t * Math.PI * 2) * 0.5;
  }
  bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
  const bMat = new THREE.PointsMaterial({
    color: 0xffdd88,
    size: 0.2,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const band = new THREE.Points(bGeo, bMat);
  scene.add(band);

  let time = 0;
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    time += dt;

    const pAttr = particles.geometry.attributes.position;
    for (let i = 0; i < pCount; i++) {
      const i3 = i * 3;
      pAttr.array[i3 + 1] += Math.sin(time * pSpeeds[i] + i) * 0.006;
      pAttr.array[i3] += Math.cos(time * pSpeeds[i] * 0.6 + i * 0.5) * 0.003;
      if (pAttr.array[i3 + 1] > 4) pAttr.array[i3 + 1] = -4;
      if (pAttr.array[i3] > 5) pAttr.array[i3] = -5;
      if (pAttr.array[i3] < -5) pAttr.array[i3] = 5;
    }
    pAttr.needsUpdate = true;

    for (const orb of orbs) {
      orb.angle += dt * orb.speed;
      orb.mesh.position.set(
        Math.cos(orb.angle + orb.phase) * orb.radius,
        orb.y + Math.sin(time * 0.4 + orb.phase) * 1.2,
        Math.sin(orb.angle + orb.phase) * orb.radius,
      );
      const s = 1 + Math.sin(time * 0.6 + orb.phase) * 0.3;
      orb.mesh.scale.setScalar(s);
    }

    for (const gem of gems) {
      gem.mesh.rotation.x += dt * gem.rotSpeed.x;
      gem.mesh.rotation.y += dt * gem.rotSpeed.y;
      gem.mesh.position.y = gem.offsetY + Math.sin(time * 0.5 + gem.phase) * 0.3;
    }

    ring.rotation.y += dt * 0.15;
    ring.rotation.x += dt * 0.02;
    ring2.rotation.y -= dt * 0.1;
    ring2.rotation.z += dt * 0.02;

    glowSphere.scale.setScalar(1 + Math.sin(time * 0.2) * 0.05);
    glowSphere2.scale.setScalar(1 + Math.cos(time * 0.15 + 1) * 0.05);

    const bAttr = band.geometry.attributes.position;
    for (let i = 0; i < bandCount; i++) {
      const t = i / bandCount;
      bAttr.array[i * 3] = (t - 0.5) * 12 + Math.sin(time * 0.3 + i * 0.1) * 1;
      bAttr.array[i * 3 + 1] = Math.sin(t * Math.PI * 4 + time) * 1.5;
    }
    bAttr.needsUpdate = true;

    renderer.render(scene, camera);
  }

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
