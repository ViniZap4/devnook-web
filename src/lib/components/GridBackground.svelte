<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import * as THREE from 'three';
  import { onMount } from 'svelte';

  let { accentColor = '#6366f1' }: { accentColor: string } = $props();

  let gridGroup = $state.raw<THREE.Group>();
  const targetColor = new THREE.Color();
  let mouseX = 0;
  let mouseY = 0;
  let time = 0;

  // Create grid lines
  const GRID_SIZE = 80;
  const GRID_DIVISIONS = 30;
  const LINE_COUNT = (GRID_DIVISIONS + 1) * 2; // horizontal + vertical

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
    if (!gridGroup) return;
    time += 0.008;

    targetColor.set(accentColor);

    // Animate grid — gentle wave motion and mouse reactivity
    gridGroup.rotation.x = -Math.PI / 2.5 + mouseY * 0.05;
    gridGroup.rotation.z = Math.sin(time * 0.3) * 0.02 + mouseX * 0.03;
    gridGroup.position.y = -8 + Math.sin(time * 0.5) * 0.5;

    // Animate children vertex positions for wave effect
    gridGroup.children.forEach((child) => {
      if (child instanceof THREE.Line) {
        const mat = child.material as THREE.LineBasicMaterial;
        mat.color.lerp(targetColor, 0.05);
      }
    });
  });
</script>

<T.Group bind:ref={gridGroup}>
  <!-- Horizontal lines -->
  {#each Array(GRID_DIVISIONS + 1) as _, i}
    {@const z = -GRID_SIZE / 2 + (i / GRID_DIVISIONS) * GRID_SIZE}
    <T.Line>
      <T.BufferGeometry>
        <T.Float32BufferAttribute
          args={[new Float32Array([-GRID_SIZE / 2, 0, z, GRID_SIZE / 2, 0, z]), 3]}
          attach="attributes.position"
        />
      </T.BufferGeometry>
      <T.LineBasicMaterial color={accentColor} transparent opacity={0.3} />
    </T.Line>
  {/each}

  <!-- Vertical lines -->
  {#each Array(GRID_DIVISIONS + 1) as _, i}
    {@const x = -GRID_SIZE / 2 + (i / GRID_DIVISIONS) * GRID_SIZE}
    <T.Line>
      <T.BufferGeometry>
        <T.Float32BufferAttribute
          args={[new Float32Array([x, 0, -GRID_SIZE / 2, x, 0, GRID_SIZE / 2]), 3]}
          attach="attributes.position"
        />
      </T.BufferGeometry>
      <T.LineBasicMaterial color={accentColor} transparent opacity={0.3} />
    </T.Line>
  {/each}

  <!-- Accent horizontal glow lines (fewer, brighter) -->
  {#each [0.2, 0.4, 0.6, 0.8] as frac}
    {@const z = -GRID_SIZE / 2 + frac * GRID_SIZE}
    <T.Line>
      <T.BufferGeometry>
        <T.Float32BufferAttribute
          args={[new Float32Array([-GRID_SIZE / 2, 0.01, z, GRID_SIZE / 2, 0.01, z]), 3]}
          attach="attributes.position"
        />
      </T.BufferGeometry>
      <T.LineBasicMaterial color={accentColor} transparent opacity={0.55} />
    </T.Line>
  {/each}
</T.Group>
