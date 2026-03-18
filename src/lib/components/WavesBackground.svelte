<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import * as THREE from 'three';
  import { onMount } from 'svelte';

  let { accentColor = '#6366f1' }: { accentColor: string } = $props();

  let meshRef = $state.raw<THREE.Mesh>();
  const targetColor = new THREE.Color();
  let mouseX = 0;
  let mouseY = 0;
  let time = 0;

  const PLANE_SIZE = 80;
  const SEGMENTS = 64;

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
    if (!meshRef) return;
    time += 0.006;

    const geometry = meshRef.geometry as THREE.PlaneGeometry;
    const positions = geometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);

      // Multi-layered sine waves for organic motion
      const wave1 = Math.sin(x * 0.08 + time * 1.2) * 1.5;
      const wave2 = Math.sin(y * 0.06 + time * 0.8) * 1.2;
      const wave3 = Math.sin((x + y) * 0.05 + time * 0.5) * 0.8;
      const mouseFactor = Math.sin(x * 0.03 + mouseX * 2) * mouseY * 1.5;

      positions.setZ(i, wave1 + wave2 + wave3 + mouseFactor);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();

    // Color update
    targetColor.set(accentColor);
    const mat = meshRef.material as THREE.MeshBasicMaterial;
    mat.color.lerp(targetColor, 0.05);
  });
</script>

<T.Mesh
  bind:ref={meshRef}
  rotation.x={-Math.PI / 2.8}
  position.y={-12}
>
  <T.PlaneGeometry args={[PLANE_SIZE, PLANE_SIZE, SEGMENTS, SEGMENTS]} />
  <T.MeshBasicMaterial
    color={accentColor}
    wireframe
    transparent
    opacity={0.35}
  />
</T.Mesh>
