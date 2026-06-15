import * as THREE from 'three';
import { Terrain } from '../../client/src/scene/Terrain';
import { setWorldManifest as setTerrainManifest } from '../../client/src/scene/VerticalTerrain';
import { setWorldManifest as setBiomeManifest } from '../../client/src/scene/Biomes';
import { setWorldManifest as setDungeonManifest } from '../../client/src/scene/DungeonConfig';
import { WorldManifest } from '../../client/src/state/WorldManifest';
import { buildMesh } from '../../client/src/meshes/core/MeshRegistry';

import '../../client/src/meshes/buildings';
import '../../client/src/meshes/props';
import '../../client/src/meshes/vegetation';

export function createHeroWorld(container: HTMLElement) {
  try {
    const rect = container.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.6;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.FogExp2(0x1a1a2e, 0.0012);

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 500);
    camera.position.set(0, 50, 80);
    camera.lookAt(0, 0, 0);

    const ambient = new THREE.AmbientLight(0x404066, 1.2);
    scene.add(ambient);
    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x362d1e, 0.4);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffeedd, 1.8);
    sun.position.set(40, 60, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const d = 50;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 120;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
    fill.position.set(-30, 20, -40);
    scene.add(fill);

    const worldManifest = new WorldManifest();
    setTerrainManifest(worldManifest);
    setBiomeManifest(worldManifest);
    setDungeonManifest(worldManifest);

    const terrain = new Terrain(scene);
    terrain.setManifest(worldManifest.toData());
    terrain.onChunkLoaded = () => {};
    terrain.onChunkUnloaded = () => {};
    terrain.init();

    const manifestData = worldManifest.toData();
    let placedCount = 0;
    for (const zone of Object.values(manifestData.zones)) {
      if (!zone.architecture?.landmarks) continue;
      for (const lm of zone.architecture.landmarks) {
        const [x, _y, z] = lm.transform.position;
        const scale = lm.transform.scale ?? 1;
        const rot = lm.transform.rotation ?? [0, 0, 0];
        const worldY = terrain.getHeightAt(x, z);
        const pos = new THREE.Vector3(x, worldY, z);
        const group = buildMesh(lm.type, { position: pos, scale });
        if (group) {
          if (rot[1]) group.rotation.y = rot[1];
          scene.add(group);
          placedCount++;
        }
      }
    }

    let time = 0;
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      time += dt;

      const angle = time * 0.08;
      const cx = Math.sin(angle) * 90;
      const cz = Math.cos(angle) * 70 - 20;
      const cy = 35 + Math.sin(angle * 0.5) * 10;

      camera.position.set(cx, cy, cz);
      camera.lookAt(0, 0, 0);

      terrain.update(cx, cz);

      // rebuild LOD caches periodically
      if (time > 0) {
        scene.traverse((obj) => {
          if (obj.type === 'LOD') (obj as THREE.LOD).update(camera);
        });
      }

      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => {
      const r = container.getBoundingClientRect();
      const nw = r.width || window.innerWidth;
      const nh = r.height || window.innerHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  } catch (err) {
    console.error('[hero-world] ERROR:', err);
    container.innerHTML = `<div style="color:white;padding:40px;text-align:center">
      <h2>Loading 3D world...</h2>
      <p style="color:#999">${err instanceof Error ? err.message : 'Unknown error'}</p>
    </div>`;
    return () => {};
  }
}
