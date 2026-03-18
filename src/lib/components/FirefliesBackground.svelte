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

  const FLY_COUNT = 80;

  interface Firefly {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    glowPhase: number;
    glowSpeed: number;
    driftSpeed: number;
  }

  const flies: Firefly[] = Array.from({ length: FLY_COUNT }, () => ({
    x: (Math.random() - 0.5) * 50,
    y: (Math.random() - 0.5) * 35,
    z: 10 - Math.random() * 18,
    vx: (Math.random() - 0.5) * 0.02,
    vy: (Math.random() - 0.5) * 0.02,
    vz: (Math.random() - 0.5) * 0.01,
    glowPhase: Math.random() * Math.PI * 2,
    glowSpeed: 0.5 + Math.random() * 1.5,
    driftSpeed: 0.3 + Math.random() * 0.7,
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
    if (!meshRef) return;
    time += 0.006;

    targetColor.set(accentColor);
    const mat = meshRef.material as THREE.MeshBasicMaterial;
    mat.color.lerp(targetColor, 0.05);

    const mxWorld = mouseX * 20;
    const myWorld = mouseY * 14;

    for (let i = 0; i < FLY_COUNT; i++) {
      const fly = flies[i];

      // Brownian drift
      fly.vx += (Math.random() - 0.5) * 0.004;
      fly.vy += (Math.random() - 0.5) * 0.004;
      fly.vz += (Math.random() - 0.5) * 0.002;

      // Damping
      fly.vx *= 0.98;
      fly.vy *= 0.98;
      fly.vz *= 0.98;

      // Mouse repulsion
      const dx = fly.x - mxWorld;
      const dy = fly.y - myWorld;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 12) {
        const force = (12 - dist) * 0.003;
        fly.vx += (dx / (dist || 1)) * force;
        fly.vy += (dy / (dist || 1)) * force;
      }

      fly.x += fly.vx * fly.driftSpeed;
      fly.y += fly.vy * fly.driftSpeed;
      fly.z += fly.vz * fly.driftSpeed;

      // Soft boundary wrapping
      if (fly.x > 30) fly.x = -30;
      if (fly.x < -30) fly.x = 30;
      if (fly.y > 22) fly.y = -22;
      if (fly.y < -22) fly.y = 22;
      if (fly.z > 15) fly.z = -8;
      if (fly.z < -8) fly.z = 15;

      // Glow pulse: 0.5x dim to 1.5x bright
      const glow = 1 + Math.sin(time * fly.glowSpeed + fly.glowPhase) * 0.5;

      dummy.position.set(fly.x, fly.y, fly.z);
      dummy.scale.setScalar(glow);
      dummy.updateMatrix();
      meshRef.setMatrixAt(i, dummy.matrix);
    }

    meshRef.instanceMatrix.needsUpdate = true;
  });
</script>

<T.InstancedMesh bind:ref={meshRef} args={[undefined, undefined, FLY_COUNT]} frustumCulled={false}>
  <T.SphereGeometry args={[0.25, 8, 8]} />
  <T.MeshBasicMaterial color={accentColor} transparent opacity={0.85} />
</T.InstancedMesh>
