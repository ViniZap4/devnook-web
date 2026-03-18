<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import * as THREE from 'three';
  import { onMount } from 'svelte';

  let { accentColor = '#6366f1' }: { accentColor: string } = $props();

  let meshRef = $state.raw<THREE.InstancedMesh>();
  const targetColor = new THREE.Color();
  const dummy = new THREE.Object3D();
  let mouseX = 0;
  let mouseY = 0;
  let time = 0;

  const COLUMNS = 20;
  const DROPS_PER_COL = 10;
  const TOTAL = COLUMNS * DROPS_PER_COL;
  const SPREAD_X = 50;
  const HEIGHT = 40;
  const FALL_SPEED_BASE = 0.08;

  interface Drop {
    colX: number;
    colZ: number;
    y: number;
    speed: number;
    index: number;
    baseScale: number;
  }

  const drops: Drop[] = [];

  for (let c = 0; c < COLUMNS; c++) {
    const colX = (c / COLUMNS - 0.5) * SPREAD_X + (Math.random() - 0.5) * 2;
    const colZ = 8 - Math.random() * 14;
    const speed = FALL_SPEED_BASE + Math.random() * 0.06;
    const startY = Math.random() * HEIGHT * 2;

    for (let d = 0; d < DROPS_PER_COL; d++) {
      drops.push({
        colX,
        colZ,
        y: startY + d * 1.8,
        speed,
        index: d,
        baseScale: Math.max(0.3, 1.2 - d * 0.09),
      });
    }
  }

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
    time += 0.01;

    targetColor.set(accentColor);
    const mat = meshRef.material as THREE.MeshBasicMaterial;
    mat.color.lerp(targetColor, 0.05);

    for (let i = 0; i < TOTAL; i++) {
      const drop = drops[i];

      // Fall down
      drop.y -= drop.speed;

      // Recycle at bottom
      if (drop.y < -HEIGHT / 2 - 5) {
        drop.y = HEIGHT / 2 + 5 + drop.index * 1.8;
      }

      const mouseOffset = mouseX * 1.5 * (1 - drop.index / DROPS_PER_COL);

      dummy.position.set(
        drop.colX + mouseOffset,
        drop.y + mouseY * 2,
        drop.colZ
      );
      dummy.scale.setScalar(drop.baseScale);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      meshRef.setMatrixAt(i, dummy.matrix);
    }

    meshRef.instanceMatrix.needsUpdate = true;
  });
</script>

<T.InstancedMesh bind:ref={meshRef} args={[undefined, undefined, TOTAL]} frustumCulled={false}>
  <T.BoxGeometry args={[0.25, 0.25, 0.25]} />
  <T.MeshBasicMaterial color={accentColor} transparent opacity={0.6} />
</T.InstancedMesh>
