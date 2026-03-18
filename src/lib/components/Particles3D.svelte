<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import { onMount } from 'svelte';

	let { count = 120, mouseX = 0, mouseY = 0 }: { count?: number; mouseX?: number; mouseY?: number } = $props();

	let mesh = $state.raw<THREE.InstancedMesh>();
	const dummy = new THREE.Object3D();
	const targetColor = new THREE.Color();

	// Read theme colors
	let accentColor = '#6366f1';

	function refreshColor() {
		const style = getComputedStyle(document.documentElement);
		accentColor = style.getPropertyValue('--color-primary').trim() || '#6366f1';
	}

	onMount(() => {
		refreshColor();
		const observer = new MutationObserver(() => refreshColor());
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
		return () => observer.disconnect();
	});

	function createParticles(n: number) {
		return Array.from({ length: n }, () => ({
			t: Math.random() * 100,
			factor: 20 + Math.random() * 100,
			speed: 0.01 + Math.random() / 200,
			xFactor: -50 + Math.random() * 100,
			yFactor: -50 + Math.random() * 100,
			zFactor: -50 + Math.random() * 100,
			mx: 0,
			my: 0
		}));
	}

	let particles: ReturnType<typeof createParticles> = [];
	let activeCount = -1;
	let internalMouseX = 0;
	let internalMouseY = 0;
	let frameCount = 0;

	onMount(() => {
		let ticking = false;
		const handleMouse = (e: MouseEvent) => {
			if (!ticking) {
				requestAnimationFrame(() => {
					internalMouseX = (e.clientX / window.innerWidth) * 2 - 1;
					internalMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
					ticking = false;
				});
				ticking = true;
			}
		};
		window.addEventListener('mousemove', handleMouse, { passive: true });
		return () => window.removeEventListener('mousemove', handleMouse);
	});

	useTask(() => {
		if (!mesh) return;

		if (activeCount !== count) {
			particles = createParticles(count);
			activeCount = count;
		}

		frameCount++;

		// Lerp material color toward theme accent
		if (frameCount % 3 === 0) {
			targetColor.set(accentColor);
			const mat = mesh.material as THREE.MeshBasicMaterial;
			mat.color.lerp(targetColor, 0.05);
		}

		const targetX = internalMouseX * 10;
		const targetY = internalMouseY * 10;

		for (let i = 0; i < particles.length; i++) {
			const p = particles[i];
			p.t += p.speed / 2;
			const { t, factor, xFactor, yFactor, zFactor } = p;

			const a = Math.cos(t) + Math.sin(t) / 10;
			const b = Math.sin(t) + Math.cos(t * 2) / 10;
			const s = Math.cos(t);

			p.mx += (targetX - p.mx) * 0.05;
			p.my += (targetY - p.my) * 0.05;

			const x = (p.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t) * factor) / 10;
			const y = (p.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10;
			const z = (p.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10;

			dummy.position.set(x, y, z);
			dummy.scale.setScalar(s);
			dummy.rotation.set(s * 5, s * 5, s * 5);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	});
</script>

<T.InstancedMesh bind:ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
	<T.DodecahedronGeometry args={[0.2, 0]} />
	<T.MeshBasicMaterial color={accentColor} transparent opacity={0.6} />
</T.InstancedMesh>
