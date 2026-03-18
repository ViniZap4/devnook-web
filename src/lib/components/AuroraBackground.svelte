<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import * as THREE from 'three';
  import { onMount } from 'svelte';

  let { accentColor = '#6366f1' }: { accentColor: string } = $props();

  const targetColor = new THREE.Color();
  let mouseX = 0;
  let mouseY = 0;
  let time = 0;

  interface Ribbon {
    width: number;
    height: number;
    segW: number;
    segH: number;
    y: number;
    z: number;
    opacity: number;
    speed: number;
    phase: number;
    amplitude: number;
  }

  const ribbons: Ribbon[] = [
    { width: 80, height: 15, segW: 64, segH: 8, y: 6, z: 10, opacity: 0.25, speed: 0.4, phase: 0, amplitude: 4.5 },
    { width: 70, height: 12, segW: 56, segH: 8, y: 2, z: 5, opacity: 0.20, speed: 0.3, phase: 1.5, amplitude: 5.0 },
    { width: 60, height: 10, segW: 48, segH: 6, y: -2, z: 0, opacity: 0.28, speed: 0.5, phase: 3.0, amplitude: 4.0 },
    { width: 75, height: 14, segW: 60, segH: 8, y: 10, z: -5, opacity: 0.22, speed: 0.35, phase: 4.5, amplitude: 4.8 },
  ];

  let ribbonRefs = $state<(THREE.Mesh | undefined)[]>([undefined, undefined, undefined, undefined]);

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
    time += 0.004;
    targetColor.set(accentColor);

    for (let r = 0; r < ribbons.length; r++) {
      const mesh = ribbonRefs[r];
      if (!mesh) continue;
      const ribbon = ribbons[r];

      const geometry = mesh.geometry as THREE.PlaneGeometry;
      const positions = geometry.attributes.position;

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);

        const wave1 = Math.sin(x * 0.06 + time * ribbon.speed + ribbon.phase) * ribbon.amplitude;
        const wave2 = Math.sin(x * 0.12 + y * 0.1 + time * ribbon.speed * 1.3) * (ribbon.amplitude * 0.4);
        const wave3 = Math.cos(y * 0.15 + time * ribbon.speed * 0.7 + ribbon.phase * 0.5) * (ribbon.amplitude * 0.3);
        const mouseWave = Math.sin(x * 0.04 + mouseX * 1.5) * mouseY * 1.5;

        positions.setZ(i, wave1 + wave2 + wave3 + mouseWave);
      }

      positions.needsUpdate = true;

      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.color.lerp(targetColor, 0.03);
    }
  });
</script>

<T.Group>
  {#each ribbons as ribbon, i}
    <T.Mesh
      bind:ref={ribbonRefs[i]}
      position.y={ribbon.y}
      position.z={ribbon.z}
      rotation.x={-0.3}
    >
      <T.PlaneGeometry args={[ribbon.width, ribbon.height, ribbon.segW, ribbon.segH]} />
      <T.MeshBasicMaterial
        color={accentColor}
        transparent
        opacity={ribbon.opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </T.Mesh>
  {/each}
</T.Group>
