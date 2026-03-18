<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import * as THREE from 'three';
  import { onMount } from 'svelte';

  let { accentColor = '#6366f1' }: { accentColor: string } = $props();

  const targetColor = new THREE.Color();
  let mouseX = 0;
  let mouseY = 0;
  let time = 0;

  const RING_COUNT = 15;
  const RING_SPACING = 6;
  const RING_SPEED = 0.08;

  interface Ring {
    z: number;
    rotZ: number;
    scale: number;
  }

  const rings: Ring[] = Array.from({ length: RING_COUNT }, (_, i) => ({
    z: -i * RING_SPACING,
    rotZ: Math.random() * Math.PI * 2,
    scale: 1 + Math.random() * 0.5,
  }));

  let ringRefs = $state<(THREE.Mesh | undefined)[]>(Array(RING_COUNT).fill(undefined));

  onMount(() => {
    let ticking = false;
    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          mouseX = (e.clientX / window.innerWidth) * 2 - 1;
          mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  });

  useTask(() => {
    time += 0.01;
    targetColor.set(accentColor);

    const totalDepth = RING_COUNT * RING_SPACING;

    for (let i = 0; i < RING_COUNT; i++) {
      const mesh = ringRefs[i];
      if (!mesh) continue;
      const ring = rings[i];

      // Move ring toward camera
      ring.z += RING_SPEED;

      // Recycle when past camera
      if (ring.z > 10) {
        ring.z -= totalDepth;
        ring.rotZ = Math.random() * Math.PI * 2;
        ring.scale = 1 + Math.random() * 0.5;
      }

      // Depth-based parallax for mouse
      const depthFactor = Math.max(0, 1 - Math.abs(ring.z) / totalDepth);
      const px = mouseX * 3 * depthFactor;
      const py = mouseY * 3 * depthFactor;

      mesh.position.set(px, py, ring.z);
      ring.rotZ += 0.003;
      mesh.rotation.z = ring.rotZ;
      mesh.scale.setScalar(ring.scale);

      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.color.lerp(targetColor, 0.05);
      mat.opacity = 0.12 + depthFactor * 0.12;
    }
  });
</script>

<T.Group>
  {#each rings as ring, i}
    <T.Mesh
      bind:ref={ringRefs[i]}
      position.z={ring.z}
    >
      <T.TorusGeometry args={[5, 0.04, 8, 6]} />
      <T.MeshBasicMaterial
        color={accentColor}
        transparent
        opacity={0.15}
        wireframe
      />
    </T.Mesh>
  {/each}
</T.Group>
