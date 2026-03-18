<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import * as THREE from 'three';
  import { onMount } from 'svelte';

  let { accentColor = '#6366f1' }: { accentColor: string } = $props();

  let groupRef = $state.raw<THREE.Group>();
  let meshRef = $state.raw<THREE.InstancedMesh>();
  let lineRef = $state.raw<THREE.LineSegments>();
  const targetColor = new THREE.Color();
  const dummy = new THREE.Object3D();
  let mouseX = 0;
  let mouseY = 0;
  let time = 0;

  const NODE_COUNT = 60;
  const MAX_DISTANCE = 16;

  interface Node {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    phaseX: number;
    phaseY: number;
    speed: number;
  }

  const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
    x: (Math.random() - 0.5) * 50,
    y: (Math.random() - 0.5) * 35,
    z: -10 - Math.random() * 20,
    vx: (Math.random() - 0.5) * 0.02,
    vy: (Math.random() - 0.5) * 0.02,
    phaseX: Math.random() * Math.PI * 2,
    phaseY: Math.random() * Math.PI * 2,
    speed: 0.3 + Math.random() * 0.5,
  }));

  // Pre-allocate line buffer (max possible edges)
  const maxEdges = (NODE_COUNT * (NODE_COUNT - 1)) / 2;
  const linePositions = new Float32Array(maxEdges * 6);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

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
    if (!meshRef || !lineRef) return;
    time += 0.005;

    targetColor.set(accentColor);
    const mat = meshRef.material as THREE.MeshBasicMaterial;
    mat.color.lerp(targetColor, 0.05);

    // Update node positions
    for (let i = 0; i < NODE_COUNT; i++) {
      const node = nodes[i];
      const t = time * node.speed;
      const px = node.x + Math.sin(t + node.phaseX) * 5 + mouseX * 3;
      const py = node.y + Math.cos(t + node.phaseY) * 4 + mouseY * 3;

      dummy.position.set(px, py, node.z);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      meshRef.setMatrixAt(i, dummy.matrix);
    }
    meshRef.instanceMatrix.needsUpdate = true;

    // Build edges
    let edgeIdx = 0;
    for (let i = 0; i < NODE_COUNT; i++) {
      const ni = nodes[i];
      const ti = time * ni.speed;
      const ax = ni.x + Math.sin(ti + ni.phaseX) * 5 + mouseX * 3;
      const ay = ni.y + Math.cos(ti + ni.phaseY) * 4 + mouseY * 3;

      for (let j = i + 1; j < NODE_COUNT; j++) {
        const nj = nodes[j];
        const tj = time * nj.speed;
        const bx = nj.x + Math.sin(tj + nj.phaseX) * 5 + mouseX * 3;
        const by = nj.y + Math.cos(tj + nj.phaseY) * 4 + mouseY * 3;

        const dx = ax - bx;
        const dy = ay - by;
        const dz = ni.z - nj.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < MAX_DISTANCE) {
          const idx = edgeIdx * 6;
          linePositions[idx] = ax;
          linePositions[idx + 1] = ay;
          linePositions[idx + 2] = ni.z;
          linePositions[idx + 3] = bx;
          linePositions[idx + 4] = by;
          linePositions[idx + 5] = nj.z;
          edgeIdx++;
        }
      }
    }

    // Zero-out unused
    for (let k = edgeIdx * 6; k < linePositions.length; k++) {
      linePositions[k] = 0;
    }

    lineGeometry.attributes.position.needsUpdate = true;
    lineGeometry.setDrawRange(0, edgeIdx * 2);

    const lineMat = lineRef.material as THREE.LineBasicMaterial;
    lineMat.color.lerp(targetColor, 0.05);
  });
</script>

<T.Group bind:ref={groupRef}>
  <T.InstancedMesh bind:ref={meshRef} args={[undefined, undefined, NODE_COUNT]} frustumCulled={false}>
    <T.SphereGeometry args={[0.3, 8, 8]} />
    <T.MeshBasicMaterial color={accentColor} transparent opacity={0.85} />
  </T.InstancedMesh>

  <T.LineSegments bind:ref={lineRef} geometry={lineGeometry} frustumCulled={false}>
    <T.LineBasicMaterial color={accentColor} transparent opacity={0.3} />
  </T.LineSegments>
</T.Group>
