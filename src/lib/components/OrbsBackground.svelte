<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import * as THREE from 'three';
  import { onMount } from 'svelte';

  let { accentColor = '#6366f1' }: { accentColor: string } = $props();

  let groupRef = $state.raw<THREE.Group>();
  const targetColor = new THREE.Color();
  let mouseX = 0;
  let mouseY = 0;
  let time = 0;

  const ORB_COUNT = 8;

  interface Orb {
    x: number;
    y: number;
    z: number;
    scale: number;
    speed: number;
    phaseX: number;
    phaseY: number;
    phaseZ: number;
    radius: number;
  }

  const orbs: Orb[] = Array.from({ length: ORB_COUNT }, () => ({
    x: (Math.random() - 0.5) * 60,
    y: (Math.random() - 0.5) * 40,
    z: -20 - Math.random() * 30,
    scale: 1.5 + Math.random() * 3,
    speed: 0.002 + Math.random() * 0.004,
    phaseX: Math.random() * Math.PI * 2,
    phaseY: Math.random() * Math.PI * 2,
    phaseZ: Math.random() * Math.PI * 2,
    radius: 8 + Math.random() * 15,
  }));

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
    if (!groupRef) return;
    time += 0.003;

    targetColor.set(accentColor);

    const children = groupRef.children;
    for (let i = 0; i < children.length; i++) {
      const orb = orbs[i];
      if (!orb) continue;
      const child = children[i] as THREE.Mesh;

      // Smooth orbital motion
      const t = time * orb.speed * 100;
      child.position.x = orb.x + Math.sin(t + orb.phaseX) * orb.radius + mouseX * 3;
      child.position.y = orb.y + Math.cos(t + orb.phaseY) * (orb.radius * 0.6) + mouseY * 3;
      child.position.z = orb.z + Math.sin(t * 0.7 + orb.phaseZ) * (orb.radius * 0.4);

      // Gentle breathing scale
      const breathe = 1 + Math.sin(t * 2 + i) * 0.15;
      child.scale.setScalar(orb.scale * breathe);

      // Color lerp
      const mat = child.material as THREE.MeshBasicMaterial;
      mat.color.lerp(targetColor, 0.03);
    }
  });
</script>

<T.Group bind:ref={groupRef}>
  {#each orbs as orb, i}
    <T.Mesh position.x={orb.x} position.y={orb.y} position.z={orb.z}>
      <T.SphereGeometry args={[orb.scale, 24, 24]} />
      <T.MeshBasicMaterial
        color={accentColor}
        transparent
        opacity={0.08 + (i % 3) * 0.03}
      />
    </T.Mesh>
  {/each}
</T.Group>
