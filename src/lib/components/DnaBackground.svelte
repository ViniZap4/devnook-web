<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import * as THREE from 'three';
  import { onMount } from 'svelte';

  let { accentColor = '#6366f1' }: { accentColor: string } = $props();

  let meshRef = $state.raw<THREE.InstancedMesh>();
  let lineRef = $state.raw<THREE.LineSegments>();
  const targetColor = new THREE.Color();
  const dummy = new THREE.Object3D();
  let mouseX = 0;
  let mouseY = 0;
  let time = 0;

  const NODES_PER_STRAND = 40;
  const TOTAL_NODES = NODES_PER_STRAND * 2;
  const HELIX_RADIUS = 4;
  const HELIX_HEIGHT = 40;
  const RUNG_INTERVAL = 3;

  // Count rungs
  const rungCount = Math.floor(NODES_PER_STRAND / RUNG_INTERVAL);
  const rungPositions = new Float32Array(rungCount * 6);
  const rungGeometry = new THREE.BufferGeometry();
  rungGeometry.setAttribute('position', new THREE.BufferAttribute(rungPositions, 3));

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
    time += 0.008;

    targetColor.set(accentColor);
    const mat = meshRef.material as THREE.MeshBasicMaterial;
    mat.color.lerp(targetColor, 0.05);

    const tiltX = mouseX * 0.3;
    const tiltY = mouseY * 0.2;

    let rungIdx = 0;

    for (let i = 0; i < NODES_PER_STRAND; i++) {
      const frac = i / NODES_PER_STRAND;
      const angle = frac * Math.PI * 6 + time * 2;
      const y = (frac - 0.5) * HELIX_HEIGHT;

      // Strand A
      const ax = Math.cos(angle) * HELIX_RADIUS + tiltX * (frac - 0.5) * 4;
      const az = Math.sin(angle) * HELIX_RADIUS;
      const ay = y + tiltY * 2;

      dummy.position.set(ax, ay, az - 15);
      dummy.scale.setScalar(0.8 + Math.sin(angle * 0.5) * 0.2);
      dummy.updateMatrix();
      meshRef.setMatrixAt(i, dummy.matrix);

      // Strand B (offset by PI)
      const bx = Math.cos(angle + Math.PI) * HELIX_RADIUS + tiltX * (frac - 0.5) * 4;
      const bz = Math.sin(angle + Math.PI) * HELIX_RADIUS;
      const by = y + tiltY * 2;

      dummy.position.set(bx, by, bz - 15);
      dummy.scale.setScalar(0.8 + Math.sin(angle * 0.5 + Math.PI) * 0.2);
      dummy.updateMatrix();
      meshRef.setMatrixAt(NODES_PER_STRAND + i, dummy.matrix);

      // Rungs every RUNG_INTERVAL nodes
      if (i % RUNG_INTERVAL === 0 && rungIdx < rungCount) {
        const idx = rungIdx * 6;
        rungPositions[idx] = ax;
        rungPositions[idx + 1] = ay;
        rungPositions[idx + 2] = az - 15;
        rungPositions[idx + 3] = bx;
        rungPositions[idx + 4] = by;
        rungPositions[idx + 5] = bz - 15;
        rungIdx++;
      }
    }

    meshRef.instanceMatrix.needsUpdate = true;

    if (lineRef) {
      rungGeometry.attributes.position.needsUpdate = true;
      const lineMat = lineRef.material as THREE.LineBasicMaterial;
      lineMat.color.lerp(targetColor, 0.05);
    }
  });
</script>

<T.Group>
  <T.InstancedMesh bind:ref={meshRef} args={[undefined, undefined, TOTAL_NODES]} frustumCulled={false}>
    <T.SphereGeometry args={[0.2, 8, 8]} />
    <T.MeshBasicMaterial color={accentColor} transparent opacity={0.6} />
  </T.InstancedMesh>

  <T.LineSegments bind:ref={lineRef} geometry={rungGeometry} frustumCulled={false}>
    <T.LineBasicMaterial color={accentColor} transparent opacity={0.2} />
  </T.LineSegments>
</T.Group>
